import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type postgres from 'postgres'
import type * as schema from '@/schema'

export type DB = PostgresJsDatabase<typeof schema>
export type Sql = ReturnType<typeof postgres>

export type Station = 'holfuy' | 'addicted_sport'
export const STATIONS: Station[] = ['holfuy', 'addicted_sport']
