# Getting Started

## Prerequisiti

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 16+

---

## 1. Installazione

```bash
git clone <repo>
cd malcesine-meteo
pnpm install
```

---

## 2. Configurazione ambiente

```bash
cp .env.example .env
```

| Variabile | Default | Note |
|---|---|---|
| `DATABASE_URL` | — | Es. `postgresql://malcesine:malcesine@localhost:5432/malcesine` |
| `API_PORT` | `4001` | Porta HTTP dell'API |
| `WEB_PORT` | `4301` | Porta dev server Vite / porta esposta nginx in prod |
| `VITE_API_URL` | `http://localhost:4001` | URL dell'API usato dal frontend Vue |
| `LOGGER_PORT` | `4201` | Porta HTTP del logger |
| `LOGGER_DATA_DIR` | `./data/logs` | Dove il logger scrive i file NDJSON flushati |
| `SCRAPE_SCHEDULE` | `* * * * *` | Espressione cron per gli scraper (ogni minuto) |
| `HOLFUY_STATION_ID` | `1000` | Stazione Holfuy "Decollo Malcesine" |
| `ADDICTED_SPORT_URL` | — | Non ancora implementato, vedi `apps/cron/src/scrapers/addictedSport.ts` |

---

## 3. Avviare PostgreSQL e inizializzare il database

```bash
docker compose up postgres -d
pnpm db:push
```

Per esplorare il DB con una UI:

```bash
pnpm db:studio
```

---

## 4. Avviare in sviluppo

Avvia tutte le app in parallelo:

```bash
pnpm dev
```

Oppure singolarmente:

```bash
pnpm dev:api      # API JSON + pagina minimale → http://localhost:4001
pnpm dev:web      # dashboard Vue               → http://localhost:4301
pnpm dev:logger   # solo logger                 → http://localhost:4201
pnpm dev:cron     # solo scraper
```

Health check:

```bash
curl http://localhost:4001/health
# → {"ok":true,"ts":"2026-01-01T00:00:00.000Z"}
```

---

## 5. Avviare con Docker

```bash
# Sviluppo con hot reload
docker compose --profile dev up --watch

# Produzione
docker compose --profile prod up --build
```

Il compose legge le porte dal `.env`: cambia `API_PORT`, `WEB_PORT` o
`LOGGER_PORT` per esporre istanze diverse (vedi schema porte in
`HOW_TO_VIBE.txt`). In produzione `apps/web` è servito da nginx e fa da
reverse proxy `/api/* → api-prod`.

---

## 6. Leggere i dati meteo

```bash
# Ultima lettura per ciascuna stazione
curl http://localhost:4001/current

# Storico ultime 3 ore (default), o filtrato per stazione
curl "http://localhost:4001/history?minutes=180"
curl "http://localhost:4001/history?station=holfuy&minutes=60"

# Pagina minimale (per connessioni lente in decollo)
curl http://localhost:4001/
```

---

## 7. Build per produzione

```bash
pnpm build        # compila tutti i package/app
pnpm typecheck    # verifica TypeScript
```

---

## Comandi utili

| Comando | Descrizione |
|---|---|
| `pnpm dev` | Tutte le app con hot reload (Turborepo) |
| `pnpm dev:api` | Solo API (`http://localhost:4001`) |
| `pnpm dev:web` | Solo dashboard Vue (`http://localhost:4301`) |
| `pnpm dev:logger` | Solo logger (`http://localhost:4201`) |
| `pnpm dev:cron` | Solo scraper |
| `pnpm db:push` | Applica schema al DB |
| `pnpm db:studio` | UI per esplorare il DB |
| `pnpm build` | Build produzione |
| `pnpm typecheck` | Type check su tutto il monorepo |
| `pnpm lint` | Lint con Biome |
| `pnpm --filter @malcesine/api test` | Test dell'API |
