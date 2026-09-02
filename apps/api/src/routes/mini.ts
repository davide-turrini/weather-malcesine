import { readings, STATIONS } from '@malcesine/db'
import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { isInMarginalSector, STATION_META } from '@/config/stations'
import { db } from '@/db'
import { WIND_RED_KMH, windLevel } from '@/lib/thresholds'

const LOG_ROWS = 10

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

function fmtTime(d: Date): string {
  return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

function windCellStyle(v: number | null): string {
  if (v == null) return ''
  if (v > WIND_RED_KMH) return ' style="color:red"'
  if (v >= 15) return ' style="color:#c60"'
  return ''
}

export default async function miniRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req, reply) => {
    const sections = await Promise.all(
      STATIONS.map(async (station) => {
        const meta = STATION_META[station]
        const rows = await db
          .select()
          .from(readings)
          .where(eq(readings.station, station))
          .orderBy(desc(readings.recordedAt))
          .limit(LOG_ROWS)

        const current = rows[0] ?? null
        if (!current) {
          return `<h2>${escapeHtml(meta.role)} &middot; ${escapeHtml(meta.name)}</h2>\n<p>Nessun dato disponibile.</p>`
        }

        const level = windLevel(current.windSpeedKmh, current.windGustKmh)
        const statusLine =
          level === 'red'
            ? '<b style="color:red">PERICOLO</b> &mdash; raffica oltre la soglia di sicurezza (25 km/h)'
            : level === 'yellow'
              ? '<b style="color:#c60">CAUTELA</b> &mdash; vento sostenuto'
              : 'buone condizioni'

        const marginal =
          meta.directionSector &&
          current.windDirDeg != null &&
          isInMarginalSector(meta.directionSector, current.windDirDeg)
            ? '<p><b style="color:#c60">Direzione ai margini del settore ottimale</b> (calibrazione centralina)</p>'
            : ''

        const tableRows = rows
          .map(
            (r) =>
              `<tr><td>${fmtTime(r.recordedAt)}</td><td${windCellStyle(r.windSpeedKmh)}>${fmt(r.windSpeedKmh, 0)}</td><td${windCellStyle(r.windGustKmh)}>${fmt(r.windGustKmh, 0)}</td><td>${r.windDirDeg ?? '—'}&deg; ${r.windDirLabel ?? ''}</td><td>${fmt(r.temperatureC)}</td></tr>`,
          )
          .join('\n')

        return `<h2>${escapeHtml(meta.role)} &middot; ${escapeHtml(meta.name)}</h2>
<p>
${statusLine}<br>
Vento: <b>${fmt(current.windSpeedKmh, 0)}</b> km/h &mdash; Raffica: <b${windCellStyle(current.windGustKmh)}>${fmt(current.windGustKmh, 0)}</b> km/h<br>
Direzione: ${current.windDirDeg ?? '—'}&deg; (${current.windDirLabel ?? '—'}) &mdash; Temperatura: ${fmt(current.temperatureC)}&deg;C
</p>
${marginal}<table>
<tr><th>Ora</th><th>Vento km/h</th><th>Raffica km/h</th><th>Direz.</th><th>Temp &deg;C</th></tr>
${tableRows}
</table>`
      }),
    )

    const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>Decollo Malcesine</title>
<style>
body { font-family: sans-serif; margin: 12px; }
table { border-collapse: collapse; margin: 6px 0 18px; }
td, th { border: 1px solid #999; padding: 3px 6px; text-align: right; }
th { text-align: right; }
</style>
</head>
<body>
<h1>Decollo Malcesine</h1>
<p>Aggiornato ${fmtTime(new Date())} &mdash; la pagina si aggiorna da sola ogni minuto.</p>
${sections.join('\n\n')}
<p><small>Pagina minimale per connessioni lente in decollo.</small></p>
</body>
</html>`

    reply.type('text/html; charset=utf-8').send(html)
  })
}
