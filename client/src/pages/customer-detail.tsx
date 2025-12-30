import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Ticket, User, Clock, Plus, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingPage } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { CustomerWithRelations, Ticket as TicketType } from "@shared/schema";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0).toUpperCase() || "";
  const last = lastName?.charAt(0).toUpperCase() || "";
  return first + last || "?";
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return format(new Date(date), "dd.MM.yyyy", { locale: de });
}

function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
}

const roleConfig: Record<string, { label: string; color: string }> = {
  primary: { label: "Hauptkontakt", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  secondary: { label: "Nebenkontakt", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
  technical: { label: "Technisch", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  billing: { label: "Buchhaltung", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  decision_maker: { label: "Entscheider", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: customer, isLoading } = useQuery<CustomerWithRelations>({
    queryKey: ["/api/customers", params.id],
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!customer) {
    return (
      <MainLayout title="Kunde nicht gefunden">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Kunde wurde nicht gefunden.</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/customers")}>
            Zur Kundenliste
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={customer.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/customers")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">{customer.name}</h1>
              <Badge variant="outline">{customer.customerNumber}</Badge>
              {customer.priority && (
                <Badge className={
                  customer.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                  customer.priority === "low" ? "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                }>
                  {customer.priority === "high" ? "Hoch" : customer.priority === "low" ? "Niedrig" : "Normal"}
                </Badge>
              )}
              {!customer.isActive && (
                <Badge variant="secondary">Inaktiv</Badge>
              )}
            </div>
            {customer.organization && (
              <p className="text-sm text-muted-foreground mt-1">
                {customer.organization.name}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="tickets">
              <TabsList>
                <TabsTrigger value="tickets" data-testid="tab-tickets">
                  <Ticket className="w-4 h-4 mr-2" />
                  Tickets ({customer.tickets?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">
                  <Clock className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tickets" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-lg">Tickets</CardTitle>
                    <Button size="sm" onClick={() => setLocation("/tickets")} data-testid="button-new-ticket">
                      <Plus className="w-4 h-4 mr-2" />
                      Neues Ticket
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!customer.tickets || customer.tickets.length === 0 ? (
                      <div className="text-center py-8">
                        <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Keine Tickets vorhanden</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customer.tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="p-4 rounded-lg border hover-elevate cursor-pointer"
                            onClick={() => setLocation(`/tickets/${ticket.id}`)}
                            data-testid={`ticket-row-${ticket.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.ticketNumber}
                                  </Badge>
                                  <StatusBadge status={ticket.status || "open"} />
                                  <PriorityBadge priority={ticket.priority || "medium"} />
                                </div>
                                <p className="font-medium mt-2 line-clamp-1">{ticket.description?.substring(0, 100) || "Keine Beschreibung"}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatRelativeDate(ticket.createdAt)}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aktivitaten-Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!customer.activities || customer.activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Keine Aktivitaten vorhanden</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                        <div className="space-y-6">
                          {customer.activities.map((activity) => (
                            <div key={activity.id} className="relative pl-10">
                              <div className="absolute left-2 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                              <div className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">
                                    {activity.activityType === "ticket_created" && "Ticket erstellt"}
                                    {activity.activityType === "ticket_resolved" && "Ticket gelost"}
                                    {activity.activityType === "ticket_closed" && "Ticket geschlossen"}
                                    {activity.activityType === "comment_added" && "Kommentar hinzugefugt"}
                                    {activity.activityType === "email_sent" && "E-Mail gesendet"}
                                    {activity.activityType === "email_received" && "E-Mail empfangen"}
                                    {activity.activityType === "call_logged" && "Anruf protokolliert"}
                                    {activity.activityType === "meeting_scheduled" && "Besprechung geplant"}
                                    {activity.activityType === "note_added" && "Notiz hinzugefugt"}
                                    {activity.activityType === "contract_signed" && "Vertrag unterzeichnet"}
                                    {activity.activityType === "invoice_sent" && "Rechnung gesendet"}
                                    {!["ticket_created", "ticket_resolved", "ticket_closed", "comment_added", "email_sent", "email_received", "call_logged", "meeting_scheduled", "note_added", "contract_signed", "invoice_sent"].includes(activity.activityType || "") && (activity.activityType || "Aktivitat")}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatRelativeDate(activity.createdAt)}
                                  </span>
                                </div>
                                {activity.description && (
                                  <p className="text-sm mt-1">{activity.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.organization && (
                  <div>
                    <p className="text-xs text-muted-foreground">Organisation</p>
                    <p className="text-sm font-medium">{customer.organization.name}</p>
                  </div>
                )}

                {customer.accountManager && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kundenbetreuer</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(customer.accountManager.firstName, customer.accountManager.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {customer.accountManager.firstName} {customer.accountManager.lastName}
                      </span>
                    </div>
                  </div>
                )}

                {customer.slaDefinition && (
                  <div>
                    <p className="text-xs text-muted-foreground">SLA</p>
                    <p className="text-sm">{customer.slaDefinition.name}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Erstellt am
                  </p>
                  <p className="text-sm">{formatDate(customer.createdAt)}</p>
                </div>

                {customer.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notizen</p>
                    <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Kontakte
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!customer.contacts || customer.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Kontakte
                  </p>
                ) : (
                  <div className="space-y-4">
                    {customer.contacts.map((contact) => (
                      <div key={contact.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">
                            {contact.salutation && `${contact.salutation} `}
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.role && (
                            <Badge className={`text-xs ${roleConfig[contact.role]?.color}`}>
                              {roleConfig[contact.role]?.label}
                            </Badge>
                          )}
                        </div>
                        {contact.title && (
                          <p className="text-xs text-muted-foreground">{contact.title}</p>
                        )}
                        <div className="space-y-1">
                          {contact.email && (
                            <a 
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 text-xs hover:underline"
                            >
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a 
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-2 text-xs hover:underline"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {contact.phone}
                            </a>
                          )}
                          {contact.mobile && (
                            <a 
                              href={`tel:${contact.mobile}`}
                              className="flex items-center gap-2 text-xs hover:underline"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {contact.mobile}
                            </a>
                          )}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {customer.locations && customer.locations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Standorte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customer.locations.map((location) => (
                      <div key={location.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{location.name}</span>
                          {location.isPrimary && (
                            <Badge variant="secondary" className="text-xs">Hauptstandort</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[location.address, location.postalCode, location.city, location.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
