<script setup lang="ts">
import { computed } from 'vue'
import { markerTrianglePath, pointOnCircle, sectorArcPath, wedgePath } from '@/lib/geo'
import type { DirectionSector, Reading } from '@/types'

const props = withDefaults(
  defineProps<{
    readings: Reading[] // qualsiasi ordine, vengono riordinate per orario
    directionSector?: DirectionSector | null
    maxScaleKmh?: number
  }>(),
  { directionSector: null, maxScaleKmh: 30 },
)

const scale = { cx: 170, cy: 170, innerR: 30, maxRing: 130, maxScaleKmh: props.maxScaleKmh }

const ordered = computed(() =>
  [...props.readings]
    .filter((r) => r.windDirDeg != null)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
)

function opacityFor(index: number, count: number): number {
  if (count <= 1) return 0.5
  return 0.1 + (0.4 * index) / (count - 1)
}

const avgWedges = computed(() =>
  ordered.value.map((r, i) => ({
    path: wedgePath(r.windDirDeg as number, r.windSpeedKmh ?? 0, scale),
    opacity: opacityFor(i, ordered.value.length),
  })),
)

const gustWedges = computed(() =>
  ordered.value.map((r, i) => ({
    path: wedgePath(r.windDirDeg as number, r.windGustKmh ?? 0, scale),
    opacity: opacityFor(i, ordered.value.length) * 0.7,
  })),
)

const latest = computed(() => ordered.value.at(-1) ?? null)

const markerPath = computed(() => (latest.value ? markerTrianglePath(latest.value.windDirDeg as number, 139, 156, 8, scale) : null))

const ringLevels = [10, 20, 30] as const
function ringR(level: number): number {
  return scale.innerR + (scale.maxRing - scale.innerR) * (level / scale.maxScaleKmh)
}

const cardinals: Array<{ label: string; deg: number }> = [
  { label: 'N', deg: 0 },
  { label: 'NE', deg: 45 },
  { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 },
  { label: 'S', deg: 180 },
  { label: 'SO', deg: 225 },
  { label: 'O', deg: 270 },
  { label: 'NO', deg: 315 },
]

const spokes = computed(() => cardinals.map((c) => ({ ...c, end: pointOnCircle(c.deg, scale.maxRing, scale) })))
const labels = computed(() => cardinals.map((c) => ({ ...c, pos: pointOnCircle(c.deg, scale.maxRing + 18, scale) })))

const sectorArcs = computed(() => {
  const sector = props.directionSector
  if (!sector) return null
  const r = 137
  return {
    optimal: sectorArcPath(sector.optimalStart, sector.optimalEnd, r, scale),
    marginal: sectorArcPath(sector.marginalStart, sector.marginalEnd, r, scale),
  }
})
</script>

<template>
  <div class="card compass-card">
    <div class="compass-title">Direzione &amp; intensit&agrave; &middot; ultimi log</div>
    <div class="compass-wrap">
      <svg width="300" height="300" viewBox="0 0 340 340">
        <defs>
          <filter id="markerShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" flood-color="#1c5cab" flood-opacity="0.45" />
          </filter>
        </defs>

        <template v-if="sectorArcs">
          <path :d="sectorArcs.optimal" fill="none" stroke="#0ca30c" stroke-width="7" stroke-linecap="round" opacity="0.55" />
          <path :d="sectorArcs.marginal" fill="none" stroke="#fab219" stroke-width="7" stroke-linecap="round" opacity="0.75" />
        </template>

        <circle :cx="scale.cx" :cy="scale.cy" :r="scale.innerR" fill="none" stroke="#c3c2b7" stroke-width="1.5" />
        <circle v-for="lvl in ringLevels" :key="lvl" :cx="scale.cx" :cy="scale.cy" :r="ringR(lvl)" fill="none" stroke="#e1e0d9" stroke-width="1" />
        <text x="176" y="112" font-size="9.5" fill="#898781">10</text>
        <text x="176" y="78.5" font-size="9.5" fill="#898781">20</text>
        <text x="176" y="45" font-size="9.5" fill="#898781">{{ maxScaleKmh }} km/h</text>

        <g stroke="#e1e0d9" stroke-width="1">
          <line v-for="s in spokes" :key="s.label" :x1="scale.cx" :y1="scale.cy" :x2="s.end[0]" :y2="s.end[1]" />
        </g>
        <g font-size="13" font-weight="700" fill="#898781" text-anchor="middle" dominant-baseline="middle">
          <text v-for="l in labels" :key="l.label" :x="l.pos[0]" :y="l.pos[1]">{{ l.label }}</text>
        </g>

        <g fill="#9aa0a8">
          <path v-for="(w, i) in gustWedges" :key="`g${i}`" :d="w.path" :opacity="w.opacity" />
        </g>
        <g fill="#2a78d6">
          <path v-for="(w, i) in avgWedges" :key="`a${i}`" :d="w.path" :opacity="w.opacity" />
        </g>

        <path v-if="markerPath" :d="markerPath" fill="#2a78d6" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" filter="url(#markerShadow)" />
      </svg>
    </div>

    <div class="compass-caption">il blu piu fitto = direzione piu ricorrente e piu forte nelle ultime letture</div>

    <div class="compass-legend">
      <div class="legend-item"><span class="dot" style="background: #2a78d6" />media</div>
      <div class="legend-item"><span class="dot" style="background: #9aa0a8" />raffica</div>
      <div class="legend-item">
        <svg width="11" height="10" viewBox="0 0 11 10"><path d="M0,5 L11,0 L11,10 Z" fill="#2a78d6" stroke="#ffffff" stroke-width="1" stroke-linejoin="round" /></svg>
        ora
      </div>
      <template v-if="directionSector">
        <div class="legend-item"><span class="dot" style="background: #0ca30c" />settore ottimale</div>
        <div class="legend-item"><span class="dot" style="background: #fab219" />marginale</div>
      </template>
    </div>
    <div v-if="directionSector" class="compass-note">settori da calibrazione della centralina</div>
  </div>
</template>

<style scoped>
.compass-card {
  padding: 14px 14px 10px;
}
.compass-title {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-weight: 600;
  margin-bottom: 8px;
}
.compass-wrap {
  display: flex;
  justify-content: center;
}
.compass-caption {
  font-size: 10.5px;
  color: var(--ink-muted);
  text-align: center;
  margin-top: -2px;
}
.compass-legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--ink-soft);
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  display: inline-block;
}
.compass-note {
  font-size: 9.5px;
  color: #b3b0a8;
  text-align: center;
  margin-top: 4px;
}
</style>
