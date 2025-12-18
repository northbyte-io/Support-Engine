import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Users, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NotificationWithRelations } from "@shared/schema";

function getNotificationIcon(type: string) {
  switch (type) {
    case "mention":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "assignment":
      return <Users className="h-4 w-4 text-green-500" />;
    case "comment":
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    case "status_change":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "sla_warning":
      return <Clock className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function NotificationDropdown() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<NotificationWithRelations[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Benachrichtigung konnte nicht als gelesen markiert werden",
        variant: "destructive",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/read-all");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Erledigt",
        description: "Alle Benachrichtigungen als gelesen markiert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Benachrichtigungen konnten nicht als gelesen markiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Benachrichtigung konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const hasUnread = unreadCount.count > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount.count > 99 ? "99+" : unreadCount.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Benachrichtigungen</h4>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Alle gelesen
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover-elevate ${!notification.isRead ? "bg-accent/30" : ""}`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight" data-testid={`notification-title-${notification.id}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2" data-testid={`notification-message-${notification.id}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true, locale: de })}
                        </span>
                        {notification.ticket && (
                          <Badge variant="outline" className="text-xs">
                            #{notification.ticket.ticketNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          disabled={markReadMutation.isPending}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => deleteMutation.mutate(notification.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-notification-${notification.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
