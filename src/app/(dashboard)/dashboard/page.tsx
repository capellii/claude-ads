import { auth } from "@clerk/nextjs/server";
import { BarChart3, Play, Link2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Runs this month", value: "—", icon: Play, trend: null },
  { label: "Active accounts", value: "—", icon: Link2, trend: null },
  { label: "Spend managed", value: "—", icon: BarChart3, trend: null },
  { label: "Avg. ROAS", value: "—", icon: TrendingUp, trend: null },
];

export default async function DashboardPage() {
  const { orgId } = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Bem-vindo ao Anasy Ads — sua central de operações de mídia paga.
        </p>
      </div>

      {!orgId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
          Crie ou selecione uma organização para começar a gerenciar suas contas de anúncios.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Últimos runs</h2>
          <Badge variant="outline">Em breve</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Conecte suas contas de anúncios para começar a executar auditorias e relatórios.
        </p>
      </div>
    </div>
  );
}
