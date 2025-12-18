import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Ticket, Clock, CheckCircle, AlertCircle, ArrowRight, TrendingUp } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityDot } from "@/components/PriorityBadge";
import { DashboardSkeleton } from "@/components/LoadingState";
import { NoTicketsEmpty } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations, User } from "@shared/schema";

interface DashboardStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
}

interface AgentWorkload {
  user: User;
  ticketCount: number;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { limit: 5 }],
  });

  const { data: workload, isLoading: workloadLoading } = useQuery<AgentWorkload[]>({
    queryKey: ["/api/dashboard/workload"],
  });

  const isLoading = statsLoading || ticketsLoading || workloadLoading;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  if (isLoading) {
    return (
      <MainLayout title="Dashboard">
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  const statCards = [
    {
      title: "Offene Tickets",
      value: stats?.openTickets ?? 0,
      icon: Ticket,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "In Bearbeitung",
      value: stats?.inProgressTickets ?? 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Heute gelöst",
      value: stats?.resolvedToday ?? 0,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Durchschn. Reaktionszeit",
      value: stats?.avgResponseTime ?? "—",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <MainLayout
      title="Dashboard"
      actions={
        <Button onClick={() => setLocation("/tickets/new")} data-testid="button-new-ticket">
          Neues Ticket
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Willkommen zurück,</span>
          <span className="font-medium">{user?.firstName}!</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Aktuelle Tickets</CardTitle>
                <CardDescription>Ihre zuletzt bearbeiteten Tickets</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/tickets")}
                data-testid="link-all-tickets"
              >
                Alle anzeigen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {!recentTickets || recentTickets.length === 0 ? (
                <NoTicketsEmpty onCreateTicket={() => setLocation("/tickets/new")} />
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg border hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/tickets/${ticket.id}`)}
                      data-testid={`ticket-row-${ticket.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PriorityDot priority={ticket.priority || "medium"} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <p className="font-medium truncate">{ticket.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusBadge status={ticket.status || "open"} />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arbeitsübersicht</CardTitle>
              <CardDescription>Tickets pro Bearbeiter</CardDescription>
            </CardHeader>
            <CardContent>
              {!workload || workload.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Keine Daten verfügbar
                </p>
              ) : (
                <div className="space-y-4">
                  {workload.map((item, index) => (
                    <div
                      key={item.user.id}
                      className="flex items-center justify-between gap-3"
                      data-testid={`workload-row-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.user.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(item.user.firstName, item.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {item.user.firstName} {item.user.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.ticketCount}</span>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
