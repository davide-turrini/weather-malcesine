import '@/banner'
import '@/heartbeat'
import { buildApp } from '@/app'
import { logger } from '@/logger'

const app = buildApp()

process.on('SIGTERM', () => {
  app.stop()
  process.exit(0)
})
process.on('SIGINT', () => {
  app.stop()
  process.exit(0)
})

app.start().catch((err) => {
  logger.error('errore fatale', { error: err.message })
  process.exit(1)
})
