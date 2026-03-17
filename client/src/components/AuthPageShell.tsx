import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Props extends Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}> {}

export function AuthPageShell({ title, description, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="absolute top-0 right-0 p-4">
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
              <CardDescription className="mt-2">{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
