# Exchange Online Integration - Einrichtungsanleitung

Diese Anleitung beschreibt Schritt für Schritt, wie Sie die Microsoft Exchange Online Integration für das Ticket-System einrichten. Die Integration ermöglicht das automatische Importieren von E-Mails als Tickets und das Versenden von E-Mail-Benachrichtigungen.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Azure AD App-Registrierung](#azure-ad-app-registrierung)
3. [API-Berechtigungen konfigurieren](#api-berechtigungen-konfigurieren)
4. [Client-Secret erstellen](#client-secret-erstellen)
5. [Exchange-Integration im System konfigurieren](#exchange-integration-im-system-konfigurieren)
6. [Postfächer einrichten](#postfächer-einrichten)
7. [Import-Aktionen festlegen](#import-aktionen-festlegen)
8. [Zuweisungsregeln erstellen](#zuweisungsregeln-erstellen)
9. [Synchronisation aktivieren](#synchronisation-aktivieren)
10. [Fehlerbehebung](#fehlerbehebung)

---

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Voraussetzungen erfüllt sind:

- **Microsoft 365 Abonnement** mit Exchange Online
- **Azure AD Administratorrechte** (Global Administrator oder Application Administrator)
- **Administratorzugang** zum Ticket-System
- **Gültige E-Mail-Postfächer** in Exchange Online, die für die Integration verwendet werden sollen

### Benötigte Informationen

Halten Sie folgende Informationen bereit:
- Ihre **Azure Tenant-ID** (Mandanten-ID)
- Die E-Mail-Adressen der Postfächer, die Sie integrieren möchten

---

## Azure AD App-Registrierung

Die Integration verwendet Microsoft Graph API und benötigt eine registrierte Anwendung in Azure AD.

### Schritt 1: Azure Portal öffnen

1. Öffnen Sie das [Azure Portal](https://portal.azure.com)
2. Melden Sie sich mit einem Administratorkonto an

### Schritt 2: App-Registrierung erstellen

1. Navigieren Sie zu **Azure Active Directory** → **App-Registrierungen**
2. Klicken Sie auf **Neue Registrierung**
3. Füllen Sie das Formular aus:
   - **Name**: `Ticket-System Exchange Integration` (oder ein aussagekräftiger Name Ihrer Wahl)
   - **Unterstützte Kontotypen**: Wählen Sie **Nur Konten in diesem Organisationsverzeichnis**
   - **Umleitungs-URI**: Lassen Sie dieses Feld leer (nicht erforderlich für die App-Only-Authentifizierung)
4. Klicken Sie auf **Registrieren**

### Schritt 3: Wichtige IDs notieren

Nach der Registrierung werden Sie zur Übersichtsseite der App weitergeleitet. Notieren Sie sich:

- **Anwendungs-ID (Client-ID)**: Eine GUID im Format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Verzeichnis-ID (Tenant-ID)**: Eine GUID im Format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Diese Werte finden Sie auf der Übersichtsseite der registrierten Anwendung.

---

## API-Berechtigungen konfigurieren

Die Integration benötigt spezifische Microsoft Graph API-Berechtigungen.

### Schritt 1: API-Berechtigungen öffnen

1. Wählen Sie in Ihrer App-Registrierung **API-Berechtigungen** im linken Menü
2. Klicken Sie auf **Berechtigung hinzufügen**

### Schritt 2: Microsoft Graph Berechtigungen hinzufügen

1. Wählen Sie **Microsoft Graph**
2. Wählen Sie **Anwendungsberechtigungen** (nicht delegierte Berechtigungen!)
3. Suchen und aktivieren Sie folgende Berechtigungen:

| Berechtigung | Beschreibung | Erforderlich für |
|--------------|--------------|------------------|
| `Mail.Read` | Lesen aller E-Mails in allen Postfächern | E-Mail-Import |
| `Mail.ReadWrite` | Lesen und Schreiben aller E-Mails | E-Mail-Verarbeitung (verschieben, archivieren) |
| `Mail.Send` | E-Mails als beliebiger Benutzer senden | Ticket-Benachrichtigungen |

4. Klicken Sie auf **Berechtigungen hinzufügen**

### Schritt 3: Administratorzustimmung erteilen

**Wichtig**: Diese Berechtigungen erfordern die Zustimmung eines Administrators.

1. Klicken Sie auf **Administratorzustimmung für [Ihre Organisation] erteilen**
2. Bestätigen Sie mit **Ja**
3. Der Status aller Berechtigungen sollte nun **Erteilt für [Ihre Organisation]** anzeigen

> **Hinweis**: Ohne Administratorzustimmung funktioniert die Integration nicht!

---

## Client-Secret erstellen

Für die Authentifizierung benötigt die Integration ein Client-Secret.

### Schritt 1: Zertifikate & Geheimnisse öffnen

1. Wählen Sie in Ihrer App-Registrierung **Zertifikate & Geheimnisse** im linken Menü
2. Wechseln Sie zum Tab **Geheime Clientschlüssel**

### Schritt 2: Neuen geheimen Clientschlüssel erstellen

1. Klicken Sie auf **Neuer geheimer Clientschlüssel**
2. Geben Sie eine Beschreibung ein: `Ticket-System Integration`
3. Wählen Sie die Gültigkeitsdauer:
   - **6 Monate** (empfohlen für Testzwecke)
   - **12 Monate**
   - **24 Monate** (empfohlen für Produktion)
4. Klicken Sie auf **Hinzufügen**

### Schritt 3: Secret-Wert kopieren

**WICHTIG**: Der Wert des Client-Secrets wird nur einmal angezeigt!

1. Kopieren Sie den **Wert** (nicht die Geheimnis-ID) sofort
2. Speichern Sie diesen Wert sicher ab
3. Sie können den Wert nach dem Verlassen der Seite nicht mehr einsehen

> **Sicherheitshinweis**: Behandeln Sie das Client-Secret wie ein Passwort. Teilen Sie es niemals öffentlich und speichern Sie es nur an sicheren Orten.

---

## Exchange-Integration im System konfigurieren

Nachdem Sie die Azure AD App erstellt haben, können Sie die Integration im Ticket-System konfigurieren.

### Schritt 1: Einstellungen öffnen

1. Melden Sie sich als Administrator im Ticket-System an
2. Navigieren Sie zu **Einstellungen** (über die Sidebar oder `/settings`)
3. Klicken Sie auf die Karte **Exchange-Integration**

### Schritt 2: Azure-Konfiguration eingeben

Im ersten Tab **Azure-Konfiguration** geben Sie die Daten Ihrer Azure AD App ein:

| Feld | Wert | Beschreibung |
|------|------|--------------|
| **Tenant-ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Ihre Azure Verzeichnis-ID |
| **Client-ID** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Die Anwendungs-ID Ihrer App |
| **Authentifizierungstyp** | `Client-Secret` | Wählen Sie die Authentifizierungsmethode |
| **Client-Secret** | `Ihr geheimer Schlüssel` | Das erstellte Client-Secret |

### Schritt 3: Verbindung testen

1. Klicken Sie auf **Verbindung testen**
2. Bei erfolgreicher Verbindung erscheint eine Bestätigung mit dem Namen Ihrer Organisation
3. Bei Fehlern überprüfen Sie:
   - Sind alle IDs korrekt eingegeben?
   - Wurde die Administratorzustimmung erteilt?
   - Ist das Client-Secret noch gültig?

---

## Postfächer einrichten

Im Tab **Postfächer** konfigurieren Sie die Exchange-Postfächer, die das System verwenden soll.

### Postfachtypen

Das System unterstützt drei Postfachtypen:

| Typ | Symbol | Verwendung |
|-----|--------|------------|
| **Eingehend** | 📥 | E-Mails werden gelesen und als Tickets importiert |
| **Ausgehend** | 📤 | Wird zum Versenden von E-Mail-Benachrichtigungen verwendet |
| **Geteilt** | 📧 | Kombiniert eingehende und ausgehende Funktionen |

### Postfach hinzufügen

1. Klicken Sie auf **Postfach hinzufügen**
2. Füllen Sie das Formular aus:
   - **E-Mail-Adresse**: Die vollständige E-Mail-Adresse des Postfachs (z.B. `support@ihrefirma.de`)
   - **Anzeigename**: Ein beschreibender Name (z.B. "Support-Postfach")
   - **Postfachtyp**: Wählen Sie den passenden Typ
3. Klicken Sie auf **Speichern**

### Empfohlene Konfiguration

Für ein typisches Support-Szenario empfehlen wir:

- **1 Geteiltes Postfach** für den allgemeinen Support (z.B. `support@ihrefirma.de`)
- Optional: **Separate eingehende Postfächer** für verschiedene Abteilungen
- Optional: **Dediziertes ausgehendes Postfach** für Benachrichtigungen

---

## Import-Aktionen festlegen

Im Tab **Import-Aktionen** legen Sie fest, was mit E-Mails nach dem Import geschehen soll.

### Verfügbare Aktionen

| Aktion | Beschreibung | Empfehlung |
|--------|--------------|------------|
| **Unverändert lassen** | E-Mail bleibt im Posteingang | Für Tests |
| **Als gelesen markieren** | E-Mail wird als gelesen markiert | ✅ Empfohlen |
| **In Ordner verschieben** | E-Mail wird in einen spezifischen Ordner verschoben | Für Archivierung |
| **Archivieren** | E-Mail wird ins Archiv verschoben | Für Langzeitaufbewahrung |
| **Löschen** | E-Mail wird nach dem Import gelöscht | ⚠️ Vorsicht |

### Konfiguration

1. Wählen Sie für jedes Postfach die gewünschte Aktion
2. Bei "In Ordner verschieben": Geben Sie den Zielordner an (z.B. "Verarbeitet" oder "Tickets")
3. Speichern Sie die Einstellungen

> **Tipp**: Erstellen Sie vorab einen Ordner in Exchange Online für verarbeitete E-Mails.

---

## Zuweisungsregeln erstellen

Im Tab **Zuweisungsregeln** definieren Sie, wie eingehende E-Mails automatisch kategorisiert und zugewiesen werden.

### Regel erstellen

1. Klicken Sie auf **Neue Regel**
2. Konfigurieren Sie die Regel:

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Regelname** | Beschreibender Name | "Dringende Anfragen" |
| **Priorität** | Reihenfolge der Regelanwendung (1 = höchste) | 1 |
| **Bedingung: Betreff enthält** | Schlagwörter im Betreff | "DRINGEND", "URGENT" |
| **Bedingung: Absender enthält** | E-Mail-Domain oder Adresse | "@wichtigerkunde.de" |
| **Bedingung: Schlüsselwörter** | Wörter im E-Mail-Text | "Serverausfall", "kritisch" |
| **Aktion: Priorität** | Ticket-Priorität setzen | "Hoch" oder "Dringend" |
| **Aktion: Kategorie** | Ticket-Kategorie zuweisen | "Technischer Support" |
| **Aktion: Zuweisen an** | Team oder Agent zuweisen | "IT-Team" |

### Regelbeispiele

**Regel 1: VIP-Kunden**
- Absender enthält: `@premiumkunde.de`, `@vip-partner.com`
- Priorität setzen: Hoch
- Zuweisen an: Key Account Manager

**Regel 2: Rechnungsanfragen**
- Betreff enthält: `Rechnung`, `Invoice`, `Zahlung`
- Kategorie: Buchhaltung
- Zuweisen an: Finanzabteilung

**Regel 3: Technische Probleme**
- Schlüsselwörter: `Fehler`, `funktioniert nicht`, `Error`, `Bug`
- Kategorie: Technischer Support
- Priorität: Mittel

---

## Synchronisation aktivieren

Im Tab **Synchronisation** konfigurieren Sie den automatischen E-Mail-Abruf.

### Synchronisationsintervall

Wählen Sie, wie oft das System nach neuen E-Mails suchen soll:

| Intervall | Empfehlung |
|-----------|------------|
| **5 Minuten** | Für zeitkritischen Support |
| **15 Minuten** | ✅ Empfohlen für die meisten Szenarien |
| **30 Minuten** | Für moderate Anfragevolumen |
| **60 Minuten** | Für niedrige Anfragevolumen |

### Einstellungen

1. Aktivieren Sie **Automatische Synchronisation**
2. Wählen Sie das **Synchronisationsintervall**
3. Optional: Legen Sie **Ruhezeiten** fest (z.B. keine Synchronisation zwischen 22:00 und 06:00)

### Manuelle Synchronisation

Sie können jederzeit eine manuelle Synchronisation durchführen:

1. Klicken Sie auf **Jetzt synchronisieren**
2. Das System ruft sofort alle neuen E-Mails ab
3. Der Synchronisationsstatus wird angezeigt

---

## Zusammenfassung und Aktivierung

Im Tab **Zusammenfassung** erhalten Sie einen Überblick über Ihre Konfiguration.

### Checkliste vor der Aktivierung

Stellen Sie sicher, dass:

- [ ] Azure AD App ist korrekt konfiguriert
- [ ] Verbindungstest war erfolgreich
- [ ] Mindestens ein Postfach ist eingerichtet
- [ ] Import-Aktionen sind festgelegt
- [ ] Zuweisungsregeln sind erstellt (optional aber empfohlen)
- [ ] Synchronisationsintervall ist gewählt

### Integration aktivieren

1. Überprüfen Sie die Zusammenfassung aller Einstellungen
2. Klicken Sie auf **Exchange-Integration aktivieren**
3. Die Integration ist nun aktiv und beginnt mit der Synchronisation

---

## Fehlerbehebung

### Häufige Fehler und Lösungen

#### Fehler: "AUTH_FAILED - Authentifizierung fehlgeschlagen"

**Ursachen:**
- Falsche Tenant-ID, Client-ID oder Client-Secret
- Client-Secret ist abgelaufen
- Administratorzustimmung wurde nicht erteilt

**Lösung:**
1. Überprüfen Sie alle IDs in der Azure AD App-Registrierung
2. Erstellen Sie ggf. ein neues Client-Secret
3. Stellen Sie sicher, dass die Administratorzustimmung erteilt wurde

#### Fehler: "PERMISSION_DENIED - Zugriff verweigert"

**Ursachen:**
- Fehlende API-Berechtigungen
- Keine Administratorzustimmung für die Berechtigungen

**Lösung:**
1. Öffnen Sie die API-Berechtigungen in Azure AD
2. Fügen Sie alle erforderlichen Berechtigungen hinzu
3. Erteilen Sie erneut die Administratorzustimmung

#### Fehler: "MAILBOX_NOT_FOUND - Postfach nicht gefunden"

**Ursachen:**
- Falsche E-Mail-Adresse
- Postfach existiert nicht in Exchange Online
- Keine Berechtigung für das Postfach

**Lösung:**
1. Überprüfen Sie die E-Mail-Adresse auf Tippfehler
2. Stellen Sie sicher, dass das Postfach in Exchange Online existiert
3. Prüfen Sie die Postfachberechtigungen

#### Fehler: "NETWORK_ERROR - Netzwerkfehler"

**Ursachen:**
- Keine Internetverbindung
- Microsoft Graph API ist nicht erreichbar
- Firewall blockiert die Verbindung

**Lösung:**
1. Überprüfen Sie die Internetverbindung
2. Prüfen Sie den Status der Microsoft Graph API
3. Stellen Sie sicher, dass Ihre Firewall `graph.microsoft.com` erlaubt

### Protokolle einsehen

Für detaillierte Fehleranalysen:

1. Navigieren Sie zu **Einstellungen** → **System-Logs**
2. Filtern Sie nach Quelle: **Exchange**
3. Überprüfen Sie die Fehlermeldungen und Stack-Traces

---

## Sicherheitshinweise

### Empfohlene Sicherheitspraktiken

1. **Minimale Berechtigungen**: Erteilen Sie nur die erforderlichen API-Berechtigungen
2. **Regelmäßige Rotation**: Erneuern Sie das Client-Secret regelmäßig (alle 6-12 Monate)
3. **Überwachung**: Überprüfen Sie regelmäßig die Anmeldeprotokolle in Azure AD
4. **Zugriffsbeschränkung**: Beschränken Sie den Administratorzugang im Ticket-System

### Client-Secret Erneuerung

Vor Ablauf des Client-Secrets:

1. Erstellen Sie ein neues Client-Secret in Azure AD
2. Aktualisieren Sie das Secret in der Exchange-Integration
3. Testen Sie die Verbindung
4. Löschen Sie das alte Client-Secret in Azure AD

---

## Support

Bei Fragen oder Problemen:

1. Konsultieren Sie zuerst diese Anleitung
2. Überprüfen Sie die System-Logs auf Fehlermeldungen
3. Wenden Sie sich an Ihren Systemadministrator

---

*Letzte Aktualisierung: Januar 2026*
*Version: 1.0*
