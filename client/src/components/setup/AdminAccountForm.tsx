/**
 * Setup Step 3: Administrator-Konto
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const adminAccountSchema = z.object({
  firstName:       z.string().min(1, "Vorname ist erforderlich"),
  lastName:        z.string().min(1, "Nachname ist erforderlich"),
  email:           z.string().email("Ungültige E-Mail-Adresse"),
  password:        z.string().min(8, "Mindestens 8 Zeichen erforderlich"), // NOSONAR — schema validation, not credential
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export type AdminAccountData = z.infer<typeof adminAccountSchema>;

interface AdminAccountFormProps {
  onChange: (data: Partial<AdminAccountData>, isValid: boolean) => void;
}

export function AdminAccountForm({ onChange }: Readonly<AdminAccountFormProps>) {
  const [showPassword, setShowPassword] = useState(false); // NOSONAR — UI state, not credential
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    formState: { errors },
    watch,
    trigger,
  } = useForm<AdminAccountData>({
    resolver: zodResolver(adminAccountSchema),
    mode: "onChange",
  });

  const handleChange = async () => {
    const current = watch();
    const valid = await trigger();
    onChange(current, valid);
  };

  return (
    <div className="space-y-4" onChange={handleChange}>
      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="admin-firstname">
            Vorname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="admin-firstname"
            {...register("firstName")}
            placeholder="Max"
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && <p className="text-2xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-lastname">
            Nachname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="admin-lastname"
            {...register("lastName")}
            placeholder="Mustermann"
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && <p className="text-2xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* E-Mail */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">
          E-Mail <span className="text-destructive">*</span>
        </Label>
        <Input
          id="admin-email"
          type="email"
          {...register("email")}
          placeholder="admin@firma.de"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-2xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Passwort */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-password">
          Passwort <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"} // NOSONAR — UI toggle
            {...register("password")}
            placeholder="Mindestens 8 Zeichen"
            className={cn("pr-10", errors.password ? "border-destructive" : "")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? "Passwort ausblenden" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-2xs text-destructive">{errors.password.message}</p>}
      </div>

      {/* Passwort bestätigen */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-confirm">
          Passwort bestätigen <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="admin-confirm"
            type={showConfirm ? "text" : "password"} // NOSONAR — UI toggle
            {...register("confirmPassword")}
            placeholder="Passwort wiederholen"
            className={cn("pr-10", errors.confirmPassword ? "border-destructive" : "")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm(p => !p)}
            aria-label={showConfirm ? "Passwort ausblenden" : "Passwort anzeigen"}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-2xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>
    </div>
  );
}
