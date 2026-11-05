"""Serviço de telemetria e monitoramento da API do Pinterest v5.

Monitora o consumo da cota diária (1.000 requisições/dia), emite alertas preventivos
e consulta métricas de perfil e quadros na API oficial.
"""

from typing import Any, Dict
import httpx


class PinterestMonitorService:
    """Gerencia a telemetria de consumo da API do Pinterest v5 e métricas de conta."""

    def __init__(self, daily_limit: int = 1000) -> None:
        """Inicializa o serviço de monitoramento.

        Args:
            daily_limit: Limite máximo diário de chamadas de API (padrão: 1000 no plano trial).
        """
        self.daily_limit = daily_limit
        self.used_today = 0

    def can_request(self) -> bool:
        """Verifica se ainda há saldo de requisições na janela diária.

        Returns:
            True se houver cota disponível, False caso contrário.
        """
        return self.used_today < self.daily_limit

    def record_request(self) -> None:
        """Incrementa o contador de requisições consumidas."""
        if self.used_today < self.daily_limit:
            self.used_today += 1

    def get_quota_status(self) -> Dict[str, Any]:
        """Retorna o estado atual da cota e alertas de sobrecarga.

        Returns:
            Dicionário com o limite diário, uso, saldo restante e alerta se > 90%.
        """
        remaining = max(0, self.daily_limit - self.used_today)
        is_near = self.used_today >= (self.daily_limit * 0.9)
        percentage = round((self.used_today / self.daily_limit) * 100, 1) if self.daily_limit > 0 else 0.0

        return {
            "daily_limit": self.daily_limit,
            "used_today": self.used_today,
            "remaining_today": remaining,
            "percentage_used": percentage,
            "is_near_limit": is_near,
        }

    async def fetch_account_metrics(self, access_token: str, is_sandbox: bool = True) -> Dict[str, Any]:
        """Consulta as métricas reais da conta no endpoint oficial da API do Pinterest v5.

        Args:
            access_token: Token de acesso Bearer ativo.
            is_sandbox: Define se a chamada deve ser feita no ambiente Sandbox ou Produção.

        Returns:
            Dicionário com informações do perfil (boards, pins, impressões) ou mensagem de erro.
        """
        base_url = "https://api-sandbox.pinterest.com/v5" if is_sandbox else "https://api.pinterest.com/v5"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        self.record_request()
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{base_url}/user_account", headers=headers)
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": response.text,
                }
            except httpx.RequestError as exc:
                return {"success": False, "error": f"Erro de conexão: {str(exc)}"}
