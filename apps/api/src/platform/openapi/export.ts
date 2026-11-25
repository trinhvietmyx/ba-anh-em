import { createApiApp } from '../../api-app';
import { readRuntimeConfig } from '../config/runtime-config';
import { createApiDocument } from './api-document';

async function exportDocument(): Promise<void> {
  const app = await createApiApp(
    { ...readRuntimeConfig({ NODE_ENV: 'test' }), exposeDocs: false },
    false,
  );
  try {
    const document = createApiDocument(app);
    process.stdout.write(JSON.stringify(document));
  } finally {
    await app.close();
  }
}

exportDocument().catch(() => {
  console.error('Không thể xuất OpenAPI từ ứng dụng NestJS.');
  process.exitCode = 1;
});
