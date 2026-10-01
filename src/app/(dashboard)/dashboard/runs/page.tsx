import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";

export default async function RunsPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Runs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auditorias, planos e relatórios executados pelo AI.
          </p>
        </div>
        <Button size="sm" disabled>
          <Plus className="h-4 w-4" />
          Novo run
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span>Tipo</span>
          <span>ID</span>
          <span>Status</span>
          <span>Data</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Play className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum run ainda.</p>
          <p className="text-xs text-muted-foreground/60">
            Conecte uma conta de anúncios e inicie um run de auditoria.
          </p>
        </div>
      </div>
    </div>
  );
}
