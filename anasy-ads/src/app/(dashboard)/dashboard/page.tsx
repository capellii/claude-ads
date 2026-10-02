import { and, count, eq, gte } from "drizzle-orm";
import { BarChart3, Play, Link2, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { accounts, runs } from "@/lib/db/schema";
import { getCurrentTenant, getTenantKey } from "@/lib/db/tenant";

async function loadCounts(tenantId: string) {
  const db = getDb();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [[runsMonth], [activeAccounts]] = await Promise.all([
    db.select({ n: count() }).from(runs).where(and(eq(runs.tenantId, tenantId), gte(runs.createdAt, monthStart))),
    db.select({ n: count() }).from(accounts).where(and(eq(accounts.tenantId, tenantId), eq(accounts.isActive, true))),
  ]);
  return { runsMonth: runsMonth.n, activeAccounts: activeAccounts.n };
}

export default async function DashboardPage() {
  const [ident, tenant] = await Promise.all([getTenantKey(), getCurrentTenant()]);
  const counts = tenant ? await loadCounts(tenant.id) : { runsMonth: 0, activeAccounts: 0 };
  const isPersonal = !ident?.orgId;

  const stats = [
    { label: "Runs este mês", value: String(counts.runsMonth), icon: Play, description: "auditorias e relatórios" },
    { label: "Contas ativas", value: String(counts.activeAccounts), icon: Link2, description: "plataformas conectadas" },
    { label: "Investimento gerenciado", value: "—", icon: BarChart3, description: "30 dias" },
    { label: "ROAS médio", value: "—", icon: TrendingUp, description: "todas as contas" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central de operações de mídia paga — powered by AI.
        </p>
      </div>

      {isPersonal && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Você está no workspace pessoal</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Contas e runs ficam vinculados só a você. Para trabalhar em equipe, crie uma organização no menu superior.
            </p>
          </div>
        </div>
      )}

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
