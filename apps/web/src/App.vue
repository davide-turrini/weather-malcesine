<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001'

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

const STATION_LABELS: Record<string, string> = {
  holfuy: 'Holfuy',
  addicted_sport: 'Addicted Sport',
}

const current = ref<Record<string, Reading | null>>({})
const loading = ref(true)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const stations = computed(() => Object.keys(current.value))

function fmt(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT')
}

async function load(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/current`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    current.value = await res.json()
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
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
  <main>
    <h1>Decollo Malcesine</h1>

    <p v-if="loading" class="status">Caricamento…</p>
    <p v-else-if="error" class="status error">Errore: {{ error }}</p>

    <div class="cards">
      <section v-for="station in stations" :key="station" class="card">
        <h2>{{ STATION_LABELS[station] ?? station }}</h2>
        <template v-if="current[station]">
          <p class="wind">
            {{ fmt(current[station]!.windSpeedKmh, 0) }}
            <span class="unit">km/h</span>
            <span class="gust">raffica {{ fmt(current[station]!.windGustKmh, 0) }}</span>
          </p>
          <p>{{ current[station]!.windDirLabel ?? '—' }} ({{ current[station]!.windDirDeg ?? '—' }}°)</p>
          <p>{{ fmt(current[station]!.temperatureC) }}°C · {{ fmt(current[station]!.humidityPct, 0) }}% umidità</p>
          <p class="ts">aggiornato {{ fmtTime(current[station]!.recordedAt) }}</p>
        </template>
        <p v-else class="status">Nessun dato disponibile</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  font-family: system-ui, sans-serif;
}
h1 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
}
.status {
  color: #6f7f9e;
}
.status.error {
  color: #d9534f;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.card {
  background: #161f33;
  color: #f5f5f5;
  border-radius: 10px;
  padding: 1rem 1.25rem;
}
.card h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #9fb3d9;
  margin: 0 0 0.5rem;
}
.wind {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0.2rem 0;
}
.unit {
  font-size: 1rem;
  font-weight: 400;
  color: #9fb3d9;
}
.gust {
  font-size: 0.9rem;
  font-weight: 400;
  color: #9fb3d9;
  margin-left: 0.5rem;
}
.ts {
  color: #6f7f9e;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}
</style>
