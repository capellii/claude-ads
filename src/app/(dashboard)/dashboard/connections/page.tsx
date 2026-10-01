import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, CheckCircle2, Clock } from "lucide-react";

const platforms = [
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Campanhas de pesquisa, display, YouTube e Shopping.",
    available: true,
    color: "#4285F4",
  },
  {
    id: "meta",
    name: "Meta Ads",
    description: "Facebook, Instagram e Audience Network.",
    available: true,
    color: "#1877F2",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    description: "Campanhas B2B com segmentação profissional.",
    available: false,
    color: "#0A66C2",
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    description: "Vídeos curtos e alcance jovem.",
    available: false,
    color: "#010101",
  },
  {
    id: "microsoft",
    name: "Microsoft Ads",
    description: "Bing Search e Audience Network.",
    available: false,
    color: "#00A4EF",
  },
  {
    id: "youtube",
    name: "YouTube Ads",
    description: "Vídeo, bumper e masthead (via Google Ads).",
    available: false,
    color: "#FF0000",
  },
];

export default async function ConnectionsPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte suas contas de anúncios via OAuth para permitir que a IA leia e analise seus dados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="flex flex-col rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                style={{ background: platform.color }}
              >
                {platform.name[0]}
              </div>
              {platform.available ? (
                <Badge variant="success" className="text-[10px]">Disponível</Badge>
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
                <Button size="sm" className="w-full" asChild>
                  <a href={`/api/oauth/initiate?platform=${platform.id}`}>
                    <Link2 className="h-3.5 w-3.5" />
                    Conectar
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
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground font-medium">Segurança por design</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground ml-6">
          Tokens OAuth são armazenados em cofre seguro (AWS Secrets Manager) — nunca no banco de dados.
          O acesso é somente leitura por padrão; mutações requerem aprovação explícita.
        </p>
      </div>
    </div>
  );
}
