import { z } from 'zod';

export const config = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_ORIGIN: z.url().default('http://localhost:3000'),
  PRODUCT_SOURCE: z.enum(['fakestore', 'fixture']).default('fakestore'),
  FEATURED_PRODUCT_IDS: z.string().default('1,5,9,16,19').transform((value) => value.split(',').map(Number)),
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.email().default('catalogue@example.test'),
  SALES_INBOX: z.email().default('sales@example.test'),
}).parse(process.env);