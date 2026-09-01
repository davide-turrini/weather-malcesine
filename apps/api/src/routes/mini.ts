import { readings, STATIONS } from '@malcesine/db'
import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '@/db'

const LABELS: Record<string, string> = {
  holfuy: 'Holfuy',
  addicted_sport: 'Addicted Sport',
}

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

export default async function miniRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req, reply) => {
    const rows = await Promise.all(
      STATIONS.map((station) =>
        db
          .select()
          .from(readings)
          .where(eq(readings.station, station))
          .orderBy(desc(readings.recordedAt))
          .limit(1)
          .then((r) => r[0] ?? null),
      ),
    )

    const cards = STATIONS.map((station, i) => {
      const r = rows[i]
      const label = escapeHtml(LABELS[station] ?? station)
      if (!r) return `<section><h2>${label}</h2><p>Nessun dato</p></section>`
      const updated = new Date(r.recordedAt).toLocaleTimeString('it-IT')
      return `<section>
  <h2>${label}</h2>
  <p class="wind">${fmt(r.windSpeedKmh, 0)} <span class="unit">km/h</span> · raffica ${fmt(r.windGustKmh, 0)}</p>
  <p>${escapeHtml(r.windDirLabel ?? '—')} (${r.windDirDeg ?? '—'}°)</p>
  <p>${fmt(r.temperatureC)}°C</p>
  <p class="ts">agg. ${updated}</p>
</section>`
    }).join('\n')

    const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>Decollo Malcesine</title>
<style>
body{font-family:system-ui,sans-serif;background:#0b1220;color:#f5f5f5;margin:0;padding:1rem}
h1{font-size:1.1rem;margin:0 0 .75rem}
section{background:#161f33;border-radius:8px;padding:.75rem 1rem;margin-bottom:.75rem}
h2{font-size:.85rem;color:#9fb3d9;margin:0 0 .35rem;text-transform:uppercase}
.wind{font-size:1.6rem;font-weight:700;margin:.1rem 0}
.unit{font-size:1rem;font-weight:400;color:#9fb3d9}
p{margin:.15rem 0}
.ts{color:#6f7f9e;font-size:.75rem}
</style>
</head>
<body>
<h1>Decollo Malcesine</h1>
${cards}
</body>
</html>`

    reply.type('text/html; charset=utf-8').send(html)
  })
}
