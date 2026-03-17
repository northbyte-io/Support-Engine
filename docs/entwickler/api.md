# API-Referenz

Support-Engine bietet eine vollständige REST-API für alle Funktionen.

## Übersicht

- **Basis-URL**: `https://ihre-domain.de/api`
- **Format**: JSON
- **Authentifizierung**: JWT Bearer Token

## Authentifizierung

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "benutzer@firma.de",
  "password": "passwort"
}
```

**Antwort:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "benutzer@firma.de",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "agent"
  }
}
```

### Token verwenden

```http
Authorization: Bearer <token>
```

## Tickets

### Alle Tickets abrufen

```http
GET /api/tickets
Authorization: Bearer <token>
```

**Query-Parameter:**

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `status` | string | Filtern nach Status |
| `priority` | string | Filtern nach Priorität |
| `assigneeId` | number | Filtern nach Agent |
| `limit` | number | Anzahl Ergebnisse |
| `offset` | number | Offset für Pagination |

### Einzelnes Ticket

```http
GET /api/tickets/:id
Authorization: Bearer <token>
```

### Ticket erstellen

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Problem mit Login",
  "description": "Benutzer kann sich nicht anmelden",
  "priority": "high",
  "typeId": 1
}
```

### Ticket aktualisieren

```http
PATCH /api/tickets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "assigneeIds": [1, 2]
}
```

## Benutzer

### Registrierung

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "neu@firma.de",
  "password": "sicheresPasswort",
  "firstName": "Anna",
  "lastName": "Beispiel"
}
```

### Aktuellen Benutzer abrufen

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Kunden & CRM

### Kunden abrufen

```http
GET /api/customers
Authorization: Bearer <token>
```

### Kunde erstellen

```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Beispiel GmbH",
  "email": "kontakt@beispiel.de"
}
```

## Wissensdatenbank

### Artikel abrufen

```http
GET /api/knowledge-base/articles
Authorization: Bearer <token>
```

### Artikel erstellen

```http
POST /api/knowledge-base/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Wie erstelle ich ein Ticket?",
  "content": "<p>Klicken Sie auf...</p>",
  "categoryId": 1
}
```

## Berichte

### Ticket-Analyse abrufen

```http
GET /api/reports/tickets?from=2026-01-01&to=2026-03-17
Authorization: Bearer <token>
```

**Antwort:**

```json
{
  "summary": { "total": 42, "open": 10, "inProgress": 5, "resolved": 20, "closed": 7 },
  "byDay": [{ "date": "2026-01-01", "total": 3, "resolved": 1, "open": 2 }],
  "byStatus": [{ "status": "open", "count": 10 }],
  "byPriority": [{ "priority": "high", "count": 8 }],
  "byAgent": [{ "agentName": "Max Mustermann", "assigned": 15, "resolved": 12 }]
}
```

### SLA-Performance abrufen

```http
GET /api/reports/sla?from=2026-01-01&to=2026-03-17
Authorization: Bearer <token>
```

**Antwort:**

```json
{
  "complianceRate": 87,
  "avgResponseMinutes": 45,
  "avgResolutionMinutes": 320,
  "summary": { "total": 42, "breached": 5, "compliant": 37 },
  "byDay": [{ "date": "2026-01-01", "total": 3, "breached": 0, "compliant": 3 }]
}
```

### Zeiterfassung abrufen

```http
GET /api/reports/time?from=2026-01-01&to=2026-03-17
Authorization: Bearer <token>
```

**Antwort:**

```json
{
  "totalMinutes": 2400,
  "billableMinutes": 1800,
  "nonBillableMinutes": 600,
  "summary": { "totalHours": "40h 0m", "billableHours": "30h 0m", "totalAmount": 450000 },
  "byAgent": [{ "agentName": "Max Mustermann", "totalMinutes": 1200, "billableMinutes": 960 }],
  "byDay": [{ "date": "2026-01-01", "minutes": 120, "billableMinutes": 90 }]
}
```

### Bericht exportieren

```http
GET /api/reports/export?type=tickets&format=xlsx&from=2026-01-01&to=2026-03-17
Authorization: Bearer <token>
```

**Query-Parameter:**

| Parameter | Werte | Beschreibung |
|-----------|-------|--------------|
| `type` | `tickets`, `sla`, `time`, `agents` | Berichtstyp |
| `format` | `csv`, `xlsx`, `pdf`, `html` | Ausgabeformat |
| `from` | `YYYY-MM-DD` | Startdatum (Standard: heute − 30 Tage) |
| `to` | `YYYY-MM-DD` | Enddatum (Standard: heute) |

Die Antwort ist eine Datei mit dem entsprechenden Content-Type und `Content-Disposition: attachment`.

---

## Fehlerbehandlung

### HTTP-Statuscodes

| Code | Bedeutung |
|------|-----------|
| `200` | Erfolg |
| `201` | Erstellt |
| `400` | Ungültige Anfrage |
| `401` | Nicht authentifiziert |
| `403` | Keine Berechtigung |
| `404` | Nicht gefunden |
| `500` | Serverfehler |

### Fehlerformat

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "E-Mail-Adresse ist ungültig"
  }
}
```
