import type { Station } from '@malcesine/db'
import { readings, STATIONS } from '@malcesine/db'
import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { STATION_META } from '@/config/stations'
import { db } from '@/db'
import { windLevel } from '@/lib/thresholds'

function fmt(n: number | null | undefined): string {
  return n == null ? 'non disponibile' : String(Math.round(n))
}

function statusPhrase(level: ReturnType<typeof windLevel>): string {
  if (level === 'red') return 'Attenzione, vento forte.'
  if (level === 'yellow') return 'Vento sostenuto, valuta con attenzione.'
  return 'Condizioni buone.'
}

// Testo pronto per un motore di sintesi vocale (Scorciatoie Siri, Tasker, ecc.) — niente
// JSON da interpretare, solo una frase in italiano gia' pronta da leggere ad alta voce.
export default async function speechRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { station?: string } }>('/speech', async (req, reply) => {
    const requested = req.query.station as Station | undefined
    const targets = requested && STATIONS.includes(requested) ? [requested] : STATIONS

    const sentences = await Promise.all(
      targets.map(async (station) => {
        const meta = STATION_META[station]
        const [reading] = await db
          .select()
          .from(readings)
          .where(eq(readings.station, station))
          .orderBy(desc(readings.recordedAt))
          .limit(1)

        if (!reading) return `${meta.role}: nessun dato disponibile.`

        const level = windLevel(reading.windSpeedKmh, reading.windGustKmh)
        return (
          `${meta.role}: vento ${fmt(reading.windSpeedKmh)} chilometri orari, ` +
          `raffiche ${fmt(reading.windGustKmh)}, direzione ${reading.windDirLabel ?? 'sconosciuta'}. ` +
          statusPhrase(level)
        )
      }),
    )

    reply.type('text/plain; charset=utf-8').send(sentences.join(' '))
  })
}
