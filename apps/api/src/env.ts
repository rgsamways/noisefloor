import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  // Port 5439 matches docker-compose.yml — 5432/5434-5438 are already in
  // use by other local Postgres instances on this machine.
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5439/noisefloor_dev"),
  BETTER_AUTH_SECRET: z.string().min(1).default("dev-only-secret-change-me"),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:3000"),
  WEB_URL: z.string().min(1).default("http://localhost:5173"),
  // Unset in dev: magic-link emails are logged to the console instead of sent.
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).default("noisefloor <onboarding@resend.dev>"),
});

export const env = envSchema.parse(process.env);
