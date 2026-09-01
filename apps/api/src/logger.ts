import { useLogger } from '@malcesine/logger'
import { env } from '@/env'

export const logger = useLogger({ service: 'api', url: env.LOGGER_URL })
