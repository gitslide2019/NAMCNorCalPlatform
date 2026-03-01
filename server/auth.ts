import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { type User, users, membershipApplications, passwordResetTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendPasswordResetEmail } from "./email";

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

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const [application] = await db
        .select()
        .from(membershipApplications)
        .where(eq(membershipApplications.email, email));

      if (!application) {
        res.json({ message: "If an account with that email exists, a reset link has been sent." });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.memberApplicationId, application.id));

      if (!user) {
        res.json({ message: "If an account with that email exists, a reset link has been sent." });
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

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
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
