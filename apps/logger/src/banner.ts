import { useBanner } from '@malcesine/banner'
import { env } from '@/env'

useBanner({ service: 'LOGGER', color: 'yellow', meta: { port: env.LOGGER_PORT } })
