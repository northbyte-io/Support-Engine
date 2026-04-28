/**
 * Dashboard — Morning Briefing
 *
 * Four-section layout showing what needs attention right now.
 * No charts — data-dense action lists only (Precision Dark aesthetic).
 *
 * Sections:
 *   1. SLA-Warnungen (tickets about to breach)
 *   2. Neue Kommentare von Endnutzern (unread customer replies)
 *   3. Meine offenen Tickets (agent's workload)
 *   4. Heute erfasste Zeit (today's time summary)
 */

import { useAuth } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { SlaWarnings } from "@/components/dashboard/SlaWarnings";
import { NewCustomerComments } from "@/components/dashboard/NewCustomerComments";
import { MyOpenTickets } from "@/components/dashboard/MyOpenTickets";
import { TimeSummaryCard } from "@/components/dashboard/TimeSummaryCard";

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Guten Morgen, ${firstName}`;
  if (hour < 18) return `Guten Tag, ${firstName}`;
  return `Guten Abend, ${firstName}`;
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-ui-2xl font-semibold text-foreground">
            {user?.firstName ? getGreeting(user.firstName) : "Dashboard"}
          </h1>
          <p className="text-ui-sm text-muted-foreground mt-0.5">
            Hier ist Ihre Übersicht für heute.
          </p>
        </div>

        {/* SLA Warnings — highest priority */}
        <SlaWarnings />

        {/* New customer replies */}
        <NewCustomerComments />

        {/* My open tickets */}
        <MyOpenTickets />

        {/* Time summary */}
        <TimeSummaryCard />
      </div>
    </MainLayout>
  );
}
