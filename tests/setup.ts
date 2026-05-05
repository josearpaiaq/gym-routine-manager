import "@testing-library/jest-dom";

process.env.JWT_SECRET = "test-secret-32-characters-minimum!!";
process.env.RESEND_API_KEY = "re_test_key";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET_NAME = "test-bucket";
process.env.R2_PUBLIC_URL = "https://cdn.test.example.com";
