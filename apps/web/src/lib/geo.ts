// Geometria polare per il grafico radiale direzione/intensita: bearing 0 = N (in alto),
// cresce in senso orario, come una bussola vera.

export interface PolarScale {
  cx: number
  cy: number
  innerR: number
  maxRing: number
  maxScaleKmh: number
}

export function pointOnCircle(
  bearingDeg: number,
  r: number,
  scale: Pick<PolarScale, 'cx' | 'cy'>,
): [number, number] {
  const rad = (bearingDeg * Math.PI) / 180
  const x = scale.cx + r * Math.sin(rad)
  const y = scale.cy - r * Math.cos(rad)
  return [round1(x), round1(y)]
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// Banda radiale per una lettura: larghezza angolare e lunghezza raggiale entrambe
// proporzionali alla velocita (piu forte -> banda piu larga e piu lunga).
export function wedgePath(bearingDeg: number, speedKmh: number, scale: PolarScale): string {
  const halfWidth = 4 + speedKmh * 0.65
  const outerR =
    scale.innerR + (scale.maxRing - scale.innerR) * Math.min(speedKmh / scale.maxScaleKmh, 1)
  const a0 = bearingDeg - halfWidth
  const a1 = bearingDeg + halfWidth
  const [ix0, iy0] = pointOnCircle(a0, scale.innerR, scale)
  const [ix1, iy1] = pointOnCircle(a1, scale.innerR, scale)
  const [ox0, oy0] = pointOnCircle(a0, outerR, scale)
  const [ox1, oy1] = pointOnCircle(a1, outerR, scale)
  const or = round1(outerR)
  return `M${ix0},${iy0} L${ox0},${oy0} A${or},${or} 0 0,1 ${ox1},${oy1} L${ix1},${iy1} A${scale.innerR},${scale.innerR} 0 0,0 ${ix0},${iy0} Z`
}

// Arco di settore (verde/giallo) lungo un raggio fisso, da startDeg a endDeg in senso orario.
export function sectorArcPath(
  startDeg: number,
  endDeg: number,
  r: number,
  scale: Pick<PolarScale, 'cx' | 'cy'>,
): string {
  const span = (endDeg - startDeg + 360) % 360 || 360
  const largeArc = span > 180 ? 1 : 0
  const [x0, y0] = pointOnCircle(startDeg, r, scale)
  const [x1, y1] = pointOnCircle(endDeg, r, scale)
  return `M${x0},${y0} A${r},${r} 0 ${largeArc},1 ${x1},${y1}`
}

// Triangolo marcatore fuori dall'anello esterno, che punta verso il quadrante alla direzione data.
export function markerTrianglePath(
  bearingDeg: number,
  apexR: number,
  baseR: number,
  halfWidthDeg: number,
  scale: Pick<PolarScale, 'cx' | 'cy'>,
): string {
  const [ax, ay] = pointOnCircle(bearingDeg, apexR, scale)
  const [lx, ly] = pointOnCircle(bearingDeg - halfWidthDeg, baseR, scale)
  const [rx, ry] = pointOnCircle(bearingDeg + halfWidthDeg, baseR, scale)
  return `M${ax},${ay} L${lx},${ly} L${rx},${ry} Z`
}
