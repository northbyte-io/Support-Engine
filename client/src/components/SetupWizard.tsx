/**
 * SetupWizard
 *
 * Three-step initial setup shell:
 *   Step 1 — Modus wählen (ModeSelector)
 *   Step 2 — Firmendaten (CompanyDataForm)
 *   Step 3 — Administratorkonto (AdminAccountForm)
 *
 * Full-screen centered card, no sidebar, no app chrome.
 */

import { useState } from "react";
import { Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModeSelector } from "@/components/setup/ModeSelector";
import { CompanyDataForm } from "@/components/setup/CompanyDataForm";
import { AdminAccountForm } from "@/components/setup/AdminAccountForm";
import type { TenantMode } from "@/lib/mode";
import type { CompanyData } from "@/components/setup/CompanyDataForm";
import type { AdminAccountData } from "@/components/setup/AdminAccountForm";

const STEPS = [
  { number: 1, label: "Modus" },
  { number: 2, label: "Firma" },
  { number: 3, label: "Administrator" },
];

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: Readonly<StepIndicatorProps>) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isDone    = currentStep > step.number;
        const isActive  = currentStep === step.number;
        const isLast    = idx === STEPS.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  isDone   && "bg-[hsl(var(--color-success))] text-white",
                  isActive && "bg-primary text-primary-foreground",
                  !isDone && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                className={cn(
                  "h-px w-16 mx-2 mb-5 transition-colors",
                  currentStep > step.number ? "bg-[hsl(var(--color-success))]" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SetupPayload {
  mode:    TenantMode;
  company: Omit<CompanyData, "logo"> & { logo?: string };
  admin:   Omit<AdminAccountData, "confirmPassword">;
}

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: Readonly<SetupWizardProps>) {
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [selectedMode, setSelectedMode] = useState<TenantMode | null>(null);

  // Step 2 state
  const [companyData, setCompanyData]     = useState<Partial<CompanyData>>({});
  const [companyValid, setCompanyValid]   = useState(false);

  // Step 3 state
  const [adminData, setAdminData]         = useState<Partial<AdminAccountData>>({});
  const [adminValid, setAdminValid]       = useState(false);

  const canAdvance = () => {
    if (currentStep === 1) return selectedMode !== null;
    if (currentStep === 2) return companyValid;
    if (currentStep === 3) return adminValid;
    return false;
  };

  const submitMutation = useMutation({
    mutationFn: async (payload: SetupPayload) => {
      const res = await apiRequest("POST", "/api/setup", payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Setup fehlgeschlagen");
      }
    },
    onSuccess: () => {
      toast({ title: "Einrichtung abgeschlossen" });
      onComplete();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(s => s + 1);
    } else {
      // Submit
      const { confirmPassword: _cp, ...adminFields } = adminData as AdminAccountData;
      submitMutation.mutate({
        mode:    selectedMode!,
        company: companyData as CompanyData,
        admin:   adminFields,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const stepTitle = [
    "Betriebsmodus wählen",
    "Firmendaten eingeben",
    "Administratorkonto anlegen",
  ][currentStep - 1];

  const stepSubtitle = [
    "Wie wird Support-Engine in Ihrer Organisation eingesetzt?",
    "Diese Angaben erscheinen in Ihrem Helpdesk und auf Berichten.",
    "Dieser Account erhält vollen Administratorzugriff.",
  ][currentStep - 1];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-xl mb-4">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Support-Engine einrichten</h1>
          <p className="text-sm text-muted-foreground mt-1">Initiale Konfiguration — dauert ca. 2 Minuten</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <StepIndicator currentStep={currentStep} />

          {/* Step heading */}
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">{stepTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{stepSubtitle}</p>
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <ModeSelector
              value={selectedMode}
              onChange={setSelectedMode}
            />
          )}

          {currentStep === 2 && (
            <CompanyDataForm
              defaultValues={companyData}
              onChange={(data, valid) => {
                setCompanyData(data);
                setCompanyValid(valid);
              }}
            />
          )}

          {currentStep === 3 && (
            <AdminAccountForm
              onChange={(data, valid) => {
                setAdminData(data);
                setAdminValid(valid);
              }}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-muted-foreground"
            >
              Zurück
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canAdvance() || submitMutation.isPending}
            >
              {currentStep === 3
                ? (submitMutation.isPending ? "Einrichten…" : "Einrichten")
                : "Weiter"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Support-Engine · AGPL-3.0
        </p>
      </div>
    </div>
  );
}
