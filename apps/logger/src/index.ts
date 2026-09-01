import '@/banner'
import '@/heartbeat'
import { buildApp, drain } from '@/app'
import { env } from '@/env'
import { startFlusher } from '@/flusher'

const app = buildApp()
startFlusher(drain)
await app.listen({ host: '0.0.0.0', port: env.LOGGER_PORT })
