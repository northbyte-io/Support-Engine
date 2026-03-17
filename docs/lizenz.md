# Lizenz

## GNU Affero General Public License v3.0 (AGPL-3.0)

Support-Engine ist unter der **GNU Affero General Public License v3.0 (AGPL-3.0)** veröffentlicht.

## Was bedeutet AGPL-3.0?

Die AGPL-3.0 ist eine Copyleft-Lizenz, die speziell für netzwerkbasierte Software entwickelt wurde.

### Erlaubt

| Nutzung | Bedingung |
|---------|-----------|
| Kommerzielle Nutzung | Quellcode muss verfügbar gemacht werden |
| Modifikation | Änderungen müssen unter derselben Lizenz stehen |
| Weitergabe | Copyright-Hinweis muss erhalten bleiben |
| Private Nutzung | Ohne Einschränkungen |

### Besonderheit: Network Copyleft

Anders als bei der GPL reicht es bei der AGPL-3.0 **nicht aus**, Software nur intern zu betreiben. Wenn Sie Support-Engine als Netzwerkdienst betreiben und Benutzern Zugang gewähren, müssen Sie diesen Benutzern den vollständigen Quellcode der von Ihnen eingesetzten Version (einschließlich aller Änderungen) zugänglich machen.

Diese Anforderung ist direkt in die Anwendung integriert:

| Endpunkt | Beschreibung |
|----------|-------------|
| `/api/license` | Zeigt den vollständigen AGPL-3.0-Lizenztext |
| `/api/source` | Gibt den Link zum Quellcode-Repository zurück |

Beide Endpunkte sind auch in der Benutzeroberfläche verlinkt (Sidebar-Footer).

## Vollständiger Lizenztext

Der vollständige Lizenztext ist in der Datei [`LICENSE`](https://github.com/northbyte-io/Support-Engine/blob/main/LICENSE) im Repository verfügbar.

## Kontakt

Bei Fragen zur Lizenzierung:

- **E-Mail**: info@northbyte.io
- **GitHub**: https://github.com/northbyte-io/Support-Engine
