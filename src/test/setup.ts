import "@testing-library/jest-dom";

// Ensure tests have mock Supabase env vars if running in isolated CI without a .env file
if (!import.meta.env.VITE_SUPABASE_URL) {
  (import.meta.env as Record<string, string>).VITE_SUPABASE_URL =
    "https://mock-test.supabase.co";
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY =
    "mock-anon-key-for-tests";
}
