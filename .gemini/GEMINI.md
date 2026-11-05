# Contexto do Projeto: Amazon Affiliate Niche Site (EUA)

## Visão Geral
Este repositório contém o código-fonte de um site estático de curadoria de produtos afiliados focados no mercado americano (Amazon.com). O objetivo principal é atrair tráfego altamente qualificado dos EUA através de SEO orgânico e entrega automatizada de anúncios/Pins nas redes visuais (como o Pinterest), convertendo visitantes através de recomendações imparciais em nichos de alta conversão (ex.: *Pet Care*, *Home & Kitchen Organization*, *Smart Living*).

---

## Diretrizes Técnicas e de Arquitetura

1. **Stack e Infraestrutura:**
   - **Framework:** Astro 5 com Tailwind CSS v4 e suporte a MDX.
   - **Deploy & Hospedagem:** GitHub Pages com pipeline de entrega contínua (CI/CD) via GitHub Actions.
   - **Automação Editorial:** Fila editorial estruturada em `data/editorial-queue.json` acionada por agendamento (cron) duas vezes por semana (`auto-publish.yml`).

2. **Design, UI/UX e Conversão (Mobile-First):**
   - Layout limpo, minimalista e com carregamento ultrarrápido (< 1s).
   - Componentes orientados à conversão: `ProductCard`, `ComparisonTable`, `AffiliateDisclosure`, `PrimeBountyCard` e `StickyMobileBar`.
   - CTAs evidentes ("Check Price on Amazon", "View on Amazon").

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

### 1. Parâmetros e Limites da API (Tier Trial)
- **Cota Diária:** 1.000 requisições a cada 24 horas (janela móvel).
- **Consumo Estimado:** Publicar de 10 a 25 Pins orgânicos diários consome entre 10 e 50 requisições/dia (< 5% da cota). Gestão de campanhas no Pinterest Ads consome entre 20 e 60 requisições/dia. A integração é **100% viável** dentro dos limites do plano gratuito/trial.
- **Autenticação:** OAuth 2.0 (Bearer Token via Refresh Token armazenado como secret no GitHub Actions).

### 2. Estratégia de Entrega de Conteúdo e Anúncios
- **Formato Visual dos Criativos:** Pins e anúncios verticais (proporção 2:3, preferencialmente 1000x1500px).
- **Destino do Tráfego:** URLs canônicas com parâmetros de rastreamento UTM:
  `https://uadson.github.io/paw-and-home/articles/<slug>/?utm_source=pinterest&utm_medium=<organic|ad>&utm_campaign=<category>`
- **Sub-Tracking Amazon:** Nos links de saída, registrar o parâmetro `ascsubtag` correspondente à fonte (ex.: `ascsubtag=pin_<slug>`) para atribuição de receita no relatório do Amazon Associates.

### 3. Pinterest Tag (Telemetria & Pixel)
- Inserir a biblioteca base `pintrk` no cabeçalho do site para rastreamento de visitas (`PageVisit`).
- Disparar eventos de saída (`OutboundClick` ou `Lead`) nos botões de CTA da Amazon para alimentar o algoritmo de otimização de conversão do Pinterest Ads.
