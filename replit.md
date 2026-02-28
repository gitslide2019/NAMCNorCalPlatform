# NAMC NorCal General Membership Application & Member Portal

## Overview

This is a membership application portal for the National Association of Minority Contractors, Northern California Chapter (NAMC NorCal). The application allows prospective members to learn about membership benefits, view membership tiers, submit membership applications online, and access a secure member portal.

### Public Site (/)
Single-page application with sections for:
- Hero/landing content explaining the organization
- Why join benefits
- Membership tier pricing (Small, Medium, Large, Government)
- Member Spotlight featuring NAMC member companies (currently: Amir Jenkins / 5D Construction Containment Services)
- Ways to get involved
- Membership application form

### Member Portal (/portal)
Secure, authenticated area for members with:
- **Dashboard** (`/portal`) - Welcome page with membership status, company info, activity summary (unread messages, open projects, upcoming events, recent discussions), quick links, and onboarding tutorial for first-time users
- **Profile** (`/portal/profile`) - View/edit company and contact information
- **Member Directory** (`/portal/directory`) - Browse approved NAMC NorCal members with search and filters; click any member to view full profile
- **Member Detail** (`/portal/directory/:id`) - Full member profile page with company info, services, certifications, and "Send Message" button
- **Messages** (`/portal/messages`) - Member-to-member messaging with inbox, sent, compose, and reply
- **Discussions** (`/portal/discussions`) - Discussion boards with topics, categories, and threaded replies
- **Projects** (`/portal/projects`) - Project opportunities with bidding system (admin posts, members bid)
- **Calendar** (`/portal/calendar`) - Monthly calendar view with events (admin manages events)
- **Newsletters** (`/portal/newsletters`) - Newsletter archive with full content view (admin publishes)
- **Equipment Sharing** (`/portal/tools`) - Equipment lending library for borrowing/returning shared tools
- **Training** (`/portal/courses`) - Learning management system with courses, lessons, and progress tracking
- **Admin Panel** (`/portal/admin`) - Admin-only application management with approve/reject and CSV export

Portal sidebar is organized into sections:
- Main: Dashboard, My Profile, Member Directory
- Community: Messages, Discussions
- Resources: Projects, Calendar, Newsletters, Equipment Sharing, Training
- Admin: Admin Panel (admin only)

### Authentication (/auth)
- Login and registration page with NAMC branding
- Session-based auth using Passport.js with local strategy
- Password hashing via scrypt
- Sessions stored in PostgreSQL via connect-pg-simple

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Theme**: Light/dark mode support via custom ThemeProvider
- **Auth**: Custom AuthContext/useAuth hook for session management

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/` (public pages) and `client/src/pages/portal/` (portal pages)
- Reusable UI components in `client/src/components/ui/` (shadcn components)
- Feature components in `client/src/components/`
- Portal layout in `client/src/components/portal-layout.tsx`
- Custom hooks in `client/src/hooks/`
- Protected route wrapper in `client/src/components/protected-route.tsx`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Style**: RESTful JSON API
- **Auth**: Passport.js with express-session and connect-pg-simple
- **Build Tool**: Vite for frontend, esbuild for server bundling

The server provides:
- Auth routes (`server/auth.ts`): register, login, logout, current user
- API routes (`server/routes.ts`): membership application CRUD, portal endpoints, messaging, discussions, projects, calendar, newsletters, tools, courses, admin endpoints
- Static file serving for production builds
- Vite dev server integration for development

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with `db:push` command

Current database tables:
- `users` - User accounts with username, password, isAdmin flag, and memberApplicationId link
- `membership_applications` - Submitted membership applications with company info, contact details, membership category, and status (pending/approved/rejected)
- `session` - Express session store (auto-created by connect-pg-simple)
- `messages` - Direct messages between members (senderId, recipientId, subject, content, isRead)
- `discussion_topics` - Discussion board topics (title, category, content, authorId, isPinned)
- `discussion_replies` - Replies to discussion topics (topicId, authorId, content)
- `project_opportunities` - Project postings for member bidding (title, description, location, budget, deadline, status)
- `project_bids` - Bids on projects (projectId, bidderId, amount, proposal, status)
- `calendar_events` - Events with date/time/location (eventDate, eventTime, location)
- `newsletters` - Published newsletters (title, content, publishedAt)
- `tools` - Tool lending library catalog (name, description, category, status: available/borrowed/maintenance)
- `tool_loans` - Tool borrowing records (toolId, borrowerId, borrowDate, returnDate, status)
- `courses` - LMS courses (title, description)
- `lessons` - Course lessons (courseId, title, content, sortOrder)
- `course_enrollments` - User course enrollments with progress (courseId, userId, progress, completedLessons)

### Code Sharing
The `shared/` directory contains code used by both frontend and backend:
- Database schema definitions
- Zod validation schemas (generated from Drizzle schemas via drizzle-zod)
- TypeScript types

## Key Routes

### API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user
- `POST /api/membership-applications` - Submit application
- `GET /api/membership-applications` - List all applications (admin)
- `GET /api/membership-applications/:id` - Get single application (admin)
- `PATCH /api/membership-applications/:id/status` - Update status (admin)
- `GET /api/membership-applications-export/csv` - CSV export (admin)
- `GET /api/portal/my-application` - Get logged-in user's linked application
- `GET /api/portal/directory` - Get approved members (auth)
- `GET /api/portal/directory/:id` - Get single member profile (auth)
- `PATCH /api/portal/profile` - Update contact info (auth)
- `POST /api/portal/link-application` - Link user to application (admin, accepts optional userId)
- `GET /api/portal/users` - List all users (id, username) (auth)
- `GET /api/portal/messages` - Inbox messages (auth)
- `GET /api/portal/messages/sent` - Sent messages (auth)
- `GET /api/portal/messages/:id` - Single message, auto mark read (auth)
- `POST /api/portal/messages` - Send message (auth)
- `GET /api/portal/discussions` - List discussion topics with reply counts (auth)
- `GET /api/portal/discussions/:id` - Topic with replies (auth)
- `POST /api/portal/discussions` - Create topic (auth)
- `POST /api/portal/discussions/:id/replies` - Add reply (auth)
- `PATCH /api/portal/discussions/:id` - Edit topic (author or admin)
- `DELETE /api/portal/discussions/:id` - Delete topic with replies (admin)
- `DELETE /api/portal/discussions/:topicId/replies/:replyId` - Delete reply (author or admin)
- `GET /api/portal/projects` - List projects (auth)
- `GET /api/portal/projects/:id` - Project with bids (auth, admin sees all bids)
- `POST /api/portal/projects` - Create project (admin)
- `PATCH /api/portal/projects/:id/status` - Update project status (admin)
- `POST /api/portal/projects/:id/bids` - Submit bid (auth)
- `PATCH /api/portal/projects/:projectId/bids/:bidId` - Update bid status (admin)
- `GET /api/portal/events` - List calendar events (auth)
- `POST /api/portal/events` - Create event (admin)
- `PATCH /api/portal/events/:id` - Edit event (admin)
- `DELETE /api/portal/events/:id` - Delete event (admin)
- `GET /api/portal/newsletters` - List newsletters (auth)
- `GET /api/portal/newsletters/:id` - Single newsletter (auth)
- `POST /api/portal/newsletters` - Create newsletter (admin)
- `PATCH /api/portal/newsletters/:id` - Edit newsletter (admin)
- `DELETE /api/portal/newsletters/:id` - Delete newsletter (admin)
- `GET /api/portal/tools` - List tools (auth)
- `POST /api/portal/tools` - Add tool (auth)
- `POST /api/portal/tools/:id/borrow` - Borrow tool (auth)
- `POST /api/portal/tools/:id/return` - Return tool (auth)
- `PATCH /api/portal/tools/:id` - Edit tool (owner or admin)
- `DELETE /api/portal/tools/:id` - Delete tool (owner or admin, no active loans)
- `GET /api/portal/tools/my-loans` - My tool loans (auth)
- `GET /api/portal/courses` - List courses (auth)
- `GET /api/portal/courses/my-enrollments` - My enrollments (auth)
- `GET /api/portal/courses/:id` - Course with lessons and enrollment (auth)
- `POST /api/portal/courses` - Create course (admin)
- `POST /api/portal/courses/:id/lessons` - Add lesson (admin)
- `PATCH /api/portal/courses/:id` - Edit course (admin)
- `DELETE /api/portal/courses/:id` - Delete course with lessons/enrollments (admin)
- `PATCH /api/portal/courses/:courseId/lessons/:lessonId` - Edit lesson (admin)
- `DELETE /api/portal/courses/:courseId/lessons/:lessonId` - Delete lesson (admin)
- `POST /api/portal/courses/:id/enroll` - Enroll in course (auth)
- `PATCH /api/portal/courses/:id/progress` - Update progress (auth, validates 0-100)

### Test Accounts
- **Admin**: `testadmin` / `test1234` (full admin access)
- **Member (Small)**: `james.jackson` / `member123` — Digital Disclosure AV
- **Member (Medium)**: `tana.harris` / `member123` — Harris Hoisting
- **Member (Large)**: `bruce.giron` / `member123` — Giron Construction (NAMC President)
- **Member (Large)**: `bianca.johnson` / `member123` — Turner Construction
- **Member (Government)**: `kimberly.wilson` / `member123` — Port of Oakland

### Admin Access
- Admin users see the Admin Panel in the portal sidebar
- Admins can approve/reject applications, export CSV, post projects, manage bids, create/edit/delete events, publish/edit/delete newsletters, create/edit/delete courses/lessons, delete discussion topics/replies, edit/delete tools

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Uses `pg` driver with connection pooling

### Authentication
- passport & passport-local for authentication strategy
- express-session for session management
- connect-pg-simple for PostgreSQL session store
- SESSION_SECRET env var for session signing

### UI Component Libraries
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS for styling
- Lucide React for icons

### Build & Development
- Vite for frontend development and bundling
- Replit-specific plugins for development experience

### Form & Validation
- Zod for runtime validation
- React Hook Form for form state management
- zod-validation-error for user-friendly error messages
