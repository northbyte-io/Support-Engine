/**
 * Setup Step 2: Firmendaten
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const companyDataSchema = z.object({
  name:    z.string().min(1, "Firmenname ist erforderlich"),
  domain:  z.string().min(1, "Domain ist erforderlich").regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche"),
  address: z.string().optional(),
  phone:   z.string().optional(),
  logo:    z.string().optional(), // data URL
});

export type CompanyData = z.infer<typeof companyDataSchema>;

interface CompanyDataFormProps {
  defaultValues?: Partial<CompanyData>;
  onChange: (data: Partial<CompanyData>, isValid: boolean) => void;
}

export function CompanyDataForm({ defaultValues, onChange }: Readonly<CompanyDataFormProps>) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<CompanyData>({
    resolver: zodResolver(companyDataSchema),
    defaultValues: defaultValues ?? {},
    mode: "onChange",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setValue("logo", dataUrl);
      const current = watch();
      trigger().then(valid => onChange({ ...current, logo: dataUrl }, valid));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue("logo", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = async () => {
    const current = watch();
    const valid = await trigger();
    onChange(current, valid);
  };

  return (
    <div className="space-y-4" onChange={handleChange}>
      {/* Firmenname */}
      <div className="space-y-1.5">
        <Label htmlFor="company-name">
          Firmenname <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company-name"
          {...register("name")}
          placeholder="Acme GmbH"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-2xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Domain */}
      <div className="space-y-1.5">
        <Label htmlFor="company-domain">
          Domain <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id="company-domain"
            {...register("domain")}
            placeholder="acme"
            className={cn("flex-1", errors.domain ? "border-destructive" : "")}
          />
          <span className="text-ui-xs text-muted-foreground">.support-engine.de</span>
        </div>
        {errors.domain && <p className="text-2xs text-destructive">{errors.domain.message}</p>}
      </div>

      {/* Adresse */}
      <div className="space-y-1.5">
        <Label htmlFor="company-address">Adresse</Label>
        <Textarea
          id="company-address"
          {...register("address")}
          placeholder="Straße Nr., PLZ Stadt"
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Telefonnummer */}
      <div className="space-y-1.5">
        <Label htmlFor="company-phone">Telefonnummer</Label>
        <Input
          id="company-phone"
          {...register("phone")}
          type="tel"
          placeholder="+49 89 12345678"
        />
      </div>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label>Logo</Label>
        {logoPreview ? (
          <div className="flex items-center gap-3">
            <img src={logoPreview} alt="Logo-Vorschau" className="h-12 w-auto max-w-[120px] object-contain rounded border border-border" />
            <button
              type="button"
              onClick={removeLogo}
              className="text-2xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Entfernen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-border text-ui-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="w-4 h-4" />
            Logo hochladen (PNG, SVG)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={handleLogoChange}
          aria-label="Logo hochladen"
        />
      </div>
    </div>
  );
}
