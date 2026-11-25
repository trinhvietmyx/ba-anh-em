import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export const GUEST_COOKIE = '__Host-bae_guest';
export const STAFF_COOKIE = '__Host-bae_staff';
export const LOGIN_COOKIE = '__Host-bae_login';

export function opaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenDigest(token: string): Buffer {
  return createHash('sha256').update(token, 'ascii').digest();
}

export function readCookie(
  headers: IncomingHttpHeaders,
  name: string,
): string | undefined {
  const values = headers.cookie
    ?.split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(`${name}=`));
  if (values?.length !== 1) return undefined;
  const value = values[0]?.slice(name.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
}

export function sessionCookie(
  name: string,
  token: string,
  maxAge: number,
): string {
  return `${name}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function requireOrigin(
  headers: IncomingHttpHeaders,
  origin: string,
): void {
  if (headers.origin !== origin) throw new ForbiddenException();
}

export function csrfToken(cookie: string, token: string): string {
  return createHmac('sha256', Buffer.from(token, 'base64url'))
    .update(`csrf:${cookie}`)
    .digest('base64url');
}

export function requireCsrf(
  headers: IncomingHttpHeaders,
  cookie: string,
  token: string,
): void {
  const received = headers['x-csrf-token'];
  if (
    typeof received !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(received) ||
    !timingSafeEqual(
      Buffer.from(received, 'ascii'),
      Buffer.from(csrfToken(cookie, token), 'ascii'),
    )
  ) {
    throw new ForbiddenException();
  }
}

export function requireCookie(
  headers: IncomingHttpHeaders,
  name: string,
): string {
  const token = readCookie(headers, name);
  if (!token) throw new UnauthorizedException();
  return token;
}
