import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // The `@/*` path alias from tsconfig.json.
      { find: /^@\//, replacement: `${fromRoot("./src")}/` },
      // `server-only` throws unless it is bundled for React Server Components,
      // so tests swap it for an empty module.
      {
        find: /^server-only$/,
        replacement: fromRoot("./src/test/server-only.ts"),
      },
    ],
  },
  test: {
    include: [
      "src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
      "docker/**/*.test.ts",
      "tests/e2e/**/*.test.ts",
    ],
    environment: "node",
  },
});
