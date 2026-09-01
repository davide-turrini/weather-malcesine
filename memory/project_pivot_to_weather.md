---
name: project-pivot-to-weather
description: Il monorepo è stato riconvertito da "Spotifillum" (music app) a "Malcesine Meteo" — reportistica meteo per il decollo parapendio di Malcesine
metadata:
  type: project
---

Il progetto precedente (Spotifillum, scope `@spotifillum/*`) è stato completamente rimosso il 2026-09-01 e sostituito da un sistema di reportistica meteo per il decollo di Malcesine (Monte Baldo). Il boilerplate del monorepo (pattern env/app/package, factory pattern, docker multi-stage, Turborepo, Biome) è stato mantenuto; tutto il codice dominio-specifico (Spotify, R2, JWT, upload, queue/worker) è stato eliminato. Scope pacchetti ora `@malcesine/*`.

**Why:** l'utente (Davide) vuole riusare l'infrastruttura del monorepo già rodata ma cambiare completamente dominio applicativo. Deploy sempre su VPS via Portainer/docker-compose.

**How to apply:**
- `apps/cron` fa scraping ogni minuto (default `SCRAPE_SCHEDULE=* * * * *`) di due centraline e scrive in `readings` (packages/db/src/schema.ts). Niente più task queue/worker: lo scraping è diretto, non passa da `enqueueTask`.
- Stazione Holfuy confermata: id `1000` = "Decollo Malcesine" (holfuy.com/en/data/1000). La pagina pubblica mostra solo segnaposto statici — i valori live arrivano da `https://holfuy.com/puget/mjso.php?k=1000` (endpoint JSON usato dal JS della pagina stessa, vedi `/js/rtr.js`). Lo scraper (`apps/cron/src/scrapers/holfuy.ts`) interroga quell'endpoint direttamente: è verificato e funzionante.
- Stazione "addicted-sport" NON ancora risolta: il dominio è `addicted-sports.com` (plurale), gestisce webcam + meteo per il Lago di Garda/Malcesine, ma non ho trovato l'endpoint/pagina esatta con i dati vento in tempo reale. Lo scraper (`apps/cron/src/scrapers/addictedSport.ts`) è uno stub che ritorna sempre `null` finché non si individua la fonte esatta. Prima di lavorarci, chiedere a Davide l'URL preciso o investigare ulteriormente su addicted-sports.com.
- Due frontend per via della connessione edge/GPRS in decollo: `apps/web` (Vue 3 + Vite, dashboard ricca) e una pagina minimale server-side in `apps/api/src/routes/mini.ts` (zero JS, auto-refresh via meta tag). Non aggiungere framework client-side alla pagina minimale.
- `packages/services` (storage R2, analyzer audio, scanner) è stato rimosso del tutto: non serve object storage, i dati meteo sono piccoli e vivono solo in Postgres. Il logger (`apps/logger`) ora fa flush su disco locale (`LOGGER_DATA_DIR`, volume Docker) invece che su R2.
- Nessuna autenticazione nell'API: i dati meteo sono pubblici, niente JWT/utenti/ruoli.
- Git è stato azzerato su richiesta esplicita dell'utente (nessun backup della history Spotifillum) e re-inizializzato da zero in questa stessa sessione.
