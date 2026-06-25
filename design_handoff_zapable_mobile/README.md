# Handoff de Design — Redesign Mobile-First Zapable

> Pacote para implementação no codebase real (`zapable`, React + TypeScript) por um desenvolvedor usando Claude Code.
> **Os arquivos `.dc.html` em `prototypes/` são referência VISUAL e de COMPORTAMENTO — não são código de produção.** O objetivo é recriar estas telas usando os componentes, rotas e padrões que **já existem** no repositório, editando os arquivos atuais (`StorePage.tsx`, `CheckoutPage.tsx`, etc.) — não substituindo a stack.

---

## 0. Como usar este pacote (instruções para o Claude Code)

1. Leia este README inteiro antes de tocar em qualquer arquivo.
2. Abra cada protótipo em `prototypes/*.dc.html` num navegador para sentir o fluxo e as interações (eles são autocontidos e abrem direto).
3. Para cada tela, localize o componente/rota correspondente no repositório (mapa na seção 8) e **refatore-o** para o novo layout mobile-first descrito aqui.
4. Reutilize os tokens existentes do projeto (`colorPresets.ts`, Tailwind config, schemas Zod de `features/onboarding/schemas`) — **não invente** novos sistemas de cor ou validação.
5. Mantenha toda a lógica de negócio existente (queries, mutations, react-hook-form + zod, geração do link de WhatsApp). O redesign é de **UI/UX**, não de regras.
6. Todo texto de interface em **pt-BR**.

### O que NÃO fazer
- Não trocar a stack (continua React Router + react-hook-form + zod + Tailwind).
- Não remover validações nem campos obrigatórios definidos nos schemas.
- Não copiar o HTML inline dos protótipos cru: traduza para componentes React reutilizáveis.
- Não usar o ícone `add_shopping_bag` (não existe no Material Symbols — use `add_shopping_cart`).

---

## 1. Princípios do redesign

Mobile-first de verdade: "se funciona perfeito no celular, funciona em qualquer lugar." Inspiração de usabilidade: Notion Mobile, Stripe Dashboard, Linear, Shopify Mobile, Material 3.

- **Uma coluna**, blocos empilhados, cards. Sem tabelas densas, sem multi-coluna desktop.
- **Alvos de toque ≥ 44px** (preferência 48px+). Botões primários têm 50–54px de altura.
- **Bottom sheets** para filtros, seletores e ordenação (em vez de dropdowns/hover).
- **Feedback sempre**: toasts, estados de loading (skeleton), vazio, erro, sucesso.
- **Divulgação progressiva**: opções avançadas escondidas em accordions/disclosure.
- **Carga cognitiva baixa**: destacar a ação primária de cada tela; esconder o resto.

---

## 2. Design System (tokens)

### Cores
| Token | Valor | Uso |
|---|---|---|
| `brand` (verde Zapable) | `#00a82d` | Ação primária, marca, preços, seleção |
| `brand-dark` | `#008f26` (≈ shade −15%) | Gradientes, hover/active |
| Fundo do app (storefront) | `#e9f3ea` | Fundo verde-claro do catálogo *(ajuste de comentário)* |
| Fundo do app (painel/onboarding) | `#f9f6f2` | Off-white quente |
| Superfície / card | `#ffffff` | Cards, inputs, sheets |
| Texto principal | `#141414` | Títulos e valores |
| Texto secundário | `#7c766c` / `#9a948a` | Descrições, labels |
| Borda sutil | `rgba(0,0,0,.06–.08)` | Contorno de cards/inputs |
| Sucesso WhatsApp | `#25d366` | CTA de checkout / confirmação |
| Erro / promo | `#ff3b30` | Selo de desconto, excluir, alertas |
| Destaque (estrela) | `#f5a623` | Seção "Em destaque" |

> O storefront é **multi-loja**: a cor primária vem da loja (`store.color`, ver `colorPresets.ts`). Tudo que está `brand` acima deve usar a cor da loja no storefront. No painel do lojista e onboarding, usar o verde Zapable fixo.
> **Texto de parcelamento**: o trecho "sem juros" deve usar a cor da loja em negrito *(ajuste de comentário)*.

### Tipografia
- Família: system stack (`-apple-system, Segoe UI, Roboto, …`). Mantenha a fonte do projeto.
- Escala mobile: Título de tela **24–26px / 800**; título de card **16–18px / 800**; corpo **13.5–15px**; label **12px / 700**; caption **11–11.5px**.
- `letter-spacing` levemente negativo em títulos (`-.02em` a `-.035em`).
- Nunca abaixo de 11px.

### Espaçamento
Escala 4px: **4, 8, 11, 14, 16, 18, 22, 24, 26**. Padding lateral padrão das telas: **18px**. Gap entre cards: **11px**. Use sempre flex/grid com `gap` (não margens soltas).

### Raios
Inputs/botões **13–16px**; cards **16–20px**; sheets **26px** (topo); pills **999px**; avatares **11–12px** (quadrado arredondado) ou 50% (cliente).

### Sombras
Cards quase planos (borda sutil > sombra). Elementos flutuantes (FAB cart, toast): `0 12px 28px -8px rgba(0,0,0,.4)`.

---

## 3. Biblioteca de componentes (recriar em React)

Crie componentes reutilizáveis a partir destes padrões observados nos protótipos:

- **PhoneShell** — só nos protótipos (moldura iPhone + status bar). **Não portar**: o app real roda no navegador do dispositivo.
- **AppHeader** — título 24–26px + ação à direita (ícone 40×40 em card branco). Variante storefront: header colorido com logo, info, share, sacola com badge.
- **BottomNav** (painel) — 4–5 abas fixas, ícone + label 10px, item ativo em verde. Já existe `BottomBar` no projeto — evoluir.
- **MetricCard / KpiCard** — label + valor grande + delta (verde/vermelho).
- **QuickAction** — ícone em card + label, grid de 4.
- **ListCard** — substitui linha de tabela: avatar/thumb + título + meta + ação. Para Pedidos, Produtos, Clientes.
- **Button** — primário (altura 50–54px, raio 15–16px, cor da marca/loja), secundário (branco + borda).
- **Input / TextArea** — altura 15px padding, borda que fica verde quando válido/preenchido; prefixo (ex.: `+55`, `@`, `.zapable.com.br`).
- **Stepper** — −/valor/+ para quantidade (botões 26–34px).
- **Chip / SegmentedControl** — categorias, filtros, seleção única/múltipla (pills).
- **BottomSheet** — backdrop `rgba(20,20,20,.42)` + painel deslizando de baixo (`translateY 100%→0`), handle 40×5px no topo. Para: busca, ordenar, selecionar estado, filtros, seletor de cliente/produto.
- **Toast** — pílula escura central-inferior, ícone de check verde, auto-some em ~2s.
- **StatusBadge** — pílula colorida para status de pedido (novo, pago, enviado, etc.).
- **EmptyState** — ícone grande + título + descrição + CTA.
- **Skeleton** — bloco com shimmer (gradiente animado, ver seção 7).

---

## 4. Fluxo: Painel do Lojista (`prototypes/Zapable Mobile.dc.html`)

Captura: `screenshots/dashboard-inicio.png`

Navegação principal: **bottom nav** (Início, Pedidos, Produtos, Clientes, Mais) — substitui a sidebar desktop. "Mais" abre acesso a Catálogo, Billing, Vendedores, Suporte, Configurações.

### Telas
1. **Início** — saudação personalizada; banner de trial/assinatura; **4 ações rápidas** (Novo produto, Ver pedidos, Compartilhar, Ver loja); cards de KPI (Pedidos hoje, Receita do mês com delta, Produtos ativos, Clientes); mini-gráfico de tendência (rolável horizontalmente se necessário); feed de últimos pedidos.
   - *Bottlenecks resolvidos*: dashboard desktop denso → KPIs priorizados em cards escaneáveis; ações primárias no topo.
2. **Pedidos** — header com botão **Novo**; busca + filtros (bottom sheet); lista de **cards** (não tabela) com cliente, código, valor, status badge, tempo. Detalhe do pedido em overlay (itens, contato, observação, ações).
   - **Novo pedido** (overlay): seletor de cliente (sheet) → adicionar produtos (sheet) → stepper de quantidade por item → observação → subtotal/total ao vivo → criar (validação: cliente + ≥1 item) → toast + entra no topo da lista.
3. **Produtos** — busca; lista de cards com thumb, nome, preço, estoque. Detalhe/edição com **abas**. Cadastro/edição deve incluir **fotos do produto** e **informação de parcelamento** *(pedido explícito do cliente)* — facilitar adição/edição.
4. **Clientes** — header com botão **Novo**; filtros inteligentes (ex.: recompra em atraso); cards com avatar/iniciais, nome, telefone, total gasto. **Ficha** com alternância ver/editar: contato, stats, etiquetas, perfil gerado por IA; edição de nome, WhatsApp, e-mail, aniversário, vendedor, etiquetas, observações.
5. **Mais** — Catálogo (personalização), Billing/Assinatura, Vendedores, Suporte, Configurações.

---

## 5. Fluxo: Onboarding (`prototypes/Zapable Onboarding.dc.html`)

Captura: `screenshots/onboarding-etapa1.png`

Wizard de **4 etapas + tela de conclusão**. Barra de progresso segmentada + "Etapa X de 4". Uma coluna, CTA fixo no rodapé, validação por etapa com bloqueio amigável (toast). **Auto-save de rascunho** (retomar de onde parou).

> **Fonte da verdade dos campos/validação**: `src/features/onboarding/schemas/index.ts` (Zod). Use-os; não duplique regras.

1. **Etapa 1 — Sua loja**: nome, WhatsApp (prefixo `+55`, validação `validatePhoneBR`), estado (bottom sheet de UF), cidade. Endereço completo em disclosure opcional (rua, bairro).
2. **Etapa 2 — Sobre o negócio**: categoria/ramo em grade de cards com ícones (valores do schema: moda, suplementos, beleza, sexshop, eletrônicos, alimentos, pet, casa, esportes, infantil, serviços, outro); Instagram (`@`); **slug** da loja (`<slug>.zapable.com.br`) com **checagem de disponibilidade ao vivo** (regex de slug do schema) + sugestões geradas do nome.
3. **Etapa 3 — Pagamento e entrega**: formas de pagamento (multi-seleção em pills: pix, dinheiro, crédito, débito, transferência, boleto, link); formas de entrega (delivery, retirada na loja, digital); área de atendimento (seleção única: cidade, estado, Brasil, mundo, digital); horário de atendimento.
4. **Etapa 4 — Visual**: paleta de cores (de `colorPresets.ts`), upload de **logo** e **banner**, com **prévia ao vivo da vitrine** que reage à cor e ao nome.
5. **Conclusão**: "Sua loja está no ar!" + link copiável + cards de próximos passos (adicionar produto, personalizar catálogo, ver loja).

CTA final ("Publicar minha loja") só habilita quando a etapa é válida; ao concluir, limpar o rascunho salvo.

---

## 6. Fluxo: Storefront / Catálogo público (`prototypes/Zapable Storefront.dc.html`)

Capturas: `screenshots/01-storefront.png` (catálogo), `screenshots/storefront-produto.png` (produto)

Tema reativo: **toda a UI usa a cor da loja** (`store.color`). Fundo do app verde-claro `#e9f3ea` *(ajuste de comentário)*.

### Telas
1. **Home / Catálogo** — header colorido (logo, info → Sobre, share, sacola com badge); hero; **busca** (abre sheet full-screen com buscas populares + resultados instantâneos); chips de categoria roláveis; carrossel **Em destaque** (selos de promoção); grade 2 colunas com preço, promo riscada, botão de adicionar rápido; **ordenação** em bottom sheet; **barra de carrinho flutuante** quando há itens; estado **sem resultados**.
2. **Produto** — galeria com selo de desconto; categoria + nome; preço grande + preço antigo riscado; **parcelamento** ("em até 3x de R$ X **sem juros**" — "sem juros" na cor da loja em negrito); **seletor de variações** (tamanho/numeração); descrição; selos de confiança; barra fixa com stepper de quantidade + **Adicionar ao carrinho** (ícone `add_shopping_cart`).
3. **Carrinho** — itens com thumb, stepper, excluir; **cupom de desconto** (validação); resumo (subtotal, desconto, frete "a combinar", total); estado **vazio** com CTA. Esgotados tratados.
4. **Checkout** — resumo do pedido; nome; WhatsApp (`+55`); confirmação "combinar entrega pelo WhatsApp"; observação opcional; CTA verde **Confirmar pelo WhatsApp** (mantém a lógica real de montar a mensagem e abrir `wa.me`). Validação: nome + telefone + confirmação.
5. **Pedido confirmado** — sucesso com código do pedido, resumo, reabrir WhatsApp, continuar comprando.
6. **Sobre a loja** — card de identidade (banner com gradiente da loja + logo + nome + slogan + endereço + CTA catálogo); Contato (WhatsApp, Instagram, telefone); Galeria (faixa rolável); Nossa história; Horário de atendimento.

---

## 7. Estados (loading / vazio / erro / sucesso)

- **Skeleton (loading)** — catálogo mostra placeholders com shimmer (hero, busca, chips, destaques, grade) antes do conteúdo. Implementar com gradiente animado:
  ```css
  @keyframes zshimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
  .skeleton { background: linear-gradient(90deg,#ece7df 25%,#f4f0e9 50%,#ece7df 75%); background-size: 200% 100%; animation: zshimmer 1.25s ease-in-out infinite; }
  ```
  Mostrar enquanto a query estiver `isLoading`. Recomenda-se skeleton também na página de produto.
- **Vazio** — EmptyState (ícone + título + descrição + CTA): carrinho vazio, sem resultados de busca, sem produtos.
- **Erro / sem conexão** — banner/estado com retry (ainda a desenhar — sugerido como próximo passo).
- **Sucesso** — toasts (adicionado ao carrinho, cupom aplicado, pedido criado) e telas de confirmação.

---

## 8. Mapa protótipo → arquivos do repositório

| Protótipo / tela | Arquivo(s) a refatorar |
|---|---|
| Storefront Home/Catálogo | `src/routes/store/StoreHomePage.tsx`, `src/routes/store/StorePage.tsx` |
| Storefront Produto | `src/routes/store/` (página de produto) |
| Storefront Carrinho | `src/routes/store/CartPage.tsx` |
| Storefront Checkout | `src/routes/store/CheckoutPage.tsx` |
| Storefront Pedido confirmado | `src/routes/store/OrderCo…Page.tsx` |
| Storefront Sobre | `src/routes/store/StoreAboutPage.tsx` |
| Storefront layout/tema | `src/routes/store/StoreLayout.tsx` |
| Painel Início + layout | `src/routes/dashboard/HomePage.tsx`, `DashboardLayout.tsx` |
| Painel Pedidos/Produtos/Clientes | rotas correspondentes em `src/routes/dashboard/` + `src/features/*` |
| Onboarding (4 etapas + completo) | `src/features/onboarding/components/OnboardingStep1–4.tsx`, `OnboardCompletePage.tsx`, `OnboardingLayout.tsx` |
| Schemas/validação onboarding | `src/features/onboarding/schemas/index.ts` *(não alterar regras)* |
| Presets de cor | `src/config/colorPresets.ts` |
| Rotas | `src/config/routes.ts` |

> Confirme os caminhos exatos no repositório antes de editar (alguns nomes acima estão truncados).

---

## 9. Acessibilidade
- Contraste WCAG AA: texto principal `#141414` sobre superfícies claras passa; verifique texto branco sobre a cor da loja (cores claras do preset podem precisar de texto escuro).
- Alvos de toque ≥ 44px; foco visível (ring) em inputs/botões; navegação por teclado preservada (não quebrar os forms react-hook-form).
- Ícones decorativos com `aria-hidden`; botões só-ícone com `aria-label`.
- Sheets: focar primeiro elemento ao abrir, fechar com Esc, restaurar foco ao fechar.

---

## 10. Comportamentos / breakpoints
- Mobile é o padrão (≤ 480px). Tablet/desktop: aumentar largura máxima do conteúdo (centralizar coluna), grade de produtos 3–4 colunas, sheets podem virar modais/drawers laterais — mas **a hierarquia e os componentes são os mesmos**.
- Posição de playback/rascunho e estado de carrinho devem persistir conforme o projeto já faz.
- Manter a geração da mensagem de WhatsApp e o redirect existentes no checkout.

---

## Conteúdo do pacote
```
design_handoff_zapable_mobile/
├── README.md            ← este arquivo
├── prototypes/          ← referências visuais (abrem no navegador)
│   ├── Zapable Mobile.dc.html       (painel do lojista)
│   ├── Zapable Onboarding.dc.html   (onboarding 4 etapas)
│   ├── Zapable Storefront.dc.html   (catálogo público)
│   └── support.js                    (runtime dos protótipos)
└── screenshots/         ← telas-chave renderizadas
    ├── 01-storefront.png
    ├── storefront-produto.png
    ├── dashboard-inicio.png
    └── onboarding-etapa1.png
```
