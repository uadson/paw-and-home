"""Aplicação FastAPI para monitoramento e controle autônomo do Paw & Home.

Fornece endpoints REST e interface web para supervisão da cota da Pinterest API v5,
status da fila editorial e geração autônoma de novos artigos via Llama 3.3 (Groq).
"""

import os
import secrets
from typing import Any, Dict, Optional
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field

from app.services.llm_generator import LlmArticleGenerator
from app.services.pinterest_monitor import PinterestMonitorService
from app.services.queue_service import QueueService

app = FastAPI(
    title="Paw & Home Monitor & Control Plane",
    description="Painel de controle para entrega de anúncios Pinterest e geração autônoma de afiliados Amazon.",
    version="1.0.0",
)

queue_service = QueueService()
pinterest_service = PinterestMonitorService(daily_limit=1000)
llm_generator = LlmArticleGenerator()
http_basic = HTTPBasic(auto_error=False)


def verify_auth(credentials: Optional[HTTPBasicCredentials] = Depends(http_basic)) -> bool:
    """Valida credenciais HTTP Basic para proteger o painel contra acesso público indevido.

    Args:
        credentials: As credenciais fornecidas no cabeçalho Authorization.

    Returns:
        True caso as credenciais sejam válidas ou se nenhuma senha estiver definida.

    Raises:
        HTTPException: Erro 401 Unauthorized caso as credenciais estejam ausentes ou incorretas.
    """
    expected_password = os.environ.get("DASHBOARD_PASSWORD")
    if not expected_password:
        return True

    expected_username = os.environ.get("DASHBOARD_USERNAME", "admin")

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso restrito. Autenticação HTTP Basic requerida.",
            headers={"WWW-Authenticate": 'Basic realm="PawAndHomeDashboard"'},
        )

    valid_user = secrets.compare_digest(credentials.username.encode("utf-8"), expected_username.encode("utf-8"))
    valid_pass = secrets.compare_digest(credentials.password.encode("utf-8"), expected_password.encode("utf-8"))

    if not (valid_user and valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": 'Basic realm="PawAndHomeDashboard"'},
        )

    return True


class GenerateArticleRequest(BaseModel):
    """Modelo de entrada para requisição de geração autônoma de artigos."""

    topic: str = Field(..., description="Tema ou palavra-chave do artigo", json_schema_extra={"example": "Best Smart Dog Feeders"})
    category: str = Field(default="Pet Care", description="Categoria editorial", json_schema_extra={"example": "Pet Care"})
    groq_api_key: Optional[str] = Field(default=None, description="Chave opcional da Groq Cloud API")


@app.get("/health")
def health_check() -> Dict[str, str]:
    """Endpoint de integridade e verificação de uptime para o Fly.io."""
    return {
        "status": "ok",
        "app": "paw-and-home-monitor",
        "version": "1.0.0",
    }


@app.get("/api/stats", dependencies=[Depends(verify_auth)])
def get_dashboard_stats() -> Dict[str, Any]:
    """Retorna métricas consolidadas da fila editorial e consumo da Pinterest API."""
    queue_stats = queue_service.get_stats()
    quota_stats = pinterest_service.get_quota_status()

    return {
        "queue": queue_stats,
        "pinterest_quota": quota_stats,
        "environment": os.environ.get("PINTEREST_ENVIRONMENT", "sandbox"),
    }


@app.get("/api/queue", dependencies=[Depends(verify_auth)])
def list_editorial_queue() -> Dict[str, Any]:
    """Lista todos os tópicos e artigos cadastrados na fila editorial."""
    articles = queue_service.get_all_articles()
    return {
        "total": len(articles),
        "articles": articles,
    }


@app.post("/api/generate-article", dependencies=[Depends(verify_auth)])
async def generate_article_endpoint(request: GenerateArticleRequest) -> Dict[str, Any]:
    """Gera um artigo completo com Llama 3.3 70B (Groq) e o anexa à fila editorial.

    Args:
        request: Parâmetros com tema, categoria e chave da API Groq.

    Returns:
        Artigo gerado com status pendente pronto para o próximo ciclo de deploy.
    """
    api_key = request.groq_api_key or os.environ.get("GROQ_API_KEY", "")

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY não fornecida. Configure no ambiente ou envie no payload.",
        )

    try:
        new_article = await llm_generator.generate_article_with_groq(
            topic=request.topic,
            category=request.category,
            groq_api_key=api_key,
        )
        queue_service.add_article(new_article)
        return {
            "success": True,
            "message": f"Artigo '{new_article['title']}' inserido na fila com sucesso!",
            "article": new_article,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/", response_class=HTMLResponse, dependencies=[Depends(verify_auth)])
def dashboard_ui() -> str:
    """Renderiza a interface web do painel de controle executado no Fly.io."""
    stats = queue_service.get_stats()
    quota = pinterest_service.get_quota_status()
    articles = queue_service.get_all_articles()

    article_rows = "".join(
        f"""
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
            <td class="py-3 px-4 font-medium text-slate-100">{a.get('title', 'Sem título')}</td>
            <td class="py-3 px-4 text-xs text-amber-400 font-semibold">{a.get('category', 'Geral')}</td>
            <td class="py-3 px-4">
                <span class="px-2.5 py-1 text-xs rounded-full font-bold {'bg-emerald-950 text-emerald-400 border border-emerald-800' if a.get('status') == 'published' else 'bg-amber-950 text-amber-400 border border-amber-800'}">
                    {a.get('status', 'pending').upper()}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 text-xs rounded font-medium {'bg-red-950/80 text-red-300' if a.get('pinterestPinned') else 'bg-slate-800 text-slate-400'}">
                    {'📌 Pinned' if a.get('pinterestPinned') else '⏳ Pending'}
                </span>
            </td>
            <td class="py-3 px-4 text-right">
                <a href="https://uadson.github.io/paw-and-home/articles/{a.get('slug')}" target="_blank" class="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium">Ver Artigo</a>
                <span class="text-slate-600 mx-1">•</span>
                <a href="https://uadson.github.io/paw-and-home/api/pin-image/{a.get('slug')}.svg" target="_blank" class="text-xs text-amber-400 hover:text-amber-300 underline font-medium">Pin SVG</a>
            </td>
        </tr>
        """
        for a in articles
    )

    return f"""<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paw & Home Control Plane • Fly.io</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-200 font-sans min-h-screen p-6 sm:p-10">
    <div class="max-w-6xl mx-auto space-y-8">
        <!-- Cabeçalho -->
        <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
                <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 text-xs font-bold uppercase tracking-wider mb-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Control Plane • Fly.io
                </div>
                <h1 class="text-3xl font-extrabold text-white tracking-tight">Paw & Home Guides • Ad & Content Monitor</h1>
                <p class="text-slate-400 text-sm mt-1">Supervisão de automação do Pinterest API v5 e entrega de anúncios Amazon Associates.</p>
            </div>
            <div class="flex items-center gap-3">
                <a href="https://uadson.github.io/paw-and-home/pinterest-feed.xml" target="_blank" class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors">
                    Feed RSS XML ↗
                </a>
                <a href="https://uadson.github.io/paw-and-home" target="_blank" class="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors">
                    Ver Site (GitHub Pages) ↗
                </a>
            </div>
        </header>

        <!-- Cards de Métricas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Cota Pinterest API (Hoje)</span>
                <div class="text-2xl font-black text-white mt-2">{quota['used_today']} <span class="text-sm font-normal text-slate-400">/ {quota['daily_limit']}</span></div>
                <div class="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div class="bg-emerald-500 h-full rounded-full" style="width: {quota['percentage_used']}%"></div>
                </div>
                <span class="text-[11px] text-emerald-400 font-medium block mt-2">{quota['remaining_today']} requisições disponíveis</span>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Artigos Publicados</span>
                <div class="text-2xl font-black text-emerald-400 mt-2">{stats['published_articles']} <span class="text-sm font-normal text-slate-400">no ar</span></div>
                <span class="text-xs text-slate-500 block mt-2">Pronto para conversão com cookie de 90 dias</span>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Pins Entregues</span>
                <div class="text-2xl font-black text-amber-400 mt-2">{stats['pinned_pins']} <span class="text-sm font-normal text-slate-400">criados</span></div>
                <span class="text-xs text-slate-500 block mt-2">{stats['pending_pins']} pins aguardando próximo ciclo</span>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Fila Editorial</span>
                <div class="text-2xl font-black text-indigo-400 mt-2">{stats['pending_articles']} <span class="text-sm font-normal text-slate-400">pendentes</span></div>
                <span class="text-xs text-slate-500 block mt-2">Publicação agendada 2x por semana</span>
            </div>
        </div>

        <!-- Tabela de Artigos e Status -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 class="font-bold text-base text-white">Fila Editorial & Status de Distribuição</h2>
                <span class="text-xs text-slate-400">Total: {len(articles)} artigos</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                        <tr>
                            <th class="py-3 px-4">Título do Artigo</th>
                            <th class="py-3 px-4">Categoria</th>
                            <th class="py-3 px-4">Status Web</th>
                            <th class="py-3 px-4">Pinterest</th>
                            <th class="py-3 px-4 text-right">Links Rápidos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {article_rows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>"""
