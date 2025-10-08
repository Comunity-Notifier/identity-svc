import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('email must be valid'),
  password: z.string().min(8, 'password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('email must be valid'),
  password: z.string().min(1, 'password is required'),
});

export const startOAuthSchema = z.object({
  redirect_uri: z.string().url('redirect_uri must be a valid url'),
  nonce: z
    .union([z.string(), z.boolean(), z.undefined()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'string') {
        return value === 'true';
      }
      return value;
    }),
});

export const handleOAuthCallbackSchema = z.object({
  code: z.string().min(1, 'code is required'),
  state: z.string().min(1, 'state is required'),
});
