/**
 * env.ts
 * ──────
 * Single source of truth for environment variables.
 * Throws at startup if required variables are missing — fails fast
 * instead of running tests with wrong or missing credentials.
 *
 * Usage:
 *   import { env } from '../utils/env';
 *   env.TEST_EMAIL
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Set it in your .env file or CI environment.\n` +
      `See .env.example for reference.`
    );
  }
  return value;
}

export const env = {
  TEST_EMAIL:    requireEnv('TEST_EMAIL'),
  TEST_PASSWORD: requireEnv('TEST_PASSWORD'),
};