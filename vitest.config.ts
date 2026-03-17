import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve("./shared"),
      "@": path.resolve("./client/src"),
    },
  },
});
