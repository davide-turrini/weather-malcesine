import { randomUUID } from 'node:crypto'
import { useHeartbeat } from '@malcesine/heartbeat'
import { database } from '@/db'

const instanceId = randomUUID()
useHeartbeat({ db: database, service: 'logger', instanceId })
