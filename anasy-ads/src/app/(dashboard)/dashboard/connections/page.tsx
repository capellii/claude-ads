import { getDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getCurrentTenant } from "@/lib/db/tenant";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, CheckCircle2, Clock, Unlink, AlertTriangle } from "lucide-react";
import { disconnectAccount } from "@/app/actions/accounts";

const PLATFORMS = [
  { id: "google_ads", name: "Google Ads", description: "Campanhas de pesquisa, display, YouTube e Shopping.", available: true, color: "#4285F4" },
  { id: "meta", name: "Meta Ads", description: "Facebook, Instagram e Audience Network.", available: true, color: "#1877F2" },
  { id: "linkedin", name: "LinkedIn Ads", description: "Campanhas B2B com segmentação profissional.", available: false, color: "#0A66C2" },
  { id: "tiktok", name: "TikTok Ads", description: "Vídeos curtos e alcance jovem.", available: false, color: "#010101" },
  { id: "microsoft", name: "Microsoft Ads", description: "Bing Search e Audience Network.", available: false, color: "#00A4EF" },
  { id: "youtube", name: "YouTube Ads", description: "Vídeo, bumper e masthead (via Google Ads).", available: false, color: "#FF0000" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Esta integração ainda não foi configurada no servidor (credenciais OAuth ausentes).",
  access_denied: "A autorização foi cancelada na tela do provedor.",
  invalid_state: "A sessão de autorização expirou ou é inválida. Tente conectar novamente.",
  missing_params: "O provedor não retornou o código de autorização. Tente novamente.",
  exchange_failed: "Não foi possível concluir a conexão com o provedor. Tente novamente em instantes.",
  invalid_platform: "Plataforma inválida.",
};

function platformName(id: string | undefined) {
  return PLATFORMS.find((p) => p.id === id)?.name ?? "a plataforma";
}

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; platform?: string }>;
}) {
  const { success, error, platform: errorPlatform } = await searchParams;
  const tenant = await getCurrentTenant();

  let connectedAccounts: (typeof accounts.$inferSelect)[] = [];
  if (tenant) {
    connectedAccounts = await getDb()
      .select()
      .from(accounts)
      .where(and(eq(accounts.tenantId, tenant.id), eq(accounts.isActive, true)));
  }

  const connectedIds = new Set(connectedAccounts.map((a) => a.platform as PlatformId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte suas contas de anúncios via OAuth para permitir que a IA leia e analise seus dados.
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {platformName(success)} conectado com sucesso.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Falha ao conectar {platformName(errorPlatform)}
            </p>
            <p className="mt-0.5 text-xs text-destructive/80">
              {ERROR_MESSAGES[error] ?? "Ocorreu um erro inesperado durante a autorização."}
            </p>
          </div>
        </div>
      )}

      {connectedAccounts.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Contas Conectadas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connectedAccounts.length} conta{connectedAccounts.length > 1 ? "s" : ""} ativa{connectedAccounts.length > 1 ? "s" : ""}
            </p>
          </div>
          <ul className="divide-y">
            {connectedAccounts.map((account) => {
              const plat = PLATFORMS.find((p) => p.id === account.platform);
              const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                new Date(account.connectedAt)
              );
              return (
                <li key={account.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ background: plat?.color ?? "#6b7280" }}
                  >
                    {plat?.name[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {account.accountName ?? account.platformAccountId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plat?.name} · {date}
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px] shrink-0">Ativo</Badge>
                  <form action={disconnectAccount.bind(null, account.id)}>
                    <button
                      type="submit"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Desconectar conta"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedIds.has(platform.id);
          return (
            <div key={platform.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ background: platform.color }}
                >
                  {platform.name[0]}
                </div>
                {isConnected ? (
                  <Badge variant="success" className="text-[10px]">Conectado</Badge>
                ) : platform.available ? (
                  <Badge variant="secondary" className="text-[10px]">Disponível</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    <Clock className="mr-1 h-2.5 w-2.5" />
                    Em breve
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex-1">
                <h3 className="text-sm font-semibold">{platform.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{platform.description}</p>
              </div>
              <div className="mt-4">
                {platform.available ? (
                  <Button
                    size="sm"
                    className="w-full"
                    variant={isConnected ? "outline" : "default"}
                    asChild
                  >
                    <a href={`/api/oauth/initiate?platform=${platform.id}`}>
                      <Link2 className="h-3.5 w-3.5" />
                      {isConnected ? "Reconectar" : "Conectar"}
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    <Clock className="h-3.5 w-3.5" />
                    Em breve
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground font-medium">Segurança por design</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground ml-6">
          Tokens OAuth são armazenados em cofre seguro (Redis Vault) — nunca no banco de dados.
          O acesso é somente leitura por padrão; mutações requerem aprovação explícita.
        </p>
      </div>
    </div>
  );
}
