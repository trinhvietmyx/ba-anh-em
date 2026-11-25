import { readRuntimeConfig } from './runtime-config';

describe('readRuntimeConfig', () => {
  it('defaults to local, same-origin operation with no database', () => {
    expect(readRuntimeConfig({})).toMatchObject({
      host: '127.0.0.1',
      port: 3000,
      corsOrigins: [],
      databaseUrl: undefined,
      exposeDocs: true,
    });
  });

  it('uses explicit deployment settings and disables docs in production', () => {
    expect(
      readRuntimeConfig({
        NODE_ENV: 'production',
        API_HOST: '0.0.0.0',
        API_PORT: '4321',
        API_CORS_ORIGINS: 'https://demo.example, http://localhost:5173',
        DATABASE_URL: 'postgresql://localhost:5432/ba_anh_em',
      }),
    ).toEqual({
      host: '0.0.0.0',
      port: 4321,
      corsOrigins: ['https://demo.example', 'http://localhost:5173'],
      databaseUrl: 'postgresql://localhost:5432/ba_anh_em',
      exposeDocs: false,
    });
  });

  it.each([
    ['NODE_ENV', 'prodution'],
    ['API_HOST', 'example.com'],
    ['API_PORT', '0'],
    ['API_CORS_ORIGINS', '*'],
    ['API_CORS_ORIGINS', 'https://demo.example/path'],
    ['API_CORS_ORIGINS', 'http://user:secret@demo.example'],
    ['DATABASE_URL', 'https://user:secret@demo.example/restaurant'],
    ['DATABASE_URL', 'postgresql://demo.example'],
    ['DATABASE_URL', 'postgresql://demo.example:0/restaurant'],
  ])('rejects an invalid %s without echoing its value', (key, value) => {
    expect(() => readRuntimeConfig({ [key]: value })).toThrow(key);
    expect(() => readRuntimeConfig({ [key]: value })).not.toThrow(value);
  });
});
