// German translations for the ticket system
export const de = {
  // Common
  common: {
    loading: "Laden...",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    create: "Erstellen",
    search: "Suchen",
    filter: "Filtern",
    actions: "Aktionen",
    back: "Zurück",
    next: "Weiter",
    submit: "Absenden",
    close: "Schließen",
    yes: "Ja",
    no: "Nein",
    all: "Alle",
    none: "Keine",
    select: "Auswählen",
    required: "Erforderlich",
    optional: "Optional",
    noResults: "Keine Ergebnisse gefunden",
    error: "Fehler",
    success: "Erfolgreich",
    warning: "Warnung",
    info: "Information",
  },

  // Auth
  auth: {
    login: "Anmelden",
    logout: "Abmelden",
    register: "Registrieren",
    email: "E-Mail-Adresse",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    firstName: "Vorname",
    lastName: "Nachname",
    forgotPassword: "Passwort vergessen?",
    rememberMe: "Angemeldet bleiben",
    noAccount: "Noch kein Konto?",
    hasAccount: "Bereits ein Konto?",
    loginTitle: "Bei Ihrem Konto anmelden",
    registerTitle: "Neues Konto erstellen",
    loginSuccess: "Erfolgreich angemeldet",
    loginError: "Anmeldung fehlgeschlagen",
    registerSuccess: "Konto erfolgreich erstellt",
    registerError: "Registrierung fehlgeschlagen",
    invalidCredentials: "Ungültige Anmeldedaten",
  },

  // Navigation
  nav: {
    dashboard: "Dashboard",
    tickets: "Tickets",
    myTickets: "Meine Tickets",
    allTickets: "Alle Tickets",
    createTicket: "Ticket erstellen",
    customers: "Kunden",
    users: "Benutzer",
    settings: "Einstellungen",
    profile: "Profil",
    ticketTypes: "Ticket-Typen",
    areas: "Bereiche",
    reports: "Berichte",
    knowledgeBase: "Wissensdatenbank",
    customerPortal: "Kundenportal",
  },

  // Dashboard
  dashboard: {
    title: "Dashboard",
    welcome: "Willkommen zurück",
    openTickets: "Offene Tickets",
    inProgress: "In Bearbeitung",
    resolvedToday: "Heute gelöst",
    averageResponseTime: "Durchschn. Reaktionszeit",
    ticketsByPriority: "Tickets nach Priorität",
    ticketsByStatus: "Tickets nach Status",
    recentTickets: "Aktuelle Tickets",
    myAssignedTickets: "Mir zugewiesene Tickets",
    workloadOverview: "Arbeitsübersicht",
    kpiTitle: "Leistungskennzahlen",
  },

  // Tickets
  tickets: {
    title: "Tickets",
    ticket: "Ticket",
    ticketNumber: "Ticket-Nr.",
    newTicket: "Neues Ticket",
    editTicket: "Ticket bearbeiten",
    ticketDetails: "Ticket-Details",
    ticketTitle: "Titel",
    description: "Beschreibung",
    status: "Status",
    priority: "Priorität",
    type: "Typ",
    area: "Bereich",
    assignees: "Bearbeiter",
    watchers: "Beobachter",
    supporters: "Unterstützer",
    createdBy: "Erstellt von",
    createdAt: "Erstellt am",
    updatedAt: "Aktualisiert am",
    dueDate: "Fälligkeitsdatum",
    resolvedAt: "Gelöst am",
    closedAt: "Geschlossen am",
    comments: "Kommentare",
    attachments: "Anhänge",
    activity: "Aktivität",
    customFields: "Zusätzliche Felder",
    addComment: "Kommentar hinzufügen",
    addNote: "Notiz hinzufügen",
    internalComment: "Interner Kommentar",
    externalComment: "Externer Kommentar",
    uploadFile: "Datei hochladen",
    noTickets: "Keine Tickets vorhanden",
    noComments: "Keine Kommentare vorhanden",
    noAttachments: "Keine Anhänge vorhanden",
    assignTo: "Zuweisen an",
    addWatcher: "Beobachter hinzufügen",
    removeAssignee: "Bearbeiter entfernen",
    removeWatcher: "Beobachter entfernen",
  },

  // Ticket Status
  status: {
    open: "Offen",
    in_progress: "In Bearbeitung",
    waiting: "Wartend",
    resolved: "Gelöst",
    closed: "Geschlossen",
  },

  // Ticket Priority
  priority: {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    urgent: "Dringend",
  },

  // Users
  users: {
    title: "Benutzer",
    user: "Benutzer",
    newUser: "Neuer Benutzer",
    editUser: "Benutzer bearbeiten",
    role: "Rolle",
    admin: "Administrator",
    agent: "Bearbeiter",
    customer: "Kunde",
    active: "Aktiv",
    inactive: "Inaktiv",
    lastLogin: "Letzte Anmeldung",
  },

  // Customer Portal
  portal: {
    title: "Kundenportal",
    welcome: "Willkommen im Kundenportal",
    submitTicket: "Ticket einreichen",
    viewTickets: "Meine Tickets anzeigen",
    trackStatus: "Status verfolgen",
    needHelp: "Benötigen Sie Hilfe?",
    createTicketDescription: "Erstellen Sie ein neues Support-Ticket",
    viewTicketsDescription: "Sehen Sie den Status Ihrer Tickets ein",
  },

  // Settings
  settings: {
    title: "Einstellungen",
    general: "Allgemein",
    appearance: "Erscheinungsbild",
    notifications: "Benachrichtigungen",
    security: "Sicherheit",
    darkMode: "Dunkelmodus",
    language: "Sprache",
    timezone: "Zeitzone",
  },

  // Validation
  validation: {
    required: "Dieses Feld ist erforderlich",
    email: "Ungültige E-Mail-Adresse",
    minLength: "Mindestens {min} Zeichen erforderlich",
    maxLength: "Maximal {max} Zeichen erlaubt",
    passwordMatch: "Passwörter stimmen nicht überein",
  },

  // Time
  time: {
    justNow: "Gerade eben",
    minutesAgo: "vor {count} Minuten",
    hoursAgo: "vor {count} Stunden",
    daysAgo: "vor {count} Tagen",
    today: "Heute",
    yesterday: "Gestern",
    minutes: "Minuten",
    hours: "Stunden",
    days: "Tage",
  },

  // Empty States
  empty: {
    noTickets: "Keine Tickets gefunden",
    noTicketsDescription: "Erstellen Sie Ihr erstes Ticket, um loszulegen.",
    noUsers: "Keine Benutzer gefunden",
    noComments: "Noch keine Kommentare",
    noAttachments: "Keine Anhänge vorhanden",
    noResults: "Keine Ergebnisse",
    noResultsDescription: "Versuchen Sie es mit anderen Suchbegriffen.",
  },
};

export type Translations = typeof de;

export function t(key: string): string {
  const keys = key.split(".");
  let value: unknown = de;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}
