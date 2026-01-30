# NAMC NorCal General Membership Application

## Overview

This is a membership application portal for the National Association of Minority Contractors, Northern California Chapter (NAMC NorCal). The application allows prospective members to learn about membership benefits, view membership tiers, and submit membership applications online.

The site is a single-page application with sections for:
- Hero/landing content explaining the organization
- Why join benefits
- Membership tier pricing (Small, Medium, Large, Government)
- Annual events calendar
- Ways to get involved
- Membership application form

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

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn components)
- Feature components in `client/src/components/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript compiled with tsx
- **API Style**: RESTful JSON API
- **Build Tool**: Vite for frontend, esbuild for server bundling

The server provides:
- API routes for membership application CRUD operations
- Static file serving for production builds
- Vite dev server integration for development

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with `db:push` command

Current database tables:
- `users` - User accounts
- `membership_applications` - Submitted membership applications with company info, contact details, and membership category

### Code Sharing
The `shared/` directory contains code used by both frontend and backend:
- Database schema definitions
- Zod validation schemas (generated from Drizzle schemas via drizzle-zod)
- TypeScript types

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Uses `pg` driver with connection pooling

### UI Component Libraries
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS for styling
- Lucide React for icons

### Build & Development
- Vite for frontend development and bundling
- Replit-specific plugins for development experience (@replit/vite-plugin-runtime-error-modal, cartographer, dev-banner)

### Form & Validation
- Zod for runtime validation
- React Hook Form for form state management
- zod-validation-error for user-friendly error messages