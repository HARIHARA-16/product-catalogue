import type { Enquiry, Product, CatalogueResult } from '../shared/contracts.js';

export interface ProductRepository {
  list(): Promise<Product[]>;
}

export interface EnquirySender {
  send(enquiry: Enquiry, product: Product): Promise<void>;
}

export class AppError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export class Catalogue {
  constructor(
    private readonly products: ProductRepository,
    private readonly featuredIds: readonly number[],
  ) {
    if (featuredIds.length !== 5 || new Set(featuredIds).size !== 5 ||
      featuredIds.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error('Exactly five distinct positive featured product IDs are required.');
    }
  }

  async browse(query: { category?: string; q?: string } = {}): Promise<CatalogueResult> {
    const all = await this.products.list();
    const categories = [...new Set(all.map((product) => product.category))].sort();
    if (query.category && !categories.includes(query.category)) {
      throw new AppError(404, 'Category not found.');
    }
    const term = query.q?.trim().toLocaleLowerCase();
    const products = all.filter((product) =>
      (!query.category || product.category === query.category) &&
      (!term || `${product.title} ${product.description} ${product.category}`.toLocaleLowerCase().includes(term)),
    );
    const featured = term ? [] : query.category
      ? [...products].sort((first, second) => second.rating.rate - first.rating.rate || first.id - second.id).slice(0, 3)
      : this.featuredIds.map((id) => {
        const product = all.find((item) => item.id === id);
        if (!product) throw new AppError(503, 'The featured collection is temporarily unavailable.');
        return product;
      });
    return { products, featured, categories };
  }

  async find(id: number): Promise<Product> {
    const product = (await this.products.list()).find((item) => item.id === id);
    if (!product) throw new AppError(404, 'Product not found.');
    return product;
  }
}

export class SubmitEnquiry {
  constructor(private readonly catalogue: Catalogue, private readonly sender: EnquirySender) {}

  async execute(enquiry: Enquiry): Promise<void> {
    const product = await this.catalogue.find(enquiry.productId);
    await this.sender.send(enquiry, product);
  }
}