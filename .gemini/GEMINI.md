# Contexto do Projeto: Amazon Affiliate Niche Site (EUA)

## Visão Geral
Este repositório contém o código-fonte de um site estático/SSR de curadoria de produtos afiliados focados no mercado americano (Amazon.com). O objetivo do site é atrair tráfego orgânico (SEO) dos EUA, apresentando recomendações altamente qualificadas em nichos de alta conversão (ex: Casa & Organização, Pet Care, Fitness Compacto e Tech).

## Diretrizes Técnicas e de Arquitetura
1. **Stack Sugerida:** Astro ou Next.js (Gerada estaticamente para máxima performance e deploy gratuito no GitHub Pages).
2. **Design e Responsividade:** Layout minimalista, limpo e focado em conversão (Mobile-First), com tabelas comparativas claras, botões de chamada para ação (CTA) evidentes ("View on Amazon") e carregamento ultrarrápido (< 1s).
3. **Internacionalização:** Conteúdo 100% em inglês nativo (americano), focado em intenções de busca transacionais (ex: "Best compact smart pet feeder for small dogs", "Top rated under-desk storage solutions").
4. **Conformidade com a Amazon:** 
   - Inclusão obrigatória do disclaimer de afiliados da Amazon (FTC Disclosure) no rodapé e no topo das páginas de review.
   - Links de afiliados configurados corretamente com a tag de rastreio (`tag=seu-id-20`).
   - Ausência de preços fixos estáticos incorretos (preferência por avisos de que o preço varia na Amazon).

## Estrutura de Pastas Esperada
- `/src/content/articles/` -> Artigos e guias de curadoria em Markdown/MDX.
- `/src/components/` -> Componentes reutilizáveis (ProductCard, ComparisonTable, DisclosureBanner).
- `public/` -> Ativos estáticos e imagens otimizadas.
