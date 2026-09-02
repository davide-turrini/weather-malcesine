import type { Station } from '@malcesine/db'
import { readings, STATIONS } from '@malcesine/db'
import { and, desc, eq, gte } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '@/db'
import { BUCKET_MINUTES, getWindSummary } from '@/queries/summary'

export default async function weatherRoutes(fastify: FastifyInstance) {
  fastify.get('/current', async () => {
    const current: Record<string, unknown> = {}
    for (const station of STATIONS) {
      const [row] = await db
        .select()
        .from(readings)
        .where(eq(readings.station, station))
        .orderBy(desc(readings.recordedAt))
        .limit(1)
      current[station] = row ?? null
    }
    return current
  })

  fastify.get<{ Querystring: { station?: string; minutes?: string } }>('/history', async (req) => {
    const { station, minutes = '180' } = req.query
    const since = new Date(Date.now() - Number(minutes) * 60_000)
    const conditions = [gte(readings.recordedAt, since)]
    if (station) conditions.push(eq(readings.station, station))

    return db
      .select()
      .from(readings)
      .where(and(...conditions))
      .orderBy(desc(readings.recordedAt))
      .limit(1000)
  })

  // Serie storica raggruppata a intervalli fissi (5/10/15/30 min): per ogni
  // bucket, media/massimo del vento e direzione associata al campione più forte.
  fastify.get<{ Querystring: { station?: string; bucket?: string; minutes?: string } }>(
    '/history/summary',
    async (req, reply) => {
      const { station, bucket = '10', minutes = '120' } = req.query
      const bucketMinutes = Number(bucket)
      if (!BUCKET_MINUTES.includes(bucketMinutes as (typeof BUCKET_MINUTES)[number])) {
        return reply
          .code(400)
          .send({ error: `bucket deve essere uno tra ${BUCKET_MINUTES.join(', ')}` })
      }
      return getWindSummary({
        station: station as Station | undefined,
        bucketMinutes,
        minutes: Number(minutes),
      })
    },
  )
}
