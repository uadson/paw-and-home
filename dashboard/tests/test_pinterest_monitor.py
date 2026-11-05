"""Testes unitários para o monitoramento da API do Pinterest v5."""

from app.services.pinterest_monitor import PinterestMonitorService


def test_pinterest_monitor_initial_state() -> None:
    """Verifica os valores padrão e cálculo de saldo da cota diária de requisições."""
    service = PinterestMonitorService(daily_limit=1000)
    status = service.get_quota_status()

    assert status["daily_limit"] == 1000
    assert status["used_today"] == 0
    assert status["remaining_today"] == 1000
    assert status["is_near_limit"] is False


def test_pinterest_monitor_record_calls() -> None:
    """Verifica a contagem e alerta de consumo acima de 90%."""
    service = PinterestMonitorService(daily_limit=100)
    for _ in range(92):
        service.record_request()

    status = service.get_quota_status()
    assert status["used_today"] == 92
    assert status["remaining_today"] == 8
    assert status["is_near_limit"] is True
