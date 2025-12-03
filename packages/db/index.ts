import { drizzle as drizzleNode } from "drizzle-orm/node-postgres"
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

import { sql } from "@vercel/postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const dbVercel = drizzle(sql, { schema, logger: true });
const dbNode = drizzleNode(pool, { logger: true, schema });

// Always use dbNode (Pool) which works with DATABASE_URL
// dbVercel requires POSTGRES_URL which is typically only set in Vercel deployments
export const db = dbNode;

// Export utils functions
export { slugifyText, generateSlug, generateUniqueString } from "./utils/generate-string";
export { generateRandomName } from "./utils/random-name";