# TLS-Zertifikatsverwaltung

Support-Engine enthält eine integrierte TLS-Verwaltung auf Basis von Let's Encrypt (ACME HTTP-01). Zertifikate können direkt über die Benutzeroberfläche beantragt, verlängert und verwaltet werden.

## Voraussetzungen

- Die Anwendung muss über HTTP (Port 80) aus dem Internet erreichbar sein
- Der Domainname muss auf den Server zeigen (DNS-Eintrag)
- Let's Encrypt muss den ACME-Challenge-Pfad erreichen können: `/.well-known/acme-challenge/`

## ACME-Konfiguration

**Navigation:** Administration → TLS-Zertifikate → Einstellungen

| Feld | Beschreibung |
|------|-------------|
| E-Mail-Adresse | Kontaktadresse für Let's Encrypt (für Ablaufbenachrichtigungen) |
| Staging-Modus | Let's Encrypt Staging verwenden (für Tests, kein Rate-Limit) |

:::{note}
Aktivieren Sie den Staging-Modus bei ersten Tests, um Let's Encrypt-Rate-Limits zu vermeiden. Staging-Zertifikate sind nicht von Browsern als vertrauenswürdig eingestuft.
:::

## Zertifikat beantragen

**Navigation:** Administration → TLS-Zertifikate → Neues Zertifikat

1. Domain eingeben (z.B. `support.firma.de`)
2. ACME-Challenge startet automatisch im Hintergrund
3. Nach erfolgreicher Validierung wird das Zertifikat ausgestellt
4. Zertifikat aktivieren mit **Aktivieren**

Der Status des Zertifikats ist im Aktionsprotokoll nachvollziehbar.

## Zertifikat-Status

| Status | Bedeutung |
|--------|----------|
| `pending` | Beantragung läuft |
| `active` | Aktiv und in Verwendung |
| `expired` | Abgelaufen |
| `revoked` | Widerrufen |

## Automatische Verlängerung

Die SLA-Engine prüft täglich ablaufende Zertifikate. Zertifikate werden automatisch 30 Tage vor Ablauf verlängert, sofern:

- Die ACME-Konfiguration vollständig ist
- Die Domain noch erreichbar ist

Manuelle Verlängerung: **TLS-Zertifikate → Zertifikat → Verlängern**

## Zertifikat widerrufen

Im Fall einer Kompromittierung kann ein Zertifikat sofort widerrufen werden:

**Navigation:** TLS-Zertifikate → Zertifikat → Widerrufen

:::{warning}
Das Widerrufen eines aktiven Zertifikats macht HTTPS sofort nicht mehr verfügbar. Stellen Sie sicher, dass ein Ersatzzertifikat bereit ist.
:::

## Aktionsprotokoll

Alle Aktionen (Beantragung, Verlängerung, Aktivierung, Widerruf) werden im Aktionsprotokoll festgehalten:

**Navigation:** Administration → TLS-Zertifikate → Aktionsprotokoll

Das Protokoll zeigt Zeitstempel, Aktion, Status und eventuelle Fehlermeldungen.

## ACME HTTP-01 Challenge

Support-Engine antwortet automatisch auf ACME-Challenges unter:

```
GET /.well-known/acme-challenge/:token
```

Dieser Endpunkt ist ohne Authentifizierung zugänglich und gibt das Challenge-Token zurück. Stellen Sie sicher, dass Ihr Reverse-Proxy diesen Pfad an die Anwendung weiterleitet.
