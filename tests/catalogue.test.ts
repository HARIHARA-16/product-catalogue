import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/app.js';
import { Catalogue, AppError } from '../src/server/catalogue.js';
import { FakeStoreRepository, SmtpEnquirySender } from '../src/server/adapters.js';
import type { Product } from '../src/shared/contracts.js';

const products: Product[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  title: index === 0 ? 'Canvas backpack' : `Product ${index + 1}`,
  price: 20 + index,
  description: 'Made for everyday travel.',
  category: index < 6 ? 'clothing' : 'electronics',
  image: 'https://example.test/product.png',
  rating: { rate: index / 2, count: 10 },
}));

function setup() {
  const sender = { send: vi.fn().mockResolvedValue(undefined) };
  const repository = { list: vi.fn().mockResolvedValue(products) };
  const app = createApp({ products: repository, sender, featuredIds: [1, 2, 3, 4, 5], allowedOrigin: 'http://localhost:3000' });
  return { app, sender, repository };
}

const enquiry = { productId: 1, name: 'Alex Smith', email: 'alex@example.test', message: 'Is this available in a different colour?' };

describe('catalogue HTTP boundary', () => {
  it('returns exactly the five owner-chosen products in order', async () => {
    const { app } = setup();
    const result = await request(app).get('/api/products').expect(200);
    expect(result.body.featured.map((product: Product) => product.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.body.categories).toEqual(['clothing', 'electronics']);
  });

  it('ranks category highlights while retaining additional category products', async () => {
    const { app } = setup();
    const result = await request(app).get('/api/products').query({ category: 'clothing' }).expect(200);
    expect(result.body.featured.map((product: Product) => product.id)).toEqual([6, 5, 4]);
    expect(result.body.products).toHaveLength(6);
    expect(result.body.products.every((product: Product) => product.category === 'clothing')).toBe(true);
  });

  it('searches title, description and category as case-insensitive literal text', async () => {
    const { app } = setup();
    const match = await request(app).get('/api/products').query({ q: '  BACKPACK ' }).expect(200);
    expect(match.body.products.map((product: Product) => product.id)).toEqual([1]);
    expect(match.body.featured).toEqual([]);
    const description = await request(app).get('/api/products?q=travel').expect(200);
    expect(description.body.products).toHaveLength(8);
    const category = await request(app).get('/api/products?q=electronics').expect(200);
    expect(category.body.products).toHaveLength(2);
    const empty = await request(app).get('/api/products?q=.*').expect(200);
    expect(empty.body.products).toEqual([]);
  });

  it('serves details and handles missing or invalid IDs/categories', async () => {
    const { app } = setup();
    const detail = await request(app).get('/api/products/1').expect(200);
    expect(detail.body.title).toBe('Canvas backpack');
    await request(app).get('/api/products/999').expect(404);
    await request(app).get('/api/products/nope').expect(400);
    await request(app).get('/api/products?category=missing').expect(404);
    await request(app).get('/api/missing').expect(404);
  });

  it('does not silently replace missing featured products', async () => {
    const { app, repository } = setup();
    repository.list.mockResolvedValue(products.slice(1));
    await request(app).get('/api/products').expect(503);
    expect(() => new Catalogue(repository, [1, 1, 2, 3, 4])).toThrow('five distinct');
  });

  it('returns a retryable error for catalogue outages', async () => {
    const { app, repository } = setup();
    repository.list.mockRejectedValue(new AppError(503, 'Catalogue unavailable.'));
    await request(app).get('/api/products').expect(503);
  });
});

describe('enquiry submission', () => {
  it('acknowledges only after the sender succeeds with server-owned product details', async () => {
    const { app, sender } = setup();
    const result = await request(app).post('/api/enquiries').send(enquiry).expect(201);
    expect(result.body.message).toContain('Thank you');
    expect(sender.send).toHaveBeenCalledWith(enquiry, products[0]);
  });

  it.each([
    { ...enquiry, email: 'not-an-email' },
    { ...enquiry, name: ' ' },
    { ...enquiry, message: 'short' },
    { ...enquiry, productId: -1 },
    { ...enquiry, to: 'attacker@example.test' },
  ])('rejects invalid form input without sending mail', async (body) => {
    const { app, sender } = setup();
    await request(app).post('/api/enquiries').send(body).expect(400);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it('rejects a missing product and cross-origin submissions', async () => {
    const { app, sender } = setup();
    await request(app).post('/api/enquiries').send({ ...enquiry, productId: 999 }).expect(404);
    await request(app).post('/api/enquiries').set('Origin', 'https://evil.test').send(enquiry).expect(403);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it('does not report thanks when email fails', async () => {
    const { app, sender } = setup();
    sender.send.mockRejectedValue(new AppError(502, 'Mail unavailable.'));
    const result = await request(app).post('/api/enquiries').send(enquiry).expect(502);
    expect(result.body.message).toBeUndefined();
  });

  it('rejects malformed, oversized and excessive submissions', async () => {
    const { app } = setup();
    await request(app).post('/api/enquiries').set('Content-Type', 'application/json').send('{').expect(400);
    await request(app).post('/api/enquiries').send({ ...enquiry, message: 'a'.repeat(9000) }).expect(413);
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app).post('/api/enquiries').send(enquiry).expect(201);
    }
    await request(app).post('/api/enquiries').send(enquiry).expect(429);
  });
});

describe('Fake Store adapter', () => {
  it('validates, caches and coalesces concurrent upstream requests', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(products)));
    const repository = new FakeStoreRepository(fetcher);
    const [first, second] = await Promise.all([repository.list(), repository.list()]);
    expect(first).toEqual(products);
    expect(second).toEqual(first);
    await repository.list();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('reuses the cache for browsing, search and product details until five minutes expire', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify(products)));
      const catalogue = new Catalogue(new FakeStoreRepository(fetcher), [1, 2, 3, 4, 5]);

      await catalogue.browse();
      clock.mockReturnValue(299_999);
      await catalogue.browse({ category: 'clothing' });
      await catalogue.browse({ q: 'backpack' });
      await catalogue.find(1);
      expect(fetcher).toHaveBeenCalledTimes(1);

      clock.mockReturnValue(300_000);
      await Promise.all([catalogue.browse(), catalogue.find(1)]);
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      clock.mockRestore();
    }
  });

  it('rejects malformed payloads and permits retry after failure', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'bad' }])))
      .mockResolvedValueOnce(new Response(JSON.stringify(products)));
    const repository = new FakeStoreRepository(fetcher);
    await expect(repository.list()).rejects.toMatchObject({ status: 503 });
    await expect(repository.list()).resolves.toEqual(products);
  });

  it('refreshes expired data and handles non-success responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify(products)));
    const repository = new FakeStoreRepository(fetcher, -1);
    await repository.list();
    await repository.list();
    expect(fetcher).toHaveBeenCalledTimes(2);
    fetcher.mockResolvedValue(new Response('', { status: 500 }));
    await expect(repository.list()).rejects.toMatchObject({ status: 503 });
  });
});

describe('SMTP adapter', () => {
  it('uses a fixed sales recipient and plain text with customer reply-to', async () => {
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: ['sales@example.test'], rejected: [] }) };
    const sender = new SmtpEnquirySender(transport, 'catalogue@example.test', 'sales@example.test');
    await sender.send(enquiry, products[0]);
    expect(transport.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'catalogue@example.test',
      to: 'sales@example.test',
      replyTo: enquiry.email,
      subject: 'Product enquiry #1',
      text: expect.stringContaining(enquiry.message),
      disableFileAccess: true,
      disableUrlAccess: true,
    }));
    expect(transport.sendMail.mock.calls[0][0]).not.toHaveProperty('html');
  });

  it('does not acknowledge rejected recipients or leak provider errors', async () => {
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: ['sales@example.test'] }) };
    const sender = new SmtpEnquirySender(transport, 'catalogue@example.test', 'sales@example.test');
    await expect(sender.send(enquiry, products[0])).rejects.toMatchObject({ status: 502 });
    transport.sendMail.mockRejectedValue(new Error('Private SMTP credentials and diagnostic details'));
    await expect(sender.send(enquiry, products[0])).rejects.toMatchObject({ status: 502, message: 'We could not send your enquiry. Please try again shortly.' });
  });
});