import { createHash } from 'crypto';

export const toBase64Url = (buffer: Buffer): string =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export const sha256Base64Url = (value: string): string =>
  toBase64Url(createHash('sha256').update(value).digest());
