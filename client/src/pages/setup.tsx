/**
 * /setup — Initial setup page
 *
 * Only accessible when no tenant has been configured yet.
 * Renders full-screen without sidebar or auth wrapper.
 * On completion, redirects to /login.
 */

import { useLocation } from "wouter";
import { SetupWizard } from "@/components/SetupWizard";

export default function SetupPage() {
  const [, setLocation] = useLocation();

  const handleComplete = () => {
    setLocation("/login");
  };

  return <SetupWizard onComplete={handleComplete} />;
}
