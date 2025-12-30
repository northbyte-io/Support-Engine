# German Ticket System - Betriebs- und Administrationsanleitung

Diese Anleitung ergänzt die [README.md](./README.md) und richtet sich an Administratoren, Betreiber und technische Ansprechpartner des German Ticket Systems.

---

## Inhaltsverzeichnis

1. [Systemüberblick](#systemüberblick)
2. [Betrieb und Administration](#betrieb-und-administration)
3. [E-Mail- und Integrationen](#e-mail--und-integrationen)
4. [CRM-Nutzung im Ticketsystem](#crm-nutzung-im-ticketsystem)
5. [Logging und Monitoring](#logging-und-monitoring)
6. [TLS und Sicherheit](#tls-und-sicherheit)
7. [Branding und Mandantenanpassung](#branding-und-mandantenanpassung)
8. [Betriebshinweise](#betriebshinweise)
9. [AGPL-3.0 Lizenzhinweise](#agpl-30-lizenzhinweise)

---

## Systemüberblick

Das German Ticket System ist eine mandantenfähige Helpdesk-Webanwendung mit REST-API. Der Aufbau ist ticketzentriert: Alle Funktionen wie CRM, SLA, Zeiterfassung und Wissensmanagement sind auf die Ticketbearbeitung ausgerichtet.

### Kernarchitektur

| Komponente | Beschreibung |
|------------|--------------|
| Frontend | React-basierte Single-Page-Application |
| Backend | Express.js REST-API |
| Datenbank | PostgreSQL mit Drizzle ORM |
| Authentifizierung | JWT-Token mit bcrypt-Passworthashing |

### Mandantenfähigkeit

Jeder Mandant (Tenant) hat isolierte Daten. Die Trennung erfolgt über `tenantId`-Fremdschlüssel in allen relevanten Tabellen. Ein Benutzer ist immer genau einem Mandanten zugeordnet.

---

## Betrieb und Administration

### Mandanten anlegen und verwalten

Mandanten werden über die Datenbank oder die Admin-API verwaltet.

**Neue Mandanten erstellen:**
```sql
INSERT INTO tenants (name, slug, is_active) 
VALUES ('Firmenname GmbH', 'firmenname', true);
```

**Wichtige Felder:**
- `name`: Anzeigename des Mandanten
- `slug`: URL-freundlicher Bezeichner (eindeutig)
- `is_active`: Aktivierungsstatus

### Benutzer und Rollen verwalten

Das System kennt drei Rollen:

| Rolle | Berechtigungen |
|-------|----------------|
| `admin` | Vollzugriff auf alle Funktionen, Systemkonfiguration |
| `agent` | Ticketbearbeitung, Zeiterfassung, KB-Artikel erstellen |
| `customer` | Eigene Tickets erstellen und einsehen |

**Benutzer anlegen (API):**
```
POST /api/auth/register
{
  "email": "benutzer@firma.de",
  "password": "sicheresPasswort",
  "firstName": "Max",
  "lastName": "Mustermann"
}
```

Neue Benutzer erhalten standardmäßig die Rolle `customer`. Die Rollenänderung erfolgt durch einen Administrator.

### Ticketarten und Workflows konfigurieren

Ticketarten definieren, welche benutzerdefinierten Felder bei der Ticketerstellung angezeigt werden.

**Navigation:** Einstellungen > Ticketarten

**Benutzerdefinierte Felder:**
- Text, Zahl, Datum, Auswahl
- Pflichtfelder markierbar
- Reihenfolge konfigurierbar

**Standard-Workflow:**
```
Offen → In Bearbeitung → Wartend → Gelöst → Geschlossen
```

### SLA-Definitionen pflegen

SLAs werden pro Priorität definiert und regeln Reaktions- und Lösungszeiten.

**Navigation:** Einstellungen > SLA-Definitionen

| Feld | Beschreibung |
|------|--------------|
| Priorität | Niedrig, Mittel, Hoch, Dringend |
| Reaktionszeit | Zeit bis zur ersten Antwort (Stunden) |
| Lösungszeit | Zeit bis zur Lösung (Stunden) |
| Geschäftszeiten | Berücksichtigung von Arbeitszeiten |

### Eskalationen überwachen

Bei SLA-Verletzungen werden automatisch Eskalationen ausgelöst.

**Eskalationsstufen:**
1. Warnung bei 80% der Zeit
2. Eskalation bei Überschreitung
3. Management-Eskalation nach definierter Frist

Die Eskalationsregeln werden pro SLA-Definition konfiguriert.

---

## E-Mail- und Integrationen

### Mailabruf und Ticketerstellung

Das System kann E-Mails aus konfigurierten Postfächern abrufen und automatisch Tickets erstellen.

**Konfiguration:**
- IMAP/Exchange-Zugangsdaten hinterlegen
- Abrufintervall festlegen
- Ziel-Ticketart und Standardpriorität definieren

### Exchange-Online-Integration

Für Microsoft 365 Umgebungen:

1. Azure AD App-Registrierung erstellen
2. API-Berechtigungen für Mail.Read vergeben
3. Client-ID und Secret im System hinterlegen
4. OAuth-Authentifizierung durchführen

### Verhalten nach Mailimport

Nach erfolgreichem Import:
- E-Mail wird als Ticketinhalt übernommen
- Anhänge werden verknüpft
- Absender wird als Kontakt zugeordnet (falls vorhanden)
- Automatische Benachrichtigung an Absender (konfigurierbar)

### Typische Fehler und Lösungen

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| Verbindung fehlgeschlagen | Falsche Zugangsdaten | Credentials prüfen |
| Timeout | Netzwerkproblem | Firewall-Regeln prüfen |
| Keine neuen Mails | Ordner falsch | IMAP-Ordner verifizieren |
| Duplikate | Fehlende Message-ID | Duplikaterkennung aktivieren |

---

## CRM-Nutzung im Ticketsystem

Das CRM ist vollständig in die Ticketbearbeitung integriert.

### Kunden und Organisationen anlegen

**Hierarchie:**
```
Organisation (optional)
  └── Kunde (KD-XXXXX)
       └── Standorte
            └── Kontakte
```

**Kunden anlegen:**
- Navigation: CRM > Kunden > Neuer Kunde
- Kundennummer wird automatisch generiert (KD-XXXXX)
- Organisation optional zuweisbar
- Account-Manager zuweisen für Verantwortlichkeiten

### Kontakte im Ticketkontext

Kontakte können mit Tickets verknüpft werden:
- Bei Ticketerstellung: Kontakt auswählen
- Nachträglich: Ticket bearbeiten > Kontakt hinzufügen
- E-Mail-Import: Automatische Zuordnung über E-Mail-Adresse

### Kundenhistorie aus Tickets

Die Kundendetailseite zeigt:
- Alle Tickets des Kunden
- Aktivitäten (Anrufe, E-Mails, Meetings, Notizen)
- Offene SLA-Verletzungen
- Verknüpfte Assets

### Vertriebs- und Servicetickets

Tickets können nach Typ kategorisiert werden:
- Störung/Incident
- Anfrage/Service Request
- Vertriebsanfrage
- Projekt

Die Kategorisierung erfolgt über Ticketarten.

---

## Logging und Monitoring

### Bedeutung der Log-Level

| Level | Verwendung |
|-------|------------|
| `debug` | Entwicklungsdetails, nur bei Bedarf aktivieren |
| `info` | Normale Betriebsmeldungen |
| `warn` | Warnungen, erfordern Aufmerksamkeit |
| `error` | Fehler mit Ursache und Lösungsvorschlag |
| `security` | Sicherheitsrelevante Ereignisse |
| `performance` | Leistungsmessungen |

### Nutzung der Log-UI

**Navigation:** Administration > System-Logs (nur für Admins)

**Funktionen:**
- Filterung nach Level und Quelle
- Volltextsuche
- Zeitraumauswahl
- Paginierung

### Filter und Exporte

**Verfügbare Exportformate:**
- TXT: Einfache Textdatei
- CSV: Für Tabellenkalkulationen
- JSON: Für maschinelle Verarbeitung

**Typische Filterszenarien:**
- Alle Fehler der letzten 24 Stunden
- Security-Events eines Benutzers
- Performance-Logs für API-Endpunkte

### Fehleranalyse anhand von Logs

1. Fehler in der UI reproduzieren
2. Logs nach Zeitpunkt filtern
3. Error-Level prüfen
4. Korrelierte Einträge über Request-ID suchen
5. Ursache und Lösung aus Log-Details entnehmen

---

## TLS und Sicherheit

### HTTPS-Aktivierung

Das System unterstützt HTTPS mit Let's Encrypt Zertifikaten.

**Voraussetzungen:**
- Öffentlich erreichbare Domain
- Port 80 für HTTP-01 Challenge verfügbar
- Gültige E-Mail-Adresse für Let's Encrypt

### Let's-Encrypt-Verwaltung

**Navigation:** Administration > TLS-Zertifikate

**Zertifikat anfordern:**
1. Domain eingeben
2. E-Mail-Adresse angeben
3. Umgebung wählen (Staging zum Testen, Production für echte Zertifikate)
4. Anforderung starten

### Zertifikatsstatus prüfen

| Status | Bedeutung |
|--------|-----------|
| `pending` | Anforderung läuft |
| `active` | Zertifikat gültig und aktiv |
| `expired` | Zertifikat abgelaufen |
| `failed` | Fehler bei Anforderung |
| `revoked` | Zertifikat widerrufen |

### Automatische Erneuerung

- Standard: 30 Tage vor Ablauf
- Konfigurierbar in den TLS-Einstellungen
- Bei Fehlern: Benachrichtigung an Admin

**Hinweis:** Die TLS-Verwaltung erfordert einen eigenen Server. In Hosting-Umgebungen wie Replit ist die HTTP-01 Challenge nicht möglich.

---

## Branding und Mandantenanpassung

### Logos und Farben setzen

**Navigation:** Einstellungen > Branding

**Logo-Typen:**
- Hauptlogo (für Header)
- Logo Light/Dark (für Theme-Wechsel)
- Favicon (Browser-Tab-Icon)

**Farben:**
- Primärfarbe: Hauptakzentfarbe
- Sekundärfarbe: Ergänzende Farbe
- Akzentfarbe: Hervorhebungen

### Schriftarten wählen

Verfügbare Schriftarten:
- Inter (Standard)
- Roboto
- Open Sans
- Lato
- Poppins
- Montserrat
- Source Sans Pro
- Nunito
- Work Sans
- IBM Plex Sans

### E-Mail-Templates anpassen

**Konfigurierbare Elemente:**
- Header-HTML
- Footer-HTML
- Absendername
- Absenderadresse

Die Templates werden für alle automatischen E-Mails verwendet (Ticketbestätigungen, Benachrichtigungen, Umfragen).

---

## Betriebshinweise

### Backup-Empfehlungen

**Datenbank:**
- Tägliches vollständiges Backup
- Aufbewahrung: mindestens 30 Tage
- Test-Restore monatlich durchführen

**Dateien:**
- Anhänge und Uploads sichern
- Logs archivieren (optional)

### Log-Retention

Standard-Konfiguration:
- Maximale Dateigröße: 2 GB
- Aufbewahrung: 7 Tage
- Rotation: täglich

Anpassung in `server/logger.ts` möglich.

### Updates und Migrationen

**Vor dem Update:**
1. Backup erstellen
2. Changelog prüfen
3. Testumgebung aktualisieren
4. Funktionstest durchführen

**Datenbankmigrationen:**
```bash
npx drizzle-kit push
```

### Typische Wartungsaufgaben

| Aufgabe | Intervall |
|---------|-----------|
| Log-Prüfung auf Fehler | Täglich |
| Backup-Verifizierung | Wöchentlich |
| Zertifikatsstatus prüfen | Monatlich |
| Datenbankoptimierung | Quartalsweise |
| Sicherheitsupdates | Nach Veröffentlichung |

---

## AGPL-3.0 Lizenzhinweise

Das German Ticket System steht unter der GNU Affero General Public License v3.0.

### Pflichten bei Betrieb als Webdienst

Als Betreiber eines AGPL-lizenzierten Webdienstes sind Sie verpflichtet:
- Den Quellcode für Nutzer zugänglich zu machen
- Änderungen unter gleicher Lizenz zu veröffentlichen
- Copyright-Hinweise beizubehalten

### Quellcode-Zugriff über UI

Das System stellt automatisch bereit:
- `/api/license` - Vollständiger Lizenztext
- `/api/source` - Repository-Link und Lizenzinfo
- Footer-Links auf jeder Seite

### Weitere Informationen

- [LICENSE](./LICENSE) - Vollständiger Lizenztext
- [NOTICE](./NOTICE) - Copyright-Hinweis
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Beitragsrichtlinien
- [README.md](./README.md) - Technische Dokumentation

---

**Stand:** Dezember 2024

Diese Anleitung wird regelmäßig aktualisiert. Bei Fragen oder Ergänzungswünschen wenden Sie sich an den technischen Ansprechpartner.
