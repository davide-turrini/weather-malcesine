import { randomUUID } from 'node:crypto'
import { hostname } from 'node:os'
import { useHeartbeat } from '@malcesine/heartbeat'
import { database } from '@/db'
import { env } from '@/env'

const instanceId = randomUUID()
useHeartbeat({
  db: database,
  service: 'api',
  instanceId,
  meta: { pid: process.pid, hostname: hostname(), port: env.API_PORT },
})
