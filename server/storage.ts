import { 
  type User, 
  type InsertUser, 
  type MembershipApplication, 
  type InsertMembershipApplication,
  users,
  membershipApplications
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplications(): Promise<MembershipApplication[]>;
  getMembershipApplication(id: string): Promise<MembershipApplication | undefined>;
  getMembershipApplicationByEmail(email: string): Promise<MembershipApplication | undefined>;
  updateMembershipApplicationStatus(id: string, status: string): Promise<MembershipApplication | undefined>;
  updateMembershipApplication(id: string, data: Partial<MembershipApplication>): Promise<MembershipApplication | undefined>;
  getApprovedMembershipApplications(): Promise<MembershipApplication[]>;
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
}

export const storage = new DatabaseStorage();
