import { 
  type User, 
  type InsertUser, 
  type MembershipApplication, 
  type InsertMembershipApplication,
  type Message,
  type InsertMessage,
  type DiscussionTopic,
  type InsertDiscussionTopic,
  type DiscussionReply,
  type InsertDiscussionReply,
  type ProjectOpportunity,
  type InsertProjectOpportunity,
  type ProjectBid,
  type InsertProjectBid,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Newsletter,
  type InsertNewsletter,
  type Tool,
  type InsertTool,
  type ToolLoan,
  type InsertToolLoan,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  users,
  membershipApplications,
  messages,
  discussionTopics,
  discussionReplies,
  projectOpportunities,
  projectBids,
  calendarEvents,
  newsletters,
  tools,
  toolLoans,
  courses,
  lessons,
  courseEnrollments
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplications(): Promise<MembershipApplication[]>;
  getMembershipApplication(id: string): Promise<MembershipApplication | undefined>;
  getMembershipApplicationByEmail(email: string): Promise<MembershipApplication | undefined>;
  updateMembershipApplicationStatus(id: string, status: string): Promise<MembershipApplication | undefined>;
  updateMembershipApplication(id: string, data: Partial<MembershipApplication>): Promise<MembershipApplication | undefined>;
  getApprovedMembershipApplications(): Promise<MembershipApplication[]>;

  sendMessage(message: InsertMessage): Promise<Message>;
  getInbox(userId: string): Promise<Message[]>;
  getSentMessages(userId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  markAsRead(id: string): Promise<Message | undefined>;

  getTopics(): Promise<DiscussionTopic[]>;
  getTopic(id: string): Promise<DiscussionTopic | undefined>;
  createTopic(topic: InsertDiscussionTopic): Promise<DiscussionTopic>;
  updateTopic(id: string, data: Partial<DiscussionTopic>): Promise<DiscussionTopic | undefined>;
  deleteTopic(id: string): Promise<void>;
  getReplies(topicId: string): Promise<DiscussionReply[]>;
  getReply(id: string): Promise<DiscussionReply | undefined>;
  createReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  deleteReply(id: string): Promise<void>;
  getReplyCount(topicId: string): Promise<number>;

  getProjects(): Promise<ProjectOpportunity[]>;
  getProject(id: string): Promise<ProjectOpportunity | undefined>;
  createProject(project: InsertProjectOpportunity): Promise<ProjectOpportunity>;
  updateProjectStatus(id: string, status: string): Promise<ProjectOpportunity | undefined>;
  getBidsForProject(projectId: string): Promise<ProjectBid[]>;
  createBid(bid: InsertProjectBid): Promise<ProjectBid>;
  updateBidStatus(bidId: string, status: string): Promise<ProjectBid | undefined>;

  getEvents(): Promise<CalendarEvent[]>;
  getEvent(id: string): Promise<CalendarEvent | undefined>;
  createEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteEvent(id: string): Promise<void>;

  updateCourse(id: string, data: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<void>;

  getNewsletters(): Promise<Newsletter[]>;
  getNewsletter(id: string): Promise<Newsletter | undefined>;
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  updateNewsletter(id: string, data: Partial<Newsletter>): Promise<Newsletter | undefined>;
  deleteNewsletter(id: string): Promise<void>;

  getTools(): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, data: Partial<Tool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<void>;
  updateToolStatus(id: string, status: string): Promise<Tool | undefined>;
  createToolLoan(loan: InsertToolLoan): Promise<ToolLoan>;
  returnToolLoan(loanId: string): Promise<ToolLoan | undefined>;
  getMyLoans(userId: string): Promise<ToolLoan[]>;
  getActiveLoanForTool(toolId: string): Promise<ToolLoan | undefined>;
  getActiveLoansForTool(toolId: string): Promise<ToolLoan[]>;

  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getLessons(courseId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  enrollInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  getEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | undefined>;
  getMyEnrollments(userId: string): Promise<CourseEnrollment[]>;
  updateEnrollmentProgress(id: string, progress: number, completedLessons: string): Promise<CourseEnrollment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication> {
    const [membershipApplication] = await db
      .insert(membershipApplications)
      .values(application)
      .returning();
    return membershipApplication;
  }

  async getMembershipApplications(): Promise<MembershipApplication[]> {
    return await db.select().from(membershipApplications);
  }

  async getMembershipApplication(id: string): Promise<MembershipApplication | undefined> {
    const [application] = await db
      .select()
      .from(membershipApplications)
      .where(eq(membershipApplications.id, id));
    return application;
  }

  async getMembershipApplicationByEmail(email: string): Promise<MembershipApplication | undefined> {
    const [application] = await db
      .select()
      .from(membershipApplications)
      .where(eq(membershipApplications.email, email));
    return application;
  }

  async updateMembershipApplicationStatus(id: string, status: string): Promise<MembershipApplication | undefined> {
    const [application] = await db
      .update(membershipApplications)
      .set({ status })
      .where(eq(membershipApplications.id, id))
      .returning();
    return application;
  }

  async updateMembershipApplication(id: string, data: Partial<MembershipApplication>): Promise<MembershipApplication | undefined> {
    const [application] = await db
      .update(membershipApplications)
      .set(data)
      .where(eq(membershipApplications.id, id))
      .returning();
    return application;
  }

  async getApprovedMembershipApplications(): Promise<MembershipApplication[]> {
    return await db
      .select()
      .from(membershipApplications)
      .where(eq(membershipApplications.status, "approved"));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }

  async getInbox(userId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.recipientId, userId)).orderBy(desc(messages.createdAt));
  }

  async getSentMessages(userId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.senderId, userId)).orderBy(desc(messages.createdAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [msg] = await db.select().from(messages).where(eq(messages.id, id));
    return msg;
  }

  async markAsRead(id: string): Promise<Message | undefined> {
    const [msg] = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id)).returning();
    return msg;
  }

  async getTopics(): Promise<DiscussionTopic[]> {
    return await db.select().from(discussionTopics).orderBy(desc(discussionTopics.isPinned), desc(discussionTopics.createdAt));
  }

  async getTopic(id: string): Promise<DiscussionTopic | undefined> {
    const [topic] = await db.select().from(discussionTopics).where(eq(discussionTopics.id, id));
    return topic;
  }

  async createTopic(topic: InsertDiscussionTopic): Promise<DiscussionTopic> {
    const [t] = await db.insert(discussionTopics).values(topic).returning();
    return t;
  }

  async updateTopic(id: string, data: Partial<DiscussionTopic>): Promise<DiscussionTopic | undefined> {
    const [t] = await db.update(discussionTopics).set(data).where(eq(discussionTopics.id, id)).returning();
    return t;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(discussionReplies).where(eq(discussionReplies.topicId, id));
    await db.delete(discussionTopics).where(eq(discussionTopics.id, id));
  }

  async getReplies(topicId: string): Promise<DiscussionReply[]> {
    return await db.select().from(discussionReplies).where(eq(discussionReplies.topicId, topicId)).orderBy(asc(discussionReplies.createdAt));
  }

  async getReply(id: string): Promise<DiscussionReply | undefined> {
    const [r] = await db.select().from(discussionReplies).where(eq(discussionReplies.id, id));
    return r;
  }

  async createReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [r] = await db.insert(discussionReplies).values(reply).returning();
    return r;
  }

  async deleteReply(id: string): Promise<void> {
    await db.delete(discussionReplies).where(eq(discussionReplies.id, id));
  }

  async getReplyCount(topicId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(discussionReplies).where(eq(discussionReplies.topicId, topicId));
    return Number(result[0]?.count || 0);
  }

  async getProjects(): Promise<ProjectOpportunity[]> {
    return await db.select().from(projectOpportunities).orderBy(desc(projectOpportunities.createdAt));
  }

  async getProject(id: string): Promise<ProjectOpportunity | undefined> {
    const [project] = await db.select().from(projectOpportunities).where(eq(projectOpportunities.id, id));
    return project;
  }

  async createProject(project: InsertProjectOpportunity): Promise<ProjectOpportunity> {
    const [p] = await db.insert(projectOpportunities).values(project).returning();
    return p;
  }

  async updateProjectStatus(id: string, status: string): Promise<ProjectOpportunity | undefined> {
    const [p] = await db.update(projectOpportunities).set({ status }).where(eq(projectOpportunities.id, id)).returning();
    return p;
  }

  async getBidsForProject(projectId: string): Promise<ProjectBid[]> {
    return await db.select().from(projectBids).where(eq(projectBids.projectId, projectId)).orderBy(desc(projectBids.createdAt));
  }

  async createBid(bid: InsertProjectBid): Promise<ProjectBid> {
    const [b] = await db.insert(projectBids).values(bid).returning();
    return b;
  }

  async updateBidStatus(bidId: string, status: string): Promise<ProjectBid | undefined> {
    const [b] = await db.update(projectBids).set({ status }).where(eq(projectBids.id, bidId)).returning();
    return b;
  }

  async getEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).orderBy(asc(calendarEvents.eventDate));
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    const [e] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return e;
  }

  async createEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [e] = await db.insert(calendarEvents).values(event).returning();
    return e;
  }

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const [e] = await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id)).returning();
    return e;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async getNewsletters(): Promise<Newsletter[]> {
    return await db.select().from(newsletters).orderBy(desc(newsletters.publishedAt));
  }

  async getNewsletter(id: string): Promise<Newsletter | undefined> {
    const [n] = await db.select().from(newsletters).where(eq(newsletters.id, id));
    return n;
  }

  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const [n] = await db.insert(newsletters).values(newsletter).returning();
    return n;
  }

  async updateNewsletter(id: string, data: Partial<Newsletter>): Promise<Newsletter | undefined> {
    const [n] = await db.update(newsletters).set(data).where(eq(newsletters.id, id)).returning();
    return n;
  }

  async deleteNewsletter(id: string): Promise<void> {
    await db.delete(newsletters).where(eq(newsletters.id, id));
  }

  async getTools(): Promise<Tool[]> {
    return await db.select().from(tools).orderBy(desc(tools.createdAt));
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const [t] = await db.select().from(tools).where(eq(tools.id, id));
    return t;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [t] = await db.insert(tools).values(tool).returning();
    return t;
  }

  async updateTool(id: string, data: Partial<Tool>): Promise<Tool | undefined> {
    const [t] = await db.update(tools).set(data).where(eq(tools.id, id)).returning();
    return t;
  }

  async deleteTool(id: string): Promise<void> {
    await db.delete(toolLoans).where(eq(toolLoans.toolId, id));
    await db.delete(tools).where(eq(tools.id, id));
  }

  async updateToolStatus(id: string, status: string): Promise<Tool | undefined> {
    const [t] = await db.update(tools).set({ status }).where(eq(tools.id, id)).returning();
    return t;
  }

  async createToolLoan(loan: InsertToolLoan): Promise<ToolLoan> {
    const [l] = await db.insert(toolLoans).values(loan).returning();
    return l;
  }

  async returnToolLoan(loanId: string, returnNotes?: string): Promise<ToolLoan | undefined> {
    const updates: Record<string, any> = { status: "returned", returnDate: new Date() };
    if (returnNotes) updates.returnNotes = returnNotes;
    const [l] = await db.update(toolLoans).set(updates).where(eq(toolLoans.id, loanId)).returning();
    return l;
  }

  async getToolLoans(toolId: string): Promise<ToolLoan[]> {
    return await db.select().from(toolLoans).where(eq(toolLoans.toolId, toolId)).orderBy(desc(toolLoans.borrowDate));
  }

  async getMyLoans(userId: string): Promise<ToolLoan[]> {
    return await db.select().from(toolLoans).where(eq(toolLoans.borrowerId, userId)).orderBy(desc(toolLoans.borrowDate));
  }

  async getActiveLoanForTool(toolId: string): Promise<ToolLoan | undefined> {
    const [loan] = await db.select().from(toolLoans).where(and(eq(toolLoans.toolId, toolId), eq(toolLoans.status, "active")));
    return loan;
  }

  async getActiveLoansForTool(toolId: string): Promise<ToolLoan[]> {
    return await db.select().from(toolLoans).where(and(eq(toolLoans.toolId, toolId), eq(toolLoans.status, "active")));
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [c] = await db.select().from(courses).where(eq(courses.id, id));
    return c;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [c] = await db.insert(courses).values(course).returning();
    return c;
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.sortOrder));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [l] = await db.select().from(lessons).where(eq(lessons.id, id));
    return l;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [l] = await db.insert(lessons).values(lesson).returning();
    return l;
  }

  async enrollInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [e] = await db.insert(courseEnrollments).values(enrollment).returning();
    return e;
  }

  async getEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | undefined> {
    const [e] = await db.select().from(courseEnrollments).where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.userId, userId)));
    return e;
  }

  async getMyEnrollments(userId: string): Promise<CourseEnrollment[]> {
    return await db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId));
  }

  async updateEnrollmentProgress(id: string, progress: number, completedLessons: string): Promise<CourseEnrollment | undefined> {
    const [e] = await db.update(courseEnrollments).set({ progress, completedLessons }).where(eq(courseEnrollments.id, id)).returning();
    return e;
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<Course | undefined> {
    const [c] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return c;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
    await db.delete(lessons).where(eq(lessons.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | undefined> {
    const [l] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return l;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }
}

export const storage = new DatabaseStorage();
