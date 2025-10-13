import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './errors';
import { createErrorResponse } from './api-response';
import swaggerUi from 'swagger-ui-express';
import { documentZod } from './documentation';
import { createIdentityRouter } from './routes/identity';

export const createApp = async () => {
  const app = express();

  app.use(helmet());

  app.use(cors({ credentials: true }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const identityRouter = await createIdentityRouter({});
  app.use('/identity', identityRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(documentZod));

  app.use((_req, res) => {
    res.status(404).json(createErrorResponse('not found', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
};
