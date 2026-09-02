<script setup lang="ts">
import { valueTier } from '@/lib/thresholds'
import type { SummaryRow } from '@/types'

defineProps<{
  rows: SummaryRow[]
  bucketMinutes: number
}>()

const emit = defineEmits<{ 'update:bucketMinutes': [value: number] }>()

function fmt(n: number | null | undefined, digits = 0): string {
  return n == null ? '—' : n.toFixed(digits)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <div style="padding: 14px 16px">
      <div class="toggle-row">
        <div class="toggle" :class="{ active: bucketMinutes === 15 }" @click="emit('update:bucketMinutes', 15)">15 minuti</div>
        <div class="toggle" :class="{ active: bucketMinutes === 60 }" @click="emit('update:bucketMinutes', 60)">Media oraria</div>
      </div>
    </div>

    <div class="card" style="margin: 0 16px 16px; overflow-x: auto">
      <p v-if="rows.length === 0" class="empty">Nessun dato disponibile</p>
      <table v-else class="log-table">
        <thead>
          <tr>
            <th style="text-align: center">Vento</th>
            <th style="text-align: center">Raffica</th>
            <th style="text-align: center">Direz.</th>
            <th style="text-align: center">Temp.</th>
            <th style="text-align: right">Ora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.bucketStart" :class="{ odd: i % 2 === 1 }">
            <td style="text-align: center">
              <span class="mono chip" :class="valueTier(row.avgWindSpeedKmh)">{{ fmt(row.avgWindSpeedKmh) }}</span>
            </td>
            <td style="text-align: center">
              <span class="mono chip" :class="valueTier(row.maxGustKmh)">{{ fmt(row.maxGustKmh) }}</span>
            </td>
            <td style="text-align: center; color: var(--ink-soft)">{{ row.windDirLabel ?? '—' }}</td>
            <td class="mono" style="text-align: center">{{ fmt(row.avgTemperatureC, 1) }}</td>
            <td class="mono" style="text-align: right; color: var(--ink-muted)">{{ fmtTime(row.bucketStart) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.toggle-row {
  display: flex;
  gap: 8px;
}
.toggle {
  flex: 1;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: 1.5px solid var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface);
  color: var(--accent);
  user-select: none;
}
.toggle.active {
  background: linear-gradient(180deg, var(--accent), var(--accent-dark));
  color: #ffffff;
  border-color: var(--accent-dark);
}
.log-table {
  width: 100%;
  border-collapse: collapse;
}
.log-table th {
  font-size: 9.5px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 8px 4px;
  border-bottom: 1px solid var(--line);
}
.log-table td {
  padding: 9px 4px;
  font-size: 13px;
  color: var(--ink);
  border-top: 1px solid var(--line);
}
.log-table tr.odd {
  background: #fcfcfb;
}
.chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}
.chip.yellow {
  background: rgba(250, 178, 25, 0.18);
  color: #a86a00;
}
.chip.red {
  background: rgba(208, 59, 59, 0.14);
  color: #b32c2c;
}
.empty {
  padding: 20px 16px;
  color: var(--ink-muted);
  font-size: 13px;
}
</style>
