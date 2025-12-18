# German Ticket System

## Overview

A German-language ticket management system (Helpdesk) built as a full-stack web application with a shared backend API designed for both web and iOS app consumption. The system provides multi-tenant support, role-based access control, and comprehensive ticket lifecycle management including custom fields, assignments, comments, and file attachments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation
- **Design System**: Linear-inspired utility-focused design with Inter font

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: REST with JSON, API-first approach
- **Authentication**: JWT tokens with bcrypt password hashing
- **Middleware**: Custom auth middleware for protected routes with role-based access (admin, agent, customer)
- **Static Serving**: Vite for development, static file serving for production

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Multi-tenancy**: Tenant-aware data isolation with `tenantId` foreign keys

### Key Design Patterns
- **Shared Schema**: Database schemas and TypeScript types shared between frontend and backend via `@shared/*` path alias
- **API-First**: Backend designed as a REST API consumable by both web and mobile clients
- **Role-Based Access**: Three user roles (admin, agent, customer) with middleware enforcement
- **Component Architecture**: Reusable UI components with consistent design patterns (StatusBadge, PriorityBadge, etc.)

### Build System
- **Development**: Vite dev server with HMR, TSX for server
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Path Aliases**: `@/*` for client source, `@shared/*` for shared code, `@assets/*` for attached assets

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for query building and schema management
- connect-pg-simple for session storage (available but JWT is primary auth)

### Authentication
- jsonwebtoken for JWT token generation/verification
- bcryptjs for password hashing
- Session secret via `SESSION_SECRET` environment variable

### UI Framework
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Tailwind CSS for styling
- Lucide React for icons
- date-fns with German locale for date formatting

### Form Handling
- React Hook Form for form state
- Zod for schema validation
- @hookform/resolvers for Zod integration

### Development Tools
- Vite with React plugin
- TypeScript with strict mode
- Replit-specific plugins (runtime error overlay, cartographer, dev banner)