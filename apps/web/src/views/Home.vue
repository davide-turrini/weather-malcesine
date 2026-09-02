<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrent, getStations } from '@/api'
import { windLevel } from '@/lib/thresholds'
import type { Reading, StationId, StationMeta } from '@/types'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001'

const stations = ref<Record<string, StationMeta>>({})
const current = ref<Record<string, Reading | null>>({})
const loading = ref(true)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const STATION_ORDER: StationId[] = ['holfuy', 'addicted_sport']

function fmt(n: number | null | undefined, digits = 0): string {
  return n == null ? '—' : n.toFixed(digits)
}

const LEVEL_LABEL: Record<string, string> = { normal: 'Buone', yellow: 'Cautela', red: 'Pericolo' }

async function load(): Promise<void> {
  try {
    const [s, c] = await Promise.all([getStations(), getCurrent()])
    stations.value = s
    current.value = c
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

function openStation(id: string): void {
  router.push(`/stazione/${id}`)
}

onMounted(() => {
  load()
  timer = setInterval(load, 30_000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main class="page">
    <div class="header">
      <div class="eyebrow">Meteo parapendio &middot; Lago di Garda</div>
      <div class="title">Malcesine</div>
    </div>
    <div class="subheader">
      <span>{{ STATION_ORDER.length }} centraline &middot; aggiornate ogni minuto</span>
      <span class="live"><span class="dot" />live</span>
    </div>

    <p v-if="loading" class="status">Caricamento…</p>
    <p v-else-if="error" class="status error">Errore: {{ error }}</p>

    <div class="cards">
      <div
        v-for="id in STATION_ORDER"
        :key="id"
        class="card station-card"
        @click="openStation(id)"
      >
        <template v-if="current[id] && stations[id]">
          <div class="row-top">
            <div>
              <div class="role">{{ stations[id]!.role }}</div>
              <div class="name">{{ stations[id]!.name }}<span v-if="stations[id]!.altitudeM"> &middot; {{ stations[id]!.altitudeM }} m</span></div>
            </div>
            <span class="badge" :class="windLevel(current[id]!.windSpeedKmh, current[id]!.windGustKmh)">
              {{ LEVEL_LABEL[windLevel(current[id]!.windSpeedKmh, current[id]!.windGustKmh)] }}
            </span>
          </div>

          <div class="wind-row">
            <span class="wind mono" :class="windLevel(current[id]!.windSpeedKmh, current[id]!.windGustKmh)">{{ fmt(current[id]!.windSpeedKmh) }}</span>
            <span class="unit">km/h</span>
            <span class="gust">raffica <b class="mono">{{ fmt(current[id]!.windGustKmh) }}</b></span>
          </div>

          <div class="footer-row">
            <span>{{ current[id]!.windDirDeg ?? '—' }}&deg; {{ current[id]!.windDirLabel ?? '' }}</span>
            <span>{{ fmt(current[id]!.temperatureC, 1) }}&deg;C</span>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="var(--ink-muted)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </div>
        </template>
        <p v-else class="status">Nessun dato disponibile</p>
      </div>
    </div>

    <a class="edge-link" :href="API_URL" target="_blank" rel="noopener">
      <div>Poca connessione in decollo?<br /><b>Usa la pagina essenziale</b></div>
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="var(--accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </a>
  </main>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--page);
}
.header {
  padding: 20px 20px 4px;
  background: var(--surface);
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-weight: 600;
}
.title {
  font-size: 24px;
  font-weight: 800;
  margin-top: 2px;
}
.subheader {
  padding: 10px 20px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--ink-muted);
}
.live {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #0a7a0a;
  font-weight: 600;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3fd67a;
  display: inline-block;
}
.status {
  padding: 16px 20px;
  color: var(--ink-muted);
}
.status.error {
  color: var(--critical);
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 16px 8px;
}
.station-card {
  padding: 18px 20px;
  cursor: pointer;
}
.row-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.role {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-weight: 600;
}
.name {
  font-size: 13px;
  color: var(--ink-soft);
  margin-top: 1px;
}
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
}
.badge.normal {
  background: rgba(12, 163, 12, 0.12);
  color: #0a7a0a;
}
.badge.yellow {
  background: rgba(250, 178, 25, 0.16);
  color: var(--warning-ink);
}
.badge.red {
  background: rgba(208, 59, 59, 0.12);
  color: var(--critical-ink);
}
.wind-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 14px;
}
.wind {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
  color: var(--ink);
}
.wind.yellow {
  color: var(--warning-ink);
}
.wind.red {
  color: var(--critical-ink);
}
.unit {
  font-size: 15px;
  color: var(--ink-muted);
  font-weight: 500;
}
.gust {
  font-size: 13px;
  color: var(--ink-soft);
  margin-left: 2px;
}
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-soft);
}
.edge-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 16px 20px;
  padding: 12px 14px;
  background: var(--accent-wash);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  font-size: 12px;
  color: var(--ink-soft);
  text-decoration: none;
}
.edge-link b {
  color: var(--ink);
}
</style>
