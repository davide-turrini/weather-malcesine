import { useBanner } from '@malcesine/banner'
import { env } from '@/env'

useBanner({ service: 'API', color: 'green', meta: { port: env.API_PORT } })
