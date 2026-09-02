# Deploy su VPS (Portainer + Caddy)

Guida passo-passo per il primo deploy. Fatta una volta, i deploy successivi sono solo
"Pull and redeploy" dallo stack di Portainer.

## 0. Prerequisiti

- Un VPS con accesso SSH, Docker e Docker Compose plugin installati.
  Se Docker non c'è ancora:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Un dominio (o sottodominio) con un record A che punta all'IP del VPS.
- Un repo GitHub con questo progetto.

---

## 1. Installare Portainer

```bash
docker volume create portainer_data
docker run -d \
  -p 8000:8000 -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Apri `https://<ip-vps>:9443`, crea l'utente admin al primo accesso.

---

## 2. Rete condivisa + Caddy (reverse proxy)

Una volta sola per tutto il VPS — la useranno anche i prossimi progetti.

```bash
docker network create web
```

In Portainer: **Stacks → Add stack**, nome `caddy`, incolla il contenuto di
[`deploy/caddy/docker-compose.yml`](../deploy/caddy/docker-compose.yml). Prima di
deployare, sulla macchina serve anche il file `Caddyfile` accanto al compose — se usi
il deploy "git repository" di Portainer (consigliato, vedi sotto) Portainer clona
l'intera cartella `deploy/caddy/` e lo trova da solo.

Apri [`deploy/caddy/Caddyfile`](../deploy/caddy/Caddyfile) e sostituisci
`meteo.tuodominio.it` con il tuo dominio reale **prima** di pushare su GitHub.

Ogni progetto futuro sul VPS aggiunge solo un blocco nuovo in questo file e fa
redeploy dello stack `caddy` — niente altra configurazione.

---

## 3. Push su GitHub

```bash
git remote add origin <url-del-tuo-repo>
git push -u origin main
```

---

## 4. Creare lo stack `malcesine-meteo` in Portainer

**Stacks → Add stack → Repository**:
- Repository URL: il tuo repo GitHub
- Compose path: `docker-compose.yml`
- Additional environment variables (equivalenti al tuo `.env` locale, minimo indispensabile):

  | Nome | Valore |
  |---|---|
  | `POSTGRES_USER` | scegli tu, non lasciare il default |
  | `POSTGRES_PASSWORD` | scegli tu, non lasciare il default |
  | `POSTGRES_DB` | `malcesine` va bene |
  | `API_PORT` | `4001` |
  | `WEB_PORT` | `4301` |
  | `LOGGER_PORT` | `4201` |
  | `LOGGER_DATA_DIR` | `./data/logs` |
  | `SCRAPE_SCHEDULE` | `* * * * *` |
  | `HOLFUY_STATION_ID` | `1000` |
  | `ADDICTED_SPORT_URL` | `https://it.addicted-sports.com/webcam/gardasee/malcesine/` |

  `DATABASE_URL` non serve impostarlo a mano: `docker-compose.yml` lo costruisce da solo
  dalle tre variabili `POSTGRES_*` qui sopra. La porta di postgres (5432) è pubblicata
  solo su `127.0.0.1` del VPS, mai su internet — coerente col fatto che qui non sono
  più i valori di sviluppo `malcesine`/`malcesine`.

- In basso, seleziona il profilo compose **prod** (Portainer lo chiede come opzione, o
  aggiungi `COMPOSE_PROFILES=prod` tra le variabili d'ambiente dello stack).

Deploy. Portainer builda le immagini `-prod` e le avvia.

---

## 5. Inizializzare il database (solo la prima volta)

La porta di postgres è chiusa su `127.0.0.1` del VPS (non raggiungibile da fuori), quindi
`pnpm db:push` da locale serve farlo passando da un tunnel SSH:

```bash
ssh -L 5544:127.0.0.1:5432 <utente>@<ip-vps> -N &
DATABASE_URL="postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:5544/malcesine" \
  pnpm --filter @malcesine/db db:push
```

Chiudi il tunnel (`kill %1` o `fg` + Ctrl-C) quando hai finito. In alternativa, apri una
shell nel container `postgres` da Portainer e usa `psql` direttamente.

---

## 6. Verifica

```bash
curl https://meteo.tuodominio.it/api/health
curl https://meteo.tuodominio.it/
```

La pagina minimale (per l'edge/GPRS in decollo) resta raggiungibile direttamente
sulla porta dell'API se preferisci non passare dal dominio:
`http://<ip-vps>:4001/`.

---

## Deploy successivi

Portainer → stack `malcesine-meteo` → **Pull and redeploy**. Se hai cambiato lo
schema del database, rilancia anche `pnpm db:push` puntato al VPS.
