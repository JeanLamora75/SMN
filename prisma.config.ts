import { defineConfig } from "prisma/config";

// La génération/application des migrations est réservée à SMN-12.
// Ne jamais déduire une URL de connexion depuis DATABASE_URL (risque LMN24).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.SMN_DATABASE_URL || "" },
});
