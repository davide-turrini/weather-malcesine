# Architettura

## Stack

| Layer | Tecnologia |
|---|---|
| HTTP server | **Fastify** v5 |
| Frontend ricco | **Vue 3** + Vite |
| Frontend minimale | HTML server-side, zero JS (Fastify) |
| Database | **PostgreSQL 16** via `postgres.js` |
| ORM | **Drizzle ORM** |
| Build | **tsup** (esbuild, apps Node) / **Vite** (apps/web) |
| Lint + Format | **Biome** |
| Scheduling | **node-cron**, singleton via `pg_try_advisory_lock` |
| Logging | **Custom** (`apps/logger` + `packages/logger` SDK), flush su disco locale |
| Package manager | **pnpm** con workspaces |
| Task orchestration | **Turborepo** |
| Deploy | Docker multi-stage, Portainer/compose su VPS |

---

## Struttura monorepo

```
apps/
├── api/     — server HTTP Fastify: JSON (/current, /history) + pagina minimale (porta 4001)
├── web/     — dashboard Vue 3 + Vite (porta 4301)
├── logger/  — microservizio di logging centralizzato (porta 4201)
└── cron/    — scraper meteo a istanza singola (advisory lock, nessuna porta)
packages/
├── db/        — schema Drizzle, client PostgreSQL
├── logger/    — SDK logger: createLogger(opts) → buffer + flush HTTP
├── banner/    — ASCII banner di avvio
├── env/       — helper Zod per validare le env var
└── with-env/  — CLI helper: carica .env e spawna un comando
```

### `packages/db`

- Schema Drizzle: `readings` (letture meteo), `serviceHeartbeats` (monitor servizi)
- `useDatabase(url)` — unica factory pubblica; restituisce `{ db, pg, connect, heartbeat, getAliveServices }`
- `STATIONS` — le stazioni note: `'holfuy' | 'addicted_sport'`

### `apps/cron`

Microservizio a istanza singola (advisory lock `pg_try_advisory_lock(42)`).
Ogni `SCRAPE_SCHEDULE` (default `* * * * *`, ogni minuto) esegue due scraper:

```
apps/cron/src/scrapers/holfuy.ts        — GET holfuy.com/puget/mjso.php?k=<HOLFUY_STATION_ID>
apps/cron/src/scrapers/addictedSport.ts — TODO: selettori non ancora definiti
```

Holfuy: la pagina pubblica mostra solo segnaposto statici; i valori live sono
iniettati via JS da quell'endpoint JSON. Lo scraper lo interroga direttamente
— è la stessa fonte usata dalla pagina, non un'API separata.

Ogni scraper ritorna `ScrapedReading | null` (null = stazione offline o
scraper non ancora implementato). `app.ts` inserisce il risultato in
`readings` senza altra logica.

### `apps/api`

```
src/
├── index.ts        — bootstrap: connect() + buildApp() + listen
├── app.ts           — registra plugin, route
└── routes/
    ├── weather.ts    — GET /current (ultima lettura per stazione), GET /history?station=&minutes=
    └── mini.ts        — GET / pagina HTML minimale, server-rendered, auto-refresh 60s
```

`GET /health` e `GET /services` (monitor heartbeat) restano generiche.
Nessuna autenticazione: i dati meteo sono pubblici.

### `apps/web`

Vue 3 + Vite. Consuma `GET /current` (e in futuro `/history` per grafici).
In dev: `vite` con hot reload. In prod: build statico servito da nginx
(`.docker/web.Dockerfile`, target `prod`), che fa anche da reverse proxy
`/api/* → api-prod:4001`.

### `apps/logger`

Microservizio Fastify che centralizza i log di tutti i servizi. Storage:
buffer in-memory con flush periodico su disco locale (volume Docker),
`{LOGGER_DATA_DIR}/{YYYY-MM-DD}/{service}.jsonl`. Nessuna dipendenza esterna.

```
POST /logs  [{ service, level, message, meta?, timestamp }]
GET /logs   → buffer corrente
GET /health → { ok: true }
```

Il SDK `packages/logger` espone `createLogger(opts)`: buffer locale,
flush ogni 2s verso `POST /logs`, fire-and-forget (se il logger è giù
l'app chiamante non crasha), stampa in console in dev.

---

## Perché due frontend

In decollo (Monte Baldo, Malcesine) la connessione è spesso edge/GPRS.
Una SPA Vue pesante non è affidabile lì. Da cui la separazione netta:

- **apps/web** — dashboard completa, per chi ha buona connessione (a valle, da casa)
- **pagina minimale di apps/api** (`GET /`) — HTML puro, zero JS/framework,
  solo gli ultimi valori delle due stazioni, pensata per essere leggibile
  anche con pochi KB/s

---

## Flusso dati

```
ogni minuto:
  cron: scrapeHolfuy() / scrapeAddictedSport()
      ↓
  INSERT INTO readings (station, recordedAt, windSpeedKmh, ...)

client (web o mini):
  GET /current   → ultima riga per ciascuna stazione
  GET /history    → serie storica (finestra in minuti)
```

---

## Variabili d'ambiente

Validate con Zod in `src/env.ts` di ogni app. Se una variabile obbligatoria
manca, il processo termina con `exit(1)` prima dell'avvio.

| Scope | Variabili |
|---|---|
| Globali (tutte le app) | `DATABASE_URL` |
| `apps/api` | `API_PORT` (default `4001`) |
| `apps/web` | `WEB_PORT` (default `4301`), `VITE_API_URL` |
| `apps/logger` | `LOGGER_PORT` (default `4201`), `LOGGER_FLUSH_INTERVAL_MS` (default `300000`), `LOGGER_DATA_DIR` (default `./data/logs`) |
| `apps/cron` | `SCRAPE_SCHEDULE` (default `* * * * *`), `HOLFUY_STATION_ID` (default `1000`), `ADDICTED_SPORT_URL` (opzionale, scraper non ancora implementato) |

Schema porte: `BASE + N` dove N è il numero di istanza.
`4000` → api · `4200` → logger · `4300` → web
