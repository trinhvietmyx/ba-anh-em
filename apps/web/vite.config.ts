import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const localEnvPath = new URL('../../.env', import.meta.url);

export default defineConfig(({ command }) => {
  if (command === 'build') {
    return { plugins: [react()] };
  }

  const localEnv = existsSync(localEnvPath)
    ? parseEnv(readFileSync(localEnvPath, 'utf8'))
    : {};
  const apiPort = process.env.API_PORT ?? localEnv.API_PORT ?? '3000';

  return {
    plugins: [react()],
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
