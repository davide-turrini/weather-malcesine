import Fastify from 'fastify'
import type { LogEntry } from '@/types'

const buffer: LogEntry[] = []

export function drain(): LogEntry[] {
  return buffer.splice(0, buffer.length)
}

export function buildApp() {
  const app = Fastify({ logger: false })

  app.get('/health', async () => ({ ok: true }))

  app.post<{ Body: unknown }>('/logs', async (req, reply) => {
    const body = req.body
    if (!Array.isArray(body) || body.length === 0) {
      return reply.code(400).send({ error: 'body deve essere un array non vuoto' })
    }
    if (body.length > 500) {
      return reply.code(400).send({ error: 'max 500 entries per batch' })
    }
    for (const entry of body as LogEntry[]) {
      buffer.push({
        service: String(entry.service ?? ''),
        level: String(entry.level ?? 'info'),
        message: String(entry.message ?? ''),
        meta: entry.meta,
        timestamp: entry.timestamp ?? new Date().toISOString(),
      })
    }
    return reply.code(201).send({ buffered: body.length })
  })

  // Serve il buffer corrente (log dal flush precedente ad ora)
  app.get('/logs', async () => buffer.slice())

  return app
}
