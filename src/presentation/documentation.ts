import { createDocument } from 'zod-openapi';
import {
  apiErrorResponseSchema,
  apiSuccessResponseSchema,
  loginSchema,
  loginSchemaResponse,
  registerSchema,
} from './validators/identity-schema';

export const documentZod = createDocument({
  openapi: '3.0.0',
  info: {
    title: 'Identity microservice',
    version: '1.0.0',
  },
  components: {
    schemas: {
      SuccessResponse: apiSuccessResponseSchema,
      ErrorResponse: apiErrorResponseSchema,
    },
    responses: {
      SuccessResponse: {
        description: 'Success response (global)',
        content: { 'application/json': { schema: apiSuccessResponseSchema } },
      },
      ErrorResponse: {
        description: 'Error response (global)',
        content: { 'application/json': { schema: apiErrorResponseSchema } },
      },
    },
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
            description: 'OK',
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
            description: ' OK',
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
