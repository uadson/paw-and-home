"""Testes unitários para o gerador autônomo de artigos via Groq / Llama."""

from app.services.llm_generator import LlmArticleGenerator


def test_format_article_payload_validation() -> None:
    """Verifica a higienização e validação estrutural do schema do artigo gerado."""
    generator = LlmArticleGenerator()
    raw_data = {
        "title": "5 Best Smart Cat Toys of 2026",
        "description": "Interactive laser and puzzle toys tested for indoor cats.",
        "category": "Pet Care",
        "author": "Pet Care Editorial Team",
        "heroImage": "https://images.unsplash.com/photo-cat.jpg",
        "tags": ["Cat Toys", "Pet Tech"],
        "intro": "Indoor cats need mental stimulation...",
        "comparisonProducts": [
            {
                "name": "Interactive Laser Toy",
                "badge": "Best Overall",
                "rating": 4.8,
                "asin": "B089ABCDEF",
                "image": "https://m.media-amazon.com/images/toy.jpg",
                "highlight": "Automatic timer and silent motor",
            }
        ],
        "detailedProducts": [
            {
                "rank": 1,
                "badge": "Best Overall",
                "name": "Interactive Laser Toy",
                "tagline": "Automatic 360-degree laser",
                "brand": "PetTech",
                "asin": "B089ABCDEF",
                "image": "https://m.media-amazon.com/images/toy.jpg",
                "rating": 4.8,
                "reviewCount": 12500,
                "verdict": "Great for bored indoor cats.",
                "specs": {"Power": "USB Rechargeable"},
                "pros": ["Silent", "Durable"],
                "cons": ["Small laser aperture"],
                "ctaText": "Check Price on Amazon",
            }
        ],
        "buyersGuide": [
            {
                "title": "Battery Life",
                "text": "Choose USB-C rechargeable toys over AA batteries.",
            }
        ],
        "faqs": [
            {
                "question": "Are laser toys safe for cats?",
                "answer": "Yes, provided the beam is low-intensity class 1.",
            }
        ],
    }

    formatted = generator.format_article_payload(raw_data)
    assert formatted["slug"] == "5-best-smart-cat-toys-of-2026"
    assert formatted["status"] == "pending"
    assert formatted["topPickAsin"] == "B089ABCDEF"
    assert len(formatted["comparisonProducts"]) == 1
