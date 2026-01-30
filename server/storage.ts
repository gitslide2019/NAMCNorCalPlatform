import { 
  type User, 
  type InsertUser, 
  type MembershipApplication, 
  type InsertMembershipApplication,
  users,
  membershipApplications
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplications(): Promise<MembershipApplication[]>;
  getMembershipApplication(id: string): Promise<MembershipApplication | undefined>;
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
}

export const storage = new DatabaseStorage();
