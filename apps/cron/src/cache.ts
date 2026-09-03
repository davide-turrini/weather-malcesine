import { useCache } from '@malcesine/cache'
import { env } from '@/env'

export const cache = useCache({ url: env.REDIS_URL })
