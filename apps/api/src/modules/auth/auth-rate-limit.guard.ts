import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../platform/config/runtime-config';

const WINDOW_MS = 60_000;
const MAX_BUCKETS = 4096;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  private nextSweep = 0;

  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const rate = this.config.auth?.rateLimitPerMinute;
    if (!rate) return true;

    const http = context.switchToHttp();
    const peer =
      http.getRequest<IncomingMessage>().socket.remoteAddress ?? 'unknown';
    const key = `${context.getHandler().name}:${peer}`;
    const now = Date.now();
    if (now >= this.nextSweep) {
      for (const [id, bucket] of this.buckets) {
        if (bucket.expiresAt <= now) this.buckets.delete(id);
      }
      this.nextSweep = now + WINDOW_MS;
    }

    const bucket = this.buckets.get(key);
    if (bucket && bucket.expiresAt > now) {
      if (bucket.count >= rate)
        this.reject(http.getResponse(), bucket.expiresAt - now);
      bucket.count += 1;
    } else {
      if (!bucket && this.buckets.size >= MAX_BUCKETS)
        this.reject(http.getResponse(), this.nextSweep - now);
      this.buckets.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    }
    return true;
  }

  private reject(response: ServerResponse, retryMs: number): never {
    response.setHeader('Retry-After', Math.ceil(retryMs / 1000));
    throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}
