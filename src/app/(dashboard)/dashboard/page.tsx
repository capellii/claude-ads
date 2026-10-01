import { auth } from "@clerk/nextjs/server";
import { BarChart3, Play, Link2, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Runs este mês", value: "—", icon: Play, description: "auditorias e relatórios" },
  { label: "Contas ativas", value: "—", icon: Link2, description: "plataformas conectadas" },
  { label: "Investimento gerenciado", value: "—", icon: BarChart3, description: "30 dias" },
  { label: "ROAS médio", value: "—", icon: TrendingUp, description: "todas as contas" },
];

export default async function DashboardPage() {
  const { orgId } = await auth();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central de operações de mídia paga — powered by AI.
        </p>
      </div>

      {/* Org warning */}
      {!orgId && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Nenhuma organização selecionada
            </p>
            <p className="mt-0.5 text-xs text-amber-600/70 dark:text-amber-400/70">
              Crie ou selecione uma organização no menu superior para começar a gerenciar contas.
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <div className="rounded-md bg-primary/10 p-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      {/* Connect CTA */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-foreground">Primeiros passos</h2>
              <Badge variant="outline" className="text-[10px]">MVP</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Conecte suas contas de anúncios via OAuth para começar a executar auditorias, planos e relatórios com IA.
            </p>
          </div>
          <Button size="sm" asChild>
            <a href="/dashboard/connections">
              <Link2 className="h-3.5 w-3.5" />
              Conectar conta
            </a>
          </Button>
        </div>

        {/* Platform chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {["Google Ads", "Meta Ads", "LinkedIn", "TikTok", "YouTube", "Microsoft"].map((p, i) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"
              style={{ opacity: i < 2 ? 1 : 0.45 }}
            >
              {p}
              {i < 2 && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          Google Ads e Meta disponíveis agora · demais plataformas em breve
        </p>
      </div>
    </div>
  );
}
