import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const localEnvPath = new URL('../../.env', import.meta.url);

export default defineConfig(({ command }) => {
  const localEnv = existsSync(localEnvPath)
    ? parseEnv(readFileSync(localEnvPath, 'utf8'))
    : {};
  const menuSource =
    process.env.VITE_MENU_SOURCE ?? localEnv.VITE_MENU_SOURCE ?? 'demo';
  if (menuSource !== 'api' && menuSource !== 'demo') {
    throw new Error('VITE_MENU_SOURCE phải là demo hoặc api.');
  }
  const bookingSource =
    process.env.VITE_BOOKING_SOURCE ?? localEnv.VITE_BOOKING_SOURCE ?? 'demo';
  if (bookingSource !== 'api' && bookingSource !== 'demo') {
    throw new Error('VITE_BOOKING_SOURCE phải là demo hoặc api.');
  }
  const common = {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_MENU_SOURCE': JSON.stringify(menuSource),
      'import.meta.env.VITE_BOOKING_SOURCE': JSON.stringify(bookingSource),
    },
  };
  if (command === 'build') return common;

  const apiPort = process.env.API_PORT ?? localEnv.API_PORT ?? '3000';

  return {
    ...common,
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/v1': `http://127.0.0.1:${apiPort}`,
      },
    },
  };
});
