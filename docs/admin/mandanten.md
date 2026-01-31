# Mandantenverwaltung

Support-Engine ist mandantenfähig - jeder Mandant hat vollständig isolierte Daten.

## Konzept

Ein Mandant (Tenant) repräsentiert eine eigenständige Organisation mit:

- Eigenen Benutzern
- Eigenen Tickets
- Eigenen Kunden und Assets
- Eigenem Branding

## Mandant konfigurieren

### Grundeinstellungen

1. Navigieren Sie zu **Einstellungen > Mandant**
2. Konfigurieren Sie:
   - **Name**: Anzeigename des Mandanten
   - **Slug**: URL-freundlicher Bezeichner
   - **Aktiv**: Aktivierungsstatus

### Branding

Passen Sie das Erscheinungsbild an:

| Einstellung | Beschreibung |
|-------------|--------------|
| **Logo** | Firmenlogo für Header |
| **Favicon** | Browser-Tab-Icon |
| **Primärfarbe** | Hauptfarbe der Oberfläche |
| **E-Mail-Footer** | Signatur für ausgehende E-Mails |

## Datenisolierung

```
┌─────────────────────────────────────────────────────┐
│                   Support-Engine                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Mandant A  │  │  Mandant B  │  │  Mandant C  │  │
│  │  - Benutzer │  │  - Benutzer │  │  - Benutzer │  │
│  │  - Tickets  │  │  - Tickets  │  │  - Tickets  │  │
│  │  - Kunden   │  │  - Kunden   │  │  - Kunden   │  │
│  │  - Assets   │  │  - Assets   │  │  - Assets   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

Jeder Mandant:
- Sieht nur eigene Daten
- Hat eigene Administratoren
- Kann eigene Einstellungen vornehmen

## Best Practices

- **Eindeutige Slugs**: Verwenden Sie aussagekräftige, eindeutige Bezeichner
- **Regelmäßige Überprüfung**: Inaktive Mandanten deaktivieren
- **Branding nutzen**: Individuelle Gestaltung erhöht die Akzeptanz
