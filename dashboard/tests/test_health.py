"""Testes unitários para os endpoints de integridade da API FastAPI."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    """Verifica se o endpoint /health responde status 200 e payload correto."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "paw-and-home-monitor"
    assert "version" in data
