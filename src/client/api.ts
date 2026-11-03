import { z } from 'zod';
import { productSchema, type Enquiry } from '../shared/contracts';

const catalogueSchema = z.object({
  products: z.array(productSchema),
  featured: z.array(productSchema),
  categories: z.array(z.string()),
});

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new Error('We could not connect. Please check your connection and try again.');
  }
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new Error(error.success ? error.data.error : 'Something went wrong. Please try again.');
  }
  return body;
}

export const api = {
  async catalogue(query: { category?: string; q?: string } = {}) {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    if (query.q) params.set('q', query.q);
    return catalogueSchema.parse(await request(`/products?${params}`));
  },
  async product(id: string) {
    return productSchema.parse(await request(`/products/${encodeURIComponent(id)}`));
  },
  async enquire(enquiry: Enquiry) {
    await request('/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiry),
    });
  },
};