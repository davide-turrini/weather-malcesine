<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001'
const BUCKET_OPTIONS = [5, 10, 15, 30] as const
const WIND_YELLOW_KMH = 15
const WIND_RED_KMH = 25
const TABLE_ROWS = 8

interface Reading {
  station: string
  recordedAt: string
  windSpeedKmh: number | null
  windGustKmh: number | null
  windDirDeg: number | null
  windDirLabel: string | null
  temperatureC: number | null
  humidityPct: number | null
  pressureHpa: number | null
}

interface SummaryRow {
  station: string
  bucketStart: string
  avgWindSpeedKmh: number | null
  maxWindSpeedKmh: number | null
  maxGustKmh: number | null
  windDirLabel: string | null
  windDirDeg: number | null
  samples: number
}

const STATION_META: Record<string, { role: string; name: string }> = {
  holfuy: { role: 'Decollo', name: 'Holfuy' },
  addicted_sport: { role: 'Atterraggio', name: 'Addicted Sport' },
}

const current = ref<Record<string, Reading | null>>({})
const summary = ref<Record<string, SummaryRow[]>>({})
const bucket = ref<(typeof BUCKET_OPTIONS)[number]>(10)
const loading = ref(true)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const stations = computed(() => Object.keys(current.value))

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function windLevel(speedKmh: number | null | undefined, gustKmh: number | null | undefined): 'normal' | 'yellow' | 'red' {
  const worst = Math.max(speedKmh ?? 0, gustKmh ?? 0)
  if (worst > WIND_RED_KMH) return 'red'
  if (worst >= WIND_YELLOW_KMH) return 'yellow'
  return 'normal'
}

async function loadCurrent(): Promise<void> {
  const res = await fetch(`${API_URL}/current`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  current.value = await res.json()
}

async function loadSummary(): Promise<void> {
  const res = await fetch(`${API_URL}/history/summary?bucket=${bucket.value}&minutes=${bucket.value * (TABLE_ROWS + 1)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const rows: SummaryRow[] = await res.json()
  const grouped: Record<string, SummaryRow[]> = {}
  for (const row of rows) {
    const list = grouped[row.station]
    if (list) list.push(row)
    else grouped[row.station] = [row]
  }
  summary.value = grouped
}

async function loadAll(): Promise<void> {
  try {
    await Promise.all([loadCurrent(), loadSummary()])
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

watch(bucket, () => loadSummary())

onMounted(() => {
  loadAll()
  timer = setInterval(loadAll, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main>
    <h1>Decollo Malcesine</h1>

    <p v-if="loading" class="status">Caricamento…</p>
    <p v-else-if="error" class="status error">Errore: {{ error }}</p>

    <div class="buckets">
      <button
        v-for="opt in BUCKET_OPTIONS"
        :key="opt"
        type="button"
        class="bucketbtn"
        :class="{ active: bucket === opt }"
        @click="bucket = opt"
      >
        {{ opt }} min
      </button>
    </div>

    <div class="cards">
      <section v-for="station in stations" :key="station" class="card">
        <h2>
          {{ STATION_META[station]?.role ?? station }}
          <span class="stationname">{{ STATION_META[station]?.name ?? '' }}</span>
        </h2>

        <template v-if="current[station]">
          <p class="wind" :class="`wind-${windLevel(current[station]!.windSpeedKmh, current[station]!.windGustKmh)}`">
            {{ fmt(current[station]!.windSpeedKmh, 0) }}<span class="unit">km/h</span>
          </p>
          <p class="gust">raffica {{ fmt(current[station]!.windGustKmh, 0) }} km/h</p>
          <p class="detail">{{ current[station]!.windDirLabel ?? '—' }} ({{ current[station]!.windDirDeg ?? '—' }}°) · {{ fmt(current[station]!.temperatureC) }}°C</p>
          <p class="ts">aggiornato {{ fmtTime(current[station]!.recordedAt) }}</p>

          <table v-if="summary[station]?.length" class="summary">
            <thead>
              <tr>
                <th>ora</th>
                <th>media</th>
                <th>raffica</th>
                <th>dir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summary[station]!.slice(0, TABLE_ROWS)" :key="row.bucketStart">
                <td>{{ fmtTime(row.bucketStart) }}</td>
                <td>{{ fmt(row.avgWindSpeedKmh, 0) }}</td>
                <td>{{ fmt(row.maxGustKmh, 0) }}</td>
                <td>{{ row.windDirLabel ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-else class="status">Nessun dato disponibile</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  font-family: system-ui, sans-serif;
  background: #eef1f5;
  min-height: 100vh;
}
h1 {
  font-size: 1.3rem;
  margin: 0 0 1rem;
  color: #111;
}
.status {
  color: #8a94a3;
}
.status.error {
  color: #dc2626;
}
.buckets {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.4rem;
}
.bucketbtn {
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  border: 1px solid #dbe1e8;
  font-size: 0.85rem;
  cursor: pointer;
}
.bucketbtn.active {
  background: #334155;
  color: #fff;
  border-color: #334155;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
.card {
  background: #fff;
  color: #111;
  border-radius: 12px;
  padding: 1.1rem 1.35rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.card h2 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #111;
  margin: 0 0 0.5rem;
}
.stationname {
  font-size: 0.75rem;
  color: #8a94a3;
  text-transform: none;
  font-weight: 400;
}
.wind {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 0.1rem 0;
  line-height: 1;
  color: #111;
}
.wind .unit {
  font-size: 1.2rem;
  font-weight: 500;
  color: #8a94a3;
  margin-left: 0.35rem;
}
.wind-yellow {
  color: #a15c00;
  background: #fff3cd;
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 10px;
}
.wind-red {
  color: #fff;
  background: #dc2626;
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 10px;
}
.gust {
  font-size: 1.1rem;
  margin: 0.2rem 0;
  color: #334155;
}
.detail {
  font-size: 1rem;
  margin: 0.2rem 0;
  color: #334155;
}
.ts {
  color: #8a94a3;
  font-size: 0.8rem;
  margin: 0.3rem 0 0.6rem;
}
table.summary {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 0.4rem;
}
table.summary th {
  text-align: left;
  color: #8a94a3;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  padding: 0.25rem 0.3rem;
  border-bottom: 1px solid #eef1f5;
}
table.summary td {
  padding: 0.3rem;
  border-bottom: 1px solid #f3f4f6;
}
</style>
