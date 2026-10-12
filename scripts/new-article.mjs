#!/usr/bin/env node
/**
 * Script de Automação para Criação de Novos Artigos de Afiliados.
 *
 * Gera um arquivo MDX pronto para publicação em src/content/articles/
 * com frontmatter validado, componentes de alta conversão (ProductCard, ComparisonTable, FaqAccordion),
 * e estrutura editorial para ranqueamento no Google US e vendas no Amazon Associates.
 *
 * Uso:
 *   node scripts/new-article.mjs --title "5 Best Dog Grooming Clippers of 2026" --category "Pet Care"
 */

import fs from 'node:fs';
import path from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: '',
    category: 'Pet Care',
    author: 'Editorial Review Team',
    tags: '',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      options.title = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1];
      i++;
    } else if (args[i] === '--author' && args[i + 1]) {
      options.author = args[i + 1];
      i++;
    } else if (args[i] === '--tags' && args[i + 1]) {
      options.tags = args[i + 1];
      i++;
    }
  }

  return options;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const options = parseArgs();

if (!options.title) {
  console.log('⚠️  Nenhum título informado. Usando exemplo padrão.');
  options.title = '5 Best Smart Pet Feeders of 2026: Automatic & App-Controlled';
}

const slug = slugify(options.title);
const targetPath = path.resolve(process.cwd(), `src/content/articles/${slug}.mdx`);

if (fs.existsSync(targetPath)) {
  console.error(`❌ Erro: O arquivo já existe em ${targetPath}`);
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
const tagsList = options.tags
  ? options.tags.split(',').map((t) => t.trim())
  : [options.category, 'Buyer Guide', 'Amazon Picks'];

const contentTemplate = `---
title: "${options.title}"
description: "Looking for top-rated recommendations? We spent 40+ hours evaluating specifications, verified customer ratings, and hands-on performance."
publishDate: ${today}
updatedDate: ${today}
author: "${options.author}"
category: "${options.category}"
heroImage: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&auto=format&fit=crop&q=80"
heroImageAlt: "${options.title}"
featured: false
rating: 4.8
tags:
${tagsList.map((tag) => `  - "${tag}"`).join('\n')}
---

import ProductCard from '../../components/ProductCard.astro';
import ComparisonTable from '../../components/ComparisonTable.astro';
import FaqAccordion from '../../components/FaqAccordion.astro';

Whether you are looking to upgrade your setup or solving everyday household frustrations, finding the right gear on Amazon can be overwhelming.

To help you make an informed investment without second-guessing, our editorial team analyzed independent lab data, tested top-rated contenders, and filtered out artificial ratings to select the top picks for 2026.

<ComparisonTable
  products={[
    {
      name: "Top Rated Pick Model #1",
      badge: "Best Overall",
      rating: 4.8,
      asin: "B09DSVFNRW",
      image: "https://m.media-amazon.com/images/I/71R2o5nK5CL._AC_SL1500_.jpg",
      highlight: "Premium durability, reliable performance, and highest user satisfaction"
    },
    {
      name: "Value Pick Model #2",
      badge: "Best Budget",
      rating: 4.6,
      asin: "B0146QXOB0",
      image: "https://m.media-amazon.com/images/I/71X8k8M5TfL._AC_SL1500_.jpg",
      highlight: "Affordable price point without compromising on essential features"
    }
  ]}
/>

---

## Detailed Product Reviews

<ProductCard
  rank={1}
  badge="Best Overall Pick"
  name="Premium Pick Model #1"
  tagline="The undisputed benchmark for everyday durability and high performance"
  brand="BrandName"
  asin="B09DSVFNRW"
  image="https://m.media-amazon.com/images/I/71R2o5nK5CL._AC_SL1500_.jpg"
  rating={4.8}
  reviewCount={14500}
  verdict="Exceeded expectations across all testing parameters. If you want the most reliable option without compromising quality, this is the one to get."
  specs={{
    "Material": "Commercial-Grade Durable Build",
    "Warranty": "1-Year Manufacturer Support",
    "Compatibility": "Universal US Household Standards"
  }}
  pros={[
    "Outstanding build quality built to last for years",
    "Intuitive design requiring minimal setup time",
    "Consistently ranks #1 in verified consumer satisfaction tests"
  ]}
  cons={[
    "Slightly higher initial investment than entry-level competitors"
  ]}
  ctaText="View on Amazon"
  showSchema={true}
/>

<ProductCard
  rank={2}
  badge="Best Budget Value"
  name="Value Pick Model #2"
  tagline="Smart, wallet-friendly engineering with excellent daily reliability"
  brand="BudgetBrand"
  asin="B0146QXOB0"
  image="https://m.media-amazon.com/images/I/71X8k8M5TfL._AC_SL1500_.jpg"
  rating={4.6}
  reviewCount={8900}
  verdict="Delivers 90% of the premium features at a fraction of the cost, making it the smartest bargain on Amazon."
  specs={{
    "Build": "BPA-Free Lightweight Composite",
    "Warranty": "Standard Limited Warranty"
  }}
  pros={[
    "Incredible price-to-performance ratio",
    "Compact footprint fits seamlessly into any space"
  ]}
  cons={[
    "Lacks some advanced automation settings present in higher-tier alternatives"
  ]}
  ctaText="Check Price on Amazon"
  showSchema={true}
/>

---

## Comprehensive Buyer's Guide

Before ordering, keep these critical evaluation criteria in mind:

### 1. Build Quality & Materials
Always look for food-grade, BPA-free, or stainless steel components where applicable to ensure safety and hygiene.

### 2. Verified User Feedback & Long-Term Durability
Look past 5-star reviews on day one. We evaluate products that hold up after 6 to 12 months of daily wear and tear.

---

<FaqAccordion
  items={[
    {
      question: "Why should I purchase through Amazon?",
      answer: "Amazon offers fast Prime delivery, hassle-free 30-day returns, and official manufacturer warranty backing on eligible items."
    },
    {
      question: "Are prices accurate on this review?",
      answer: "Amazon prices fluctuate dynamically with coupons and sales events. Click 'Check Price on Amazon' for current real-time pricing and offers."
    }
  ]}
/>
`;

fs.writeFileSync(targetPath, contentTemplate.trimStart(), 'utf-8');
console.log(`✅ Novo artigo criado com sucesso em: ${targetPath}`);
console.log(`🔗 Slug gerado: /articles/${slug}`);
