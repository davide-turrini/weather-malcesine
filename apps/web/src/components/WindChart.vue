<script setup lang="ts">
import { computed } from 'vue'
import type { Reading } from '@/types'

const props = defineProps<{
  readings: Reading[] // qualsiasi ordine
}>()

const MAX_KMH = 40
const PLOT_LEFT = 34
const PLOT_RIGHT = 350
const PLOT_TOP = 10
const PLOT_BOTTOM = 190

const ordered = computed(() => [...props.readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()))

function x(i: number, count: number): number {
  if (count <= 1) return PLOT_LEFT
  return PLOT_LEFT + ((PLOT_RIGHT - PLOT_LEFT) * i) / (count - 1)
}

function y(v: number): number {
  const clamped = Math.min(v, MAX_KMH)
  return PLOT_BOTTOM - ((PLOT_BOTTOM - PLOT_TOP) * clamped) / MAX_KMH
}

const avgLine = computed(() => {
  const rows = ordered.value
  if (rows.length === 0) return ''
  return rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i, rows.length).toFixed(1)},${y(r.windSpeedKmh ?? 0).toFixed(1)}`).join(' ')
})

const gustLine = computed(() => {
  const rows = ordered.value
  if (rows.length === 0) return ''
  return rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i, rows.length).toFixed(1)},${y(r.windGustKmh ?? 0).toFixed(1)}`).join(' ')
})

const avgArea = computed(() => {
  if (ordered.value.length === 0) return ''
  return `${avgLine.value} L${PLOT_RIGHT},${PLOT_BOTTOM} L${PLOT_LEFT},${PLOT_BOTTOM} Z`
})

const timeLabels = computed(() => {
  const rows = ordered.value
  if (rows.length === 0) return []
  const idxs = rows.length === 1 ? [0] : [0, Math.floor((rows.length - 1) / 2), rows.length - 1]
  return [...new Set(idxs)].map((i) => ({
    x: x(i, rows.length),
    label: new Date(rows[i]!.recordedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
  }))
})

const DIR_TOP = 20
const DIR_BOTTOM = 168

function dirY(deg: number): number {
  return DIR_TOP + ((DIR_BOTTOM - DIR_TOP) * deg) / 360
}

const dirPoints = computed(() =>
  ordered.value
    .map((r, i) => (r.windDirDeg == null ? null : { x: x(i, ordered.value.length), y: dirY(r.windDirDeg) }))
    .filter((p): p is { x: number; y: number } => p !== null),
)
</script>

<template>
  <div>
    <div class="card chart-card">
      <div class="chart-head">
        <span class="chart-title">Vento &amp; raffica</span>
        <span class="chart-unit">km/h</span>
      </div>
      <p v-if="ordered.length === 0" class="empty">Nessun dato disponibile</p>
      <template v-else>
        <svg width="358" height="230" viewBox="0 0 358 230">
          <line :x1="PLOT_LEFT" :y1="PLOT_BOTTOM" :x2="PLOT_RIGHT" :y2="PLOT_BOTTOM" stroke="#c3c2b7" stroke-width="1" />
          <line v-for="lvl in [10, 20, 30]" :key="lvl" :x1="PLOT_LEFT" :y1="y(lvl)" :x2="PLOT_RIGHT" :y2="y(lvl)" stroke="#e1e0d9" stroke-width="1" />
          <line :x1="PLOT_LEFT" :y1="PLOT_TOP" :x2="PLOT_RIGHT" :y2="PLOT_TOP" stroke="#e1e0d9" stroke-width="1" />
          <text x="28" y="193" text-anchor="end" font-size="10" fill="#898781">0</text>
          <text x="28" :y="y(10) + 3" text-anchor="end" font-size="10" fill="#898781">10</text>
          <text x="28" :y="y(20) + 3" text-anchor="end" font-size="10" fill="#898781">20</text>
          <text x="28" :y="y(30) + 3" text-anchor="end" font-size="10" fill="#898781">30</text>
          <text x="28" y="13" text-anchor="end" font-size="10" fill="#898781">40</text>

          <defs>
            <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a78d6" stop-opacity="0.32" />
              <stop offset="100%" stop-color="#2a78d6" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="gustLine" fill="none" stroke="#8fb7e8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <path :d="avgArea" fill="url(#windFill)" />
          <path :d="avgLine" fill="none" stroke="#2a78d6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

          <g font-size="9.5" fill="#898781">
            <text v-for="(t, i) in timeLabels" :key="i" :x="t.x" y="212" :transform="`rotate(-40 ${t.x} 212)`">{{ t.label }}</text>
          </g>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="swatch" style="border-top: 2.2px solid #2a78d6" />media</div>
          <div class="legend-item"><span class="swatch" style="border-top: 1.6px solid #8fb7e8" />raffica</div>
        </div>
      </template>
    </div>

    <div class="card chart-card" style="margin-top: 14px">
      <div class="chart-head"><span class="chart-title">Direzione vento</span></div>
      <p v-if="dirPoints.length === 0" class="empty">Nessun dato disponibile</p>
      <svg v-else width="358" height="190" viewBox="0 0 358 190">
        <line v-for="deg in [0, 90, 180, 270, 360]" :key="deg" :x1="34" :y1="dirY(deg)" x2="350" :y2="dirY(deg)" :stroke="deg === 0 || deg === 360 ? '#c3c2b7' : '#e1e0d9'" stroke-width="1" />
        <text x="28" :y="dirY(0) + 3" text-anchor="end" font-size="10" fill="#898781">N</text>
        <text x="28" :y="dirY(90) + 3" text-anchor="end" font-size="10" fill="#898781">E</text>
        <text x="28" :y="dirY(180) + 3" text-anchor="end" font-size="10" fill="#898781">S</text>
        <text x="28" :y="dirY(270) + 3" text-anchor="end" font-size="10" fill="#898781">O</text>
        <text x="28" :y="dirY(360) + 3" text-anchor="end" font-size="10" fill="#898781">N</text>
        <g fill="#2a78d6" opacity="0.75">
          <circle v-for="(p, i) in dirPoints" :key="i" :cx="p.x" :cy="p.y" r="2.6" />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 0;
  overflow: hidden;
}
.chart-head {
  padding: 16px 16px 6px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.chart-title {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-weight: 600;
}
.chart-unit {
  font-size: 10px;
  color: var(--ink-muted);
}
.chart-legend {
  display: flex;
  gap: 16px;
  padding: 2px 18px 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ink-soft);
}
.swatch {
  width: 16px;
  height: 0;
  display: inline-block;
}
.empty {
  padding: 24px 16px;
  color: var(--ink-muted);
  font-size: 13px;
}
</style>
