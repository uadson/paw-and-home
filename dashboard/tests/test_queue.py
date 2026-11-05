"""Testes unitários para o serviço de fila editorial e monitoramento."""

import json
from pathlib import Path
from typing import Any, Dict

from app.services.queue_service import QueueService


def test_queue_service_load_and_stats(tmp_path: Path) -> None:
    """Verifica se o serviço calcula corretamente estatísticas de pendentes e publicados."""
    fake_queue = [
        {"id": "art-1", "slug": "art-1", "status": "published", "pinterestPinned": True},
        {"id": "art-2", "slug": "art-2", "status": "published", "pinterestPinned": False},
        {"id": "art-3", "slug": "art-3", "status": "pending", "pinterestPinned": False},
    ]
    file_path = tmp_path / "editorial-queue.json"
    file_path.write_text(json.dumps(fake_queue), encoding="utf-8")

    service = QueueService(queue_path=file_path)
    stats = service.get_stats()

    assert stats["total_articles"] == 3
    assert stats["published_articles"] == 2
    assert stats["pending_articles"] == 1
    assert stats["pinned_pins"] == 1
    assert stats["pending_pins"] == 1


def test_queue_service_add_article(tmp_path: Path) -> None:
    """Verifica a adição de um novo artigo gerado via LLM na fila."""
    fake_queue: list[Dict[str, Any]] = []
    file_path = tmp_path / "editorial-queue.json"
    file_path.write_text(json.dumps(fake_queue), encoding="utf-8")

    service = QueueService(queue_path=file_path)
    new_item = {
        "id": "best-dog-ramps",
        "slug": "best-dog-ramps",
        "title": "5 Best Dog Ramps of 2026",
        "description": "Safe ramps for senior dogs.",
        "category": "Pet Care",
        "author": "Pet Care Editorial Team",
        "heroImage": "https://images.unsplash.com/photo-ramp.jpg",
        "heroImageAlt": "Dog using ramp",
        "status": "pending",
        "tags": ["Dog Care", "Ramps"],
        "intro": "Intro text here...",
        "comparisonProducts": [],
        "detailedProducts": [],
        "buyersGuide": [],
        "faqs": [],
    }

    added = service.add_article(new_item)
    assert added is True
    assert service.get_stats()["total_articles"] == 1
    assert service.get_stats()["pending_articles"] == 1
