import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMembershipApplicationSchema } from "@shared/schema";
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
      const allowedFields = ["contactName", "email", "phone", "address", "city", "state", "zipCode", "website"];
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
      const user = req.user!;
      const { applicationId } = req.body;
      if (!applicationId) {
        res.status(400).json({ message: "Application ID is required" });
        return;
      }
      const application = await storage.getMembershipApplication(applicationId);
      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      const updatedUser = await storage.updateUser(user.id, { memberApplicationId: applicationId });
      if (!updatedUser) {
        res.status(500).json({ message: "Failed to link application" });
        return;
      }
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error linking application:", error);
      res.status(500).json({ message: "Failed to link application" });
    }
  });

  return httpServer;
}
