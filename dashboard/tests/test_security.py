"""Testes de segurança e controle de acesso HTTP Basic para proteção do painel."""

import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_public_healthcheck_always_accessible() -> None:
    """O endpoint /health deve ser sempre acessível sem credenciais para o Fly.io."""
    response = client.get("/health")
    assert response.status_code == 200


def test_dashboard_protected_when_password_set(monkeypatch) -> None:
    """Quando DASHBOARD_PASSWORD estiver configurada, exige autenticação HTTP Basic."""
    monkeypatch.setenv("DASHBOARD_PASSWORD", "secret123")
    monkeypatch.setenv("DASHBOARD_USERNAME", "admin")

    # Acesso sem credenciais -> 401
    unauth_resp = client.get("/")
    assert unauth_resp.status_code == 401
    assert "WWW-Authenticate" in unauth_resp.headers

    # Acesso com credenciais erradas -> 401
    bad_auth_resp = client.get("/", auth=("admin", "wrongpassword"))
    assert bad_auth_resp.status_code == 401

    # Acesso com credenciais corretas -> 200
    good_auth_resp = client.get("/", auth=("admin", "secret123"))
    assert good_auth_resp.status_code == 200
