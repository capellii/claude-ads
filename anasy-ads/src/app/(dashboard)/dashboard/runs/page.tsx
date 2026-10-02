import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { runs, accounts, tenants } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { NewRunButton } from "@/components/runs/new-run-button";
import { RunsPoller } from "@/components/runs/runs-poller";
import Link from "next/link";

const RUN_TYPE_LABELS: Record<string, string> = {
  setup: "Setup",
  audit: "Auditoria",
  plan: "Plano",
  create: "Criação",
  monitor: "Monitor",
  optimize: "Otimização",
  experiment: "Experimento",
  report: "Relatório",
};

const STATUS_CONFIG = {
  queued:    { label: "Na fila",     variant: "outline"     as const, Icon: Clock },
  running:   { label: "Executando",  variant: "secondary"   as const, Icon: Loader2 },
  completed: { label: "Concluído",   variant: "success"     as const, Icon: CheckCircle2 },
  failed:    { label: "Erro",        variant: "destructive" as const, Icon: XCircle },
  partial:   { label: "Parcial",     variant: "warning"     as const, Icon: AlertCircle },
};

export default async function RunsPage() {
  const { orgId } = await auth();

  let runList: (typeof runs.$inferSelect)[] = [];
  let connectedAccounts: {
    id: string;
    platform: string;
    accountName: string | null;
    platformAccountId: string;
  }[] = [];

  if (orgId) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, orgId),
    });
    if (tenant) {
      [runList, connectedAccounts] = await Promise.all([
        db
          .select()
          .from(runs)
          .where(eq(runs.tenantId, tenant.id))
          .orderBy(desc(runs.createdAt))
          .limit(50),
        db
          .select({
            id: accounts.id,
            platform: accounts.platform,
            accountName: accounts.accountName,
            platformAccountId: accounts.platformAccountId,
          })
          .from(accounts)
          .where(and(eq(accounts.tenantId, tenant.id), eq(accounts.isActive, true))),
      ]);
    }
  }

  const hasActiveRuns = runList.some(
    (r) => r.status === "queued" || r.status === "running"
  );

  return (
    <div className="space-y-6">
      <RunsPoller active={hasActiveRuns} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Runs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auditorias, planos e relatórios executados pelo AI.
          </p>
        </div>
        <NewRunButton accounts={connectedAccounts} />
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {runList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Play className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum run ainda.</p>
            <p className="text-xs text-muted-foreground/60">
              Conecte uma conta de anúncios e inicie um run de auditoria.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">ID</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Data</th>
                <th className="px-4 py-2.5 text-right font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runList.map((run) => {
                const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.queued;
                const { Icon } = cfg;
                const date = new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(run.createdAt));
                return (
                  <tr
                    key={run.id}
                    className="relative hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/dashboard/runs/${run.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {RUN_TYPE_LABELS[run.type] ?? run.type}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {run.id.slice(0, 12)}…
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant} className="gap-1 text-[10px]">
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{date}</td>
                    <td className="px-4 py-3 text-right">
                      {run.status === "completed" && (
                        <span className="relative z-10 text-xs text-primary underline-offset-2 hover:underline">
                          Ver →
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
