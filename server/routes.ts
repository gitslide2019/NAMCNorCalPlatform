import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMembershipApplicationSchema, insertMessageSchema, insertDiscussionTopicSchema, insertDiscussionReplySchema, insertProjectOpportunitySchema, insertProjectBidSchema, insertCalendarEventSchema, insertNewsletterSchema, insertToolSchema, insertCourseSchema, insertLessonSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAuth, requireAdmin } from "./auth";

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
        userId: linkedUser?.id || null,
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
      const allowedFields = ["contactName", "email", "phone", "address", "city", "state", "zipCode", "website", "primaryServices", "certifications", "yearEstablished", "numberOfEmployees"];
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
      res.json(inbox);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/portal/messages/sent", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const sent = await storage.getSentMessages(user.id);
      res.json(sent);
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
      res.json(message);
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
          return { ...topic, replyCount };
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
      const allowedFields = ["name", "description", "category", "status", "condition", "location"];
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

  return httpServer;
}
