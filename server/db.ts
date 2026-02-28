import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureAdminUser() {
  const { users } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const { scrypt, randomBytes } = await import("crypto");
  const { promisify } = await import("util");
  const scryptAsync = promisify(scrypt);

  const [existing] = await db.select().from(users).where(eq(users.username, "testadmin"));
  if (!existing) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("test1234", salt, 64)) as Buffer;
    const hashedPassword = buf.toString("hex") + "." + salt;
    await db.insert(users).values({
      username: "testadmin",
      password: hashedPassword,
      isAdmin: true,
    });
    console.log("Created testadmin user");
  }
}

export async function seedMembers() {
  const { membershipApplications } = await import("@shared/schema");
  const { sql: sqlTag } = await import("drizzle-orm");

  const result = await db.select({ count: sqlTag<number>`count(*)` }).from(membershipApplications);
  const count = Number(result[0]?.count || 0);
  if (count === 0) {
    const { default: seedData } = await import("./seed-members.json");
    for (const member of seedData) {
      await db.insert(membershipApplications).values(member as any);
    }
    console.log(`Seeded ${seedData.length} member applications`);
  }
}

export async function ensureTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id varchar NOT NULL,
      recipient_id varchar NOT NULL,
      subject text NOT NULL,
      content text NOT NULL,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discussion_topics (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      category text NOT NULL DEFAULT 'general',
      content text NOT NULL,
      author_id varchar NOT NULL,
      is_pinned boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discussion_replies (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id varchar NOT NULL,
      author_id varchar NOT NULL,
      content text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_opportunities (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      location text NOT NULL,
      budget text,
      deadline text,
      contact_email text,
      posted_by_id varchar NOT NULL,
      status text NOT NULL DEFAULT 'open',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_bids (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id varchar NOT NULL,
      bidder_id varchar NOT NULL,
      amount text NOT NULL,
      proposal text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      event_date text NOT NULL,
      event_time text,
      location text,
      created_by_id varchar NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS newsletters (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      content text NOT NULL,
      published_at timestamp NOT NULL DEFAULT now(),
      created_by_id varchar NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tools (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      category text NOT NULL DEFAULT 'general',
      owner_id varchar NOT NULL,
      status text NOT NULL DEFAULT 'available',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tool_loans (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_id varchar NOT NULL,
      borrower_id varchar NOT NULL,
      borrow_date timestamp NOT NULL DEFAULT now(),
      return_date timestamp,
      status text NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS courses (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      created_by_id varchar NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lessons (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id varchar NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id varchar NOT NULL,
      user_id varchar NOT NULL,
      progress integer NOT NULL DEFAULT 0,
      completed_lessons text NOT NULL DEFAULT '',
      enrolled_at timestamp NOT NULL DEFAULT now()
    )
  `);
}
