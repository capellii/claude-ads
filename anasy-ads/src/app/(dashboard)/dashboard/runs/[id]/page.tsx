import { getDb } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { getCurrentTenant } from "@/lib/db/tenant";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RunsPoller } from "@/components/runs/runs-poller";

const RUN_TYPE_LABELS: Record<string, string> = {
  setup: "Setup da Conta",
  audit: "Auditoria",
  plan: "Plano de Mídia",
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

type RunMetadata = {
  result?: string;
  model?: string;
  tokens?: { input: number; output: number };
};

function fmt(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const [run] = await getDb()
    .select()
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.tenantId, tenant.id)));

  if (!run) notFound();

  const isActive = run.status === "queued" || run.status === "running";
  const metadata = run.metadata as RunMetadata | null;
  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.queued;
  const { Icon } = cfg;

  const metaTiles = [
    { label: "ID",        value: run.id.slice(0, 20) + "…" },
    { label: "Criado",    value: fmt(run.createdAt) },
    run.startedAt   ? { label: "Iniciado",   value: fmt(run.startedAt) }   : null,
    run.completedAt ? { label: "Concluído",  value: fmt(run.completedAt) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-6">
      <RunsPoller active={isActive} />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/runs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Runs
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">
          {RUN_TYPE_LABELS[run.type] ?? run.type}
        </h1>
        <Badge variant={cfg.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {cfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metaTiles.map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-mono mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {metadata?.tokens && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Tokens entrada", value: metadata.tokens.input.toLocaleString("pt-BR") },
            { label: "Tokens saída",   value: metadata.tokens.output.toLocaleString("pt-BR") },
            { label: "Modelo",         value: metadata.model ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-mono mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Resultado</h2>
        </div>
        <div className="px-4 py-4 min-h-[120px]">
          {run.status === "queued" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-pulse shrink-0" />
              Run na fila, aguardando processamento…
            </p>
          )}
          {run.status === "running" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              AI processando, isso pode levar alguns instantes…
            </p>
          )}
          {run.status === "failed" && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Erro ao processar run</p>
              {run.errorMessage && (
                <p className="mt-1 font-mono text-xs text-destructive/80">{run.errorMessage}</p>
              )}
            </div>
          )}
          {metadata?.result && (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {metadata.result}
            </pre>
          )}
          {run.status === "completed" && !metadata?.result && (
            <p className="text-sm text-muted-foreground">Sem resultado registrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}
