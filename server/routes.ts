import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMembershipApplicationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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

  app.get("/api/membership-applications", async (req, res) => {
    try {
      const applications = await storage.getMembershipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching membership applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/membership-applications/:id", async (req, res) => {
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

  // CSV export endpoint for downloading applications
  app.get("/api/membership-applications-export/csv", async (req, res) => {
    try {
      const applications = await storage.getMembershipApplications();
      
      // CSV headers
      const headers = [
        "ID",
        "Membership Category",
        "Company Name",
        "Contact Name",
        "Title",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "ZIP Code",
        "Website",
        "Year Established",
        "Number of Employees",
        "Annual Revenue",
        "Primary Services",
        "Certifications",
        "How Did You Hear",
        "Accepted Terms",
        "Submitted At"
      ];

      // Convert applications to CSV rows
      const rows = applications.map(app => [
        app.id,
        app.membershipCategory,
        app.companyName,
        app.contactName,
        app.title,
        app.email,
        app.phone,
        app.address,
        app.city,
        app.state,
        app.zipCode,
        app.website || "",
        app.yearEstablished || "",
        app.numberOfEmployees || "",
        app.annualRevenue || "",
        (app.primaryServices || "").replace(/"/g, '""'),
        (app.certifications || "").replace(/"/g, '""'),
        app.howDidYouHear || "",
        app.acceptedTerms ? "Yes" : "No",
        app.createdAt ? new Date(app.createdAt).toISOString() : ""
      ]);

      // Build CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // Set response headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=namc-membership-applications-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting membership applications:", error);
      res.status(500).json({ message: "Failed to export applications" });
    }
  });

  return httpServer;
}
