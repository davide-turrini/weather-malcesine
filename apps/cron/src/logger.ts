import { useLogger } from '@malcesine/logger'
import { env } from '@/env'

export const logger = useLogger({ service: 'cron', url: env.LOGGER_URL })
