import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Igual que en Vercel: el proceso corre en UTC y la lógica tiene que calcular en Europe/Madrid.
    env: { TZ: "UTC" },
  },
});
