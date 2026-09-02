import type { Station } from '@malcesine/db'

export interface DirectionSector {
  optimalStart: number
  optimalEnd: number
  marginalStart: number
  marginalEnd: number
}

export interface StationMeta {
  role: string
  name: string
  altitudeM: number | null
  directionSector: DirectionSector | null
}

// Settore direzione: calibrazione propria di ciascuna centralina (per Holfuy presa da
// `stattr` sulla pagina pubblica della stazione — o_s/o_e/w_s/w_e). Non e' un giudizio di
// volabilita': indica dove la lettura della centralina e' considerata affidabile.
// Nessun dato equivalente per Addicted Sport: resta null finche' non lo abbiamo.
export const STATION_META: Record<Station, StationMeta> = {
  holfuy: {
    role: 'Decollo',
    name: 'Holfuy',
    altitudeM: 1760,
    directionSector: { optimalStart: 45, optimalEnd: 315, marginalStart: 316, marginalEnd: 44 },
  },
  addicted_sport: {
    role: 'Atterraggio',
    name: 'Addicted Sport',
    altitudeM: null,
    directionSector: null,
  },
}

// true se `deg` e' nel settore marginale (calibrazione centralina) — non c'entra la volabilita' reale.
export function isInMarginalSector(sector: DirectionSector, deg: number): boolean {
  const { marginalStart: s, marginalEnd: e } = sector
  return s > e ? deg > s || deg < e : deg > s && deg < e
}
