import { randomUUID } from 'node:crypto'
import { hostname } from 'node:os'
import { useHeartbeat } from '@malcesine/heartbeat'
import { database } from '@/db'

const instanceId = randomUUID()
useHeartbeat({
  db: database,
  service: 'cron',
  instanceId,
  meta: { pid: process.pid, hostname: hostname() },
})
