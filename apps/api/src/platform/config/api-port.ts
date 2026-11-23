export function readApiPort(value: string | undefined): number {
  if (value === undefined) {
    return 3000;
  }

  const port = Number(value);

  if (!/^\d+$/.test(value) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer from 1 to 65535');
  }

  return port;
}
