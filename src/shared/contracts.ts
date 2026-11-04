import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  price: z.number().nonnegative().finite(),
  description: z.string().max(10000),
  category: z.string().min(1).max(100),
  image: z.url().refine((value) => value.startsWith('https://'), 'HTTPS image required'),
  rating: z.object({ rate: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
});

export type Product = z.infer<typeof productSchema>;

export const enquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters).').max(100),
  email: z.email('Enter a valid email address.').max(254),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, 'Please include at least 10 characters.').max(2000),
}).strict();

export type Enquiry = z.infer<typeof enquirySchema>;

export interface CatalogueResult {
  products: Product[];
  featured: Product[];
  categories: string[];
}