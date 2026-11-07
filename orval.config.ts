import { defineConfig } from "orval";

export default defineConfig({
  wnsApi: {
    input: {
      // Link direto da documentação OpenAPI do seu back-end no Render!
      target: "https://wnsfinal.onrender.com/v3/api-docs",
    },
    output: {
      mode: "tags-split", // Separa os arquivos por Controller (auth, cursos, cupons, etc.)
      target: "src/api/generated/endpoints",
      schemas: "src/api/generated/model",
      client: "react-query", // Gera os hooks do TanStack Query automaticamente!
      httpClient: "axios",
      override: {
        mutator: {
          path: "./src/api/axios-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
