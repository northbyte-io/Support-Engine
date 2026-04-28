/**
 * /setup — Initial setup page
 *
 * Only accessible when no tenant has been configured yet.
 * Renders full-screen without sidebar or auth wrapper.
 * On completion, redirects to /login.
 */

import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { SetupWizard } from "@/components/SetupWizard";

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/setup/status"] });
    setLocation("/login");
  };

  return <SetupWizard onComplete={handleComplete} />;
}
