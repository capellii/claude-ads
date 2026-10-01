# Anasy Ads

Plataforma SaaS de operações de mídia paga com IA, construída sobre o skill **Claude Ads**. Conecta contas de anúncios via OAuth, executa auditorias e relatórios com Claude, e entrega resultados via chat ou formulários estruturados que disparam workflows.

---

## Arquitetura

```
src/
├── app/
│   ├── (auth)/            # Login, Signup — Clerk
│   ├── (dashboard)/       # Layout protegido: sidebar + header
│   │   └── dashboard/
│   │       ├── page.tsx          # Overview
│   │       ├── chat/             # Chat AI (SSE)
│   │       ├── connections/      # Contas OAuth conectadas
│   │       ├── runs/             # Runs de auditoria
│   │       ├── reports/          # Relatórios gerados
│   │       └── settings/         # Configurações do tenant
│   └── api/
│       ├── chat/          # POST — streaming Anthropic SDK
│       ├── oauth/         # initiate + callbacks Google Ads, Meta
│       └── trpc/          # [Etapa 3] tRPC handler
├── components/
│   ├── chat/              # ChatInterface (SSE reader)
│   ├── dashboard/         # Sidebar, Header
│   └── ui/                # Button, Badge, Avatar, DropdownMenu (Radix)
└── lib/
    ├── ai/                # anthropic client, skill-loader
    ├── db/                # Drizzle + Neon; schemas: tenants, accounts, runs, messages, mutations
    ├── oauth/             # adapters Google Ads, Meta; state CSRF
    ├── queue/             # BullMQ + ioredis (Upstash)
    ├── trpc/              # [Etapa 3] router, context, procedures
    └── vault/             # storeSecret / getSecret → Redis (secretRef no DB)
```

**Stack principal:** Next.js 15 (App Router) · Clerk · Drizzle ORM · Neon PostgreSQL · BullMQ · Upstash Redis · Anthropic SDK · Tailwind v4 · Radix UI

---

## Roadmap de Etapas

### Etapa 1 — OAuth Callbacks ✅
Conexão segura com plataformas de anúncios via OAuth 2.0.

- Fluxo `initiate` → cookie CSRF assinado HttpOnly → redirect OAuth
- Callback Google Ads: troca de código, vault (Redis), `secretRef` no DB
- Callback Meta: idem para Facebook Graph API
- Tokens **nunca** armazenados no banco — apenas a referência (`secretRef`)

### Etapa 2 — Chat AI Streaming ✅
Interface conversacional com o skill Claude Ads via Server-Sent Events.

- `POST /api/chat` com `anthropic.messages.stream()` e prompt caching
- Skill carregado de `skill-refs/` em runtime (nunca commitado)
- Componente `ChatInterface` — leitor SSE, chips de sugestão, Shift+Enter

### Etapa 3 — tRPC API + Camada de Dados 🔄 *(próxima)*
Conectar as páginas do dashboard a dados reais do banco.

**Escopo:**
- Configurar tRPC com contexto Clerk + Drizzle (`src/lib/trpc/`)
- Procedures:
  - `accounts.list` — listar contas conectadas do tenant
  - `accounts.disconnect` — desativar conta e remover secretRef do vault
  - `runs.list` — listar runs do tenant com paginação
  - `runs.get` — detalhes de um run específico
- Atualizar página `connections` para exibir contas reais do banco
- Atualizar página `runs` para listar runs reais com status
- Remover páginas em caminhos incorretos (`(dashboard)/connections`, `(dashboard)/runs`)
- Migração Drizzle: `drizzle-kit push` para criar tabelas em produção

### Etapa 4 — Worker BullMQ (Audit Runs) ⬜
Processamento assíncrono de auditorias e relatórios.

**Escopo:**
- Worker `src/workers/ads-workflow.ts` consumindo fila `ads-workflows`
- Job types: `audit`, `report`, `setup`, `plan`
- Integração com Anthropic SDK (tool use + resultados estruturados)
- Atualização de status do run em tempo real (polling ou SSE)
- Disparo de run pela UI (botão "Nova Auditoria" na página Runs)
- Armazenamento de resultados: S3 key pattern `runs/{tenantId}/{id}/manifest.json`

### Etapa 5 — Formulários Estruturados + Workflow Dispatch ⬜
Entrada de dados via formulários que disparam workflows de forma guiada.

**Escopo:**
- Formulário de configuração de auditoria (plataforma, conta, período, objetivos)
- Formulário de criação de relatório com parâmetros
- Validação Zod + integração com tRPC mutations
- Preview do workflow antes de disparar (dry-run)
- Histórico de mutations com rollback

### Etapa 6 — Billing Stripe + Metering ⬜
Monetização por uso de runs e seats.

**Escopo:**
- Integração Stripe (subscription plans + usage billing)
- Metering por run executado e tokens consumidos
- Página de billing no Settings
- Webhooks Stripe para atualizar status de subscription no banco
- Gates de funcionalidade por plano (free / pro / enterprise)

---

## Configuração do Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (nunca commitado):

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon PostgreSQL
DATABASE_URL=postgresql://...

# Upstash Redis (BullMQ + Vault)
UPSTASH_REDIS_REST_URL=rediss://...

# Google Ads OAuth
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...

# Meta OAuth
META_APP_ID=...
META_APP_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Skill-refs (runtime, nunca commitado)

Copie os arquivos de skill do repositório `claude-ads` para `skill-refs/`:

```bash
# Não commite estes arquivos — estão no .gitignore
cp /path/to/claude-ads/ads/SKILL.md skill-refs/
cp /path/to/claude-ads/ads/thinking-framework.md skill-refs/
```

### Banco de Dados

```bash
# Criar tabelas no Neon
npx drizzle-kit push
```

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

---

## Segurança

- Tokens OAuth **nunca** no banco — apenas `secretRef` (chave Redis)
- Arquivos `.env*` e `skill-refs/*.md` no `.gitignore`
- CSRF em fluxos OAuth via cookie HttpOnly assinado
- Todas as rotas do dashboard protegidas pelo middleware Clerk
- Mutations exigem preview, aprovação explícita e registro de auditoria

---

## Repositório

Branch de desenvolvimento: `claude/claude-ads-project-6o8r3b`
