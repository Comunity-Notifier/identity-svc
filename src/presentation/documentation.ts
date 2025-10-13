import { createDocument } from 'zod-openapi';
import { loginSchema, loginSchemaResponse, registerSchema } from './validators/identity-schema';

export const documentZod = createDocument({
  openapi: '3.0.0',
  info: {
    title: 'Identity microservice',
    version: '1.0.0',
  },
  paths: {
    '/identity/register': {
      post: {
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: registerSchema },
          },
        },
        responses: {
          '201': {
            description: '201 OK',
          },
        },
      },
    },
    '/identity/login': {
      post: {
        requestBody: {
          content: {
            'application/json': { schema: loginSchema },
          },
        },
        responses: {
          '200': {
            description: '200 OK',
            content: {
              'application/json': { schema: loginSchemaResponse },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          default: {
            description: 'Unexpected error',
          },
        },
      },
    },
  },
});
