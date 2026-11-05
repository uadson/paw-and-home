"""Testes de segurança e controle de acesso HTTP Basic para proteção do painel."""

import base64
import secrets
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_public_healthcheck_always_accessible() -> None:
    """O endpoint /health deve ser sempre acessível sem credenciais para o Fly.io."""
    response = client.get("/health")
    assert response.status_code == 200


def test_dashboard_protected_when_password_set(monkeypatch) -> None:
    """Quando DASHBOARD_PASSWORD estiver configurada, exige autenticação HTTP Basic."""
    # Gera credenciais efêmeras em tempo de execução sem valores literais sensíveis
    user_key = f"usr_{secrets.token_hex(4)}"
    pass_key = f"pwd_{secrets.token_hex(8)}"

    monkeypatch.setenv("DASHBOARD_USERNAME", user_key)
    monkeypatch.setenv("DASHBOARD_PASSWORD", pass_key)

    # 1. Requisição sem credenciais -> 401 Unauthorized
    unauth_resp = client.get("/")
    assert unauth_resp.status_code == 401
    assert "WWW-Authenticate" in unauth_resp.headers

    # 2. Requisição com credencial inválida -> 401 Unauthorized
    invalid_b64 = base64.b64encode(f"{user_key}:mismatch".encode("utf-8")).decode("utf-8")
    bad_auth_resp = client.get("/", headers={"Authorization": f"Basic {invalid_b64}"})
    assert bad_auth_resp.status_code == 401

    # 3. Requisição com credencial legítima -> 200 OK
    valid_b64 = base64.b64encode(f"{user_key}:{pass_key}".encode("utf-8")).decode("utf-8")
    good_auth_resp = client.get("/", headers={"Authorization": f"Basic {valid_b64}"})
    assert good_auth_resp.status_code == 200
