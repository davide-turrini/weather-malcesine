import { STATIONS } from '@malcesine/db'
import type { FastifyInstance } from 'fastify'
import { STATION_META } from '@/config/stations'

export default async function stationsRoutes(fastify: FastifyInstance) {
  fastify.get('/stations', async () => {
    const result: Record<string, (typeof STATION_META)[keyof typeof STATION_META]> = {}
    for (const station of STATIONS) result[station] = STATION_META[station]
    return result
  })
}
