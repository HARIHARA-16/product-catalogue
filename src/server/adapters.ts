import type { SendMailOptions } from 'nodemailer';
import { z } from 'zod';
import { productSchema, type Product, type Enquiry } from '../shared/contracts.js';
import { AppError, type ProductRepository, type EnquirySender } from './catalogue.js';

interface MailTransport {
  sendMail(options: SendMailOptions): Promise<{ accepted?: unknown[]; rejected?: unknown[] }>;
}

export class FakeStoreRepository implements ProductRepository {
  private cached?: { products: Product[]; expiresAt: number };
  private pending?: Promise<Product[]>;

  constructor(private readonly request: typeof fetch = fetch, private readonly ttlMs = 300_000) {}

  async list(): Promise<Product[]> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.products;
    if (this.pending) return this.pending;
    this.pending = this.load();
    try {
      return await this.pending;
    } finally {
      this.pending = undefined;
    }
  }

  private async load(): Promise<Product[]> {
    try {
      const response = await this.request('https://fakestoreapi.com/products', {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Upstream HTTP failure');
      const products = z.array(productSchema).min(5).max(2000).parse(await response.json());
      if (new Set(products.map((product) => product.id)).size !== products.length) {
        throw new Error('Duplicate upstream IDs');
      }
      this.cached = { products, expiresAt: Date.now() + this.ttlMs };
      return products;
    } catch {
      throw new AppError(503, 'The catalogue is temporarily unavailable. Please try again.');
    }
  }
}

export class SmtpEnquirySender implements EnquirySender {
  constructor(
    private readonly transport: MailTransport,
    private readonly from: string,
    private readonly salesInbox: string,
  ) {}

  async send(enquiry: Enquiry, product: Product): Promise<void> {
    try {
      const result = await this.transport.sendMail({
        from: this.from,
        to: this.salesInbox,
        replyTo: enquiry.email,
        subject: `Product enquiry #${product.id}`,
        text: [
          `Product: ${product.title} (#${product.id})`,
          `Listed price: USD ${product.price.toFixed(2)}`,
          `Name: ${enquiry.name}`,
          `Email: ${enquiry.email}`,
          `Phone: ${enquiry.phone || 'Not provided'}`,
          '',
          enquiry.message,
        ].join('\n'),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      if (result.rejected?.length || !result.accepted?.length) throw new Error('SMTP recipient rejected');
    } catch {
      throw new AppError(502, 'We could not send your enquiry. Please try again shortly.');
    }
  }
}