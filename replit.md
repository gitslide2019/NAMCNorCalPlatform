# NAMC NorCal General Membership Application & Member Portal

## Overview

This project is a membership application and portal for the National Association of Minority Contractors, Northern California Chapter (NAMC NorCal). Its purpose is to streamline membership applications, provide a secure member portal with various functionalities, and facilitate communication and collaboration among members. The platform aims to enhance member engagement and operational efficiency for NAMC NorCal.

Key capabilities include:
- **Public Site**: Information on benefits, membership tiers, and an online application form.
- **Member Portal**: A secure area offering a dashboard, editable profiles (with photo upload, document uploads, project portfolio), a member directory (with enhanced corporate partner profiles featuring gold accents, stats cards, services/certifications sections, portfolio and document displays, and an interactive map view showing members' geographic locations across the Bay Area with color-coded markers), messaging (with sender/recipient usernames), discussion boards (with author usernames), committees (working groups with members, meetings, and tasks — any member can join/leave; chair or admin can edit committee, manage members, and CRUD meetings/tasks; assignees can update their own task status), project opportunities (real feed from NAMC email: 4 open + 21 past, with category chips, organization display, Gmail links, Key Dates notes, and collapsible past-opportunities metrics block; no bid form), a calendar for events (with RSVP/cancel and attendee lists), newsletter archives, a document library, equipment sharing (with structured lending process: request→owner approval→terms acceptance→loan, photo uploads, lending terms, notifications at each step), training modules (enroll/progress tracking), fundraising campaign tracking (with pledges), endorsements (endorse members for skills), notifications, and a Store page linking to the NAMC NorCal Shopify store (https://w0kiic-5a.myshopify.com/).
- **Authentication**: Members can sign in three ways: (1) **email magic link** — enter email on file, receive a Resend-delivered one-time link (15-min expiry, single-use), click to log in; (2) **email + password** — enter email + password set via the reset flow; (3) admins use **username + password** via a small "Admin sign-in" link. All three flows use clear feedback when the email isn't on file (no anti-enumeration generic message — chosen for UX in this small private portal) plus an in-memory IP throttle (10 req / 5 min). Password set/reset uses the existing forgot-password → email link → /reset-password page flow.
- **Admin Panel**: Tabbed interface with Applications management (approve/reject, CSV export, admin-only), Finance dashboard (organizational budget, revenue tracking, pie charts, bar charts, editable expense/revenue tables, campaign progress, pledge status — accessible to admins and board members, with editing restricted to admins), and SMS Invitations (CSV upload, message templating with {{name}}/{{company}} variables, Twilio SMS sending, batch history — admin-only).

## User Preferences

Preferred communication style: Simple, everyday language.

**Critical: Never send SMS, email, or any outbound messages (Twilio, Resend, etc.) without explicit per-action permission from the user. This applies to test sends, bulk blasts, single recipients — all of it.**

**Email sending domain**: All Resend emails go from `NAMC NorCal <noreply@namcnorcal.org>` (hardcoded in `server/email.ts`). The `namcnorcal.org` domain has SPF/DKIM/DMARC records published at Squarespace DNS and is verified at Resend. This bypasses whatever `from_email` is configured on the Resend connector.

**GitHub sync rhythm**: The Replit codebase is mirrored at `github.com/gitslide2019/NAMCNorCalPlatform`. After significant work or before/after every published deploy, push local main to GitHub (`git push origin main`) to keep the two in sync. If GitHub gets ahead (someone edits there directly), fetch and reconcile before pushing. The Resend From address is sourced from the Resend connector (`from_email`), not hardcoded — keep it that way so local edits to `server/email.ts` don't fight the connector setting.

**Production deployment architecture (fast-boot proxy)**: The deploy run command is `node ./dist/start.cjs`. `server/start.cjs` opens port 5000 in <50ms with a tiny placeholder HTTP server (returns 200 to health checks, a friendly "Waking up" splash to browsers), then `child_process.fork()`s the real Express bundle (`dist/index-server.cjs`) on `PORT+1` (5001). When the child sends IPC `'ready'`, the placeholder begins proxying all HTTP + WebSocket traffic to the child. This works around Replit's deploy health checker, which polls within ~10ms of process launch — too fast for the 1.2 MB CJS bundle to load. The placeholder also auto-restarts the child up to 10× if it crashes. Dev (`npm run dev`) runs `server/index.ts` directly via tsx and is unaffected.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript.
- **Routing**: Wouter for client-side navigation.
- **Styling**: Tailwind CSS, augmented by shadcn/ui for UI components.
- **State Management**: TanStack React Query for server state synchronization.
- **Forms**: React Hook Form combined with Zod for validation.
- **Theming**: Supports light/dark modes via a custom ThemeProvider.
- **Authentication**: Custom AuthContext/useAuth hook for session management.
- **Component Structure**: Organized into pages (`client/src/pages/`), reusable UI components (`client/src/components/ui/`), feature-specific components (`client/src/components/`), a dedicated portal layout (`client/src/components/portal-layout.tsx`), custom hooks (`client/src/hooks/`), and protected route handling (`client/src/components/protected-route.tsx`).

### Backend Architecture
- **Runtime**: Node.js with Express 5.
- **Language**: TypeScript, executed with `tsx`.
- **API Style**: RESTful JSON API.
- **Authentication**: Utilizes Passport.js with `express-session` and `connect-pg-simple`.
- **Build**: Vite for frontend assets and esbuild for server-side bundling.
- **API Endpoints**: Covers authentication, membership applications, and a comprehensive suite of portal functionalities including messaging, discussions, projects, calendar, newsletters, tools, courses, and admin operations.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM for database interactions.
- **Schema**: Defined in `shared/schema.ts`.
- **Migrations**: Managed using Drizzle Kit.
- **Tables**: `users`, `membership_applications`, `password_reset_tokens`, `session`, `messages`, `discussion_topics`, `discussion_replies`, `project_opportunities`, `project_bids`, `calendar_events`, `newsletters`, `tools`, `tool_loans`, `tool_borrow_requests`, `courses`, `lessons`, `course_enrollments`, `announcements`, `notifications`, `endorsements`, `event_rsvps`, `documents`, `campaigns`, `campaign_pledges`, `budget_categories`, `funding_sources`, `member_projects`, `member_documents`, `sms_invitations`, `sms_contacts`, `committees`, `committee_memberships`, `committee_meetings`, `committee_tasks`.
- **SMS Contacts Intelligence**: The `sms_contacts` table stores 1,395 Bay Area contractors with outreach intelligence fields: `outreach_description`, `specialties`, `project_focus`, `energy_relevance`, `why_namc_relevant`, `membership_value`, `membership_pitch`, `best_outreach_angle`, `sms_template`, `email_template`, `preferred_contact_name`, `professional_salutation`, `primary_license_types`, `google_search_url`. Auto-seeded from CSV on startup; enriched from a second intelligence CSV.
- **Charts**: Recharts library for pie charts, bar charts in admin Finance dashboard.

### Code Sharing
- The `shared/` directory centralizes common code like database schema definitions, Zod validation schemas (generated from Drizzle), and TypeScript types, ensuring consistency between frontend and backend.

## External Dependencies

- **Database**: PostgreSQL (via `pg` driver).
- **Authentication**: `passport`, `passport-local`, `express-session`, `connect-pg-simple`.
- **UI Components**: shadcn/ui (leveraging Radix UI primitives), Tailwind CSS, Lucide React (for icons).
- **Form & Validation**: Zod, React Hook Form, `zod-validation-error`.