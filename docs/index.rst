Support-Engine Dokumentation
=============================

.. image:: https://img.shields.io/badge/version-0.1.5-blue
   :alt: Version 0.1.5

.. image:: https://img.shields.io/badge/license-AGPL--3.0-purple
   :alt: AGPL-3.0 Lizenz

Willkommen zur offiziellen Dokumentation von **Support-Engine** – einer mandantenfähigen Helpdesk- und Ticketverwaltungsplattform für deutschsprachige Unternehmen.

Support-Engine bietet Ticketverwaltung mit SLA-Tracking, CRM, Wissensdatenbank, Zeiterfassung, Asset-Management, Projektmanagement, Genehmigungsworkflows sowie eine vollständige Microsoft Exchange Online Integration – alles in einem modernen, responsiven Interface mit Dark und Light Mode.

.. toctree::
   :maxdepth: 2
   :caption: Erste Schritte

   einfuehrung
   installation
   schnellstart

.. toctree::
   :maxdepth: 2
   :caption: Benutzerhandbuch

   benutzer/tickets
   benutzer/genehmigungen
   benutzer/wissensdatenbank
   benutzer/zeiterfassung
   benutzer/crm
   benutzer/assets
   benutzer/projekte
   benutzer/berichte
   benutzer/portal

.. toctree::
   :maxdepth: 2
   :caption: Administration

   admin/mandanten
   admin/benutzer
   admin/sla
   admin/genehmigungen
   admin/email-integration
   admin/branding
   admin/tls
   admin/logging

.. toctree::
   :maxdepth: 2
   :caption: Entwicklerdokumentation

   entwickler/architektur
   entwickler/entwicklungsumgebung
   entwickler/datenbank
   entwickler/api

.. toctree::
   :maxdepth: 2
   :caption: Datenschutz & Sicherheit

   compliance
   compliance-issues

.. toctree::
   :maxdepth: 1
   :caption: Weitere Informationen

   changelog
   lizenz
   mitwirken


Schnellübersicht
----------------

**Support-Engine** ist eine vollständige SaaS-Helpdesk-Lösung mit folgenden Kernfunktionen:

* **Multi-Tenant** – vollständige Datenisolierung zwischen Mandanten
* **Ticketverwaltung** – Status-Workflow, SLA-Tracking, Kommentare, Anhänge
* **Genehmigungsworkflows** – mehrstufige Freigabeprozesse für Tickets mit Rollen- oder Benutzerzuweisung
* **CRM** – Kunden, Organisationen, Kontakte, Aktivitätsverfolgung
* **Asset-Management** – Hardware, Software, Lizenzen, Verträge
* **Wissensdatenbank** – versionierte Artikel mit Rich-Text-Editor
* **Zeiterfassung** – Timer, manuelle Buchung, abrechenbare Einträge
* **Projektmanagement** – Kanban-Board mit Drag-and-Drop
* **Berichte & Analysen** – Ticket-, SLA- und Zeitauswertung; Export als CSV, XLSX, PDF, HTML
* **Exchange Online** – automatischer E-Mail-Import und Ticketerstellung via Microsoft Graph API
* **Globale Suche** – Tickets, KB-Artikel, Kunden und Kontakte von jeder Seite aus

.. note::
   Die gesamte Benutzeroberfläche ist auf Deutsch. Systemrelevante Datei- und Variablennamen
   folgen englischer Konvention (TypeScript/JavaScript Standard).

Indizes und Tabellen
--------------------

* :ref:`genindex`
* :ref:`search`
