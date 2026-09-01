import * as cheerio from 'cheerio'
import type { ScrapedReading } from './types'

// TODO: selettori non ancora definiti — in attesa della pagina esatta della
// centralina Addicted Sports per Malcesine. Struttura pronta: fetch → cheerio →
// normalizza in ScrapedReading, stesso pattern di holfuy.ts.
export async function scrapeAddictedSport(url: string): Promise<ScrapedReading | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; malcesine-meteo/1.0)' },
  })
  if (!res.ok) throw new Error(`Addicted Sport HTTP ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)
  void $ // rimuovere una volta implementato il parsing reale

  return null
}
