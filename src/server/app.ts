import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import path from 'node:path';
import { enquirySchema } from '../shared/contracts.js';
import { AppError, Catalogue, SubmitEnquiry, type ProductRepository, type EnquirySender } from './catalogue.js';

interface Dependencies {
  products: ProductRepository;
  sender: EnquirySender;
  featuredIds: number[];
  allowedOrigin: string;
  staticDirectory?: string;
}

export function createApp(dependencies: Dependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    imgSrc: ["'self'", 'https:', 'data:'],
    upgradeInsecureRequests: dependencies.allowedOrigin.startsWith('http:') ? null : [],
  } } }));
  app.use(express.json({ limit: '8kb' }));
  const catalogue = new Catalogue(dependencies.products, dependencies.featuredIds);
  const submitEnquiry = new SubmitEnquiry(catalogue, dependencies.sender);

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  app.get('/api/products', async (request, response) => {
    const query = z.object({
      category: z.string().trim().min(1).max(100).optional(),
      q: z.string().trim().max(200).optional(),
    }).strict().parse(request.query);
    response.json(await catalogue.browse(query));
  });

  app.get('/api/products/:id', async (request, response) => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    response.json(await catalogue.find(id));
  });

  app.post('/api/enquiries', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many enquiries. Please try again in 15 minutes.' },
  }), async (request, response) => {
    if (request.get('origin') && request.get('origin') !== dependencies.allowedOrigin) {
      throw new AppError(403, 'This origin is not allowed.');
    }
    const enquiry = enquirySchema.parse(request.body);
    await submitEnquiry.execute(enquiry);
    response.status(201).json({ message: 'Thank you. Your enquiry has been sent to our team.' });
  });

  app.use('/api', (_request, _response, next) => next(new AppError(404, 'Endpoint not found.')));

  if (dependencies.staticDirectory) {
    app.use(express.static(dependencies.staticDirectory));
    app.get('/{*path}', (_request, response) => {
      response.sendFile(path.join(dependencies.staticDirectory!, 'index.html'));
    });
  }

  const errorHandler: express.ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Please check the supplied fields.', fields: z.flattenError(error).fieldErrors });
    } else if (error instanceof AppError) {
      response.status(error.status).json({ error: error.message });
    } else if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: 'Invalid JSON body.' });
    } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      response.status(413).json({ error: 'Request is too large.' });
    } else {
      console.error('Unhandled request failure', { kind: error instanceof Error ? error.name : 'unknown' });
      response.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
  
  app.use(errorHandler);
  return app;
}