import cors from '@fastify/cors'
import Fastify from 'fastify'
import { getAliveServices } from '@/db'
import miniRoutes from '@/routes/mini'
import speechRoutes from '@/routes/speech'
import stationsRoutes from '@/routes/stations'
import weatherRoutes from '@/routes/weather'

export async function buildApp() {
  const fastify = Fastify({ logger: false })

  await fastify.register(cors, { origin: true })

  fastify.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }))

  fastify.get('/services', async () => {
    const rows = await getAliveServices()
    const grouped: Record<
      string,
      {
        instances: number
        lastSeen: Date
        list: Array<{ instanceId: string; lastSeen: Date }>
      }
    > = {}
    for (const row of rows) {
      const entry = grouped[row.service]
      const item = { instanceId: row.instanceId, lastSeen: row.updatedAt, meta: row.meta ?? {} }
      if (!entry) {
        grouped[row.service] = { instances: 1, lastSeen: row.updatedAt, list: [item] }
      } else {
        entry.instances++
        entry.list.push(item)
        if (row.updatedAt > entry.lastSeen) entry.lastSeen = row.updatedAt
      }
    }
    return grouped
  })

  fastify.register(weatherRoutes)
  fastify.register(stationsRoutes)
  fastify.register(speechRoutes)
  fastify.register(miniRoutes)

  return fastify
}
