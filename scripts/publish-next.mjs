#!/usr/bin/env node
/**
 * Robô Publicador da Fila Editorial (Auto-Publisher).
 *
 * Lê a fila em data/editorial-queue.json, seleciona o próximo tópico pendente,
 * compila o artigo MDX estruturado com os componentes de conversão de afiliados,
 * atualiza o status na fila e prepara o repositório para deploy.
 */

import fs from 'node:fs';
import path from 'node:path';

const queuePath = path.resolve(process.cwd(), 'data/editorial-queue.json');
const articlesDir = path.resolve(process.cwd(), 'src/content/articles');

if (!fs.existsSync(queuePath)) {
  console.error(`❌ Fila editorial não encontrada em: ${queuePath}`);
  process.exit(1);
}

const rawData = fs.readFileSync(queuePath, 'utf-8');
const queue = JSON.parse(rawData);

// Encontra o próximo artigo pendente
const nextIndex = queue.findIndex((item) => item.status === 'pending');

if (nextIndex === -1) {
  console.log('🎉 Todos os artigos da fila editorial já foram publicados!');
  process.exit(0);
}

const item = queue[nextIndex];
const today = new Date().toISOString().split('T')[0];
const targetPath = path.join(articlesDir, `${item.slug}.mdx`);

if (fs.existsSync(targetPath)) {
  console.warn(`⚠️ Arquivo já existe em ${targetPath}. Marcando como publicado.`);
  item.status = 'published';
  item.publishedAt = today;
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8');
  process.exit(0);
}

// Gera o conteúdo MDX
const mdxContent = `---
title: "${item.title.replace(/"/g, '\\"')}"
description: "${item.description.replace(/"/g, '\\"')}"
publishDate: ${today}
updatedDate: ${today}
author: "${item.author}"
category: "${item.category}"
heroImage: "${item.heroImage}"
heroImageAlt: "${item.heroImageAlt.replace(/"/g, '\\"')}"
featured: false
rating: 4.8
tags:
${item.tags.map((tag) => `  - "${tag}"`).join('\n')}
topPickName: "${item.detailedProducts[0]?.name ? item.detailedProducts[0].name.replace(/"/g, '\\"') : ''}"
topPickAsin: "${item.detailedProducts[0]?.asin || ''}"
---

import ProductCard from '../../components/ProductCard.astro';
import ComparisonTable from '../../components/ComparisonTable.astro';
import FaqAccordion from '../../components/FaqAccordion.astro';

${item.intro}

<ComparisonTable
  products={${JSON.stringify(item.comparisonProducts, null, 2)}}
/>

---

## Detailed In-Depth Reviews

${item.detailedProducts.map((p) => `<ProductCard
  rank={${p.rank}}
  badge={${JSON.stringify(p.badge)}}
  name={${JSON.stringify(p.name)}}
  tagline={${JSON.stringify(p.tagline)}}
  brand={${JSON.stringify(p.brand)}}
  asin={${JSON.stringify(p.asin)}}
  image={${JSON.stringify(p.image)}}
  rating={${p.rating}}
  reviewCount={${p.reviewCount}}
  verdict={${JSON.stringify(p.verdict)}}
  specs={${JSON.stringify(p.specs, null, 4)}}
  pros={${JSON.stringify(p.pros)}}
  cons={${JSON.stringify(p.cons)}}
  ctaText={${JSON.stringify(p.ctaText || 'Check Price on Amazon')}}
  showSchema={true}
/>`).join('\n\n')}

---

## Essential Buyer's Guide

Before ordering on Amazon, evaluate these critical factors:

${item.buyersGuide.map((bg, idx) => `### ${idx + 1}. ${bg.title}\n${bg.text}`).join('\n\n')}

---

<FaqAccordion
  items={${JSON.stringify(item.faqs.map((f) => ({ question: f.question, answer: f.text })), null, 2)}}
/>
`;

fs.writeFileSync(targetPath, mdxContent.trimStart(), 'utf-8');

// Atualiza a fila
item.status = 'published';
item.publishedAt = today;
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8');

const remainingCount = queue.filter((i) => i.status === 'pending').length;

console.log(`✅ Artigo publicado com sucesso: ${item.title}`);
console.log(`📄 Salvo em: ${targetPath}`);
console.log(`📊 Artigos restantes na fila: ${remainingCount}`);
