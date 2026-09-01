import { useDatabase } from '@malcesine/db'
import { env } from '@/env'

export const database = useDatabase({ connectionString: env.DATABASE_URL })
