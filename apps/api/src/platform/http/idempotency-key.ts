import type { IncomingHttpHeaders } from 'node:http';
import { BadRequestException } from '@nestjs/common';

export const REQUEST_KEY_PATTERN = '^[A-Za-z0-9._~-]{16,128}$';
const keyPattern = new RegExp(REQUEST_KEY_PATTERN);

export function requireRequestKey(headers: IncomingHttpHeaders): string {
  const key = headers['idempotency-key'];
  if (typeof key !== 'string' || !keyPattern.test(key))
    throw new BadRequestException();
  return key;
}
