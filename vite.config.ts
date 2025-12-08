import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/workers/ServiceWorker.ts",
            fileName: "sw",
            formats: ["es"],
        },
        rollupOptions: {
            external: [/^node:/],
        },
    },
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
