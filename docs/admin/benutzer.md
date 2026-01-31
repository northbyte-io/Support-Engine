# Benutzerverwaltung

Die Benutzerverwaltung ermöglicht das Anlegen und Verwalten von Systemzugängen.

## Benutzerrollen

Support-Engine kennt drei Benutzerrollen:

| Rolle | Symbol | Berechtigungen |
|-------|--------|----------------|
| **Admin** | 👑 | Vollzugriff, Systemkonfiguration |
| **Agent** | 👷 | Ticketbearbeitung, Zeiterfassung, KB-Artikel |
| **Kunde** | 👤 | Eigene Tickets erstellen und einsehen |

## Benutzer anlegen

### Über die Oberfläche

1. Navigieren Sie zu **Einstellungen > Benutzer**
2. Klicken Sie auf **"Neuer Benutzer"**
3. Füllen Sie die Felder aus:
   - **E-Mail**: Eindeutige E-Mail-Adresse
   - **Vorname / Nachname**: Anzeigename
   - **Passwort**: Mindestens 8 Zeichen
   - **Rolle**: Admin, Agent oder Kunde

### Via API

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "benutzer@firma.de",
  "password": "sicheresPasswort",
  "firstName": "Max",
  "lastName": "Mustermann"
}
```

## Rollen ändern

1. Öffnen Sie den Benutzer zur Bearbeitung
2. Wählen Sie die neue Rolle
3. Speichern Sie die Änderung

:::{note}
Neue Benutzer erhalten standardmäßig die Rolle "Kunde". Die Rollenänderung muss durch einen Administrator erfolgen.
:::

## Benutzer deaktivieren

Anstatt Benutzer zu löschen, können diese deaktiviert werden:

1. Öffnen Sie den Benutzer
2. Setzen Sie "Aktiv" auf **Nein**
3. Speichern

Der Benutzer kann sich nicht mehr anmelden, aber die Datenintegrität bleibt erhalten.

## Passwort zurücksetzen

Administratoren können Passwörter zurücksetzen:

1. Öffnen Sie den Benutzer
2. Klicken Sie auf **"Passwort zurücksetzen"**
3. Geben Sie ein neues Passwort ein
4. Teilen Sie das neue Passwort dem Benutzer mit
