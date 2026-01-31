# E-Mail-Integration

Support-Engine unterstützt die Integration mit Microsoft Exchange Online / Microsoft 365.

## Funktionen

- **E-Mail-Abruf**: Automatisches Abrufen von E-Mails
- **Ticket-Erstellung**: E-Mails werden zu Tickets
- **Anhänge**: Automatische Übernahme von Dateianhängen
- **Verarbeitungsregeln**: Flexible Automatisierung

## Exchange Online einrichten

### Voraussetzungen

- Microsoft 365 / Azure AD Konto
- Administratorzugang zu Azure Portal
- Berechtigungen für App-Registrierung

### 1. Azure App registrieren

1. Öffnen Sie das [Azure Portal](https://portal.azure.com)
2. Navigieren Sie zu **Azure Active Directory > App-Registrierungen**
3. Klicken Sie auf **Neue Registrierung**
4. Konfigurieren Sie:
   - **Name**: Support-Engine Email Integration
   - **Kontotypen**: Einzelner Mandant
   - **Umleitungs-URI**: (leer lassen)

### 2. API-Berechtigungen

Fügen Sie folgende Microsoft Graph Berechtigungen hinzu:

| Berechtigung | Typ | Beschreibung |
|--------------|-----|--------------|
| `Mail.Read` | Delegiert | E-Mails lesen |
| `Mail.ReadWrite` | Delegiert | E-Mails lesen und schreiben |
| `Mail.Send` | Delegiert | E-Mails senden |

### 3. Client-Secret erstellen

1. Gehen Sie zu **Zertifikate & Geheimnisse**
2. Klicken Sie auf **Neues Clientgeheimnis**
3. Kopieren Sie den Wert sofort!

### 4. In Support-Engine konfigurieren

1. Navigieren Sie zu **Einstellungen > E-Mail-Integration**
2. Geben Sie die Azure-Daten ein:
   - **Client ID**: Aus Azure App
   - **Client Secret**: Aus Schritt 3
   - **Tenant ID**: Ihre Azure Tenant ID

## Postfächer hinzufügen

1. Klicken Sie auf **Neues Postfach**
2. Wählen Sie das E-Mail-Konto
3. Konfigurieren Sie:
   - **Ordner**: Zu überwachender Ordner
   - **Intervall**: Abrufhäufigkeit

## Verarbeitungsregeln

### Regel erstellen

1. Gehen Sie zu **E-Mail > Regeln**
2. Klicken Sie auf **Neue Regel**
3. Definieren Sie Bedingungen:
   - **Absender enthält**: E-Mail-Domain/Adresse
   - **Betreff enthält**: Schlüsselwörter
   - **Inhalt enthält**: Textmuster

4. Wählen Sie Aktionen:
   - Ticket erstellen
   - Priorität setzen
   - Agent zuweisen
   - Kategorie festlegen

### Logische Verknüpfung

Mehrere Bedingungen können verknüpft werden:

- **UND**: Alle Bedingungen müssen zutreffen
- **ODER**: Eine Bedingung muss zutreffen

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Keine E-Mails | Berechtigungen in Azure prüfen |
| Authentifizierungsfehler | Client Secret erneuern |
| Ordner nicht gefunden | Ordnername überprüfen |

Weitere Details finden Sie in der [Exchange-Einrichtungsanleitung](https://github.com/northbyte-io/Support-Engine/blob/main/EXCHANGE_EINRICHTUNG.md).
