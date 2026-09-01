import { readings, STATIONS } from '@malcesine/db'
import { and, desc, eq, gte } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '@/db'

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
}
