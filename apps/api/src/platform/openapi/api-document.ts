import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { STAFF_COOKIE } from '../../modules/auth/session-security';

export function createApiDocument(app: INestApplication) {
  const settings = new DocumentBuilder()
    .setTitle('Nhà hàng Ba Anh Em API')
    .setVersion('0.0.0')
    .setOpenAPIVersion('3.1.1')
    .addCookieAuth(STAFF_COOKIE, undefined, 'StaffCookie')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
      'CsrfToken',
    )
    .build();

  return SwaggerModule.createDocument(app, settings);
}
