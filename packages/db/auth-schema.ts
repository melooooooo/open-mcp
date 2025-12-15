import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, varchar, numeric, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  phoneNumber: text("phone_number"),
  phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
  gender: text("gender"),
  address: text("address"),
  contactPhone: text("contact_phone"),
  role: varchar("role", { length: 64, enum: ["admin", "user", "member"] }).default("user"),
  banned: boolean("banned").notNull().default(false),
  bannedReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"),
  impersonatedAt: timestamp("impersonated_at"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});


export const phoneVerificationCodes = pgTable(
  "phone_verification_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    phone: varchar("phone", { length: 20 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).default(sql`now()`),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  }
)

// https://www.better-auth.com/docs/plugins/api-key
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  start: varchar("start", { length: 256 }),
  prefix: varchar("prefix", { length: 256 }),
  key: varchar("key", { length: 256 }).notNull(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  refillInterval: numeric("refill_interval"),
  refillAmount: numeric("refill_amount"),
  lastRefillAt: timestamp("last_refill_at"),
  enabled: boolean("enabled").default(true).notNull(),
  rateLimitEnabled: boolean("rate_limit_enabled").default(true).notNull(),
  rateLimitTimeWindow: numeric("rate_limit_time_window").notNull(),
  rateLimitMax: numeric("rate_limit_max").notNull(),
  requestCount: numeric("request_count").notNull(),
  remaining: numeric("remaining").notNull(),
  lastRequest: timestamp("last_request"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  permissions: text("permissions"),
  metadata: jsonb("metadata")
});
