import type { Station } from '@malcesine/db'
import { pg } from '@/db'

export const BUCKET_MINUTES = [5, 10, 15, 30, 60] as const
export type BucketMinutes = (typeof BUCKET_MINUTES)[number]

export interface WindSummaryRow {
  station: string
  bucketStart: string
  avgWindSpeedKmh: number | null
  maxWindSpeedKmh: number | null
  maxGustKmh: number | null
  avgTemperatureC: number | null
  windDirLabel: string | null
  windDirDeg: number | null
  samples: number
}

export async function getWindSummary(opts: {
  station?: Station
  bucketMinutes: number
  minutes: number
}): Promise<WindSummaryRow[]> {
  const { station, bucketMinutes, minutes } = opts
  const bucketSeconds = bucketMinutes * 60
  const since = new Date(Date.now() - minutes * 60_000)

  return pg<WindSummaryRow[]>`
    SELECT
      station,
      to_timestamp(floor(extract(epoch FROM recorded_at) / ${bucketSeconds}) * ${bucketSeconds}) AS "bucketStart",
      avg(wind_speed_kmh) AS "avgWindSpeedKmh",
      max(wind_speed_kmh) AS "maxWindSpeedKmh",
      max(wind_gust_kmh) AS "maxGustKmh",
      avg(temperature_c) AS "avgTemperatureC",
      (array_agg(wind_dir_label ORDER BY wind_speed_kmh DESC NULLS LAST))[1] AS "windDirLabel",
      (array_agg(wind_dir_deg ORDER BY wind_speed_kmh DESC NULLS LAST))[1] AS "windDirDeg",
      count(*)::int AS "samples"
    FROM readings
    WHERE recorded_at >= ${since.toISOString()}
      ${station ? pg`AND station = ${station}` : pg``}
    GROUP BY station, "bucketStart"
    ORDER BY station, "bucketStart" DESC
    LIMIT 500
  `
}
