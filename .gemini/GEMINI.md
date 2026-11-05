# Contexto do Projeto: Amazon Affiliate Niche Site (EUA)

## Visão Geral
Este repositório contém o código-fonte de um site estático de curadoria de produtos afiliados focados no mercado americano (Amazon.com). O objetivo principal é atrair tráfego altamente qualificado dos EUA através de SEO orgânico e entrega automatizada de anúncios/Pins nas redes visuais (como o Pinterest), convertendo visitantes através de recomendações imparciais em nichos de alta conversão (ex.: *Pet Care*, *Home & Kitchen Organization*, *Smart Living*).

---

## Diretrizes Técnicas e de Arquitetura

1. **Stack e Infraestrutura:**
   - **Framework:** Astro 5 com Tailwind CSS v4 e suporte a MDX.
   - **Deploy & Hospedagem:** GitHub Pages com pipeline de entrega contínua (CI/CD) via GitHub Actions.
   - **Automação Editorial:** Fila editorial estruturada em `data/editorial-queue.json` acionada por agendamento (cron) duas vezes por semana (`auto-publish.yml`).
   - **Feed de Distribuição Pinterest:** Endpoint estático `/pinterest-feed.xml` com suporte completo a RSS 2.0 e enclosures para Rich Pins.
   - **Gerador de Criativos Verticais:** Endpoint `/api/pin-image/[slug].svg` que compila criativos vetoriais de 1000x1500px em tempo de build para alta conversão no Pinterest.

2. **Design, UI/UX e Conversão (Mobile-First):**
   - Layout limpo, minimalista e com carregamento ultrarrápido (< 1s).
   - Componentes orientados à conversão: `ProductCard`, `ComparisonTable`, `AffiliateDisclosure`, `PrimeBountyCard` e `StickyMobileBar`.
   - CTAs evidentes ("Check Price on Amazon", "View on Amazon").
   - **Janela de Cookie de 90 Dias (Add to Cart):** Implementação de botões de adição direta ao carrinho (`buildAmazonAddToCartUrl`) estendendo a janela de atribuição de 24 horas para 90 dias.
   - Instrumentação com atributos `data-track="amazon-outbound"`, `data-asin` e `data-product-name` para rastreamento de cliques de saída.

3. **Internacionalização e Mercado-Alvo:**
   - Todo o conteúdo editorial, títulos, descrições, criativos de anúncios e textos de Pins devem ser estritamente em **inglês americano nativo** (`en-US`), com gírias e expressões naturais de compras nos EUA (ex.: "budget-friendly", "heavy-duty", "game changer", "vet-approved").
   - A documentação interna, commits e discussões técnicas permanecem em **Português do Brasil (PT-BR)**.

4. **Conformidade com o Amazon Associates Program (Operating Agreement):**
   - **Proibição de Direct Linking em Anúncios:** É estritamente proibido veicular anúncios pagos (Pinterest Ads, Meta Ads, Google Ads) que redirecionem diretamente para URLs da Amazon usando a tag de afiliado. O anúncio deve sempre direcionar o usuário para a página de análise/artigo intermediária (Bridge Page) do `paw-and-home`.
   - **Transparência e FTC Disclosure:** Todas as páginas com links de afiliados e criativos de divulgação externa devem exibir a declaração oficial da FTC ("As an Amazon Associate, we earn from qualifying purchases..."). Nos Pins e anúncios, deve constar `#ad` ou `#affiliate`.
   - **Política de Preços:** Não exibir preços estáticos ou promessas de descontos em texto fixo. O preço deve ser conferido em tempo real na Amazon ("Check Price on Amazon"), a menos que seja obtido dinamicamente via Amazon PA-API com timestamp de verificação.
   - **Hospedagem de Imagens:** As imagens dos produtos devem ser servidas a partir dos servidores CDN oficiais da Amazon (`m.media-amazon.com`) ou Unsplash para fotos de capa contextuais, respeitando os direitos autorais dos fabricantes.

---

## Integração com a API do Pinterest (Ad Delivery & Pin Automation)

### 1. Parâmetros e Credenciais da API (Tier Trial)
- **Pinterest App ID:** `1623625`
- **Referência Oficial:** [`pinterest/api-quickstart`](https://github.com/pinterest/api-quickstart)
- **Ambientes Suportados:** Sandbox (`https://api-sandbox.pinterest.com/v5`) e Produção (`https://api.pinterest.com/v5`), configuráveis via variável `PINTEREST_ENVIRONMENT`.
- **Cota Diária:** 1.000 requisições a cada 24 horas (janela móvel).
- **Consumo Estimado:** Publicar de 10 a 25 Pins orgânicos diários consome entre 10 e 50 requisições/dia (< 5% da cota).
- **Rate Limiting:** Implementado na classe `PinterestRateLimiter` (`src/utils/pinterest.ts`), controlando requisições e emitindo alertas caso o consumo atinja 90% da cota diária.
- **Autenticação OAuth 2.0:** Script `scripts/pinterest-oauth.mjs` que inicia servidor local em `http://localhost:8085/`, executa a troca de código por Access Token e Refresh Token, e os salva em `.pinterest-token.json`.
- **Automação via CI/CD:** Script `scripts/pinterest-publish.mjs` conectado ao workflow `.github/workflows/auto-publish.yml` para publicação contínua de novos artigos.

### 2. Estratégia de Entrega de Conteúdo e Anúncios (Multi-Pinning)
- **Formato Visual dos Criativos:** Pins verticais em proporção 2:3 (1000x1500px) gerados via `src/utils/pin-image.ts`.
- **Estratégia de Multi-Pinning:** Método `generateMultiPinHooks` que desdobra cada artigo publicado em 4 criativos com ganchos complementares em inglês americano:
  1. `hook_pain`: Dor e alívio imediato para pets/donos;
  2. `hook_value`: Custo-benefício e compra inteligente;
  3. `hook_durability`: Durabilidade, facilidade de lavagem e resistência;
  4. `hook_comparison`: Prova social, testes laboratoriais e notas de compradores.
- **Destino do Tráfego:** URLs canônicas com parâmetros de rastreamento UTM geradas via `generateAdUtmLink`:
  `https://uadson.github.io/paw-and-home/articles/<slug>/?utm_source=pinterest&utm_medium=pin&utm_campaign=<slug>&utm_content=<hook>`
- **Sub-Tracking Amazon:** Links da Amazon gerados com suporte ao parâmetro `ascsubtag` (`buildAmazonUrl` e `buildAmazonAddToCartUrl`) para atribuir conversões aos Pins.

### 3. Pinterest Tag (Telemetria & Pixel)
- **Script Base:** Injetado via `SeoHead.astro` utilizando `buildPinterestTagSnippet` com suporte à variável de ambiente `PUBLIC_PINTEREST_TAG_ID`.
- **Rastreamento de Conversão:** Listener em `BaseLayout.astro` que captura cliques em links afiliados e despacha o evento `pintrk('track', 'lead', { lead_type: 'Amazon Outbound Click', asin, product_name })`.
