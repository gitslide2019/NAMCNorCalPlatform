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
  type Announcement,
  type InsertAnnouncement,
  type Notification,
  type Endorsement,
  type InsertEndorsement,
  type EventRsvp,
  type Campaign,
  type InsertCampaign,
  type CampaignPledge,
  type InsertCampaignPledge,
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
  courseEnrollments,
  announcements,
  notifications,
  endorsements,
  eventRsvps,
  documents,
  campaigns,
  campaignPledges,
  budgetCategories,
  fundingSources,
  type BudgetCategory,
  type InsertBudgetCategory,
  type FundingSource,
  type InsertFundingSource,
  type MemberProject,
  type InsertMemberProject,
  type MemberDocument,
  type InsertMemberDocument,
  type ToolBorrowRequest,
  type InsertToolBorrowRequest,
  type SmsInvitation,
  type InsertSmsInvitation,
  type SmsContact,
  type InsertSmsContact,
  memberProjects,
  memberDocuments,
  toolBorrowRequests,
  smsInvitations,
  smsContacts,
  savedProjectOpportunities,
  committees,
  committeeMemberships,
  committeeMeetings,
  committeeTasks,
  type Committee,
  type InsertCommittee,
  type CommitteeMembership,
  type InsertCommitteeMembership,
  type CommitteeMeeting,
  type InsertCommitteeMeeting,
  type CommitteeTask,
  type InsertCommitteeTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, ilike, count } from "drizzle-orm";

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
  returnToolLoan(loanId: string, returnNotes?: string): Promise<ToolLoan | undefined>;
  getMyLoans(userId: string): Promise<ToolLoan[]>;
  getActiveLoanForTool(toolId: string): Promise<ToolLoan | undefined>;
  getActiveLoansForTool(toolId: string): Promise<ToolLoan[]>;

  createBorrowRequest(data: InsertToolBorrowRequest): Promise<ToolBorrowRequest>;
  getBorrowRequest(id: string): Promise<ToolBorrowRequest | undefined>;
  getBorrowRequestsForTool(toolId: string): Promise<ToolBorrowRequest[]>;
  getBorrowRequestsForOwner(ownerId: string): Promise<ToolBorrowRequest[]>;
  getBorrowRequestsForUser(userId: string): Promise<ToolBorrowRequest[]>;
  updateBorrowRequestStatus(id: string, status: string, ownerResponse?: string): Promise<ToolBorrowRequest | undefined>;

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

  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: { userId: string; type: string; title: string; message: string; link?: string }): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getEndorsements(applicationId: string): Promise<Endorsement[]>;
  createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement>;
  deleteEndorsement(id: string): Promise<void>;

  getRsvps(eventId: string): Promise<EventRsvp[]>;
  getUserRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined>;
  createRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp>;
  deleteRsvp(eventId: string, userId: string): Promise<void>;

  getDocuments(): Promise<any[]>;
  getDocument(id: string): Promise<any | undefined>;
  createDocument(doc: any): Promise<any>;
  deleteDocument(id: string): Promise<void>;

  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<void>;
  getCampaignPledges(campaignId: string): Promise<CampaignPledge[]>;
  createPledge(pledge: InsertCampaignPledge): Promise<CampaignPledge>;
  updatePledgeStatus(id: string, status: string, paidAt?: Date): Promise<CampaignPledge | undefined>;
  deletePledge(id: string): Promise<void>;
  updateCampaignTotal(campaignId: string): Promise<void>;

  getBudgetCategories(fiscalYear?: string): Promise<BudgetCategory[]>;
  updateBudgetCategory(id: string, data: Partial<BudgetCategory>): Promise<BudgetCategory | undefined>;
  getFundingSources(fiscalYear?: string): Promise<FundingSource[]>;
  updateFundingSource(id: string, data: Partial<FundingSource>): Promise<FundingSource | undefined>;

  getMemberProjects(userId: string): Promise<MemberProject[]>;
  getMemberProject(id: string): Promise<MemberProject | undefined>;
  createMemberProject(project: InsertMemberProject): Promise<MemberProject>;
  updateMemberProject(id: string, data: Partial<MemberProject>): Promise<MemberProject | undefined>;
  deleteMemberProject(id: string): Promise<void>;
  getAllFeaturedProjects(): Promise<MemberProject[]>;

  getMemberDocuments(userId: string): Promise<Omit<MemberDocument, "fileData">[]>;
  getMemberDocument(id: string): Promise<MemberDocument | undefined>;
  createMemberDocument(doc: InsertMemberDocument): Promise<MemberDocument>;
  deleteMemberDocument(id: string): Promise<void>;

  createSmsInvitation(data: InsertSmsInvitation): Promise<SmsInvitation>;
  getSmsInvitations(): Promise<SmsInvitation[]>;
  getSmsInvitationsByBatch(batchId: string): Promise<SmsInvitation[]>;
  updateSmsInvitationStatus(id: string, status: string, twilioSid?: string): Promise<SmsInvitation | undefined>;

  createSmsContact(data: InsertSmsContact): Promise<SmsContact>;
  getSmsContacts(filters?: { search?: string; county?: string; city?: string; hasEmail?: boolean; businessType?: string; page?: number; limit?: number }): Promise<{ contacts: SmsContact[]; total: number }>;
  getSmsContactIds(filters?: { search?: string; county?: string; city?: string; hasEmail?: boolean; businessType?: string }): Promise<string[]>;
  getSmsContactBusinessTypes(): Promise<string[]>;
  getSmsContact(id: string): Promise<SmsContact | undefined>;
  getSmsContactByPhone(phone: string): Promise<SmsContact | undefined>;
  updateSmsContact(id: string, data: Partial<SmsContact>): Promise<SmsContact | undefined>;
  deleteSmsContact(id: string): Promise<void>;
  getSmsContactCount(): Promise<number>;

  saveProject(userId: string, projectId: string): Promise<void>;
  unsaveProject(userId: string, projectId: string): Promise<void>;
  getSavedProjectIds(userId: string): Promise<string[]>;

  getCommittees(): Promise<Committee[]>;
  getCommittee(id: string): Promise<Committee | undefined>;
  createCommittee(data: InsertCommittee): Promise<Committee>;
  updateCommittee(id: string, data: Partial<Committee>): Promise<Committee | undefined>;
  deleteCommittee(id: string): Promise<void>;
  getCommitteeMemberships(committeeId: string): Promise<CommitteeMembership[]>;
  getCommitteeMembershipsByUser(userId: string): Promise<CommitteeMembership[]>;
  getCommitteeMembership(id: string): Promise<CommitteeMembership | undefined>;
  getCommitteeMembershipByUser(committeeId: string, userId: string): Promise<CommitteeMembership | undefined>;
  addCommitteeMember(data: InsertCommitteeMembership): Promise<CommitteeMembership>;
  removeCommitteeMember(id: string): Promise<void>;
  getCommitteeMeetings(committeeId: string): Promise<CommitteeMeeting[]>;
  getCommitteeMeeting(id: string): Promise<CommitteeMeeting | undefined>;
  createCommitteeMeeting(data: InsertCommitteeMeeting): Promise<CommitteeMeeting>;
  updateCommitteeMeeting(id: string, data: Partial<CommitteeMeeting>): Promise<CommitteeMeeting | undefined>;
  deleteCommitteeMeeting(id: string): Promise<void>;
  getCommitteeTasks(committeeId: string): Promise<CommitteeTask[]>;
  getCommitteeTask(id: string): Promise<CommitteeTask | undefined>;
  createCommitteeTask(data: InsertCommitteeTask): Promise<CommitteeTask>;
  updateCommitteeTask(id: string, data: Partial<CommitteeTask>): Promise<CommitteeTask | undefined>;
  deleteCommitteeTask(id: string): Promise<void>;
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

  async createBorrowRequest(data: InsertToolBorrowRequest): Promise<ToolBorrowRequest> {
    const [req] = await db.insert(toolBorrowRequests).values(data).returning();
    return req;
  }

  async getBorrowRequest(id: string): Promise<ToolBorrowRequest | undefined> {
    const [req] = await db.select().from(toolBorrowRequests).where(eq(toolBorrowRequests.id, id));
    return req;
  }

  async getBorrowRequestsForTool(toolId: string): Promise<ToolBorrowRequest[]> {
    return await db.select().from(toolBorrowRequests).where(eq(toolBorrowRequests.toolId, toolId)).orderBy(desc(toolBorrowRequests.createdAt));
  }

  async getBorrowRequestsForOwner(ownerId: string): Promise<ToolBorrowRequest[]> {
    const ownerTools = await db.select().from(tools).where(eq(tools.ownerId, ownerId));
    const toolIds = ownerTools.map(t => t.id);
    if (toolIds.length === 0) return [];
    const allRequests = await db.select().from(toolBorrowRequests).orderBy(desc(toolBorrowRequests.createdAt));
    return allRequests.filter(r => toolIds.includes(r.toolId));
  }

  async getBorrowRequestsForUser(userId: string): Promise<ToolBorrowRequest[]> {
    return await db.select().from(toolBorrowRequests).where(eq(toolBorrowRequests.requesterId, userId)).orderBy(desc(toolBorrowRequests.createdAt));
  }

  async updateBorrowRequestStatus(id: string, status: string, ownerResponse?: string): Promise<ToolBorrowRequest | undefined> {
    const updateData: any = { status, respondedAt: new Date() };
    if (ownerResponse !== undefined) updateData.ownerResponse = ownerResponse;
    const [req] = await db.update(toolBorrowRequests).set(updateData).where(eq(toolBorrowRequests.id, id)).returning();
    return req;
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
    const updates: Partial<typeof courseEnrollments.$inferInsert> = { progress, completedLessons };
    if (progress >= 100) updates.completedAt = new Date();
    const [e] = await db.update(courseEnrollments).set(updates).where(eq(courseEnrollments.id, id)).returning();
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

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [a] = await db.insert(announcements).values(announcement).returning();
    return a;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: { userId: string; type: string; title: string; message: string; link?: string }): Promise<Notification> {
    const [n] = await db.insert(notifications).values(data).returning();
    return n;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  async getEndorsements(applicationId: string): Promise<Endorsement[]> {
    return await db.select().from(endorsements).where(eq(endorsements.toApplicationId, applicationId)).orderBy(desc(endorsements.createdAt));
  }

  async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
    const [e] = await db.insert(endorsements).values(endorsement).returning();
    return e;
  }

  async deleteEndorsement(id: string): Promise<void> {
    await db.delete(endorsements).where(eq(endorsements.id, id));
  }

  async getRsvps(eventId: string): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getUserRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined> {
    const [r] = await db.select().from(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return r;
  }

  async createRsvp(eventId: string, userId: string, status: string): Promise<EventRsvp> {
    const existing = await this.getUserRsvp(eventId, userId);
    if (existing) {
      const [r] = await db.update(eventRsvps).set({ status }).where(eq(eventRsvps.id, existing.id)).returning();
      return r;
    }
    const [r] = await db.insert(eventRsvps).values({ eventId, userId, status }).returning();
    return r;
  }

  async deleteRsvp(eventId: string, userId: string): Promise<void> {
    await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
  }

  async getDocuments(): Promise<any[]> {
    const docs = await db.select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      fileType: documents.fileType,
      category: documents.category,
      uploadedById: documents.uploadedById,
      createdAt: documents.createdAt,
    }).from(documents).orderBy(desc(documents.createdAt));
    return docs;
  }

  async getDocument(id: string): Promise<any | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: any): Promise<any> {
    const [d] = await db.insert(documents).values(doc).returning();
    return d;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return c;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [c] = await db.insert(campaigns).values(campaign).returning();
    return c;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const [c] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    return c;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaignPledges).where(eq(campaignPledges.campaignId, id));
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async getCampaignPledges(campaignId: string): Promise<CampaignPledge[]> {
    return await db.select().from(campaignPledges).where(eq(campaignPledges.campaignId, campaignId)).orderBy(desc(campaignPledges.createdAt));
  }

  async createPledge(pledge: InsertCampaignPledge): Promise<CampaignPledge> {
    const [p] = await db.insert(campaignPledges).values(pledge).returning();
    await this.updateCampaignTotal(pledge.campaignId);
    return p;
  }

  async updatePledgeStatus(id: string, status: string, paidAt?: Date): Promise<CampaignPledge | undefined> {
    const updateData: any = { status };
    if (paidAt) updateData.paidAt = paidAt;
    const [p] = await db.update(campaignPledges).set(updateData).where(eq(campaignPledges.id, id)).returning();
    if (p) await this.updateCampaignTotal(p.campaignId);
    return p;
  }

  async deletePledge(id: string): Promise<void> {
    const [pledge] = await db.select().from(campaignPledges).where(eq(campaignPledges.id, id));
    await db.delete(campaignPledges).where(eq(campaignPledges.id, id));
    if (pledge) await this.updateCampaignTotal(pledge.campaignId);
  }

  async updateCampaignTotal(campaignId: string): Promise<void> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(campaignPledges).where(and(eq(campaignPledges.campaignId, campaignId), eq(campaignPledges.status, "received")));
    const total = result[0]?.total || "0";
    await db.update(campaigns).set({ currentAmount: total }).where(eq(campaigns.id, campaignId));
  }

  async getBudgetCategories(fiscalYear?: string): Promise<BudgetCategory[]> {
    if (fiscalYear) {
      return await db.select().from(budgetCategories).where(eq(budgetCategories.fiscalYear, fiscalYear));
    }
    return await db.select().from(budgetCategories);
  }

  async updateBudgetCategory(id: string, data: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const [result] = await db.update(budgetCategories).set(data).where(eq(budgetCategories.id, id)).returning();
    return result;
  }

  async getFundingSources(fiscalYear?: string): Promise<FundingSource[]> {
    if (fiscalYear) {
      return await db.select().from(fundingSources).where(eq(fundingSources.fiscalYear, fiscalYear));
    }
    return await db.select().from(fundingSources);
  }

  async updateFundingSource(id: string, data: Partial<FundingSource>): Promise<FundingSource | undefined> {
    const [result] = await db.update(fundingSources).set(data).where(eq(fundingSources.id, id)).returning();
    return result;
  }

  async getMemberProjects(userId: string): Promise<MemberProject[]> {
    return await db.select().from(memberProjects).where(eq(memberProjects.userId, userId)).orderBy(desc(memberProjects.createdAt));
  }

  async getMemberProject(id: string): Promise<MemberProject | undefined> {
    const [result] = await db.select().from(memberProjects).where(eq(memberProjects.id, id));
    return result;
  }

  async createMemberProject(project: InsertMemberProject): Promise<MemberProject> {
    const [result] = await db.insert(memberProjects).values(project).returning();
    return result;
  }

  async updateMemberProject(id: string, data: Partial<MemberProject>): Promise<MemberProject | undefined> {
    const [result] = await db.update(memberProjects).set(data).where(eq(memberProjects.id, id)).returning();
    return result;
  }

  async deleteMemberProject(id: string): Promise<void> {
    await db.delete(memberProjects).where(eq(memberProjects.id, id));
  }

  async getAllFeaturedProjects(): Promise<MemberProject[]> {
    return await db.select().from(memberProjects).where(eq(memberProjects.isFeatured, true)).orderBy(desc(memberProjects.createdAt));
  }

  async getMemberDocuments(userId: string): Promise<Omit<MemberDocument, "fileData">[]> {
    return await db.select({
      id: memberDocuments.id,
      userId: memberDocuments.userId,
      title: memberDocuments.title,
      description: memberDocuments.description,
      fileName: memberDocuments.fileName,
      fileSize: memberDocuments.fileSize,
      fileType: memberDocuments.fileType,
      category: memberDocuments.category,
      createdAt: memberDocuments.createdAt,
    }).from(memberDocuments).where(eq(memberDocuments.userId, userId)).orderBy(desc(memberDocuments.createdAt));
  }

  async getMemberDocument(id: string): Promise<MemberDocument | undefined> {
    const [result] = await db.select().from(memberDocuments).where(eq(memberDocuments.id, id));
    return result;
  }

  async createMemberDocument(doc: InsertMemberDocument): Promise<MemberDocument> {
    const [result] = await db.insert(memberDocuments).values(doc).returning();
    return result;
  }

  async deleteMemberDocument(id: string): Promise<void> {
    await db.delete(memberDocuments).where(eq(memberDocuments.id, id));
  }

  async createSmsInvitation(data: InsertSmsInvitation): Promise<SmsInvitation> {
    const [result] = await db.insert(smsInvitations).values(data).returning();
    return result;
  }

  async getSmsInvitations(): Promise<SmsInvitation[]> {
    return db.select().from(smsInvitations).orderBy(desc(smsInvitations.createdAt));
  }

  async getSmsInvitationsByBatch(batchId: string): Promise<SmsInvitation[]> {
    return db.select().from(smsInvitations).where(eq(smsInvitations.batchId, batchId)).orderBy(desc(smsInvitations.createdAt));
  }

  async updateSmsInvitationStatus(id: string, status: string, twilioSid?: string): Promise<SmsInvitation | undefined> {
    const updateData: any = { status, sentAt: new Date() };
    if (twilioSid) updateData.twilioSid = twilioSid;
    const [result] = await db.update(smsInvitations).set(updateData).where(eq(smsInvitations.id, id)).returning();
    return result;
  }

  async createSmsContact(data: InsertSmsContact): Promise<SmsContact> {
    const [result] = await db.insert(smsContacts).values(data).returning();
    return result;
  }

  private buildSmsContactConditions(filters?: { search?: string; county?: string; city?: string; hasEmail?: boolean; businessType?: string }) {
    const conditions: any[] = [];
    if (filters?.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(
        ilike(smsContacts.businessName, term),
        ilike(smsContacts.contactName, term),
        ilike(smsContacts.phone, term),
        ilike(smsContacts.email, term),
      ));
    }
    if (filters?.county) {
      conditions.push(ilike(smsContacts.county, filters.county));
    }
    if (filters?.city) {
      conditions.push(ilike(smsContacts.city, `%${filters.city}%`));
    }
    if (filters?.hasEmail) {
      conditions.push(sql`${smsContacts.email} IS NOT NULL AND ${smsContacts.email} != ''`);
    }
    if (filters?.businessType) {
      conditions.push(ilike(smsContacts.businessType, filters.businessType));
    }
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async getSmsContacts(filters?: { search?: string; county?: string; city?: string; hasEmail?: boolean; businessType?: string; page?: number; limit?: number }): Promise<{ contacts: SmsContact[]; total: number }> {
    const whereClause = this.buildSmsContactConditions(filters);

    const [totalResult] = await db.select({ value: count() }).from(smsContacts).where(whereClause);
    const total = Number(totalResult?.value || 0);

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const contacts = await db.select().from(smsContacts)
      .where(whereClause)
      .orderBy(asc(smsContacts.businessName))
      .limit(limit)
      .offset(offset);

    return { contacts, total };
  }

  async getSmsContactIds(filters?: { search?: string; county?: string; city?: string; hasEmail?: boolean; businessType?: string }): Promise<string[]> {
    const whereClause = this.buildSmsContactConditions(filters);
    const results = await db.select({ id: smsContacts.id }).from(smsContacts).where(whereClause).orderBy(asc(smsContacts.businessName));
    return results.map(r => r.id);
  }

  async getSmsContactBusinessTypes(): Promise<string[]> {
    const results = await db.selectDistinct({ businessType: smsContacts.businessType })
      .from(smsContacts)
      .where(sql`${smsContacts.businessType} IS NOT NULL AND ${smsContacts.businessType} != ''`)
      .orderBy(asc(smsContacts.businessType));
    return results.map(r => r.businessType!);
  }

  async getSmsContact(id: string): Promise<SmsContact | undefined> {
    const [result] = await db.select().from(smsContacts).where(eq(smsContacts.id, id));
    return result;
  }

  async getSmsContactByPhone(phone: string): Promise<SmsContact | undefined> {
    const [result] = await db.select().from(smsContacts).where(eq(smsContacts.phone, phone));
    return result;
  }

  async updateSmsContact(id: string, data: Partial<SmsContact>): Promise<SmsContact | undefined> {
    const [result] = await db.update(smsContacts).set(data).where(eq(smsContacts.id, id)).returning();
    return result;
  }

  async deleteSmsContact(id: string): Promise<void> {
    await db.delete(smsContacts).where(eq(smsContacts.id, id));
  }

  async getSmsContactCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(smsContacts);
    return Number(result?.value || 0);
  }

  async saveProject(userId: string, projectId: string): Promise<void> {
    await db.insert(savedProjectOpportunities).values({ userId, projectId }).onConflictDoNothing();
  }

  async unsaveProject(userId: string, projectId: string): Promise<void> {
    await db.delete(savedProjectOpportunities).where(
      and(
        eq(savedProjectOpportunities.userId, userId),
        eq(savedProjectOpportunities.projectId, projectId)
      )
    );
  }

  async getSavedProjectIds(userId: string): Promise<string[]> {
    const rows = await db.select({ projectId: savedProjectOpportunities.projectId })
      .from(savedProjectOpportunities)
      .where(eq(savedProjectOpportunities.userId, userId));
    return rows.map(r => r.projectId);
  }

  async getCommittees(): Promise<Committee[]> {
    return await db.select().from(committees).orderBy(desc(committees.isActive), asc(committees.name));
  }

  async getCommittee(id: string): Promise<Committee | undefined> {
    const [c] = await db.select().from(committees).where(eq(committees.id, id));
    return c;
  }

  async createCommittee(data: InsertCommittee): Promise<Committee> {
    const [c] = await db.insert(committees).values(data).returning();
    return c;
  }

  async updateCommittee(id: string, data: Partial<Committee>): Promise<Committee | undefined> {
    const [c] = await db.update(committees).set(data).where(eq(committees.id, id)).returning();
    return c;
  }

  async deleteCommittee(id: string): Promise<void> {
    await db.delete(committeeTasks).where(eq(committeeTasks.committeeId, id));
    await db.delete(committeeMeetings).where(eq(committeeMeetings.committeeId, id));
    await db.delete(committeeMemberships).where(eq(committeeMemberships.committeeId, id));
    await db.delete(committees).where(eq(committees.id, id));
  }

  async getCommitteeMemberships(committeeId: string): Promise<CommitteeMembership[]> {
    return await db.select().from(committeeMemberships).where(eq(committeeMemberships.committeeId, committeeId)).orderBy(asc(committeeMemberships.joinedAt));
  }

  async getCommitteeMembershipsByUser(userId: string): Promise<CommitteeMembership[]> {
    return await db.select().from(committeeMemberships).where(eq(committeeMemberships.userId, userId));
  }

  async getCommitteeMembership(id: string): Promise<CommitteeMembership | undefined> {
    const [m] = await db.select().from(committeeMemberships).where(eq(committeeMemberships.id, id));
    return m;
  }

  async getCommitteeMembershipByUser(committeeId: string, userId: string): Promise<CommitteeMembership | undefined> {
    const [m] = await db.select().from(committeeMemberships)
      .where(and(eq(committeeMemberships.committeeId, committeeId), eq(committeeMemberships.userId, userId)));
    return m;
  }

  async addCommitteeMember(data: InsertCommitteeMembership): Promise<CommitteeMembership> {
    const [m] = await db.insert(committeeMemberships).values(data).returning();
    return m;
  }

  async removeCommitteeMember(id: string): Promise<void> {
    await db.delete(committeeMemberships).where(eq(committeeMemberships.id, id));
  }

  async getCommitteeMeetings(committeeId: string): Promise<CommitteeMeeting[]> {
    return await db.select().from(committeeMeetings)
      .where(eq(committeeMeetings.committeeId, committeeId))
      .orderBy(desc(committeeMeetings.meetingDate));
  }

  async getCommitteeMeeting(id: string): Promise<CommitteeMeeting | undefined> {
    const [m] = await db.select().from(committeeMeetings).where(eq(committeeMeetings.id, id));
    return m;
  }

  async createCommitteeMeeting(data: InsertCommitteeMeeting): Promise<CommitteeMeeting> {
    const [m] = await db.insert(committeeMeetings).values(data).returning();
    return m;
  }

  async updateCommitteeMeeting(id: string, data: Partial<CommitteeMeeting>): Promise<CommitteeMeeting | undefined> {
    const [m] = await db.update(committeeMeetings).set(data).where(eq(committeeMeetings.id, id)).returning();
    return m;
  }

  async deleteCommitteeMeeting(id: string): Promise<void> {
    await db.delete(committeeMeetings).where(eq(committeeMeetings.id, id));
  }

  async getCommitteeTasks(committeeId: string): Promise<CommitteeTask[]> {
    return await db.select().from(committeeTasks)
      .where(eq(committeeTasks.committeeId, committeeId))
      .orderBy(asc(committeeTasks.status), desc(committeeTasks.createdAt));
  }

  async getCommitteeTask(id: string): Promise<CommitteeTask | undefined> {
    const [t] = await db.select().from(committeeTasks).where(eq(committeeTasks.id, id));
    return t;
  }

  async createCommitteeTask(data: InsertCommitteeTask): Promise<CommitteeTask> {
    const [t] = await db.insert(committeeTasks).values(data).returning();
    return t;
  }

  async updateCommitteeTask(id: string, data: Partial<CommitteeTask>): Promise<CommitteeTask | undefined> {
    const [t] = await db.update(committeeTasks).set(data).where(eq(committeeTasks.id, id)).returning();
    return t;
  }

  async deleteCommitteeTask(id: string): Promise<void> {
    await db.delete(committeeTasks).where(eq(committeeTasks.id, id));
  }
}

export const storage = new DatabaseStorage();
