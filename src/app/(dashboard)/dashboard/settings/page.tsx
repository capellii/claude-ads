import { auth } from "@clerk/nextjs/server";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie preferências da organização e do plano.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Settings className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Configurações em breve</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          Aqui você poderá configurar notificações, plano de assinatura, membros da equipe e preferências gerais.
        </p>
      </div>
    </div>
  );
}
