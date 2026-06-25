# Campanha Performance Max — Captação de Trials (Zapia)

> **Objetivo:** maximizar cadastros de trial (7 dias, sem cartão) com orçamento enxuto.
> **Orçamento:** R$ 20/dia (~R$ 600/mês) · **Lance:** Maximizar conversões · **Marca:** Zapia (zapia.app)
> **Fonte da verdade:** dados reais do código (`src/config/plans.ts`, landing/trial). Trial = **7 dias sem cartão**.
> Preços: Básico R$ 9,90 · Pro R$ 19,90 · Ilimitado R$ 29,90.

---

## 0. Aviso honesto sobre o orçamento

R$ 20/dia ainda está abaixo do que o Google recomenda para PMax (R$ 50–100/dia). Com esse valor:

- A **fase de aprendizado** (7–14 dias) terá CPA 30–50% acima do normal. **Não mexa na campanha nesse período.**
- O algoritmo precisa de **~30 conversões/mês** para otimizar bem. Acompanhe se você chega perto disso.
- A PMax tende a gastar primeiro em canais baratos (Display/YouTube). Os ajustes abaixo (Final URL expansion **off**, search themes de intenção, negativas) servem justamente para **empurrar o gasto para a Pesquisa**, que é onde está o lojista com intenção de compra.

**Gatilho de decisão:** se em 30–45 dias o custo por trial ficar muito alto (acima de ~3× a sua margem aceitável) ou o volume for irrisório, migramos para uma campanha de **Pesquisa pura**, que rende mais nesse orçamento.

---

## 1. Configurações da campanha

| Campo | Valor |
|---|---|
| Tipo | Performance Max |
| Objetivo | Leads / "Incentivar ações on-line" (sem meta de objetivo de loja física) |
| Conversão principal | **Cadastro de trial** (marque como "Primária"; deixe as demais como "Secundária") |
| Estratégia de lance | **Maximizar conversões** (SEM tCPA no início) |
| Orçamento diário | R$ 20,00 |
| Localização | Brasil (selecione "Presença: pessoas no Brasil" — não "interesse") |
| Idioma | Português |
| **URL final** | Página de trial: `https://zapia.app/cadastro` *(confirme a rota exata — é a `TrialSignupPage`)* |
| **Expansão de URL final** | **DESATIVADA** (trava o tráfego na página de trial) |
| Exclusões de URL | Adicione domínio inteiro exceto a página de trial, se quiser reforçar |
| Rotação de anúncios | Otimizar (padrão) |
| Conteúdo (brand safety) | Inventário padrão; exclua tipos sensíveis e conteúdo "para crianças" |

**Estrutura:** 1 campanha → **1 asset group** só. Não dilua o budget em vários grupos.

---

## 2. Ativos de texto (copiar e colar)

> Respeite os limites de caracteres do Google. Quanto mais ativos preenchidos, melhor a "Força do anúncio" (mire em **Excelente**).

### Nome da empresa
`Zapia`

### Títulos — até 15 (máx. 30 caracteres cada)
1. Catálogo no WhatsApp
2. Sua loja no WhatsApp
3. Venda mais pelo WhatsApp
4. Crie seu catálogo grátis
5. Catálogo online grátis
6. Receba pedidos no WhatsApp
7. Monte sua loja em 5 min
8. Loja pronta em minutos
9. Teste grátis por 7 dias
10. 7 dias grátis, sem cartão
11. Sem cartão de crédito
12. Catálogo digital fácil
13. Venda online sem site
14. Loja virtual no WhatsApp
15. Pedidos direto no WhatsApp

### Títulos longos — até 5 (máx. 90 caracteres cada)
1. Transforme sua loja em um catálogo pronto para o WhatsApp
2. Crie seu catálogo online e receba pedidos direto no seu WhatsApp
3. Monte sua loja virtual em menos de 5 minutos, sem precisar de site
4. Teste grátis por 7 dias, sem cartão de crédito. Cancele quando quiser
5. Catálogo profissional no WhatsApp para vender mais todos os dias

### Descrição curta — 1 (máx. 60 caracteres)
- Catálogo no WhatsApp. Teste grátis, sem cartão.

### Descrições longas — até 4 (máx. 90 caracteres cada)
1. Crie um catálogo online lindo e receba pedidos direto no WhatsApp. Comece grátis hoje.
2. Monte sua loja em minutos, adicione produtos e compartilhe o link. Sem precisar de site.
3. 7 dias grátis, sem cartão de crédito. Configure em menos de 5 minutos e venda mais.
4. Ideal para quem vende pelo WhatsApp. Organize pedidos, clientes e produtos num só lugar.

### Frase de chamariz (CTA)
`Inscrever-se` ou `Começar agora` (selecione no dropdown — não é texto livre)

### Sitelinks — 4+ (texto ≤ 25 caracteres + 2 descrições ≤ 35)
| Texto do link | Descrição 1 | Descrição 2 | Destino |
|---|---|---|---|
| Planos e preços | A partir de R$ 9,90/mês | 7 dias grátis sem cartão | `/precos` |
| Como funciona | Monte sua loja em 5 min | Simples e sem complicação | `/#como-funciona` |
| Ver exemplo de loja | Veja um catálogo real | Pronto para o WhatsApp | (loja demo) |
| Começar grátis | Teste 7 dias sem cartão | Cancele quando quiser | `/cadastro` |

### Frases de destaque (callouts ≤ 25 caracteres)
- Sem cartão de crédito
- Pronto em 5 minutos
- Pedidos pelo WhatsApp
- Cancele quando quiser
- Suporte em português
- Feito para o Brasil

### Snippets estruturados
- **Cabeçalho "Tipos":** Catálogo online, Loja virtual, Pedidos por WhatsApp, Gestão de produtos, Cupons

---

## 3. Imagens e vídeo (especificações)

Use as cores da marca (verde `#00a82d`, lima `#95e030`, fundo off-white `#f9f6f2`) e mostre **o catálogo no celular + a conversa no WhatsApp**.

| Tipo | Proporção | Tamanho recomendado | Qtd. mínima |
|---|---|---|---|
| Paisagem | 1.91:1 | 1200×628 | 1 (envie 3–5) |
| Quadrada | 1:1 | 1200×1200 | 1 (envie 3–5) |
| Retrato | 4:5 | 960×1200 | 1 (recomendado) |
| Logo quadrado | 1:1 | 1200×1200 | 1 |
| Logo paisagem | 4:1 | 1200×300 | 1 |
| Vídeo | horizontal/vertical/quadrado | ≥ 10s (ideal 15–30s) | 1 |

> Se você não enviar vídeo, o Google **gera um automaticamente** a partir das imagens — costuma ficar fraco. Vale fazer 1 vídeo simples (até no Canva) mostrando: produto → catálogo → "novo pedido no WhatsApp". Posso te ajudar a roteirizar.

---

## 4. Sinais de público (audience signals)

Sinais **orientam** o algoritmo, não limitam o alcance. Crie 1 sinal combinando:

**Segmento personalizado (intenção) — pessoas que pesquisam por:**
catálogo online whatsapp, como vender pelo whatsapp, criar loja virtual, vender pela internet, loja online grátis, catálogo digital, sistema de pedidos whatsapp, montar loja online

**Segmento personalizado (concorrentes) — pessoas que pesquisam/visitam:**
nuvemshop, loja integrada, yampi, bagy, sak loja, linkbio, catálogo whatsapp business

**Seus dados (quando houver volume):**
visitantes do site, lista de quem iniciou trial (semente para públicos semelhantes), clientes pagantes.

**Dados demográficos:** donos de pequenos negócios / empreendedores (use como sinal, não trave).

---

## 5. Search themes (até 25)

Cole estes temas no asset group (eles dizem ao PMax quais buscas priorizar):

1. catálogo online whatsapp
2. como vender pelo whatsapp
3. criar catálogo digital
4. loja virtual no whatsapp
5. catálogo de produtos online
6. vender online sem site
7. sistema de pedidos whatsapp
8. loja online grátis
9. catálogo para whatsapp business
10. como montar loja virtual
11. plataforma de vendas whatsapp
12. link de catálogo de produtos
13. catálogo digital para loja
14. vender mais pelo whatsapp
15. loja para pequenos negócios
16. criar loja online rápido
17. catálogo de roupas online
18. vender no instagram e whatsapp
19. gestão de pedidos whatsapp
20. montar catálogo no celular
21. loja virtual barata
22. vender produtos pelo whatsapp
23. catálogo profissional online
24. app para criar catálogo
25. cardápio digital whatsapp

---

## 6. Negativas e exclusões (proteção de orçamento)

### Palavras-chave negativas no nível da conta
Adicione em **Ferramentas → Listas de exclusão de palavras-chave** e aplique à conta:

baixar whatsapp, whatsapp web, atualizar whatsapp, gb whatsapp, whatsapp gb, figurinhas, status whatsapp, espião whatsapp, espionar whatsapp, clonar whatsapp, recuperar conversas, disparo em massa, disparador whatsapp, envio em massa, api whatsapp, chatbot whatsapp, curso, apostila, emprego, vaga, trabalhe em casa, planilha grátis, template grátis, pdf grátis, gratis para sempre, de graça sem pagar, crackeado, pirata

### Exclusão de marca (brand exclusions)
- Só ative se você criar **uma campanha de Pesquisa separada para a marca "Zapia"**. Aí exclua "zapia" da PMax para não competir/duplicar.
- No início, com 1 só campanha, **deixe sem exclusão de marca** — buscas pela marca são baratas e convertem bem.

---

## 7. Conversão e medição

- **Conversão primária:** cadastro de trial (você já tem tag do Google Ads + GA4 configurados — confirme que o evento dispara na página de confirmação do cadastro, ex.: `/onboarding` ou tela de "conta criada").
- Marque **só o trial** como "Primária". Eventos como "ver planos" ou "iniciar formulário" podem ficar como **secundárias** (ajudam o algoritmo a aprender sem virar meta de lance).
- **Janela de conversão:** 30 dias, clique.
- **Importante:** trial sem cartão = conversão "leve". Acompanhe **trial → pago** por fora (no Stripe) para saber o custo real de cliente. Em 60–90 dias, se tiver volume, podemos otimizar por uma conversão mais profunda (ex.: trial que adiciona ≥ 3 produtos, que é sinal de ativação).

---

## 8. Cronograma e otimização

**Semana 0 — Lançamento**
Subir campanha com tudo acima. Força do anúncio = Excelente. Conferir que a conversão de trial registra de verdade (faça um cadastro de teste).

**Semanas 1–2 — Aprendizado (não mexer)**
Não pausar, não editar lance, não trocar ativos. CPA vai vir alto — é esperado.

**Semanas 3–4 — Primeiros ajustes**
- Veja o **relatório de termos de pesquisa** (Insights) e adicione novas negativas para buscas ruins.
- Pause/troque os ativos individuais marcados como "Baixo" desempenho; reforce os "Melhores".
- Se o gasto estiver indo todo para Display/YouTube, reforce search themes e negativas.

**A partir de ~30 conversões acumuladas**
- Considere trocar para **CPA desejado** (tCPA), começando ~20% acima do CPA médio que você já está pagando. Abaixo de 30 conversões/mês, **fique em Maximizar conversões**.

**A partir de ~50 conversões/30 dias**
- Aí sim dá para pensar em escalar o orçamento (suba no máx. ~20–30% por vez, a cada 1–2 semanas) ou abrir um segundo asset group/tema.

---

## 9. Checklist de lançamento

- [ ] Conversão de trial testada e marcada como Primária
- [ ] Final URL = página de trial · Expansão de URL final **OFF**
- [ ] Localização "Presença no Brasil" · Idioma português
- [ ] 15 títulos, 5 títulos longos, 5 descrições, nome da empresa
- [ ] 4 sitelinks, 6 callouts, snippets estruturados
- [ ] Imagens (paisagem, quadrada, retrato) + 2 logos + 1 vídeo
- [ ] 1 sinal de público (intenção + concorrentes)
- [ ] Até 25 search themes
- [ ] Lista de negativas de conta aplicada
- [ ] Lance: Maximizar conversões · Orçamento R$ 20/dia
- [ ] Força do anúncio = Excelente

---

*Documento gerado para a campanha de captação de trials da Zapia. Ativos prontos para colar no Google Ads. Próximos passos sugeridos: confirmar a URL exata da página de trial e o nome do evento de conversão; produzir 1 vídeo curto e 3–5 imagens nas cores da marca.*
