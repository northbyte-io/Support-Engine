# Kundenportal

Das Kundenportal ermöglicht Endbenutzern (Kunden) den Zugriff auf ihre eigenen Tickets ohne vollen Agenten-Zugriff. Kunden können Tickets erstellen, den Status verfolgen und Kommentare hinterlassen.

## Zugang

Kunden benötigen ein Benutzerkonto mit der Rolle `customer`. Diese Konten werden von Admins angelegt.

**Login:** Gleicher Login wie für Agenten (`/login`) — die Benutzeroberfläche passt sich automatisch an die Rolle an.

## Funktionsumfang für Kunden

| Funktion | Verfügbar |
|----------|----------|
| Eigene Tickets einsehen | ✓ |
| Neues Ticket erstellen | ✓ |
| Kommentare hinzufügen | ✓ (öffentlich) |
| Status verfolgen | ✓ |
| SLA-Fortschritt sehen | ✓ |
| Anhänge hochladen | ✓ |
| KB-Artikel lesen (veröffentlichte) | ✓ |
| Tickets anderer Kunden sehen | ✗ |
| Agenten-Interne Kommentare sehen | ✗ |
| CRM-Daten, Assets, Projekte | ✗ |
| Administration | ✗ |

## Ticket erstellen

**Navigation:** Kundenportal → Neues Ticket

Kunden können folgende Felder ausfüllen:
- Betreff (Pflicht)
- Beschreibung (Rich-Text)
- Priorität

Der Ticket-Typ wird automatisch zugewiesen. Agenten können das Ticket anschließend mit weiteren Informationen anreichern.

## Ticket-Übersicht

Das Portal zeigt nur die eigenen Tickets des angemeldeten Kunden. Die Anzeige enthält:
- Ticket-ID und Betreff
- Aktueller Status
- Priorität
- Erstellungs- und Aktualisierungsdatum
- SLA-Status (falls sichtbar konfiguriert)

## Kommentare

Kunden können öffentliche Kommentare zu ihren Tickets hinterlassen. Interne Kommentare (von Agenten als „intern" markiert) sind für Kunden **nicht sichtbar**.

## Benachrichtigungen

Kunden erhalten In-App-Benachrichtigungen bei:
- Statusänderungen ihres Tickets
- Neuen öffentlichen Kommentaren
- Wenn sie in einem Kommentar erwähnt werden

## Anpassung

Das Portal-Erscheinungsbild übernimmt das Mandanten-Branding (Logo, Farben). Kunden sehen keine interne Navigation, Seitenleiste oder Admin-Bereiche.

## API-Endpunkte

Kunden greifen über dedizierte Endpunkte auf das Portal zu:

```text
GET  /api/portal/tickets         # Eigene Tickets
GET  /api/portal/tickets/:id     # Einzelnes Ticket
POST /api/portal/tickets         # Neues Ticket erstellen
```

Diese Endpunkte geben nur Daten zurück, die für den angemeldeten Kunden sichtbar sein dürfen.
