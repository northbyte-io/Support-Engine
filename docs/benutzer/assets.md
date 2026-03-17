# Asset-Management

Das Asset-Management ermöglicht die Verwaltung von Hardware, Software und anderen IT-Ressourcen. Assets können direkt mit Tickets verknüpft werden, um den technischen Kontext einer Anfrage zu dokumentieren.

## Kategorien

Assets werden in Kategorien organisiert. Admins können eigene Kategorien anlegen.

**Navigation:** Ressourcen → Assets → Kategorien (Admin)

Beispiele: Computer, Monitor, Drucker, Software, Lizenz, Netzwerkgerät

## Asset anlegen

**Navigation:** Ressourcen → Assets → Neues Asset

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| Name | ✓ | Bezeichnung des Assets |
| Asset-Nummer | – | Automatisch oder manuell (eindeutig) |
| Kategorie | ✓ | Asset-Kategorie |
| Typ | – | Gerät, Software, Lizenz etc. |
| Status | ✓ | Aktiv, Inaktiv, Lager, Reparatur, Ausgemustert |
| Seriennummer | – | Hardware-Seriennummer |
| Hersteller | – | Hersteller / Anbieter |
| Modell | – | Modellbezeichnung |
| Kaufdatum | – | Datum des Kaufs |
| Garantie bis | – | Ablauf der Garantie |
| Standort | – | Physischer Standort |
| Besitzer | – | Zugewiesener Benutzer oder Kunde |
| Notizen | – | Interne Anmerkungen |

Die Asset-Nummer wird automatisch vergeben, kann aber überschrieben werden. Die nächste verfügbare Nummer ist über `GET /api/assets/next-number` abrufbar.

## Asset-Status

| Status | Bedeutung |
|--------|----------|
| `aktiv` | Im Einsatz |
| `inaktiv` | Nicht in Verwendung |
| `lager` | Im Lager / nicht zugewiesen |
| `reparatur` | Wird repariert |
| `ausgemustert` | Außer Betrieb genommen |

## Assets mit Tickets verknüpfen

Im Ticket-Detail → **Assets** → Asset suchen und verknüpfen.

Die Verknüpfung zeigt im Asset-Detail alle Tickets, bei denen dieses Gerät betroffen war.

## Änderungsverlauf

Jede Änderung an einem Asset wird automatisch im **Verlauf** protokolliert:
- Geändertes Feld
- Vorheriger und neuer Wert
- Zeitstempel und bearbeitender Benutzer

**Navigation:** Asset-Detail → Verlauf

## Lizenzen

Softwarelizenzen können einem Asset zugeordnet werden:

| Feld | Beschreibung |
|------|-------------|
| Produkt | Name der Software |
| Lizenzschlüssel | Aktivierungsschlüssel |
| Typ | Einzelplatz, Volumen, Abonnement |
| Ablaufdatum | Lizenzende |
| Anzahl Seats | Bei Mehrplatzlizenzen |

## Verträge

Wartungs- und Serviceverträge können Assets zugeordnet werden:

| Feld | Beschreibung |
|------|-------------|
| Vertragsname | Bezeichnung des Vertrags |
| Anbieter | Vertragspartner |
| Vertragsbeginn / -ende | Laufzeit |
| Vertragsnummer | Referenznummer beim Anbieter |
| Notizen | Details zum Vertrag |
