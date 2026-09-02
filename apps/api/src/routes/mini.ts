import type { Station } from '@malcesine/db'
import { readings, STATIONS } from '@malcesine/db'
import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '@/db'
import { BUCKET_MINUTES, getWindSummary, type WindSummaryRow } from '@/queries/summary'

const STATION_META: Record<Station, { role: string; name: string }> = {
  holfuy: { role: 'Decollo', name: 'Holfuy' },
  addicted_sport: { role: 'Atterraggio', name: 'Addicted Sport' },
}

const WIND_YELLOW_KMH = 15
const WIND_RED_KMH = 25
const TABLE_ROWS = 6
const DEFAULT_BUCKET = 10

function windLevel(speedKmh: number | null, gustKmh: number | null): 'normal' | 'yellow' | 'red' {
  const worst = Math.max(speedKmh ?? 0, gustKmh ?? 0)
  if (worst > WIND_RED_KMH) return 'red'
  if (worst >= WIND_YELLOW_KMH) return 'yellow'
  return 'normal'
}

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

function fmtTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

export default async function miniRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { bucket?: string } }>('/', async (req, reply) => {
    const bucketParam = Number(req.query.bucket)
    const bucketMinutes = BUCKET_MINUTES.includes(bucketParam as (typeof BUCKET_MINUTES)[number])
      ? bucketParam
      : DEFAULT_BUCKET

    const [currentRows, summaryRows] = await Promise.all([
      Promise.all(
        STATIONS.map((station) =>
          db
            .select()
            .from(readings)
            .where(eq(readings.station, station))
            .orderBy(desc(readings.recordedAt))
            .limit(1)
            .then((r) => r[0] ?? null),
        ),
      ),
      getWindSummary({ bucketMinutes, minutes: bucketMinutes * (TABLE_ROWS + 1) }),
    ])

    const summaryByStation = new Map<string, WindSummaryRow[]>()
    for (const row of summaryRows) {
      const list = summaryByStation.get(row.station)
      if (list) list.push(row)
      else summaryByStation.set(row.station, [row])
    }

    const bucketLinks = BUCKET_MINUTES.map((m) => {
      const active = m === bucketMinutes
      return `<a href="/?bucket=${m}" class="bucketlink${active ? ' active' : ''}">${m} min</a>`
    }).join('')

    const cards = STATIONS.map((station, i) => {
      const r = currentRows[i]
      const meta = STATION_META[station]
      const roleLabel = escapeHtml(meta.role)
      const nameLabel = escapeHtml(meta.name)

      if (!r) {
        return `<section class="card">
  <h2>${roleLabel} <span class="stationname">${nameLabel}</span></h2>
  <p class="nodata">Nessun dato disponibile</p>
</section>`
      }

      const level = windLevel(r.windSpeedKmh, r.windGustKmh)
      const rows = (summaryByStation.get(station) ?? []).slice(0, TABLE_ROWS)
      const tableRows = rows
        .map(
          (b) => `<tr>
      <td>${fmtTime(b.bucketStart)}</td>
      <td>${fmt(b.avgWindSpeedKmh, 0)}</td>
      <td>${fmt(b.maxGustKmh, 0)}</td>
      <td>${b.windDirLabel ?? '—'}</td>
    </tr>`,
        )
        .join('')

      return `<section class="card">
  <h2>${roleLabel} <span class="stationname">${nameLabel}</span></h2>
  <p class="wind wind-${level}">${fmt(r.windSpeedKmh, 0)}<span class="unit">km/h</span></p>
  <p class="gust">raffica ${fmt(r.windGustKmh, 0)} km/h</p>
  <p class="detail">${r.windDirLabel ?? '—'} (${r.windDirDeg ?? '—'}°) · ${fmt(r.temperatureC)}°C</p>
  <p class="ts">agg. ${fmtTime(r.recordedAt)}</p>
  ${
    rows.length > 0
      ? `<table class="summary">
    <thead><tr><th>ora</th><th>media</th><th>raffica</th><th>dir</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>`
      : ''
  }
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
* { box-sizing: border-box; }
body{font-family:system-ui,sans-serif;background:#eef1f5;color:#111;margin:0;padding:1rem}
h1{font-size:1.1rem;margin:0 0 .75rem;color:#111}
.buckets{margin-bottom:.75rem}
.bucketlink{display:inline-block;padding:.3rem .7rem;margin-right:.4rem;border-radius:6px;background:#fff;color:#334155;text-decoration:none;font-size:.85rem;border:1px solid #dbe1e8}
.bucketlink.active{background:#334155;color:#fff;border-color:#334155}
section.card{background:#fff;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h2{font-size:1rem;color:#111;margin:0 0 .5rem;text-transform:uppercase;letter-spacing:.02em}
.stationname{font-size:.75rem;color:#8a94a3;text-transform:none;font-weight:400}
.wind{font-size:3.2rem;font-weight:800;margin:.1rem 0;line-height:1;color:#111}
.wind .unit{font-size:1.2rem;font-weight:500;color:#8a94a3;margin-left:.35rem}
.wind-yellow{color:#a15c00;background:#fff3cd;display:inline-block;padding:.1rem .6rem;border-radius:10px}
.wind-red{color:#fff;background:#dc2626;display:inline-block;padding:.1rem .6rem;border-radius:10px}
.gust{font-size:1.1rem;margin:.2rem 0;color:#334155}
.detail{font-size:1rem;margin:.2rem 0;color:#334155}
.nodata{color:#8a94a3}
.ts{color:#8a94a3;font-size:.8rem;margin:.3rem 0 .6rem}
table.summary{width:100%;border-collapse:collapse;font-size:.9rem;margin-top:.4rem}
table.summary th{text-align:left;color:#8a94a3;font-weight:600;font-size:.75rem;text-transform:uppercase;padding:.25rem .3rem;border-bottom:1px solid #eef1f5}
table.summary td{padding:.3rem;border-bottom:1px solid #f3f4f6}
</style>
</head>
<body>
<h1>Decollo Malcesine</h1>
<div class="buckets">${bucketLinks}</div>
${cards}
</body>
</html>`

    reply.type('text/html; charset=utf-8').send(html)
  })
}
