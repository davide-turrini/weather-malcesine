<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    unit?: string
    accent?: 'warn' | 'crit' | 'neutral'
  }>(),
  { unit: '', accent: 'neutral' },
)
</script>

<template>
  <div class="stat-chip" :class="accent">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value"><span class="mono">{{ value }}</span></div>
    <div class="stat-unit">{{ unit }}</div>
  </div>
</template>

<style scoped>
.stat-chip {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 12px 4px 11px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.stat-chip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.stat-chip.warn::before {
  background: var(--warning);
}
.stat-chip.crit::before {
  background: var(--critical);
}
.stat-chip.neutral::before {
  background: transparent;
}
.stat-label {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.stat-value {
  margin-top: 4px;
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
}
.stat-unit {
  font-size: 10px;
  color: var(--ink-muted);
}
</style>
