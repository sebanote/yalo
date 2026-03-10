import { requireEnv, optionalEnv } from './env';

/**
 * credentials.ts
 * ──────────────
 * Central store for all test accounts.
 *
 * - Use requireEnv() for accounts needed by the core test suite — fails fast if missing.
 * - Use optionalEnv() for accounts needed only by specific tests — fails only when used.
 *
 * Add new accounts here as the suite grows. Mirror any new vars in:
 *   - .env.example
 *   - GitHub Actions secrets
 */
export const credentials = {
  default: {
    email:    requireEnv('TEST_EMAIL'),
    password: requireEnv('TEST_PASSWORD'),
  },
  // admin: {
  //   email:    requireEnv('TEST_EMAIL_ADMIN'),
  //   password: requireEnv('TEST_PASSWORD_ADMIN'),
  // },
};

export type Credentials = {
  email: string;
  password: string;
};