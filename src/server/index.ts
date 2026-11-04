import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { productSchema } from '../shared/contracts.js';
import { createApp } from './app.js';
import { FakeStoreRepository, SmtpEnquirySender } from './adapters.js';
import { config } from './config.js';
import type { ProductRepository } from './catalogue.js';

const products: ProductRepository = config.PRODUCT_SOURCE === 'fixture'
  ? { list: async () => z.array(productSchema).parse(JSON.parse(await readFile(path.resolve('data/products.json'), 'utf8'))) }
  : new FakeStoreRepository();

const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

const app = createApp({
  products,
  sender: new SmtpEnquirySender(transport, config.MAIL_FROM, config.SALES_INBOX),
  featuredIds: config.FEATURED_PRODUCT_IDS,
  allowedOrigin: config.PUBLIC_ORIGIN,
  staticDirectory: path.resolve('dist/client'),
});

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Catalogue listening on port ${config.PORT}; product source: ${config.PRODUCT_SOURCE}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);