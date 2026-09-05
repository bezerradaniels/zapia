# Implementação — direção 1A

Dois arquivos prontos para o seu projeto:

- `main.css` → sua entrada do Tailwind (ex.: `src/main.css`)
- `index.html` → a página reformulada, em classes Tailwind v4

Build: `npx @tailwindcss/cli -i ./src/main.css -o ./styles/main.css --minify`

---

## 1. Tokens (não use hex avulso)

Tudo vem do `@theme` em `main.css`. As classes seguem os nomes dos tokens:

| Papel | Token / classe | Onde usar |
|---|---|---|
| Fundo da página | `cream` #f5ead8 | `body`, seções neutras |
| Superfície tonal | `sand` #ebddc5 | cards secundários, faixa de segmentos, chips |
| Card elevado | `paper` #fffdf7 | cards de conteúdo, seções alternadas |
| Texto | `ink` #201e1d | texto; opacidade via `text-ink/70`, `/55` |
| Acento — UI | `p-600` #6344bd | preenchimento de botão primário |
| Acento — hover/pressed | `p-700` #4c3196 | hover de botão, **texto de acento** |
| Acento — tinta clara | `p-100` / `p-200` / `p-300` | fundos tintados, barras de gráfico, tracejado |
| Bloco escuro | `p-800` #37236e | faixa de aviso, "com a Zapia", CTA final |
| Segunda voz | `sage-100` / `sage-500` / `sage-800` | estados positivos (Pix confirmado, loja aberta) |
| Alerta | `alert-100` / `alert-700` | apenas o lado "antes" — nunca como cor de marca |

Regras de contraste: **texto de acento em parágrafo é sempre `text-p-700`** (não `p-600`, não `p-500`). Roxo sobre cream em tamanho pequeno com `p-500` reprova.

## 2. Tipografia

- Títulos: `font-display` (Caprasimo 400) — nunca em negrito, o peso já é o desenho da fonte.
- Corpo: `font-sans` (Figtree). Pesos usados: 400 / 500 / 600 / 700 / 800.
- Escala real da página: h1 `text-[2.5rem]` → `lg:text-6xl`; h2 `text-3xl` → `lg:text-[42px]`; h3 `text-2xl`; corpo `text-base`/`text-[17px]`; apoio `text-sm`.
- Nada abaixo de 13px, e `text-ink/55` só em rótulos curtos.
- Auto-hospede as duas fontes em `/fonts/*.woff2` (os `@font-face` já estão no `main.css`) e remova o `<link>` do Google Fonts — hoje vocês já pré-carregam fonte local, mantenha esse padrão.

## 3. Ritmo e forma

- Container único: `mx-auto w-full max-w-[1180px] px-5 sm:px-8`.
- Espaçamento vertical de seção: `py-16 sm:py-20`. **Só isso** — era esse o "espaçamento quebrado": havia 4 escalas diferentes (`py-12 sm:py-16 md:py-18`, `md:py-20`) e margens soltas.
- Raios: containers `rounded-[28px]`/`rounded-[32px]`, cards internos `rounded-[20px]`, botões e chips `rounded-full`. Sem cantos retos.
- Alternância de fundo: `cream` → `paper` → `cream` → `sand`. Máximo dois fundos por dobra; nunca dois `paper` seguidos.
- Sem bordas hairline como estrutura: separação é por fundo e sombra (`shadow-sm` / `shadow-md` / `shadow-lg`), não por `border-slate-200`.

## 4. O que mudou de estrutura (e por quê)

1. **As 6 seções "Problema frequente do lojista" saíram.** Elas repetiam o mesmo layout 6× com textos longos. Viraram:
   - **um** bloco *Antes e depois* (o problema mais forte, mostrado em vez de descrito);
   - **uma** grade de 6 recursos, uma frase cada.
   Resultado: mesma informação, ~⅓ do comprimento.
2. **Badges vermelhos de "problema" removidos.** Repetir "Problema frequente do lojista" 6× em rosa vende hesitação, não solução.
3. **Segmentos** deixaram de ser 8 cards com ícone + descrição e viraram uma linha de chips + uma frase. Ninguém lê 8 descrições de segmento; a pessoa só procura o dela.
4. **Um CTA por dobra, não seis.** Havia um botão diferente por seção ("Controlar Meu Fluxo de Caixa", "Economizar Tempo com PDFs"…), o que dilui a ação. Agora: header, hero, recursos (secundário) e CTA final.
5. **H1 encurtado** de 9 para 5 palavras. "Sua loja inteira em um link." é a promessa; o resto é subtítulo.
6. **Mockups refeitos** para parecerem produto: header de loja com URL, cards com grade e preço, bolha de pedido com total e horário, gráfico de caixa com barras tonais.

## 5. Acessibilidade e interação

- `:focus-visible` já é anel roxo de 2px no `main.css` — não sobrescreva por elemento.
- Áreas de toque mínimas de 44px: os botões usam `py-3`/`py-4`.
- No hero, a bolha de pedido **empilha no mobile** (`mt-4`) e só vira sobreposta em `lg:` (`lg:absolute lg:bottom-0` com `lg:pb-[196px]` no wrapper). Se mexer na altura da bolha, ajuste esse `pb` — ele precisa ser maior que a altura dela.
- Chips de segmento são `<ul>/<li>`, passos são `<ol>/<li>`, FAQ é `<details>` nativo (sem JS).

## 6. Antes de subir

- [ ] Substituir os `photo-slot` (placeholders listrados) por fotos reais de produto — 1:1, ~800px, WebP.
- [ ] Colar de volta o bloco `<script>` de GTM/UTM (há um marcador comentado no fim do `index.html`).
- [ ] Revisar `speculationrules` e o preload da fonte antiga, que saíram do `<head>`.
- [ ] Conferir os textos de preço/prazo ("7 dias", "0% comissão") com o que está em `/precos`.
- [ ] `npx @tailwindcss/cli --minify` e checar o CSS final (deve ficar bem abaixo de 20 kB).
