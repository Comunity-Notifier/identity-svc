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
          '400': {
            description: 'Bad Request',
          },
          '409': {
            description: 'Conflict',
          },
          '500': {
            description: 'Unexpected error',
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
          '500': {
            description: 'Unexpected error',
          },
        },
      },
    },
    '/identity/logout': {
      post: {
        responses: {
          '204': {
            description: '204 OK',
          },
          '500': {
            description: 'Unexpected error',
          },
        },
      },
    },
  },
});
