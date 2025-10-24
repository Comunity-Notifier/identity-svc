import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './errors';
import { createErrorResponse } from './api-response';
import swaggerUi from 'swagger-ui-express';
import { documentZod } from './documentation';
import identityRouter from './routes/identity';
import { createAppContainer } from '../presentation/container';
import { scopePerRequest } from 'awilix-express';

export const createApp = () => {
  const app = express();

  app.use(helmet());

  app.use(cors({ credentials: true }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  const container = createAppContainer();

  app.use(scopePerRequest(container));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(documentZod));

  app.use('/identity', identityRouter);

  app.use((_req, res) => {
    res.status(404).json(createErrorResponse('not found', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
};
