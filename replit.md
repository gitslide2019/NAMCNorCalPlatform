# NAMC NorCal General Membership Application & Member Portal

## Overview

This project is a membership application and portal for the National Association of Minority Contractors, Northern California Chapter (NAMC NorCal). Its purpose is to streamline membership applications, provide a secure member portal with various functionalities, and facilitate communication and collaboration among members. The platform aims to enhance member engagement and operational efficiency for NAMC NorCal.

Key capabilities include:
- **Public Site**: Information on benefits, membership tiers, and an online application form.
- **Member Portal**: A secure area offering a dashboard, editable profiles, a member directory, messaging, discussion boards, project opportunities with bidding, a calendar for events, newsletter archives, a document library, equipment sharing, training modules, fundraising campaign tracking, and notifications.
- **Authentication**: Secure login, registration, and password recovery.
- **Admin Panel**: Tools for managing applications, projects, events, newsletters, courses, and user data.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Tables**: `users`, `membership_applications`, `password_reset_tokens`, `session`, `messages`, `discussion_topics`, `discussion_replies`, `project_opportunities`, `project_bids`, `calendar_events`, `newsletters`, `tools`, `tool_loans`, `courses`, `lessons`, `course_enrollments`.

### Code Sharing
- The `shared/` directory centralizes common code like database schema definitions, Zod validation schemas (generated from Drizzle), and TypeScript types, ensuring consistency between frontend and backend.

## External Dependencies

- **Database**: PostgreSQL (via `pg` driver).
- **Authentication**: `passport`, `passport-local`, `express-session`, `connect-pg-simple`.
- **UI Components**: shadcn/ui (leveraging Radix UI primitives), Tailwind CSS, Lucide React (for icons).
- **Form & Validation**: Zod, React Hook Form, `zod-validation-error`.