# Datenbank-Schema

Support-Engine verwendet PostgreSQL mit Drizzle ORM.

## Übersicht

Das Schema ist in `shared/schema.ts` definiert und umfasst:

- Benutzer und Authentifizierung
- Mandanten (Tenants)
- Tickets und Kommentare
- CRM (Kunden, Kontakte, Assets)
- Wissensdatenbank
- Zeiterfassung

## Haupttabellen

### Tenants (Mandanten)

```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Users (Benutzer)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tickets

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  type_id INTEGER REFERENCES ticket_types(id),
  creator_id INTEGER REFERENCES users(id),
  customer_id INTEGER REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Ticket Assignees (Zuweisungen)

```sql
CREATE TABLE ticket_assignees (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  user_id INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

### Comments (Kommentare)

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## CRM-Tabellen

### Customers (Kunden)

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Assets

```sql
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  serial_number VARCHAR(100),
  customer_id INTEGER REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Beziehungen

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Tenant  │────<│   User   │────<│  Ticket  │
└──────────┘     └──────────┘     └──────────┘
                      │                 │
                      │                 │
                      ▼                 ▼
                ┌──────────┐     ┌──────────┐
                │ Customer │     │ Comment  │
                └──────────┘     └──────────┘
```

## Migrationen

Drizzle ORM verwaltet Schemaänderungen:

```bash
# Schema in Datenbank pushen
npm run db:push

# Migrationen generieren
npx drizzle-kit generate

# Migrationen ausführen
npx drizzle-kit migrate
```

## Drizzle ORM Beispiele

### Abfrage

```typescript
import { db } from './db';
import { tickets, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Tickets mit Creator abrufen
const result = await db
  .select()
  .from(tickets)
  .leftJoin(users, eq(tickets.creatorId, users.id))
  .where(eq(tickets.tenantId, tenantId));
```

### Einfügen

```typescript
const newTicket = await db
  .insert(tickets)
  .values({
    tenantId: user.tenantId,
    title: 'Neues Ticket',
    description: 'Beschreibung',
    creatorId: user.id
  })
  .returning();
```

### Aktualisieren

```typescript
await db
  .update(tickets)
  .set({ status: 'closed' })
  .where(eq(tickets.id, ticketId));
```
