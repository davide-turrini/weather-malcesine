import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ── Letture meteo ────────────────────────────────────────────────────────

export const readings = pgTable(
  'readings',
  {
    id: text('id').primaryKey(),
    station: text('station').notNull(), // 'holfuy' | 'addicted_sport'
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    windSpeedKmh: real('wind_speed_kmh'),
    windGustKmh: real('wind_gust_kmh'),
    windDirDeg: integer('wind_dir_deg'),
    windDirLabel: text('wind_dir_label'),
    temperatureC: real('temperature_c'),
    humidityPct: real('humidity_pct'),
    pressureHpa: real('pressure_hpa'),
    raw: jsonb('raw').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxStationTime: index('idx_readings_station_time').on(t.station, t.recordedAt),
  }),
)

// ── Service registry ──────────────────────────────────────────────────────

export const serviceHeartbeats = pgTable(
  'service_heartbeats',
  {
    service: text('service').notNull(),
    instanceId: text('instance_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.service, t.instanceId] }) }),
)
