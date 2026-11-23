import { readApiPort } from './api-port';

describe('readApiPort', () => {
  it('defaults to port 3000 when API_PORT is unset', () => {
    expect(readApiPort(undefined)).toBe(3000);
  });

  it('uses an explicitly configured port', () => {
    expect(readApiPort('4321')).toBe(4321);
  });

  it.each(['', 'abc', '1.5', '3e3', '0', '-1', '65536'])(
    'rejects the invalid port %j',
    (value) => {
      expect(() => readApiPort(value)).toThrow('API_PORT');
    },
  );
});
