# GEOSSTORE Design System & Style Guide

Este documento serve como guia (Markdown - MD) para manter a consistência de UI/UX (Interface de Utilizador e Experiência de Utilizador) em todo o website da GEOSSTORE. Foi desenhado com foco em simplicidade, elegância, e funcionalidade premium (estética inspirada na Apple).

---

## 🎨 Cores e Tema (Sem "Dark Mode")
A paleta baseia-se num contraste clássico e deslumbrante de preto e branco, utilizando um tom de azul dinâmico para os "Acentos" de acção.

| Função             | Variável CSS      | Valor Hexadecimal / RGB    | Descrição                                 |
| ------------------ | ----------------- | --------------------------- | ----------------------------------------- |
| **Fundo Principal** | `--bg-light`      | `#fbfbfb`                   | Branco puro, limpo, fundo imaculado       |
| **Fundo Secundário**| `--bg-subtle`     | `#f5f5f7`                   | Cinzento levíssimo para áreas de destaque |
| **Primário/Texto**  | `--black`         | `#111111`                   | Preto profundo para texto e botões escuros|
| **Texto Secundário**| `--text-secondary`| `#424245`                   | Cinza escuro para descrições              |
| **Texto Suave**     | `--text-muted`    | `#86868b`                   | Cinza médio para labels e breadcrumbs     |
| **Destaque de Acção**| `--accent`        | `#0071E2` (Azul GEOSSTORE)  | Links ativos, CTA de compra               |
| **Bordas**          | `--border-light`  | `rgba(0,0,0,0.08)`          | Linhas e divisórias muito subtis          |

---

## 🔤 Tipografia e Espaçamento
Utilizar fontes sem serifa modernas e limpas (neste caso, a fonte padrão do sistema ou *Inter* / *San Francisco* importados).
- **Headings (H1, H2)**: `font-weight: 700;` com `letter-spacing: -0.02em;`
- **Sub-headings (H3)**: `font-weight: 600;`
- **Corpo do Texto (p)**: `font-weight: 400;` com `line-height: 1.6;`

**Sombras (Glassmorphism / Elevação)**:
- `--shadow-sm`: `0 2px 10px rgba(0,0,0,0.03);`
- `--shadow-md`: `0 8px 30px rgba(0,0,0,0.04);`
- `--shadow-lg`: `0 20px 40px rgba(0,0,0,0.08);`

---

## 🖱️ Botões (CTAs) e Links (Interatividade)
Todos os links e botões devem gerar *feedback* imediato, seja reduzindo a opacidade ou sofrendo um ligeiro "lift" (elevação).

1. **Botão Primário (Solid Black ou Accent)**
   - Fundo: `--black` ou `--accent`
   - Raio: `8px` (`--radius-sm`)
   - Efeito: `transform: translateY(-2px);` com uma leve sombra difusa

2. **Botão Secundário / Contorno (Outline)**
   - Cor do Borda: `--border-light`
   - Hover Action: A borda fica `var(--black)` e a cor de texto acompanha.

```html
<!-- Exemplo de botão primário -->
<button class="btn btn-primary">Comprar Agora</button>

<!-- Exemplo de botão preto absoluto -->
<button class="btn btn-black">Submeter</button>

<!-- Exemplo de Link/Botão Fundo Fantasma -->
<button class="btn btn-ghost">Cancelar</button>
```

---

## 🧱 Componentes Consistentes a Usar

### 1. Sistema de Notificações (Toast)
Sempre que o cliente interagir (submeter formulário, erro, carrinho), utilizar o `GeoToast.show()`.
```js
GeoToast.show('Produto adicionado ao carrinho!', 'success'); // 'success' ou 'error'
```

### 2. Layouts de Produtos
Todos os *cards* de produtos utilizam um layout unificado:
- **Imagem**: Ocupa o topo (aspect-ratio 1:1), e amplia no `hover` (`scale(1.05)`).
- **Etiquetas**: Se for novidade ("Novo") ou descontos, coloque de forma flutuante sobre a imagem.
- **Informações**: Ficam espaçadas, com nome (`font-weight: 600`), preço e opções para selecionar o tamanho.

### 3. Header & Navigation (O "Top")
Sempre `fixed top-0` com efeito "Glassmorphism" `backdrop-filter: blur(12px)`. Composto por:
- Logo SGV alinhado à esquerda.
- Navegação (Mulher, Homem, Criança) ao centro.
- Ícone do carrinho e botão à direita.

### 4. Entradas de Formulário (Inputs)
Campos de texto sempre suaves, grandes e legíveis:
- Fundo: `--bg-light` ou `--white`
- Borda: Fica `var(--accent)` (azul) ao aplicar `:focus`, removendo a *outline* nativa padrão.
- *Padding*: Generoso, pelo menos `12px 16px`.

---

## 📐 Regras de Ouro
1. **Sem Links Mortos / "href=#"**: Tudo precisa navegar para algum lado. Para ações puras de JavaScript (sem URL), deve-se usar `<button type="button">` em vez de `<a href="#">`.
2. **Imagens de Alta Qualidade**: Nunca deforme proporções de aspect-ratio. Forçar `object-fit: cover`.
3. **API e Dados Reais**: Todos os ecrãs que carreguem dados devem apresentar o texto: *A carregar...*, antes de revelar o conteúdo JSON vindo de `server.js`. Em caso de ecrã vazio, mostrar mensagem neutra suave "Nenhum resultado".
4. **Sem Modo Escuro**: Garantir que se o utilizador colocar o Sistema Operativo/Navegador em Dark Mode, que NÃO estraga as cores - force as diretivas com cores hexadecimais constantes.
5. **Português**: Toda marcação HTML e "Placeholders" são sempre em Português-AO.
