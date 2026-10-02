import { auth } from "@clerk/nextjs/server";
import { BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Análises e resumos gerados automaticamente.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Relatórios em breve</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          Esta seção exibirá relatórios gerados pelo AI com base nos dados das suas contas conectadas.
        </p>
      </div>
    </div>
  );
}
