import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { type User, users, membershipApplications, passwordResetTokens, loginTokens } from "@shared/schema";
import { eq, and, gt, sql, desc } from "drizzle-orm";
import { sendPasswordResetEmail, sendLoginLinkEmail } from "./email";

const scryptAsync = promisify(scrypt);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl(req: any): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers.host || "localhost:5000";
  return `${protocol}://${host}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

declare global {
  namespace Express {
    interface User extends import("@shared/schema").User {}
  }
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.isActive === false) {
          return done(null, false, { message: "Your account has been deactivated. Please contact NAMC NorCal." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ message: "Username and password are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        res.status(400).json({ message: "Username already exists" });
        return;
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        res.status(401).json({ message: info?.message || "Invalid credentials" });
        return;
      }
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: "Logout failed" });
        return;
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const { password: _, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  // In-memory IP throttle for the magic-link endpoint.
  // 10 requests per IP per 5 minutes. Cheap brute-force/abuse mitigation.
  const ipRequestLog = new Map<string, number[]>();
  const IP_WINDOW_MS = 5 * 60 * 1000;
  const IP_MAX_REQUESTS = 10;

  function checkIpThrottle(ip: string): boolean {
    const now = Date.now();
    const cutoff = now - IP_WINDOW_MS;
    const recent = (ipRequestLog.get(ip) || []).filter((t) => t > cutoff);
    if (recent.length >= IP_MAX_REQUESTS) {
      ipRequestLog.set(ip, recent);
      return false;
    }
    recent.push(now);
    ipRequestLog.set(ip, recent);
    // Opportunistic cleanup so the map doesn't grow forever
    if (ipRequestLog.size > 5000) {
      for (const [k, v] of ipRequestLog) {
        const filtered = v.filter((t) => t > cutoff);
        if (filtered.length === 0) ipRequestLog.delete(k);
        else ipRequestLog.set(k, filtered);
      }
    }
    return true;
  }

  function getClientIp(req: any): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  const NO_ACCOUNT_MSG =
    "We couldn't find a member account with that email. Double-check the spelling, or contact NAMC NorCal if you think this is a mistake.";

  app.post("/api/auth/request-login-link", async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    if (!checkIpThrottle(getClientIp(req))) {
      res.status(429).json({ message: "Too many requests. Please wait a few minutes and try again." });
      return;
    }

    try {
      const [application] = await db
        .select()
        .from(membershipApplications)
        .where(sql`lower(${membershipApplications.email}) = ${normalizedEmail}`);
      if (!application) {
        res.status(404).json({ message: NO_ACCOUNT_MSG });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.memberApplicationId, application.id));
      if (!user) {
        res.status(404).json({ message: NO_ACCOUNT_MSG });
        return;
      }
      if (user.isActive === false) {
        res.status(403).json({ message: "Your account has been deactivated. Please contact NAMC NorCal." });
        return;
      }

      // Per-user throttle: don't issue more than one link per 60s
      const [recent] = await db
        .select()
        .from(loginTokens)
        .where(
          and(
            eq(loginTokens.userId, user.id),
            gt(loginTokens.createdAt, new Date(Date.now() - 60 * 1000))
          )
        )
        .orderBy(desc(loginTokens.createdAt))
        .limit(1);
      if (recent) {
        res.json({
          email: application.email,
          message: `We just sent a sign-in link to ${application.email} a moment ago — check your inbox.`,
        });
        return;
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(loginTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      const baseUrl = getAppBaseUrl(req);
      const loginUrl = `${baseUrl}/api/auth/verify-login?token=${token}`;
      await sendLoginLinkEmail(application.email, loginUrl, application.contactName);

      res.json({
        email: application.email,
        message: `We sent a sign-in link to ${application.email}. It expires in 15 minutes.`,
      });
    } catch (error) {
      console.error("Login-link request error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/auth/login-with-email", async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!checkIpThrottle(getClientIp(req))) {
        res.status(429).json({ message: "Too many sign-in attempts. Please wait a few minutes and try again." });
        return;
      }

      const [application] = await db
        .select()
        .from(membershipApplications)
        .where(sql`lower(${membershipApplications.email}) = ${normalizedEmail}`);
      if (!application) {
        res.status(401).json({ message: NO_ACCOUNT_MSG });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.memberApplicationId, application.id));
      if (!user) {
        res.status(401).json({ message: NO_ACCOUNT_MSG });
        return;
      }
      if (user.isActive === false) {
        res.status(403).json({ message: "Your account has been deactivated. Please contact NAMC NorCal." });
        return;
      }

      const ok = await comparePasswords(password, user.password);
      if (!ok) {
        res.status(401).json({
          message: "Wrong password. Try again, or use the email sign-in link instead.",
        });
        return;
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _pw, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error) {
      console.error("Email login error:", error);
      res.status(500).json({ message: "Sign-in failed. Please try again." });
    }
  });

  app.get("/api/auth/verify-login", async (req, res, next) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      if (!token) {
        res.redirect("/auth?expired=1");
        return;
      }

      const tokenHash = hashToken(token);

      const [loginToken] = await db
        .select()
        .from(loginTokens)
        .where(
          and(
            eq(loginTokens.token, tokenHash),
            gt(loginTokens.expiresAt, new Date())
          )
        );

      if (!loginToken || loginToken.usedAt) {
        res.redirect("/auth?expired=1");
        return;
      }

      // Mark token used immediately (single-use even on race)
      const [claimed] = await db
        .update(loginTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(loginTokens.id, loginToken.id), sql`${loginTokens.usedAt} IS NULL`))
        .returning();

      if (!claimed) {
        res.redirect("/auth?expired=1");
        return;
      }

      const user = await storage.getUser(loginToken.userId);
      if (!user) {
        res.redirect("/auth?expired=1");
        return;
      }

      if (user.isActive === false) {
        res.redirect("/auth?expired=1");
        return;
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.redirect("/portal");
      });
    } catch (error) {
      console.error("Verify login error:", error);
      res.redirect("/auth?expired=1");
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!checkIpThrottle(getClientIp(req))) {
        res.status(429).json({ message: "Too many requests. Please wait a few minutes and try again." });
        return;
      }

      const [application] = await db
        .select()
        .from(membershipApplications)
        .where(sql`lower(${membershipApplications.email}) = ${normalizedEmail}`);

      if (!application) {
        res.status(404).json({ message: NO_ACCOUNT_MSG });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.memberApplicationId, application.id));

      if (!user) {
        res.status(404).json({ message: NO_ACCOUNT_MSG });
        return;
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      const baseUrl = getAppBaseUrl(req);
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(application.email, resetUrl, application.contactName);

      res.json({
        email: application.email,
        message: `We sent a password reset link to ${application.email}. It expires in 1 hour.`,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ message: "Token and password are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }

      const tokenHash = hashToken(token);

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        );

      if (!resetToken || resetToken.usedAt) {
        res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
        return;
      }

      const hashedPassword = await hashPassword(password);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ message: "Password has been reset successfully. You can now sign in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (req.user?.isActive === false) {
    req.logout(() => {});
    res.status(403).json({ message: "Your account has been deactivated. Please contact NAMC NorCal." });
    return;
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

export function requireAdminOrBoard(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (!req.user?.isAdmin && !req.user?.isBoardMember) {
    res.status(403).json({ message: "Admin or board member access required" });
    return;
  }
  next();
}
