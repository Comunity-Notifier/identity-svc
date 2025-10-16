import { z } from 'zod';

export const registerSchema = z.object({
  id: z.uuid('id must be a valid UUID'),
  name: z.string().min(1, 'name is required'),
  email: z.email('email must be valid'),
  password: z.string().min(8, 'password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.email('email must be valid'),
  password: z.string().min(1, 'password is required'),
});

export const loginSchemaResponse = z.object({
  email: z.email('email must be valid'),
  id: z.uuid('id must be a valid UUID'),
  name: z.string().min(1, 'name is required'),
});

export type LoginLocalResponseDto = z.infer<typeof loginSchemaResponse>;
