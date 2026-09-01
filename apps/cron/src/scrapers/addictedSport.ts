import * as cheerio from 'cheerio'
import type { ScrapedReading } from './types'

// La pagina della webcam (es. it.addicted-sports.com/webcam/gardasee/malcesine/)
// espone i dati vento tramite un endpoint JSON protetto da CSRF token + sessione:
// 1) GET della pagina → cattura cookie PHPSESSID + <meta name="csrf-token">
// 2) GET su fileadmin/webcam/src/getWeatherData.php con quel cookie/token
// È lo stesso identico flusso usato dal JS della pagina (mediaPlayerWebcamView.js
// → webcam.loadCurrentWeatherData()), verificato manualmente.
const WC = 'gardasee'
const STATION_PID = '248' // "Webcam Lago di Garda Malcesine | Malcesine tempo metereologico"
const KNOTS_TO_KMH = 1.852
const WINDOW_MINUTES = 60 // la centralina aggiorna ogni ~10 min

const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
]

function degToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16]
}

function toImagePath(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}/${hh}${mi}`
}

interface Measurement {
  pid: string
  temp?: string
  wsavg?: string
  wsmax?: string
  dir?: string
  rp?: string
  rh?: string
  utctstamp: string
}

interface WeatherDataResponse {
  measurment: Record<string, Measurement> | Array<{ pid: number; error: string }>
}

export async function scrapeAddictedSport(pageUrl: string): Promise<ScrapedReading | null> {
  const userAgent = 'Mozilla/5.0 (compatible; malcesine-meteo/1.0)'

  const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': userAgent } })
  if (!pageRes.ok) throw new Error(`Addicted Sport HTTP ${pageRes.status} (pagina)`)
  const cookie = pageRes.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')
  const $ = cheerio.load(await pageRes.text())
  const token = $('meta[name="csrf-token"]').attr('content')
  if (!cookie || !token)
    throw new Error('Addicted Sport: cookie o CSRF token non trovati sulla pagina')

  const now = new Date()
  const start = new Date(now.getTime() - WINDOW_MINUTES * 60_000)
  const dataUrl = new URL('/fileadmin/webcam/src/getWeatherData.php', pageUrl)
  dataUrl.searchParams.set('startimg', toImagePath(start))
  dataUrl.searchParams.set('stopimg', toImagePath(now))
  dataUrl.searchParams.set('wc', WC)

  const dataRes = await fetch(dataUrl, {
    headers: { 'User-Agent': userAgent, Cookie: cookie, CsrfToken: token },
  })
  if (!dataRes.ok) throw new Error(`Addicted Sport HTTP ${dataRes.status} (dati)`)

  const data = (await dataRes.json()) as WeatherDataResponse
  if (Array.isArray(data.measurment)) return null // "No Weatherdata available" — stazione offline

  const latest = Object.values(data.measurment)
    .filter((m) => m.pid === STATION_PID)
    .sort((a, b) => Number(b.utctstamp) - Number(a.utctstamp))[0]
  if (!latest) return null

  const windSpeedKmh = latest.wsavg != null ? Number(latest.wsavg) * KNOTS_TO_KMH : null
  const windGustKmh = latest.wsmax != null ? Number(latest.wsmax) * KNOTS_TO_KMH : null
  const windDirDeg = latest.dir != null ? Number(latest.dir) : null

  return {
    station: 'addicted_sport',
    recordedAt: new Date(Number(latest.utctstamp) * 1000),
    windSpeedKmh,
    windGustKmh,
    windDirDeg,
    windDirLabel: windDirDeg != null ? degToCompass(windDirDeg) : null,
    temperatureC: latest.temp != null ? Number(latest.temp) : null,
    humidityPct: latest.rh != null ? Number(latest.rh) : null,
    pressureHpa: latest.rp != null ? Number(latest.rp) : null,
    raw: latest as unknown as Record<string, unknown>,
  }
}
