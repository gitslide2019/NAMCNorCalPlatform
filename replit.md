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
- **Dashboard** (`/portal`) - Welcome page with membership status, company info, quick links
- **Profile** (`/portal/profile`) - View/edit company and contact information
- **Member Directory** (`/portal/directory`) - Browse approved NAMC NorCal members with search and filters
- **Admin Panel** (`/portal/admin`) - Admin-only application management with approve/reject and CSV export

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
- API routes (`server/routes.ts`): membership application CRUD, portal endpoints, admin endpoints
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
- `GET /api/membership-applications` - List all applications
- `GET /api/membership-applications/:id` - Get single application
- `PATCH /api/membership-applications/:id/status` - Update status (admin only)
- `GET /api/membership-applications-export/csv` - CSV export
- `GET /api/portal/my-application` - Get logged-in user's linked application
- `GET /api/portal/directory` - Get approved members (auth required)
- `PATCH /api/portal/profile` - Update contact info (auth required)
- `POST /api/portal/link-application` - Link user to application (auth required)

### Admin Access
- Default test admin: username `testadmin`, password `test1234`
- Admin users see the Admin Panel in the portal sidebar
- Admins can approve/reject applications and export CSV

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
