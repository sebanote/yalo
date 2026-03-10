import dotenv from 'dotenv';
dotenv.config({quiet: true}); // Suppress warnings if .env is missing, since some variables are optional

/**
 * requireEnv
 * ──────────
 * Reads an environment variable and throws immediately if it is missing or empty.
 * Use for variables that are required for the test suite to run at all.
 */
export function requireEnv(name: string): string {
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

/**
 * optionalEnv
 * ───────────
 * Reads an environment variable and returns undefined if missing.
 * Use for variables only needed by specific tests — throw in the test or fixture
 * if the value is required for that particular scenario.
 */
export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  TEST_EMAIL:    requireEnv('TEST_EMAIL'),
  TEST_PASSWORD: requireEnv('TEST_PASSWORD'),
};