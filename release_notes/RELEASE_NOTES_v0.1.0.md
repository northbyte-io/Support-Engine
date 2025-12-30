# 🚀 v0.1.0 - Initial Public Release

This is the first official public release of the German Ticket System, an enterprise-grade helpdesk and ticket management platform designed for German-speaking organizations.

---

## 📋 Overview

The German Ticket System is a multi-tenant SaaS web application built with a modern tech stack. It provides a comprehensive REST API designed for both web applications and future iOS mobile clients.

---

## ✨ Key Features

### 🎫 Ticket Management
- Full ticket lifecycle management with status workflow
- Priority levels (low, medium, high, urgent)
- Ticket types with customizable fields
- Multiple assignees per ticket
- Internal and public comments
- File attachments

### 🔐 User Authentication and Roles
- JWT-based authentication
- Secure password hashing with bcrypt
- Three user roles: Admin, Agent, Customer
- Role-based access control

### 🏢 Multi-Tenant Architecture
- Complete data isolation between tenants
- Tenant-specific branding and customization
- Isolated user management per tenant

### ⏱️ SLA Tracking and Escalation
- SLA definitions per priority level
- Response and resolution time tracking
- Automatic escalation rules
- Visual SLA status indicators

### 📚 Knowledge Base
- Article management with versioning
- Categories and full-text search
- Article-ticket linking

### 👥 CRM Integration
- Organizations and customers
- Contact management
- Location tracking
- Activity logging (calls, emails, meetings, notes)
- Customer-ticket associations

### 💼 Asset Management
- Hardware, software, licenses, contracts
- Asset-ticket linking
- Change history tracking

### 📊 Project and Kanban Boards
- Project management with team members
- Kanban board with drag-and-drop
- WIP limits per column
- Ticket-project associations

### ⚙️ System Administration
- Comprehensive logging with admin UI
- Log filtering, search, and export
- Let's Encrypt TLS certificate management
- Tenant branding customization

---

## 🛠️ Technical Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js with Express.js |
| Frontend | React 18 with TypeScript |
| Database | PostgreSQL with Drizzle ORM |
| Authentication | JWT with bcrypt |
| API | RESTful JSON API |
| UI Framework | Tailwind CSS with shadcn/ui |

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

As required by the AGPL license, the source code is publicly available. When running this software as a network service, you must make the source code available to users of that service.

- 🔗 License endpoints: `/api/license` and `/api/source`
- 📄 Full license text: [LICENSE](../LICENSE)

---

## 📝 Changelog

### ➕ Added
- Initial implementation of core ticket management system
- User authentication and authorization system
- Multi-tenant architecture with data isolation
- SLA tracking and escalation engine
- Knowledge base with article management
- CRM module with organizations, customers, contacts
- Asset management system
- Project management with Kanban boards
- System logging with admin interface
- TLS certificate management with Let's Encrypt
- Tenant branding customization
- German language UI throughout

### 🔧 Technical
- Core application architecture established
- REST API design and implementation
- Database schema with Drizzle ORM
- Admin and user interfaces implemented
- Dark/Light mode support

---

## 📦 Installation

See [README.md](../README.md) for installation and setup instructions.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| 📘 [README.md](../README.md) | Technical documentation |
| 📗 [ANLEITUNG.md](../ANLEITUNG.md) | Operations and administration guide (German) |
| 📙 [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |

---

🔗 **Repository**: https://github.com/northbyte-io/Support-Engine  
🏷️ **Version**: 0.1.0  
📅 **Release Date**: December 2024
