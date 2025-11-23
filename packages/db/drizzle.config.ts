import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./schema.ts",
  dialect: "postgresql",
  verbose: true,
  out: "./drizzle",
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
});
