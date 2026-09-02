# Zapia — Catálogo Digital para Comércio Local

Plataforma de catálogo digital e checkout integrado ao WhatsApp, otimizada para o comércio de **Bom Jesus da Lapa - BA**. Permite que lojistas criem seus catálogos online, gerenciem produtos, clientes, pedidos e cupons, com subdomínios personalizados (`{loja}.zapia.app`).

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Vite, React Router v6
- **Estilos:** Tailwind CSS, PostCSS, HugeIcons
- **Gerenciamento de Estado & Dados:** TanStack Query v5, Zustand, React Hook Form, Zod
- **Backend & Autenticação:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Infraestrutura:** Hostinger (Apache SPA Rewrite), Cloudflare Worker (Subdomain Proxy)
- **Testes & Qualidade:** Vitest, Testing Library, ESLint Flat Config, Prettier

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js:** `>= 18` (recomendado Node 20 LTS)
- **npm:** `>= 9`

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/bezerradaniels/zapia.git
cd zapia

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

O servidor iniciará em `http://localhost:5173`.

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes chaves (baseado no `.env.example`):

| Variável                        | Descrição                                  | Exemplo                                    |
| ------------------------------- | ------------------------------------------ | ------------------------------------------ |
| `VITE_SUPABASE_URL`             | URL da instância do projeto Supabase       | `https://xopesjswojsesjmvazel.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública publicável (publishable key) | `sb_publishable_...`                       |
| `VITE_SUPABASE_ANON_KEY`        | Chave anônima pública do Supabase          | `eyJhbGciOi...`                            |
| `VITE_ROOT_DOMAIN`              | Domínio base para resolução de subdomínios | `zapia.app`                                |

---

## 📜 Scripts Disponíveis

| Comando             | Descrição                                                                |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | Inicia o servidor Vite de desenvolvimento com HMR                        |
| `npm run build`     | Valida tipagem (`tsc -b`) e compila a aplicação para produção em `dist/` |
| `npm run preview`   | Roda preview local do build de produção                                  |
| `npm run test`      | Executa a suite de testes unitários com Vitest                           |
| `npm run typecheck` | Executa o verificador estático do TypeScript (`tsc --noEmit`)            |
| `npm run lint`      | Analisa o código com ESLint Flat Config                                  |
| `npm run format`    | Formata o código com Prettier e organiza classes Tailwind                |

---

## 📂 Estrutura de Pastas

```
zapia/
├── .github/workflows/   # Workflows de CI/CD (GitHub Actions)
├── public/              # Assets estáticos servidos na raiz (favicons, robots, .htaccess)
├── src/
│   ├── assets/          # Assets estáticos importados pelo bundle
│   ├── components/      # Componentes de UI transversais e atômicos
│   │   ├── feedback/    # Estados vazios e loaders
│   │   ├── forms/       # Inputs reutilizáveis (Crop de imagens, Money, Phone)
│   │   ├── layout/      # Sidebar, Topbar, BottomBar, menus
│   │   ├── store/       # Cards e componentes de vitrine
│   │   └── ui/          # Componentes base (Botões, Badges, Modais, Sheets)
│   ├── config/          # Constantes globais (rotas, planos, admin)
│   ├── features/        # Módulos de domínio autocontidos (Feature-Based)
│   │   ├── admin/       # Gestão de superadmin da plataforma
│   │   ├── analytics/   # Rastreamento de eventos GA4 / DataLayer
│   │   ├── auth/        # Login, Cadastro, Recuperação de senha, Sessão
│   │   ├── billing/     # Planos, Assinaturas, Limites de uso
│   │   ├── catalog/     # Configurações gerais da loja e dados do catálogo
│   │   ├── categories/  # Gestão de categorias de produtos
│   │   ├── coupons/     # Cupons de desconto e links de cupom
│   │   ├── customers/   # Gestão e histórico de clientes
│   │   ├── notifications/# Notificações em tempo real e sino de alertas
│   │   ├── onboarding/  # Fluxo guiado em 4 etapas para novos lojistas
│   │   ├── orders/      # Pedidos, WhatsApp checkout, impressão
│   │   ├── products/    # Cadastro e edição de produtos, fotos e variações
│   │   └── sellers/     # Vendedores e catálogos individuais
│   ├── hooks/           # Hooks genéricos utilitários
│   ├── lib/             # Integrações externas e utilitários compartilhados
│   │   ├── br/          # Validações e dados BR (Bairros de BJ da Lapa, CPF/CNPJ, Telefone)
│   │   ├── format/      # Formatadores de moeda, datas e texto
│   │   ├── pdf/         # Geração sob demanda do catálogo em PDF
│   │   ├── sanitize/    # Sanitização de HTML com DOMPurify
│   │   ├── supabase/    # Inicialização do cliente Supabase e Storage
│   │   ├── tenant/      # Resolução de subdomínio e contexto de loja ativa
│   │   └── whatsapp/    # Montagem de mensagens estruturadas para WhatsApp
│   ├── providers/       # Provedores de contexto React (QueryClient, AuthProvider)
│   ├── routes/          # Telas e páginas roteadas da aplicação
│   │   ├── admin/       # Painel administrativo da plataforma
│   │   ├── auth/        # Telas de autenticação
│   │   ├── dashboard/   # Painel de controle do lojista
│   │   ├── marketing/   # Landing page, Preços, Termos de uso, Privacidade
│   │   └── store/       # Vitrine pública da loja, Carrinho e Checkout
│   ├── stores/          # Stores globais com Zustand (Carrinho de compras)
│   ├── styles/          # Folhas de estilo CSS globais e tokens Tailwind
│   └── types/           # Tipagens TypeScript de domínio e banco de dados
├── supabase/
│   ├── functions/       # Edge Functions Deno do Supabase (Stripe, Notificações)
│   └── migrations/      # Migrações SQL e políticas RLS do PostgreSQL
├── tailwind.config.ts   # Configuração do Tailwind CSS e Design System
├── tsconfig.json        # Configurações do TypeScript
└── vite.config.ts       # Configuração do Vite e chunks de build
```

---

## 🌐 Roteamento de Subdomínios (Multi-Tenant)

A Zapia suporta arquitetura multi-tenant por subdomínio:

- **Domínio Principal (`zapia.app`):** Landing page, painel do lojista (`/dashboard`) e autenticação.
- **Subdomínios de Lojas (`{slug}.zapia.app`):** Vitrine dedicada da loja correspondente.
- **Ambiente Local (`{slug}.localhost:5173` ou `localhost:5173/{slug}`):** Roteamento automático para testes em desenvolvimento.

O resolvedor de contexto (`src/lib/tenant/resolveStore.ts`) detecta o hostname em tempo de execução e injeta os dados da loja nos layouts sem recarregar o bundle da aplicação.
