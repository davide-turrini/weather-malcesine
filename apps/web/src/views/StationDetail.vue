<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrent, getHistory, getHistorySummary, getStations } from '@/api'
import LogTable from '@/components/LogTable.vue'
import StatChip from '@/components/StatChip.vue'
import WarningBanner from '@/components/WarningBanner.vue'
import WindChart from '@/components/WindChart.vue'
import WindCompass from '@/components/WindCompass.vue'
import { dewPointC } from '@/lib/meteo'
import { isInMarginalSector, valueTier, windLevel } from '@/lib/thresholds'
import type { Reading, StationId, StationMeta, SummaryRow } from '@/types'

const route = useRoute()
const router = useRouter()

const STATION_ORDER: StationId[] = ['holfuy', 'addicted_sport']

const stationId = computed(() => route.params.id as StationId)
const otherStationId = computed(() => STATION_ORDER.find((id) => id !== stationId.value) ?? STATION_ORDER[0])

const tab = ref<'live' | 'chart' | 'table'>('live')
const bucketMinutes = ref(15)

const stations = ref<Record<string, StationMeta>>({})
const current = ref<Reading | null>(null)
const recentReadings = ref<Reading[]>([]) // ultimi ~12 min, per la bussola
const chartReadings = ref<Reading[]>([]) // ultime 3h, per il grafico
const summaryRows = ref<SummaryRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const meta = computed<StationMeta | null>(() => stations.value[stationId.value] ?? null)
const otherMeta = computed<StationMeta | null>(() => stations.value[otherStationId.value] ?? null)

const level = computed(() => (current.value ? windLevel(current.value.windSpeedKmh, current.value.windGustKmh) : 'normal'))

const marginalDirection = computed(() => {
  const sector = meta.value?.directionSector
  const deg = current.value?.windDirDeg
  return sector && deg != null ? isInMarginalSector(sector, deg) : false
})

const dewPoint = computed(() => dewPointC(current.value?.temperatureC ?? null, current.value?.humidityPct ?? null))

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

async function loadAll(): Promise<void> {
  try {
    const [s, c, recent, chart] = await Promise.all([
      getStations(),
      getCurrent(),
      getHistory({ station: stationId.value, minutes: 12 }),
      getHistory({ station: stationId.value, minutes: 180 }),
    ])
    stations.value = s
    current.value = c[stationId.value] ?? null
    recentReadings.value = recent
    chartReadings.value = chart
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

async function loadSummary(): Promise<void> {
  try {
    const rows = await getHistorySummary({ station: stationId.value, bucket: bucketMinutes.value, minutes: bucketMinutes.value * 10 })
    summaryRows.value = rows.slice(0, 10)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

watch(bucketMinutes, () => loadSummary())
watch(stationId, () => {
  loading.value = true
  tab.value = 'live'
  loadAll()
  loadSummary()
})

onMounted(() => {
  loadAll()
  loadSummary()
  timer = setInterval(() => {
    loadAll()
    loadSummary()
  }, 30_000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main class="page">
    <div class="header">
      <div class="back" @click="router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke="var(--accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Indietro
      </div>
      <div class="title">{{ meta?.role ?? '' }} {{ meta?.name ? `— ${meta.name}` : '' }}</div>
      <div />
    </div>

    <div class="tabs">
      <div class="tabpill" :class="{ active: tab === 'live' }" @click="tab = 'live'">Live</div>
      <div class="tabpill" :class="{ active: tab === 'chart' }" @click="tab = 'chart'">Grafico</div>
      <div class="tabpill" :class="{ active: tab === 'table' }" @click="tab = 'table'">Tabella</div>
    </div>

    <p v-if="loading" class="status">Caricamento…</p>
    <p v-else-if="error" class="status error">Errore: {{ error }}</p>

    <template v-else-if="current">
      <section v-show="tab === 'live'" class="tab-pane">
        <WarningBanner
          v-if="level === 'red'"
          level="red"
          title="Vento troppo forte"
          :subtitle="`Raffica ${fmt(current.windGustKmh, 0)} km/h, oltre la soglia di sicurezza (25 km/h)`"
        />
        <WarningBanner
          v-else-if="level === 'yellow'"
          level="yellow"
          title="Vento sostenuto"
          subtitle="Valuta con attenzione prima di volare"
        />
        <WarningBanner
          v-if="marginalDirection"
          level="yellow"
          title="Direzione ai margini del settore ottimale"
          subtitle="Calibrazione della centralina, non un giudizio di volabilit&agrave;"
        />

        <div class="updated-row">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" fill="none" stroke="var(--accent)" stroke-width="1.8" /><circle cx="12" cy="10" r="2.4" fill="var(--accent)" /></svg>
          <span>aggiornato {{ new Date(current.recordedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>

        <WindCompass :readings="recentReadings" :direction-sector="meta?.directionSector ?? null" />

        <div class="stat-grid">
          <StatChip label="Vento" :value="fmt(current.windSpeedKmh, 0)" unit="km/h" :accent="valueTier(current.windSpeedKmh) === 'red' ? 'crit' : valueTier(current.windSpeedKmh) === 'yellow' ? 'warn' : 'neutral'" />
          <StatChip label="Raffica" :value="fmt(current.windGustKmh, 0)" unit="km/h" :accent="valueTier(current.windGustKmh) === 'red' ? 'crit' : valueTier(current.windGustKmh) === 'yellow' ? 'warn' : 'neutral'" />
          <StatChip label="Direz." :value="String(current.windDirDeg ?? '—')" :unit="`&deg; ${current.windDirLabel ?? ''}`" />
          <StatChip label="Temp." :value="fmt(current.temperatureC)" unit="&deg;C" />
        </div>

        <div class="card detail-list">
          <div class="detail-row"><span class="k">Umidit&agrave;</span><span class="v">{{ fmt(current.humidityPct, 0) }} %</span></div>
          <div class="detail-row"><span class="k">Punto di rugiada</span><span class="v">{{ fmt(dewPoint) }}&deg;C</span></div>
          <div class="detail-row" style="border-bottom: none"><span class="k">Pressione</span><span class="v">{{ fmt(current.pressureHpa) }} hPa</span></div>
        </div>

        <div class="switcher" @click="router.push(`/stazione/${otherStationId}`)">
          VEDI {{ (otherMeta?.role ?? '').toUpperCase() }} &rarr;
        </div>
      </section>

      <section v-show="tab === 'chart'" class="tab-pane">
        <WindChart :readings="chartReadings" />
      </section>

      <section v-show="tab === 'table'" class="tab-pane no-pad">
        <LogTable :rows="summaryRows" :bucket-minutes="bucketMinutes" @update:bucket-minutes="bucketMinutes = $event" />
      </section>
    </template>

    <div class="foot">Malcesine Meteo</div>
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.back {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--accent);
  font-size: 16px;
  font-weight: 500;
  justify-self: start;
  cursor: pointer;
}
.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
  white-space: nowrap;
}
.tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.tabpill {
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  border: 1.5px solid var(--accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface);
  color: var(--accent);
  user-select: none;
}
.tabpill.active {
  background: linear-gradient(180deg, var(--accent), var(--accent-dark));
  color: #ffffff;
  border-color: var(--accent-dark);
}
.status {
  padding: 16px 20px;
  color: var(--ink-muted);
}
.status.error {
  color: var(--critical);
}
.tab-pane {
  padding: 12px 16px 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tab-pane.no-pad {
  padding: 12px 0 4px;
}
.updated-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.detail-list {
  overflow: hidden;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
}
.detail-row .k {
  color: var(--ink-soft);
}
.detail-row .v {
  font-weight: 600;
}
.switcher {
  padding: 14px;
  background: var(--accent-wash);
  border: 1.5px solid var(--accent);
  border-radius: var(--r-md);
  text-align: center;
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
}
.foot {
  padding: 14px 16px 24px;
  font-size: 10.5px;
  color: var(--ink-muted);
}
</style>
