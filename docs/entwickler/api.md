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
