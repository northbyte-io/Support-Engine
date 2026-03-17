// Vitest global setup — set required env vars before any module is imported
process.env.SESSION_SECRET = "vitest-test-secret-for-unit-testing-only";
process.env.NODE_ENV = "test";
