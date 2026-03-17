# Mandantenverwaltung

Support-Engine ist eine mandantenfähige Anwendung. Jeder Mandant hat eine vollständig isolierte Umgebung mit eigenen Benutzern, Tickets, Einstellungen und Branding.

## Konzept

Jeder Datensatz in der Datenbank enthält ein `tenantId`-Feld. Der Server filtert alle Abfragen automatisch nach dem `tenantId` des angemeldeten Benutzers — Mandanten können niemals auf Daten anderer Mandanten zugreifen.

## Mandanten anlegen

Ein neuer Mandant entsteht automatisch bei der ersten Registrierung über `/register`. Der registrierende Benutzer wird automatisch zum `admin` des neuen Mandanten.

| Feld | Beschreibung |
|------|-------------|
| Name | Anzeigename des Mandanten |
| Slug | URL-freundlicher Bezeichner (eindeutig, z.B. `acme-corp`) |

Der Slug wird für die öffentliche Branding-API verwendet: `GET /api/tenant/public/:slug`

## Mandanten-Konfiguration

Admins können ihren Mandanten über **Einstellungen** konfigurieren. Die folgenden Felder sind verfügbar:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `name` | Text | Anzeigename |
| `slug` | Text | URL-Bezeichner |
| `logoUrl` | URL | Logo (erscheint in Seitenleiste) |
| `faviconUrl` | URL | Browser-Favicon |
| `customCss` | CSS | Eigene Stilanpassungen |
| `primaryColor` | Farbe | Primärfarbe (überschreibt Amber) |

:::{note}
Ab v0.1.3 ist Amber die globale Primärfarbe ohne Mandanten-Override. Individuelle Anpassungen sind weiterhin über `customCss` möglich.
:::

## Mandanten-Daten

Alle folgenden Daten gehören zum Mandanten und sind vollständig isoliert:

- Benutzer und Rollen
- Tickets, Kommentare, Anhänge
- SLA-Definitionen und Eskalationen
- Wissensdatenbank-Kategorien und Artikel
- CRM: Organisationen, Kunden, Kontakte
- Assets und Lizenzen
- Projekte und Kanban-Boards
- Bereiche/Abteilungen
- Exchange-Konfiguration und Postfächer
- TLS-Zertifikate
- Systemlogs

## Datenisolierung

Die Isolation wird auf Datenbankebene erzwungen — nicht nur auf API-Ebene. Alle Storage-Methoden in `server/storage.ts` akzeptieren `tenantId` als ersten Parameter und filtern alle Queries:

```typescript
// Alle Queries folgen diesem Muster
.where(eq(tickets.tenantId, tenantId))
```

Selbst wenn ein API-Fehler vorliegt, kann ein Mandant niemals Daten eines anderen Mandanten lesen oder schreiben.
