# Einführung

## Was ist Support-Engine?

**Support-Engine** ist eine moderne, mandantenfähige Helpdesk- und Ticketverwaltungsplattform, die speziell für deutschsprachige Unternehmen entwickelt wurde.

## Kernfunktionen

| Feature | Beschreibung |
|---------|--------------|
| **Multi-Tenant** | Vollständige Datenisolierung zwischen Mandanten |
| **Rollenbasiert** | Admin, Agent und Kunden-Rollen mit feingranularen Berechtigungen |
| **API-First** | REST-API für Web- und Mobile-Anwendungen |
| **Modernes Design** | Linear-inspiriertes UI mit Dark/Light Mode |
| **Deutschsprachig** | Alle UI-Texte und Systemmeldungen auf Deutsch |

## Architektur

Support-Engine basiert auf einer modernen Webanwendungs-Architektur:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    React 18 + TypeScript                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      REST API                                │
│                    Express.js                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Datenbank                               │
│               PostgreSQL + Drizzle ORM                       │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Backend | Node.js mit Express.js |
| Frontend | React 18 mit TypeScript |
| Datenbank | PostgreSQL mit Drizzle ORM |
| Authentifizierung | JWT mit bcrypt |
| API | RESTful JSON API |
| UI-Framework | Tailwind CSS mit shadcn/ui |

## Zielgruppe

Support-Engine richtet sich an:

- **IT-Abteilungen** die ein professionelles Ticketsystem benötigen
- **Helpdesk-Teams** für effiziente Kundenbetreuung
- **MSPs (Managed Service Provider)** mit Multi-Mandanten-Anforderungen
- **Unternehmen** die eine deutschsprachige Lösung bevorzugen
