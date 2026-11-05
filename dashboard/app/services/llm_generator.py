"""Gerador autônomo de artigos editoriais de afiliados via Groq / Llama 3.3.

Opera 100% em nuvem serverless (sem necessidade de GPU local), estruturando
o conteúdo em inglês americano no schema JSON estrito de editorial-queue.json.
"""

import json
import re
from typing import Any, Dict
import httpx


class LlmArticleGenerator:
    """Orquestra a geração de artigos via APIs de LLM gratuitas (Groq/Llama)."""

    @staticmethod
    def slugify(text: str) -> str:
        """Converte uma string em um slug URL-friendly em minúsculas.

        Args:
            text: Texto de entrada (ex.: título do artigo).

        Returns:
            Slug sanitizado separado por hífens.
        """
        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text).strip()
        return re.sub(r"[-\s]+", "-", text)

    def format_article_payload(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitiza e valida a estrutura do artigo para conformidade com a fila editorial.

        Args:
            raw_data: Dicionário contendo os dados brutos gerados pela LLM.

        Returns:
            Dicionário padronizado no formato consumido pelo Astro e publish-next.mjs.
        """
        title = raw_data.get("title", "Untitled Review Guide")
        slug = self.slugify(title)

        detailed_products = raw_data.get("detailedProducts", [])
        top_asin = ""
        top_name = ""

        if detailed_products and isinstance(detailed_products, list) and len(detailed_products) > 0:
            first = detailed_products[0]
            top_asin = first.get("asin", "")
            top_name = first.get("name", "")

        return {
            "id": slug,
            "slug": slug,
            "title": title,
            "description": raw_data.get("description", ""),
            "category": raw_data.get("category", "Pet Care"),
            "author": raw_data.get("author", "Pet Care Editorial Team"),
            "heroImage": raw_data.get(
                "heroImage",
                "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=1200&auto=format&fit=crop&q=80",
            ),
            "heroImageAlt": raw_data.get("heroImageAlt", title),
            "status": "pending",
            "tags": raw_data.get("tags", [raw_data.get("category", "Pet Care")]),
            "intro": raw_data.get("intro", ""),
            "comparisonProducts": raw_data.get("comparisonProducts", []),
            "detailedProducts": detailed_products,
            "buyersGuide": raw_data.get("buyersGuide", []),
            "faqs": raw_data.get("faqs", []),
            "topPickName": top_name,
            "topPickAsin": top_asin,
            "pinterestPinned": False,
        }

    async def generate_article_with_groq(
        self, topic: str, category: str, groq_api_key: str
    ) -> Dict[str, Any]:
        """Gera um artigo completo de alta conversão usando Llama 3.3 70B via Groq Cloud API.

        Args:
            topic: Tema ou palavra-chave (ex.: 'Automatic Cat Water Fountains').
            category: Categoria editorial (ex.: 'Pet Care' ou 'Home Organization').
            groq_api_key: Chave de API gratuita da Groq Cloud.

        Returns:
            Dicionário com o artigo formatado pronto para inserção na fila.
        """
        system_prompt = (
            "You are an expert affiliate marketer and copywriter for the US market. "
            "Generate an in-depth review article in English (en-US) evaluating 3 to 5 top products. "
            "Output ONLY valid JSON matching this structure:\n"
            "{\n"
            '  "title": "Title with year 2026",\n'
            '  "description": "Engaging 150-char SEO meta description",\n'
            f'  "category": "{category}",\n'
            '  "author": "Editorial Review Team",\n'
            '  "heroImage": "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=1200",\n'
            '  "heroImageAlt": "Alt text for hero image",\n'
            '  "tags": ["Tag1", "Tag2"],\n'
            '  "intro": "Persuasive 2-paragraph introduction with shopping intent",\n'
            '  "comparisonProducts": [{"name": "Product 1", "badge": "Best Overall", "rating": 4.8, "asin": "B089ABCDEF", "image": "https://m.media-amazon.com/images/p1.jpg", "highlight": "Key spec"}],\n'
            '  "detailedProducts": [{"rank": 1, "badge": "Best Overall", "name": "Product 1", "tagline": "Short tagline", "brand": "BrandName", "asin": "B089ABCDEF", "image": "https://m.media-amazon.com/images/p1.jpg", "rating": 4.8, "reviewCount": 15000, "verdict": "Verdict text", "specs": {"Spec1": "Val1"}, "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1"], "ctaText": "Check Price on Amazon"}],\n'
            '  "buyersGuide": [{"title": "Factor 1", "text": "Guide advice"}],\n'
            '  "faqs": [{"question": "Q1?", "answer": "A1."}]\n'
            "}"
        )

        user_prompt = f"Topic to review: {topic}. Target US consumers with clear buying criteria."

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
        }

        body = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=body,
            )

            if response.status_code != 200:
                raise RuntimeError(f"Groq API error ({response.status_code}): {response.text}")

            result = response.json()
            content_str = result["choices"][0]["message"]["content"]
            raw_data = json.loads(content_str)
            return self.format_article_payload(raw_data)
