import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.js";
import * as authSchema from "./auth-schema.js";

// Phase 0 holds only Better Auth's own tables. The product tables
// (attempts/stage_commits/gotcha_progress, NOISEFLOOR-OUTLINE.md §10) are
// deliberately added in Phase 2 alongside the case engine, not guessed at here.
export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema: { ...authSchema } });
