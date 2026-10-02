import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // security.ts import anında AUTH_SECRET ister; test ortamında sabit bir değer
    env: { AUTH_SECRET: "test-secret-for-vitest" },
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
