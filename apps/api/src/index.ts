import '@/banner'
import '@/heartbeat'
import { buildApp } from '@/app'
import { connect } from '@/db'
import { env } from '@/env'
import { logger } from '@/logger'

await connect()
const app = await buildApp()
await app.listen({ port: env.API_PORT, host: '0.0.0.0' })
logger.info('server avviato', { port: env.API_PORT })
