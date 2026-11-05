"""Serviço de gerenciamento da fila editorial de artigos para afiliados.

Lê, calcula estatísticas e adiciona novos tópicos gerados via LLM
no arquivo estruturado data/editorial-queue.json.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class QueueService:
    """Gerencia operações de leitura e persistência na fila editorial de artigos."""

    def __init__(self, queue_path: Optional[Path | str] = None) -> None:
        """Inicializa o serviço apontando para o caminho da fila editorial.

        Args:
            queue_path: Caminho opcional para o arquivo editorial-queue.json.
                Caso omitido, resolve relativamente à raiz do projeto.
        """
        if queue_path is not None:
            self.queue_path = Path(queue_path)
        else:
            # Caminho padrão a partir do repositório
            self.queue_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "editorial-queue.json"

    def _read_queue(self) -> List[Dict[str, Any]]:
        """Lê os itens persistidos no arquivo JSON.

        Returns:
            Lista de dicionários representando os artigos cadastrados.
        """
        if not self.queue_path.exists():
            return []

        try:
            content = self.queue_path.read_text(encoding="utf-8")
            data = json.loads(content)
            if isinstance(data, list):
                return data
            return []
        except (json.JSONDecodeError, OSError):
            return []

    def _write_queue(self, queue_data: List[Dict[str, Any]]) -> None:
        """Persiste os dados atualizados na fila editorial.

        Args:
            queue_data: Lista completa de artigos a ser salva.
        """
        self.queue_path.parent.mkdir(parents=True, exist_ok=True)
        self.queue_path.write_text(json.dumps(queue_data, indent=2, ensure_ascii=False), encoding="utf-8")

    def get_stats(self) -> Dict[str, int]:
        """Calcula métricas consolidadas sobre o status da fila e entrega de Pins.

        Returns:
            Dicionário com contadores de artigos totais, publicados, pendentes,
            pins já postados e pins pendentes de publicação.
        """
        items = self._read_queue()
        total = len(items)
        published = sum(1 for item in items if item.get("status") == "published")
        pending = sum(1 for item in items if item.get("status") == "pending")

        pinned = sum(1 for item in items if item.get("pinterestPinned") is True)
        pending_pins = sum(
            1 for item in items if item.get("status") == "published" and not item.get("pinterestPinned")
        )

        return {
            "total_articles": total,
            "published_articles": published,
            "pending_articles": pending,
            "pinned_pins": pinned,
            "pending_pins": pending_pins,
        }

    def get_all_articles(self) -> List[Dict[str, Any]]:
        """Recupera todos os artigos cadastrados na fila.

        Returns:
            Lista completa de artigos com seus respectivos metadados.
        """
        return self._read_queue()

    def add_article(self, article_data: Dict[str, Any]) -> bool:
        """Adiciona um novo artigo à fila editorial com status pendente.

        Args:
            article_data: Dicionário contendo os dados validados do artigo.

        Returns:
            True caso a inserção ocorra com sucesso, False em caso de falha.
        """
        items = self._read_queue()

        # Garante status pendente para novos artigos adicionados
        article_data["status"] = "pending"
        article_data["pinterestPinned"] = False

        items.append(article_data)
        self._write_queue(items)
        return True
