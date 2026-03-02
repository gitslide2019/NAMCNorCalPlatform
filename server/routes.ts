import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMembershipApplicationSchema, insertMessageSchema, insertDiscussionTopicSchema, insertDiscussionReplySchema, insertProjectOpportunitySchema, insertProjectBidSchema, insertCalendarEventSchema, insertNewsletterSchema, insertToolSchema, insertCourseSchema, insertLessonSchema, insertAnnouncementSchema, insertEndorsementSchema, insertCampaignSchema, insertCampaignPledgeSchema, insertMemberProjectSchema, insertMemberDocumentSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAuth, requireAdmin, requireAdminOrBoard } from "./auth";
import { sendNewsletterEmail, sendDigestEmail } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/membership-applications", async (req, res) => {
    try {
      const validatedData = insertMembershipApplicationSchema.parse(req.body);
      const application = await storage.createMembershipApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating membership application:", error);
        res.status(500).json({ message: "Failed to submit application. Please try again." });
      }
    }
  });

  app.get("/api/membership-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getMembershipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching membership applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/membership-applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching membership application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.get("/api/membership-applications-export/csv", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getMembershipApplications();
      
      const headers = [
        "ID", "Membership Category", "Company Name", "Contact Name", "Title",
        "Email", "Phone", "Address", "City", "State", "ZIP Code", "Website",
        "Year Established", "Number of Employees", "Annual Revenue",
        "Primary Services", "Certifications", "How Did You Hear",
        "Accepted Terms", "Status", "Submitted At"
      ];

      const rows = applications.map(app => [
        app.id, app.membershipCategory, app.companyName, app.contactName,
        app.title, app.email, app.phone, app.address, app.city, app.state,
        app.zipCode, app.website || "", app.yearEstablished || "",
        app.numberOfEmployees || "", app.annualRevenue || "",
        (app.primaryServices || "").replace(/"/g, '""'),
        (app.certifications || "").replace(/"/g, '""'),
        app.howDidYouHear || "", app.acceptedTerms ? "Yes" : "No",
        app.status || "pending",
        app.createdAt ? new Date(app.createdAt).toISOString() : ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=namc-membership-applications-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting membership applications:", error);
      res.status(500).json({ message: "Failed to export applications" });
    }
  });

  app.patch("/api/membership-applications/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        res.status(400).json({ message: "Invalid status. Must be pending, approved, or rejected." });
        return;
      }
      const application = await storage.updateMembershipApplicationStatus(req.params.id, status);
      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  app.get("/api/portal/directory", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getApprovedMembershipApplications();
      const directory = applications.map(app => ({
        id: app.id,
        companyName: app.companyName,
        contactName: app.contactName,
        title: app.title,
        email: app.email,
        phone: app.phone,
        city: app.city,
        state: app.state,
        website: app.website,
        primaryServices: app.primaryServices,
        certifications: app.certifications,
        membershipCategory: app.membershipCategory,
        isBoardMember: app.isBoardMember,
        profileImageUrl: app.profileImageUrl,
      }));
      res.json(directory);
    } catch (error) {
      console.error("Error fetching directory:", error);
      res.status(500).json({ message: "Failed to fetch member directory" });
    }
  });

  app.get("/api/portal/directory/:id", requireAuth, async (req, res) => {
    try {
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application || application.status !== "approved") {
        res.status(404).json({ message: "Member not found" });
        return;
      }
      const allUsers = await storage.getAllUsers();
      const linkedUser = allUsers.find(u => u.memberApplicationId === application.id);
      const linkedUserId = linkedUser?.id || null;

      let memberProjectsList: any[] = [];
      let memberDocumentsList: any[] = [];
      if (linkedUserId) {
        try {
          memberProjectsList = await storage.getMemberProjects(linkedUserId);
          memberDocumentsList = await storage.getMemberDocuments(linkedUserId);
        } catch (e) {}
      }

      res.json({
        id: application.id,
        companyName: application.companyName,
        contactName: application.contactName,
        title: application.title,
        email: application.email,
        phone: application.phone,
        address: application.address,
        city: application.city,
        state: application.state,
        zipCode: application.zipCode,
        website: application.website,
        primaryServices: application.primaryServices,
        certifications: application.certifications,
        membershipCategory: application.membershipCategory,
        isBoardMember: application.isBoardMember,
        userId: linkedUserId,
        yearEstablished: application.yearEstablished,
        numberOfEmployees: application.numberOfEmployees,
        annualRevenue: application.annualRevenue,
        profileImageUrl: application.profileImageUrl,
        memberProjects: memberProjectsList,
        memberDocuments: memberDocumentsList,
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.get("/api/portal/my-application", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.memberApplicationId) {
        const application = await storage.getMembershipApplication(user.memberApplicationId);
        res.json(application || null);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching user application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.patch("/api/portal/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.memberApplicationId) {
        res.status(404).json({ message: "No linked application found" });
        return;
      }
      const allowedFields = ["companyName", "title", "contactName", "email", "phone", "address", "city", "state", "zipCode", "website", "primaryServices", "certifications", "yearEstablished", "numberOfEmployees", "annualRevenue", "profileImageUrl"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const application = await storage.updateMembershipApplication(user.memberApplicationId, updates);
      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      res.json(application);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/portal/link-application", requireAdmin, async (req, res) => {
    try {
      const { applicationId, userId } = req.body;
      if (!applicationId) {
        res.status(400).json({ message: "Application ID is required" });
        return;
      }
      const application = await storage.getMembershipApplication(applicationId);
      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      const targetUserId = userId || req.user!.id;
      const updatedUser = await storage.updateUser(targetUserId, { memberApplicationId: applicationId });
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error linking application:", error);
      res.status(500).json({ message: "Failed to link application" });
    }
  });

  app.get("/api/portal/users", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(u => ({ id: u.id, username: u.username }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/portal/messages", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const inbox = await storage.getInbox(user.id);
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      const enriched = inbox.map(msg => ({
        ...msg,
        senderUsername: userMap.get(msg.senderId) || "Unknown",
        recipientUsername: userMap.get(msg.recipientId) || "Unknown",
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/portal/messages/sent", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const sent = await storage.getSentMessages(user.id);
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      const enriched = sent.map(msg => ({
        ...msg,
        senderUsername: userMap.get(msg.senderId) || "Unknown",
        recipientUsername: userMap.get(msg.recipientId) || "Unknown",
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent messages" });
    }
  });

  app.get("/api/portal/messages/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const message = await storage.getMessage(req.params.id);
      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }
      if (message.recipientId !== user.id && message.senderId !== user.id) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }
      if (message.recipientId === user.id && !message.isRead) {
        await storage.markAsRead(message.id);
      }
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      res.json({
        ...message,
        senderUsername: userMap.get(message.senderId) || "Unknown",
        recipientUsername: userMap.get(message.recipientId) || "Unknown",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message" });
    }
  });

  app.post("/api/portal/messages", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertMessageSchema.parse({ ...req.body, senderId: user.id });
      const message = await storage.sendMessage(validated);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/portal/discussions", requireAuth, async (req, res) => {
    try {
      const topics = await storage.getTopics();
      const topicsWithCounts = await Promise.all(
        topics.map(async (topic) => {
          const replyCount = await storage.getReplyCount(topic.id);
          const author = await storage.getUser(topic.authorId);
          return { ...topic, replyCount, authorUsername: author?.username };
        })
      );
      res.json(topicsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.get("/api/portal/discussions/:id", requireAuth, async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      const replies = await storage.getReplies(req.params.id);
      res.json({ ...topic, replies });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  app.post("/api/portal/discussions", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertDiscussionTopicSchema.parse({ ...req.body, authorId: user.id });
      const topic = await storage.createTopic(validated);
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  app.post("/api/portal/discussions/:id/replies", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      const validated = insertDiscussionReplySchema.parse({ ...req.body, topicId: req.params.id, authorId: user.id });
      const reply = await storage.createReply(validated);
      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.patch("/api/portal/discussions/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      if (topic.authorId !== user.id && !user.isAdmin) {
        res.status(403).json({ message: "Not authorized to edit this topic" });
        return;
      }
      const allowedFields = ["title", "content", "category"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const updated = await storage.updateTopic(req.params.id, updates);
      if (!updated) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  app.delete("/api/portal/discussions/:id", requireAdmin, async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      await storage.deleteTopic(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });

  app.delete("/api/portal/discussions/:topicId/replies/:replyId", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const reply = await storage.getReply(req.params.replyId);
      if (!reply) {
        res.status(404).json({ message: "Reply not found" });
        return;
      }
      if (reply.authorId !== user.id && !user.isAdmin) {
        res.status(403).json({ message: "Not authorized to delete this reply" });
        return;
      }
      await storage.deleteReply(req.params.replyId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });

  app.get("/api/portal/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/portal/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      const bids = await storage.getBidsForProject(req.params.id);
      const user = req.user!;
      if (user.isAdmin) {
        res.json({ ...project, bids });
      } else {
        const myBids = bids.filter(b => b.bidderId === user.id);
        res.json({ ...project, bids: myBids });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/portal/projects", requireAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertProjectOpportunitySchema.parse({ ...req.body, postedById: user.id });
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/portal/projects/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["open", "closed"].includes(status)) {
        res.status(400).json({ message: "Invalid status. Must be open or closed." });
        return;
      }
      const project = await storage.updateProjectStatus(req.params.id, status);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project status" });
    }
  });

  app.post("/api/portal/projects/:id/bids", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      if (project.status !== "open") {
        res.status(400).json({ message: "Project is no longer accepting bids" });
        return;
      }
      const validated = insertProjectBidSchema.parse({ ...req.body, projectId: req.params.id, bidderId: user.id });
      const bid = await storage.createBid(validated);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to submit bid" });
    }
  });

  app.patch("/api/portal/projects/:projectId/bids/:bidId", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "accepted", "rejected"].includes(status)) {
        res.status(400).json({ message: "Invalid status. Must be pending, accepted, or rejected." });
        return;
      }
      const bid = await storage.updateBidStatus(req.params.bidId, status);
      if (!bid) {
        res.status(404).json({ message: "Bid not found" });
        return;
      }
      res.json(bid);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bid status" });
    }
  });

  app.get("/api/portal/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/portal/events", requireAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertCalendarEventSchema.parse({ ...req.body, createdById: user.id });
      const event = await storage.createEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/portal/events/:id", requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
      const allowedFields = ["title", "description", "eventDate", "eventTime", "location"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const updated = await storage.updateEvent(req.params.id, updates);
      if (!updated) {
        res.status(404).json({ message: "Event not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/portal/events/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.get("/api/portal/newsletters", requireAuth, async (req, res) => {
    try {
      const allNewsletters = await storage.getNewsletters();
      res.json(allNewsletters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch newsletters" });
    }
  });

  app.get("/api/portal/newsletters/:id", requireAuth, async (req, res) => {
    try {
      const newsletter = await storage.getNewsletter(req.params.id);
      if (!newsletter) {
        res.status(404).json({ message: "Newsletter not found" });
        return;
      }
      res.json(newsletter);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch newsletter" });
    }
  });

  app.post("/api/portal/newsletters", requireAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertNewsletterSchema.parse({ ...req.body, createdById: user.id });
      const newsletter = await storage.createNewsletter(validated);
      res.status(201).json(newsletter);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create newsletter" });
    }
  });

  app.patch("/api/portal/newsletters/:id", requireAdmin, async (req, res) => {
    try {
      const newsletter = await storage.getNewsletter(req.params.id);
      if (!newsletter) {
        res.status(404).json({ message: "Newsletter not found" });
        return;
      }
      const allowedFields = ["title", "content"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const updated = await storage.updateNewsletter(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating newsletter:", error);
      res.status(500).json({ message: "Failed to update newsletter" });
    }
  });

  app.delete("/api/portal/newsletters/:id", requireAdmin, async (req, res) => {
    try {
      const newsletter = await storage.getNewsletter(req.params.id);
      if (!newsletter) {
        res.status(404).json({ message: "Newsletter not found" });
        return;
      }
      await storage.deleteNewsletter(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      res.status(500).json({ message: "Failed to delete newsletter" });
    }
  });

  app.get("/api/portal/tools", requireAuth, async (req, res) => {
    try {
      const allTools = await storage.getTools();
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      const enriched = await Promise.all(allTools.map(async (tool) => {
        const activeLoan = await storage.getActiveLoanForTool(tool.id);
        return {
          ...tool,
          ownerUsername: userMap.get(tool.ownerId) || "Unknown",
          activeLoan: activeLoan ? {
            id: activeLoan.id,
            borrowerId: activeLoan.borrowerId,
            borrowerUsername: userMap.get(activeLoan.borrowerId) || "Unknown",
            borrowDate: activeLoan.borrowDate,
            expectedReturnDate: activeLoan.expectedReturnDate,
            notes: activeLoan.notes,
          } : null,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.post("/api/portal/tools", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertToolSchema.parse({ ...req.body, ownerId: user.id });
      const tool = await storage.createTool(validated);
      res.status(201).json(tool);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to add tool" });
    }
  });

  app.patch("/api/portal/tools/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        res.status(404).json({ message: "Tool not found" });
        return;
      }
      if (tool.ownerId !== user.id && !user.isAdmin) {
        res.status(403).json({ message: "Not authorized to edit this tool" });
        return;
      }
      const allowedFields = ["name", "description", "category", "status", "condition", "location", "lendingTerms", "imageData", "imageType"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      if (updates.status && !["available", "borrowed", "maintenance"].includes(updates.status)) {
        res.status(400).json({ message: "Invalid status. Must be available, borrowed, or maintenance." });
        return;
      }
      const updated = await storage.updateTool(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  app.delete("/api/portal/tools/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        res.status(404).json({ message: "Tool not found" });
        return;
      }
      if (tool.ownerId !== user.id && !user.isAdmin) {
        res.status(403).json({ message: "Not authorized to delete this tool" });
        return;
      }
      const activeLoans = await storage.getActiveLoansForTool(req.params.id);
      if (activeLoans.length > 0) {
        res.status(400).json({ message: "Cannot delete tool with active loans" });
        return;
      }
      await storage.deleteTool(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tool" });
    }
  });

  app.post("/api/portal/tools/:id/borrow", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        res.status(404).json({ message: "Tool not found" });
        return;
      }
      if (tool.status !== "available") {
        res.status(400).json({ message: "Tool is not available" });
        return;
      }
      const existingLoan = await storage.getActiveLoanForTool(req.params.id);
      if (existingLoan && existingLoan.borrowerId === user.id) {
        res.status(400).json({ message: "You already have an active loan for this tool" });
        return;
      }
      const { expectedReturnDate, notes } = req.body;
      if (!expectedReturnDate) {
        res.status(400).json({ message: "Expected return date is required" });
        return;
      }
      const returnBy = new Date(expectedReturnDate);
      if (isNaN(returnBy.getTime()) || returnBy <= new Date()) {
        res.status(400).json({ message: "Expected return date must be a valid future date" });
        return;
      }
      await storage.updateToolStatus(req.params.id, "borrowed");
      const loan = await storage.createToolLoan({
        toolId: req.params.id,
        borrowerId: user.id,
        expectedReturnDate: returnBy,
        notes: notes || null,
      });
      try {
        await storage.createNotification({
          userId: tool.ownerId,
          type: "tool",
          title: "Equipment Borrowed",
          message: `${user.username} borrowed your "${tool.name}". Expected return: ${returnBy.toLocaleDateString()}.`,
          link: "/portal/tools",
        });
      } catch {}
      res.status(201).json(loan);
    } catch (error) {
      res.status(500).json({ message: "Failed to borrow tool" });
    }
  });

  app.post("/api/portal/tools/:id/return", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const activeLoan = await storage.getActiveLoanForTool(req.params.id);
      if (!activeLoan || activeLoan.borrowerId !== user.id) {
        res.status(400).json({ message: "No active loan found for this tool" });
        return;
      }
      const { returnNotes, condition } = req.body || {};
      await storage.returnToolLoan(activeLoan.id, returnNotes || undefined);
      if (condition && ["good", "fair", "needs-repair"].includes(condition)) {
        await storage.updateTool(req.params.id, { condition, status: "available" });
      } else {
        await storage.updateToolStatus(req.params.id, "available");
      }
      const tool = await storage.getTool(req.params.id);
      if (tool) {
        try {
          const conditionText = condition ? ` Condition: ${condition}.` : "";
          await storage.createNotification({
            userId: tool.ownerId,
            type: "tool",
            title: "Equipment Returned",
            message: `${user.username} returned your "${tool.name}".${conditionText}`,
            link: "/portal/tools",
          });
        } catch {}
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to return tool" });
    }
  });

  app.get("/api/portal/tools/my-loans", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const loans = await storage.getMyLoans(user.id);
      const enriched = await Promise.all(loans.map(async (loan) => {
        const tool = await storage.getTool(loan.toolId);
        return {
          ...loan,
          toolName: tool?.name || "Unknown Tool",
          toolCategory: tool?.category || "general",
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get("/api/portal/tools/my-shared", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const allTools = await storage.getTools();
      const myTools = allTools.filter(t => t.ownerId === user.id);
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      const enriched = await Promise.all(myTools.map(async (tool) => {
        const activeLoan = await storage.getActiveLoanForTool(tool.id);
        return {
          ...tool,
          activeLoan: activeLoan ? {
            id: activeLoan.id,
            borrowerId: activeLoan.borrowerId,
            borrowerUsername: userMap.get(activeLoan.borrowerId) || "Unknown",
            borrowDate: activeLoan.borrowDate,
            expectedReturnDate: activeLoan.expectedReturnDate,
            notes: activeLoan.notes,
          } : null,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared equipment" });
    }
  });

  app.post("/api/portal/tools/:id/request", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        res.status(404).json({ message: "Tool not found" });
        return;
      }
      if (tool.ownerId === user.id) {
        res.status(400).json({ message: "You cannot request your own equipment" });
        return;
      }
      const { message, requestedStartDate, requestedReturnDate } = req.body;
      if (!requestedReturnDate) {
        res.status(400).json({ message: "Requested return date is required" });
        return;
      }
      const returnDate = new Date(requestedReturnDate);
      if (isNaN(returnDate.getTime()) || returnDate <= new Date()) {
        res.status(400).json({ message: "Return date must be a valid future date" });
        return;
      }
      const startDate = requestedStartDate ? new Date(requestedStartDate) : null;
      if (startDate && isNaN(startDate.getTime())) {
        res.status(400).json({ message: "Invalid start date" });
        return;
      }
      const request = await storage.createBorrowRequest({
        toolId: req.params.id,
        requesterId: user.id,
        message: message || null,
        requestedStartDate: startDate,
        requestedReturnDate: returnDate,
      });
      try {
        await storage.createNotification({
          userId: tool.ownerId,
          type: "tool",
          title: "New Borrow Request",
          message: `${user.username} wants to borrow your "${tool.name}".`,
          link: "/portal/tools",
        });
      } catch {}
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit borrow request" });
    }
  });

  app.get("/api/portal/tools/requests/incoming", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const requests = await storage.getBorrowRequestsForOwner(user.id);
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      const enriched = await Promise.all(requests.map(async (r) => {
        const tool = await storage.getTool(r.toolId);
        return {
          ...r,
          requesterUsername: userMap.get(r.requesterId) || "Unknown",
          toolName: tool?.name || "Unknown Tool",
          toolId: r.toolId,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch incoming requests" });
    }
  });

  app.get("/api/portal/tools/requests/outgoing", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const requests = await storage.getBorrowRequestsForUser(user.id);
      const enriched = await Promise.all(requests.map(async (r) => {
        const tool = await storage.getTool(r.toolId);
        return {
          ...r,
          toolName: tool?.name || "Unknown Tool",
          toolLendingTerms: tool?.lendingTerms || null,
          toolOwnerId: tool?.ownerId || null,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch outgoing requests" });
    }
  });

  app.post("/api/portal/tools/requests/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const request = await storage.getBorrowRequest(req.params.id);
      if (!request) {
        res.status(404).json({ message: "Request not found" });
        return;
      }
      const tool = await storage.getTool(request.toolId);
      if (!tool || tool.ownerId !== user.id) {
        res.status(403).json({ message: "Not authorized to approve this request" });
        return;
      }
      if (request.status !== "pending") {
        res.status(400).json({ message: "Request is no longer pending" });
        return;
      }
      const { ownerResponse } = req.body || {};
      const updated = await storage.updateBorrowRequestStatus(req.params.id, "approved", ownerResponse || undefined);
      try {
        await storage.createNotification({
          userId: request.requesterId,
          type: "tool",
          title: "Borrow Request Approved",
          message: `Your request to borrow "${tool.name}" has been approved!${tool.lendingTerms ? " Please review and accept the lending terms to complete." : " You can now pick up the equipment."}`,
          link: "/portal/tools",
        });
      } catch {}
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.post("/api/portal/tools/requests/:id/deny", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const request = await storage.getBorrowRequest(req.params.id);
      if (!request) {
        res.status(404).json({ message: "Request not found" });
        return;
      }
      const tool = await storage.getTool(request.toolId);
      if (!tool || tool.ownerId !== user.id) {
        res.status(403).json({ message: "Not authorized to deny this request" });
        return;
      }
      if (request.status !== "pending") {
        res.status(400).json({ message: "Request is no longer pending" });
        return;
      }
      const { ownerResponse } = req.body || {};
      const updated = await storage.updateBorrowRequestStatus(req.params.id, "denied", ownerResponse || undefined);
      try {
        await storage.createNotification({
          userId: request.requesterId,
          type: "tool",
          title: "Borrow Request Denied",
          message: `Your request to borrow "${tool.name}" was not approved.${ownerResponse ? ` Reason: ${ownerResponse}` : ""}`,
          link: "/portal/tools",
        });
      } catch {}
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to deny request" });
    }
  });

  app.post("/api/portal/tools/requests/:id/cancel", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const request = await storage.getBorrowRequest(req.params.id);
      if (!request) {
        res.status(404).json({ message: "Request not found" });
        return;
      }
      if (request.requesterId !== user.id) {
        res.status(403).json({ message: "Not authorized to cancel this request" });
        return;
      }
      if (request.status !== "pending") {
        res.status(400).json({ message: "Can only cancel pending requests" });
        return;
      }
      const updated = await storage.updateBorrowRequestStatus(req.params.id, "cancelled");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel request" });
    }
  });

  app.post("/api/portal/tools/requests/:id/accept-terms", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const request = await storage.getBorrowRequest(req.params.id);
      if (!request) {
        res.status(404).json({ message: "Request not found" });
        return;
      }
      if (request.requesterId !== user.id) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }
      if (request.status !== "approved") {
        res.status(400).json({ message: "Request must be approved before accepting terms" });
        return;
      }
      const tool = await storage.getTool(request.toolId);
      if (!tool) {
        res.status(404).json({ message: "Tool not found" });
        return;
      }
      if (tool.status === "borrowed") {
        res.status(400).json({ message: "Equipment is currently borrowed by someone else" });
        return;
      }
      await storage.updateToolStatus(request.toolId, "borrowed");
      const loan = await storage.createToolLoan({
        toolId: request.toolId,
        borrowerId: user.id,
        expectedReturnDate: request.requestedReturnDate,
        notes: request.message || null,
        requestId: request.id,
        termsAcceptedAt: new Date(),
      });
      await storage.updateBorrowRequestStatus(request.id, "completed");
      try {
        await storage.createNotification({
          userId: tool.ownerId,
          type: "tool",
          title: "Equipment Loan Started",
          message: `${user.username} accepted terms and borrowed your "${tool.name}". Expected return: ${request.requestedReturnDate ? new Date(request.requestedReturnDate).toLocaleDateString() : "TBD"}.`,
          link: "/portal/tools",
        });
      } catch {}
      res.status(201).json(loan);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept terms" });
    }
  });

  app.get("/api/portal/courses", requireAuth, async (req, res) => {
    try {
      const allCourses = await storage.getCourses();
      res.json(allCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/portal/courses/my-enrollments", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const enrollments = await storage.getMyEnrollments(user.id);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/portal/courses/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }
      const courseLessons = await storage.getLessons(req.params.id);
      const enrollment = await storage.getEnrollment(req.params.id, user.id);
      res.json({ ...course, lessons: courseLessons, enrollment });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/portal/courses", requireAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const validated = insertCourseSchema.parse({ ...req.body, createdById: user.id });
      const course = await storage.createCourse(validated);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.post("/api/portal/courses/:id/lessons", requireAdmin, async (req, res) => {
    try {
      const validated = insertLessonSchema.parse({ ...req.body, courseId: req.params.id });
      const lesson = await storage.createLesson(validated);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.patch("/api/portal/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { title, description } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      const course = await storage.updateCourse(req.params.id, updates);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/portal/courses/:id", requireAdmin, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  app.patch("/api/portal/courses/:courseId/lessons/:lessonId", requireAdmin, async (req, res) => {
    try {
      const { title, content, sortOrder } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;
      const lesson = await storage.updateLesson(req.params.lessonId, updates);
      if (!lesson) {
        res.status(404).json({ message: "Lesson not found" });
        return;
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/portal/courses/:courseId/lessons/:lessonId", requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.lessonId);
      if (!lesson) {
        res.status(404).json({ message: "Lesson not found" });
        return;
      }
      await storage.deleteLesson(req.params.lessonId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  app.post("/api/portal/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const existing = await storage.getEnrollment(req.params.id, user.id);
      if (existing) {
        res.status(400).json({ message: "Already enrolled" });
        return;
      }
      const enrollment = await storage.enrollInCourse({ courseId: req.params.id, userId: user.id });
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to enroll" });
    }
  });

  app.patch("/api/portal/courses/:id/progress", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const enrollment = await storage.getEnrollment(req.params.id, user.id);
      if (!enrollment) {
        res.status(404).json({ message: "Not enrolled in this course" });
        return;
      }
      const { progress, completedLessons } = req.body;
      if (progress !== undefined) {
        if (typeof progress !== "number" || progress < 0 || progress > 100) {
          res.status(400).json({ message: "Progress must be a number between 0 and 100" });
          return;
        }
      }
      if (completedLessons !== undefined) {
        if (typeof completedLessons !== "string" && !Array.isArray(completedLessons)) {
          res.status(400).json({ message: "completedLessons must be a string or array" });
          return;
        }
        if (Array.isArray(completedLessons)) {
          req.body.completedLessons = completedLessons.join(",");
        }
      }
      const updated = await storage.updateEnrollmentProgress(enrollment.id, progress, req.body.completedLessons);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // === ANNOUNCEMENTS ===
  app.get("/api/portal/announcements", requireAuth, async (req, res) => {
    try {
      const items = await storage.getAnnouncements();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/portal/announcements", requireAdmin, async (req, res) => {
    try {
      const data = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(data);
      const allUsers = await storage.getAllUsers();
      for (const u of allUsers) {
        if (u.id !== req.user!.id) {
          await storage.createNotification({
            userId: u.id,
            type: "announcement",
            title: "New Announcement",
            message: data.title,
            link: "/portal",
          });
        }
      }
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create announcement" });
      }
    }
  });

  app.delete("/api/portal/announcements/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.json({ message: "Announcement deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // === NOTIFICATIONS ===
  app.get("/api/portal/notifications", requireAuth, async (req, res) => {
    try {
      const items = await storage.getNotifications(req.user!.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/portal/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch count" });
    }
  });

  app.patch("/api/portal/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.patch("/api/portal/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ message: "All marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update" });
    }
  });

  // === ENDORSEMENTS ===
  app.get("/api/portal/endorsements/:applicationId", requireAuth, async (req, res) => {
    try {
      const items = await storage.getEndorsements(req.params.applicationId);
      const allUsers = await storage.getAllUsers();
      const enriched = items.map(e => {
        const user = allUsers.find(u => u.id === e.fromUserId);
        return { ...e, fromUsername: user?.username || "Unknown" };
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch endorsements" });
    }
  });

  app.post("/api/portal/endorsements", requireAuth, async (req, res) => {
    try {
      const data = insertEndorsementSchema.parse(req.body);
      const endorsement = await storage.createEndorsement(data);
      res.status(201).json(endorsement);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create endorsement" });
      }
    }
  });

  app.delete("/api/portal/endorsements/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEndorsement(req.params.id);
      res.json({ message: "Endorsement deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete endorsement" });
    }
  });

  // === EVENT RSVPS ===
  app.get("/api/portal/events/:id/rsvps", requireAuth, async (req, res) => {
    try {
      const rsvps = await storage.getRsvps(req.params.id);
      const allUsers = await storage.getAllUsers();
      const enriched = rsvps.map(r => {
        const user = allUsers.find(u => u.id === r.userId);
        return { ...r, username: user?.username || "Unknown" };
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.post("/api/portal/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const status = req.body.status || "attending";
      const rsvp = await storage.createRsvp(req.params.id, req.user!.id, status);
      res.status(201).json(rsvp);
    } catch (error) {
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  app.delete("/api/portal/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      await storage.deleteRsvp(req.params.id, req.user!.id);
      res.json({ message: "RSVP cancelled" });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel RSVP" });
    }
  });

  // === DOCUMENTS ===
  app.get("/api/portal/documents", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getDocuments();
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/portal/documents/:id/download", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc) { res.status(404).json({ message: "Not found" }); return; }
      const buffer = Buffer.from(doc.fileData, "base64");
      res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
      res.setHeader("Content-Type", doc.fileType || "application/octet-stream");
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download" });
    }
  });

  app.post("/api/portal/documents", requireAdmin, async (req, res) => {
    try {
      const { title, description, category, fileName, fileType, fileSize, fileData } = req.body;
      if (!title || !fileName || !fileData) {
        res.status(400).json({ message: "Title, filename, and file data are required" });
        return;
      }
      const doc = await storage.createDocument({
        title,
        description: description || null,
        category: category || "general",
        fileName,
        fileType: fileType || null,
        fileSize: fileSize || null,
        fileData,
        uploadedById: req.user!.id,
      });
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/portal/documents/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ message: "Document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // === CAMPAIGNS ===
  app.get("/api/portal/campaigns", requireAuth, async (req, res) => {
    try {
      const items = await storage.getCampaigns();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/portal/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) { res.status(404).json({ message: "Not found" }); return; }
      const pledges = await storage.getCampaignPledges(req.params.id);
      const allUsers = await storage.getAllUsers();
      const apps = await storage.getMembershipApplications();
      const enrichedPledges = pledges.map(p => {
        const user = allUsers.find(u => u.id === p.userId);
        const app = apps.find(a => a.id === user?.memberApplicationId);
        return { ...p, username: user?.username || "Unknown", companyName: app?.companyName || "" };
      });
      res.json({ ...campaign, pledges: enrichedPledges });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/portal/campaigns", requireAdmin, async (req, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(data);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  app.patch("/api/portal/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/portal/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.json({ message: "Campaign deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.post("/api/portal/campaigns/:id/pledges", requireAuth, async (req, res) => {
    try {
      const data = insertCampaignPledgeSchema.parse({ ...req.body, campaignId: req.params.id, userId: req.user!.id });
      const pledge = await storage.createPledge(data);
      res.status(201).json(pledge);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Failed to create pledge" });
      }
    }
  });

  app.patch("/api/portal/campaigns/:campaignId/pledges/:pledgeId", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const paidAt = status === "received" ? new Date() : undefined;
      const pledge = await storage.updatePledgeStatus(req.params.pledgeId, status, paidAt);
      res.json(pledge);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pledge" });
    }
  });

  app.delete("/api/portal/campaigns/:campaignId/pledges/:pledgeId", requireAdmin, async (req, res) => {
    try {
      await storage.deletePledge(req.params.pledgeId);
      res.json({ message: "Pledge deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pledge" });
    }
  });

  // === GLOBAL SEARCH ===
  app.get("/api/portal/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string || "").toLowerCase().trim();
      if (!q) { res.json({ members: [], projects: [], discussions: [], events: [], newsletters: [] }); return; }
      const apps = await storage.getApprovedMembershipApplications();
      const members = apps.filter(a => a.companyName.toLowerCase().includes(q) || a.contactName.toLowerCase().includes(q) || (a.primaryServices || "").toLowerCase().includes(q)).slice(0, 10).map(a => ({ id: a.id, companyName: a.companyName, contactName: a.contactName, type: "member" }));
      const projects = (await storage.getProjects()).filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)).slice(0, 10).map(p => ({ id: p.id, title: p.title, location: p.location, type: "project" }));
      const discussions = (await storage.getTopics()).filter(t => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)).slice(0, 10).map(t => ({ id: t.id, title: t.title, category: t.category, type: "discussion" }));
      const events = (await storage.getEvents()).filter(e => e.title.toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q)).slice(0, 10).map(e => ({ id: e.id, title: e.title, eventDate: e.eventDate, type: "event" }));
      const nls = (await storage.getNewsletters()).filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 10).map(n => ({ id: n.id, title: n.title, type: "newsletter" }));
      res.json({ members, projects, discussions, events, newsletters: nls });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // === NEWSLETTER EMAIL ===
  app.post("/api/portal/newsletters/:id/send-email", requireAdmin, async (req, res) => {
    try {
      const newsletter = await storage.getNewsletter(req.params.id);
      if (!newsletter) { res.status(404).json({ message: "Newsletter not found" }); return; }
      const apps = await storage.getApprovedMembershipApplications();
      const emails = apps.map(a => a.email).filter(Boolean);
      let sent = 0;
      for (const email of emails) {
        try {
          await sendNewsletterEmail(email, newsletter.title, newsletter.content);
          sent++;
        } catch (e) {
          console.error(`Failed to send newsletter to ${email}:`, e);
        }
      }
      res.json({ message: `Newsletter sent to ${sent} member(s)` });
    } catch (error) {
      res.status(500).json({ message: "Failed to send newsletter emails" });
    }
  });

  // === SEND DIGEST EMAIL ===
  app.post("/api/portal/send-digest", requireAdmin, async (req, res) => {
    try {
      const apps = await storage.getApprovedMembershipApplications();
      const projects = (await storage.getProjects()).filter(p => p.status === "open").slice(0, 5);
      const events = (await storage.getEvents()).slice(0, 5);
      const anns = (await storage.getAnnouncements()).slice(0, 5);
      const emails = apps.map(a => a.email).filter(Boolean);
      let sent = 0;
      for (const email of emails) {
        try {
          await sendDigestEmail(email, anns, projects, events);
          sent++;
        } catch (e) {
          console.error(`Failed to send digest to ${email}:`, e);
        }
      }
      res.json({ message: `Digest sent to ${sent} member(s)` });
    } catch (error) {
      res.status(500).json({ message: "Failed to send digest" });
    }
  });

  // === PROFILE IMAGE ===
  app.patch("/api/portal/profile-image", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.memberApplicationId) { res.status(404).json({ message: "No linked application" }); return; }
      const { profileImageUrl } = req.body;
      const app = await storage.updateMembershipApplication(user.memberApplicationId, { profileImageUrl });
      res.json(app);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // === ADMIN BUDGET & FUNDING ===
  app.get("/api/portal/admin/budget", requireAdminOrBoard, async (req, res) => {
    try {
      const fiscalYear = req.query.fiscalYear as string | undefined;
      const categories = await storage.getBudgetCategories(fiscalYear || "2025-2026");
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.get("/api/portal/admin/funding", requireAdminOrBoard, async (req, res) => {
    try {
      const fiscalYear = req.query.fiscalYear as string | undefined;
      const sources = await storage.getFundingSources(fiscalYear || "2025-2026");
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch funding sources" });
    }
  });

  app.get("/api/portal/admin/financial-summary", requireAdminOrBoard, async (req, res) => {
    try {
      const budgetCats = await storage.getBudgetCategories("2025-2026");
      const fundingSrcs = await storage.getFundingSources("2025-2026");
      const allCampaigns = await storage.getCampaigns();

      const totalBudgeted = budgetCats.reduce((sum, c) => sum + parseFloat(c.budgetedAmount), 0);
      const totalActual = budgetCats.reduce((sum, c) => sum + parseFloat(c.actualAmount), 0);
      const totalProjected = fundingSrcs.reduce((sum, s) => sum + parseFloat(s.projectedAmount), 0);
      const totalReceived = fundingSrcs.reduce((sum, s) => sum + parseFloat(s.receivedAmount), 0);

      const campaignTotalGoal = allCampaigns.reduce((sum, c) => sum + parseFloat(c.goalAmount), 0);
      const campaignTotalRaised = allCampaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0);

      let pledgedCount = 0, receivedCount = 0, pledgedAmount = 0, receivedAmount = 0;
      for (const camp of allCampaigns) {
        const pledges = await storage.getCampaignPledges(camp.id);
        for (const p of pledges) {
          if (p.status === "pledged") { pledgedCount++; pledgedAmount += parseFloat(p.amount); }
          if (p.status === "received") { receivedCount++; receivedAmount += parseFloat(p.amount); }
        }
      }

      res.json({
        totalBudgeted,
        totalActual,
        totalProjected,
        totalReceived,
        surplus: totalReceived - totalActual,
        campaignTotalGoal,
        campaignTotalRaised,
        pledgeBreakdown: {
          pledgedCount, receivedCount, pledgedAmount, receivedAmount,
        },
        budgetCategories: budgetCats,
        fundingSources: fundingSrcs,
        campaigns: allCampaigns,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  app.patch("/api/portal/admin/budget/:id", requireAdmin, async (req, res) => {
    try {
      const { actualAmount, budgetedAmount, notes } = req.body;
      const updates: Record<string, any> = {};
      if (actualAmount !== undefined) updates.actualAmount = actualAmount;
      if (budgetedAmount !== undefined) updates.budgetedAmount = budgetedAmount;
      if (notes !== undefined) updates.notes = notes;
      const result = await storage.updateBudgetCategory(req.params.id, updates);
      if (!result) { res.status(404).json({ message: "Budget category not found" }); return; }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update budget category" });
    }
  });

  app.patch("/api/portal/admin/funding/:id", requireAdmin, async (req, res) => {
    try {
      const { receivedAmount, projectedAmount, notes } = req.body;
      const updates: Record<string, any> = {};
      if (receivedAmount !== undefined) updates.receivedAmount = receivedAmount;
      if (projectedAmount !== undefined) updates.projectedAmount = projectedAmount;
      if (notes !== undefined) updates.notes = notes;
      const result = await storage.updateFundingSource(req.params.id, updates);
      if (!result) { res.status(404).json({ message: "Funding source not found" }); return; }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update funding source" });
    }
  });

  // === ADMIN ANALYTICS ===
  app.get("/api/portal/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const allApps = await storage.getMembershipApplications();
      const allUsers = await storage.getAllUsers();
      const projects = await storage.getProjects();
      const topics = await storage.getTopics();
      const events = await storage.getEvents();
      const courses = await storage.getCourses();

      const totalMembers = allApps.filter(a => a.status === "approved").length;
      const pendingApps = allApps.filter(a => a.status === "pending").length;
      const rejectedApps = allApps.filter(a => a.status === "rejected").length;
      const totalUsers = allUsers.length;
      const openProjects = projects.filter(p => p.status === "open").length;
      const totalDiscussions = topics.length;
      const totalEvents = events.length;
      const totalCourses = courses.length;

      const categoryBreakdown: Record<string, number> = {};
      allApps.filter(a => a.status === "approved").forEach(a => {
        categoryBreakdown[a.membershipCategory] = (categoryBreakdown[a.membershipCategory] || 0) + 1;
      });

      res.json({
        totalMembers,
        pendingApps,
        rejectedApps,
        totalUsers,
        openProjects,
        totalDiscussions,
        totalEvents,
        totalCourses,
        categoryBreakdown,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // === MEMBER PROFILE PHOTO ===
  app.patch("/api/portal/profile/photo", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { profileImageUrl } = req.body;
      if (!profileImageUrl) {
        res.status(400).json({ message: "Photo data is required" });
        return;
      }
      const user = await storage.getUser(userId);
      if (!user?.memberApplicationId) {
        res.status(400).json({ message: "No linked membership application" });
        return;
      }
      const app = await storage.getMembershipApplication(user.memberApplicationId);
      if (!app) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      const updated = await storage.updateMembershipApplication(app.id, { profileImageUrl });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile photo" });
    }
  });

  // === MEMBER PROJECTS (PORTFOLIO) ===
  app.get("/api/portal/my-projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getMemberProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/portal/member-projects/:userId", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getMemberProjects(req.params.userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member projects" });
    }
  });

  app.get("/api/portal/featured-projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getAllFeaturedProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });

  app.post("/api/portal/my-projects", requireAuth, async (req, res) => {
    try {
      const project = await storage.createMemberProject({ ...req.body, userId: req.user!.id });
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/portal/my-projects/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getMemberProject(req.params.id);
      if (!existing || existing.userId !== req.user!.id) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      const { title, description, location, projectValue, completionDate, clientName, role, imageData, imageType } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (location !== undefined) updates.location = location;
      if (projectValue !== undefined) updates.projectValue = projectValue;
      if (completionDate !== undefined) updates.completionDate = completionDate;
      if (clientName !== undefined) updates.clientName = clientName;
      if (role !== undefined) updates.role = role;
      if (imageData !== undefined) updates.imageData = imageData;
      if (imageType !== undefined) updates.imageType = imageType;
      const updated = await storage.updateMemberProject(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/portal/my-projects/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getMemberProject(req.params.id);
      if (!existing || existing.userId !== req.user!.id) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      await storage.deleteMemberProject(req.params.id);
      res.json({ message: "Project deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.patch("/api/portal/admin/member-projects/:id/feature", requireAdmin, async (req, res) => {
    try {
      const { isFeatured } = req.body;
      const updated = await storage.updateMemberProject(req.params.id, { isFeatured: !!isFeatured });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  // === MEMBER DOCUMENTS ===
  app.get("/api/portal/my-documents", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getMemberDocuments(req.user!.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/portal/member-documents/:userId", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getMemberDocuments(req.params.userId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member documents" });
    }
  });

  app.post("/api/portal/my-documents", requireAuth, async (req, res) => {
    try {
      const doc = await storage.createMemberDocument({ ...req.body, userId: req.user!.id });
      res.json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/portal/my-documents/:id/download", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getMemberDocument(req.params.id);
      if (!doc) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      const buffer = Buffer.from(doc.fileData, "base64");
      res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
      res.setHeader("Content-Type", doc.fileType || "application/octet-stream");
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.delete("/api/portal/my-documents/:id", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getMemberDocument(req.params.id);
      if (!doc || doc.userId !== req.user!.id) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      await storage.deleteMemberDocument(req.params.id);
      res.json({ message: "Document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  return httpServer;
}
