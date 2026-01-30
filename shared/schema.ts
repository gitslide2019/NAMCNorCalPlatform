import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const membershipCategories = [
  "small",
  "medium", 
  "large",
  "government"
] as const;

export type MembershipCategory = typeof membershipCategories[number];

export const membershipApplications = pgTable("membership_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  membershipCategory: text("membership_category").notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  website: text("website"),
  yearEstablished: text("year_established"),
  numberOfEmployees: text("number_of_employees"),
  annualRevenue: text("annual_revenue"),
  primaryServices: text("primary_services"),
  certifications: text("certifications"),
  howDidYouHear: text("how_did_you_hear"),
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  membershipCategory: z.enum(membershipCategories, {
    errorMap: () => ({ message: "Please select a membership category" }),
  }),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to submit" }),
  }),
});

export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;
export type MembershipApplication = typeof membershipApplications.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
