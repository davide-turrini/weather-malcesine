// Punto di rugiada (formula di Magnus-Tetens) — non e' un dato scaricato, e' calcolato
// da temperatura e umidita' che leggiamo davvero dalla centralina.
export function dewPointC(tempC: number | null, humidityPct: number | null): number | null {
  if (tempC == null || humidityPct == null || humidityPct <= 0) return null
  const a = 17.27
  const b = 237.7
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100)
  return (b * alpha) / (a - alpha)
}
