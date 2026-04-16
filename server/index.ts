import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { ensureTables, ensureAdminUser, seedMembers, seedMemberAccounts, seedSampleContent } from "./db";
import { storage } from "./storage";
import { sendEventReminderEmail } from "./email";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
const port = parseInt(process.env.PORT || "5000", 10);
const httpServer = createServer(app);

(async () => {
  await ensureTables();

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  setupAuth(app);

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  await new Promise<void>((resolve) => {
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      resolve();
    });
  });

  log("Application fully initialized and ready");

  if (process.send) {
    // Suppress IPC errors if the parent process has already exited
    process.on("error", () => {});
    try { process.send("ready"); } catch (_) {}
  }

  await ensureAdminUser();
  await seedMembers();
  await seedMemberAccounts();
  await seedSampleContent();
  log("Background seeding complete");

  // Daily event reminder job — sends emails to RSVP'd attendees for events tomorrow
  async function runEventReminderJob() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD
      const events = await storage.getEvents();
      const tomorrowEvents = events.filter(e => e.eventDate === tomorrowStr);
      let reminded = 0;
      for (const event of tomorrowEvents) {
        const rsvps = await storage.getRsvps(event.id);
        const attendingIds = rsvps.filter(r => r.status === "attending").map(r => r.userId);
        for (const userId of attendingIds) {
          const u = await storage.getUser(userId);
          if (!u?.memberApplicationId) continue;
          const app = await storage.getMembershipApplication(u.memberApplicationId);
          if (app?.email) {
            await sendEventReminderEmail(
              app.email,
              event.title,
              event.eventDate,
              event.eventTime,
              event.location,
              event.description,
            );
            reminded++;
          }
        }
      }
      log(`Event reminder job: ${tomorrowEvents.length} events, ${reminded} reminders sent`);
    } catch (err) {
      console.error("Event reminder job error:", err);
    }
  }

  // Schedule daily at 8:00 AM server time — compute ms until next 8 AM then repeat every 24h
  function scheduleDailyAt8AM() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(8, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const msUntil = next.getTime() - now.getTime();
    setTimeout(() => {
      runEventReminderJob();
      setInterval(runEventReminderJob, 24 * 60 * 60 * 1000);
    }, msUntil);
  }
  scheduleDailyAt8AM();
})();
