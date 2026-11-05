# Manutenção e Limpeza Automatizada do Docker

Esta pasta contém utilitários para manter a infraestrutura Docker limpa e sem acúmulo de imagens ou volumes órfãos em ambientes de desenvolvimento, staging e produção.

---

## 1. Conteúdo

* **`docker-cleanup.sh`**: Script bash executável que executa `docker container prune`, `docker image prune`, `docker network prune`, `docker volume prune` e `docker builder prune`.
* **`docker-cleanup.service`**: Unit systemd que invoca o script de limpeza em segundo plano.
* **`docker-cleanup.timer`**: Temporizador systemd configurado para executar a rotina todo domingo às 03:00 da manhã.

---

## 2. Instalação no Servidor (Linux)

Para ativar a rotina de limpeza automatizada com systemd:

```bash
# 1. Copiar as units para o diretório do systemd
sudo cp infra/maintenance/docker-cleanup.service /etc/systemd/system/
sudo cp infra/maintenance/docker-cleanup.timer /etc/systemd/system/

# 2. Recarregar os daemons do systemd
sudo systemctl daemon-reload

# 3. Habilitar e iniciar o timer semanal
sudo systemctl enable --now docker-cleanup.timer

# 4. Verificar o status do agendamento
sudo systemctl list-timers | grep docker-cleanup
```

---

## 3. Execução Manual

Você pode executar o script a qualquer momento manualmente:

```bash
bash infra/maintenance/docker-cleanup.sh
```
