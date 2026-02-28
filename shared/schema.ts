import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const membershipCategories = [
  "small",
  "medium", 
  "large",
  "government"
] as const;

export type MembershipCategory = typeof membershipCategories[number];

export const applicationStatuses = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];

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
  isBoardMember: boolean("is_board_member").notNull().default(false),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({
  id: true,
  status: true,
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
  isAdmin: boolean("is_admin").notNull().default(false),
  memberApplicationId: varchar("member_application_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const discussionTopics = pgTable("discussion_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiscussionTopicSchema = createInsertSchema(discussionTopics).omit({
  id: true,
  isPinned: true,
  createdAt: true,
});

export type InsertDiscussionTopic = z.infer<typeof insertDiscussionTopicSchema>;
export type DiscussionTopic = typeof discussionTopics.$inferSelect;

export const discussionReplies = pgTable("discussion_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({
  id: true,
  createdAt: true,
});

export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

export const projectOpportunities = pgTable("project_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  budget: text("budget"),
  deadline: text("deadline"),
  contactEmail: text("contact_email"),
  postedById: varchar("posted_by_id").notNull(),
  status: text("status").notNull().default("open"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectOpportunitySchema = createInsertSchema(projectOpportunities).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertProjectOpportunity = z.infer<typeof insertProjectOpportunitySchema>;
export type ProjectOpportunity = typeof projectOpportunities.$inferSelect;

export const projectBids = pgTable("project_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  bidderId: varchar("bidder_id").notNull(),
  amount: text("amount").notNull(),
  proposal: text("proposal").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectBidSchema = createInsertSchema(projectBids).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertProjectBid = z.infer<typeof insertProjectBidSchema>;
export type ProjectBid = typeof projectBids.$inferSelect;

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  location: text("location"),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

export const newsletters = pgTable("newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  publishedAt: true,
  createdAt: true,
});

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletters.$inferSelect;

export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  ownerId: varchar("owner_id").notNull(),
  status: text("status").notNull().default("available"),
  condition: text("condition").notNull().default("good"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

export const toolLoans = pgTable("tool_loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull(),
  borrowerId: varchar("borrower_id").notNull(),
  borrowDate: timestamp("borrow_date").defaultNow().notNull(),
  expectedReturnDate: timestamp("expected_return_date"),
  returnDate: timestamp("return_date"),
  notes: text("notes"),
  returnNotes: text("return_notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertToolLoanSchema = createInsertSchema(toolLoans).omit({
  id: true,
  returnDate: true,
  returnNotes: true,
  status: true,
  createdAt: true,
});

export type InsertToolLoan = z.infer<typeof insertToolLoanSchema>;
export type ToolLoan = typeof toolLoans.$inferSelect;

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  userId: varchar("user_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completedLessons: text("completed_lessons").notNull().default(""),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  progress: true,
  completedLessons: true,
  enrolledAt: true,
});

export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
