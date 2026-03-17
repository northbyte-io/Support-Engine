# Benutzerverwaltung

Support-Engine unterstützt drei Benutzerrollen mit unterschiedlichen Rechten. Benutzer sind immer einem einzelnen Mandanten zugeordnet.

## Rollen

| Rolle | Beschreibung |
|-------|-------------|
| `admin` | Voller Zugriff. Kann Benutzer, SLAs, Exchange, TLS und alle Einstellungen verwalten |
| `agent` | Operative Rolle. Kann Tickets, CRM-Daten, Assets und Projekte bearbeiten |
| `customer` | Eingeschränkter Zugriff. Sieht nur das Kundenportal mit eigenen Tickets |

## Benutzer anlegen

**Navigation:** Administration → Benutzer → Neuer Benutzer

Nur Admins können neue Benutzer anlegen. Folgende Felder sind erforderlich:

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| Name | ✓ | Anzeigename |
| E-Mail | ✓ | Eindeutige E-Mail-Adresse (Benutzername) |
| Passwort | ✓ | Min. 8 Zeichen |
| Rolle | ✓ | `admin`, `agent` oder `customer` |

## Passwort-Sicherheit

Passwörter werden mit bcryptjs (10 Runden) gehasht und nie im Klartext gespeichert. Es ist nicht möglich, ein Passwort abzurufen — nur zurückzusetzen.

Ein Admin kann das Passwort eines Benutzers direkt über die Benutzerverwaltung zurücksetzen.

## Sitzungsverwaltung

- JWT-Token mit 7-Tage-Gültigkeit
- "Angemeldet bleiben": Token in `localStorage`, sonst `sessionStorage`
- Abmelden invalidiert das Token clientseitig

## Benutzer deaktivieren

Benutzer können über die Benutzerverwaltung deaktiviert werden (Feld `active`). Deaktivierte Benutzer können sich nicht mehr anmelden, werden aber in der Datenbank behalten, um Ticket-Historien zu erhalten.

## Erster Benutzer

Der erste Benutzer, der sich für einen neuen Mandanten registriert, erhält automatisch die Rolle `admin`. Danach ist eine Selbstregistrierung nicht mehr möglich — weitere Benutzer werden ausschließlich von Admins angelegt.
