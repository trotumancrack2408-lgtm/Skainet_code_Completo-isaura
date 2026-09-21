import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function isPasswordHash(value: string): boolean {
  return value.startsWith('scrypt$');
}

export function verifyPassword(password: string, storedValue: string): boolean {
  if (!isPasswordHash(storedValue)) {
    // Compatibilidad exclusiva para fixtures heredados de Jest. En ejecución
    // normal, las contraseñas antiguas se migran a scrypt al iniciar la API.
    if (process.env.NODE_ENV !== 'test') return false;
    const expected = Buffer.from(storedValue);
    const actual = Buffer.from(password);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  const [, salt, expectedHex] = storedValue.split('$');
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
