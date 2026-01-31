# Support-Engine

## Overview

A German-language support and ticket management system (Helpdesk) built as a full-stack web application with a shared backend API designed for both web and iOS app consumption. The system provides multi-tenant support, role-based access control, and comprehensive ticket lifecycle management including custom fields, assignments, comments, file attachments, CRM functionality, and enterprise-grade logging.

**License**: AGPL-3.0 (GNU Affero General Public License v3.0)

## User Preferences

Preferred communication style: Simple, everyday language (German).

## Recent Changes

- **January 2026**: Renamed application from "German Ticket System" to "Support-Engine"
- **January 2026**: Added comprehensive time tracking system with multiple simultaneous timers, work entry logging, and billable time tracking
- **January 2026**: Added TipTap rich text editor for ticket descriptions and knowledge base articles with full formatting toolbar
- **January 2026**: Added customer/contact/asset assignment to ticket form (required customer selection, optional contact and asset assignment)
- **January 2026**: Enhanced Exchange integration: editable mailbox settings, fetchUnreadOnly toggle, .eml attachments on imported tickets
- **January 2026**: Added Exchange Online integration with Microsoft Graph API support
- **December 2024**: Added AGPL-3.0 license with UI footer links to /api/license and /api/source endpoints
- **December 2024**: Added TLS/SSL certificate management with Let's Encrypt integration (ACME client, auto-renewal, admin UI)
- **December 2024**: Added tenant branding customization (logos, colors, fonts, email templates, custom CSS)
- **December 2024**: Added comprehensive CRM module (Organizations, Customers, Contacts, Locations, Activity Tracking)
- **December 2024**: Implemented System-Logging with Winston (color-coded output, log rotation, sensitive data masking)
- **December 2024**: Added Admin-only Logs UI page with filtering, search, pagination, and export (TXT, CSV, JSON)
- **December 2024**: Fixed Select component issues preventing form submissions
- **December 2024**: Auto-generated customer numbers (KD-XXXXX format)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation
- **Design System**: Linear-inspired utility-focused design with Inter font
- **Layout**: Consistent MainLayout component for all pages with sidebar navigation

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: REST with JSON, API-first approach
- **Authentication**: JWT tokens with bcrypt password hashing
- **Middleware**: Custom auth middleware for protected routes with role-based access (admin, agent, customer)
- **Logging**: Winston-based logging with daily rotation, sensitive data masking
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
- **MainLayout Pattern**: All pages use MainLayout component for consistent header, sidebar, and navigation

### Build System
- **Development**: Vite dev server with HMR, TSX for server
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Path Aliases**: `@/*` for client source, `@shared/*` for shared code, `@assets/*` for attached assets

## Key Features

### Ticket Management
- Ticket CRUD with status workflow (open, in_progress, waiting, resolved, closed)
- Priority levels (low, medium, high, urgent)
- Ticket types with custom fields
- Multiple assignees per ticket
- Comments (internal/public) and file attachments
- Automatic ticket numbers (TKT-XXXXX)

### CRM Module
- **Organizations**: Company groups with legal name, industry, contact info
- **Customers**: Auto-numbered (KD-XXXXX), organization assignment, account manager
- **Locations**: Multiple locations per customer with primary flag
- **Contacts**: Contact persons with position, department, communication channels
- **Activity Tracking**: Call, email, meeting, note logging

### SLA Management
- SLA definitions per priority
- Response and resolution time tracking
- Escalation rules
- Visual SLA status indicators

### Knowledge Base
- Article management with versioning
- Categories and full-text search
- Ticket-article linking

### Asset Management
- Categories: Hardware, Software, Licenses, Contracts
- Asset-ticket linking
- Change history tracking

### Projects & Kanban
- Project management with members
- Kanban board with drag-and-drop (dnd-kit)
- WIP limits per column
- Ticket-project associations

### Surveys
- Multiple question types (rating, yes/no, text, NPS)
- Automatic sending after ticket closure
- Results dashboard

### System Logging
- Log levels: debug, info, warn, error, security, performance
- Sources: api, auth, ticket, sla, crm, email, integration, database, system, exchange
- Features: Color-coded console, daily rotation (2GB max), 7-day retention
- Sensitive data masking (passwords, API keys, tokens, emails)
- Admin UI with filtering, search, pagination, export

### Tenant Branding
- Custom logos (light/dark mode variants, favicon)
- Color customization (primary, secondary, accent colors)
- Font family selection (10 font options)
- Email templates (header/footer HTML, sender name/address)
- Custom CSS injection for advanced styling
- Contact information (website, support email, phone)
- Dynamic CSS variable application via BrandingProvider
- Admin-only branding settings page with live preview

### TLS Certificate Management
- Let's Encrypt integration via ACME protocol (acme-client)
- HTTP-01 challenge support for domain validation
- Staging and Production CA environments
- Certificate lifecycle: request, issue, renew, revoke
- Auto-renewal before expiry (configurable days)
- Certificate history and action logging
- Admin UI with settings, certificates list, and history tabs
- Secure private key storage in database

### Exchange Online Integration
- Microsoft Graph API integration for Exchange Online
- Authentication: Client Secret or Certificate (Azure Entra ID)
- Multi-mailbox support (incoming/outgoing/shared)
- Configurable post-import actions (mark as read, move to folder, archive, delete, keep unchanged)
- Assignment rules for automatic ticket creation (subject, sender, keywords)
- Email synchronization with detailed logging
- Admin UI with 6-step setup wizard (Azure-Konfiguration, Postfächer, Import-Aktionen, Zuweisungsregeln, Synchronisation, Zusammenfassung)
- Disabled by default until explicitly configured
- Required Azure AD permissions: Mail.Read, Mail.ReadWrite, Mail.Send

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for query building and schema management

### Authentication
- jsonwebtoken for JWT token generation/verification
- bcryptjs for password hashing
- Session secret via `SESSION_SECRET` environment variable

### Logging
- Winston for structured logging
- winston-daily-rotate-file for log rotation
- Chalk for colored console output

### UI Framework
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Tailwind CSS for styling
- Lucide React for icons
- date-fns with German locale for date formatting
- dnd-kit for drag-and-drop functionality

### Form Handling
- React Hook Form for form state
- Zod for schema validation
- @hookform/resolvers for Zod integration

## Important Files

- `shared/schema.ts` - All database tables and Zod schemas
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database access layer
- `server/logger.ts` - Logging system
- `server/auth.ts` - Authentication middleware
- `server/tls-service.ts` - TLS certificate management with ACME/Let's Encrypt
- `server/exchange-service.ts` - Exchange Online integration with Microsoft Graph API
- `client/src/pages/exchange-integration.tsx` - Exchange settings UI with 6-step wizard
- `client/src/components/MainLayout.tsx` - Main page layout with license footer
- `client/src/components/AppSidebar.tsx` - Navigation sidebar
- `client/src/lib/branding.tsx` - Tenant branding provider
- `client/src/pages/branding.tsx` - Branding settings page
- `design_guidelines.md` - Design system documentation
- `LICENSE` - AGPL-3.0 license text
- `NOTICE` - Copyright notice
- `CONTRIBUTING.md` - Contribution guidelines
- `ANLEITUNG.md` - Betriebs- und Administrationsanleitung
- `EXCHANGE_EINRICHTUNG.md` - Einrichtungsanleitung für Exchange Online Integration

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.de | admin123 |
| Agent | agent@demo.de | agent123 |
| Customer | kunde@demo.de | kunde123 |
