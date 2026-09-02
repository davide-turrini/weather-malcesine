<script setup lang="ts">
defineProps<{
  level: 'red' | 'yellow'
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="banner" :class="level === 'red' ? 'banner-critical' : 'banner-warning'">
    <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink: 0; margin-top: 1px">
      <path
        d="M12 3.5 L22 20.5 L2 20.5 Z"
        fill="none"
        :stroke="level === 'red' ? '#ffffff' : '#8a5a00'"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <line x1="12" y1="9.5" x2="12" y2="14.5" :stroke="level === 'red' ? '#ffffff' : '#8a5a00'" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="17.3" r="1" :fill="level === 'red' ? '#ffffff' : '#8a5a00'" />
    </svg>
    <div>
      <div class="banner-title">{{ title }}</div>
      <div class="banner-sub">{{ subtitle }}</div>
    </div>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: var(--r-md);
}
.banner-critical {
  background: linear-gradient(135deg, #e14b4b, var(--critical));
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(208, 59, 59, 0.3);
}
.banner-warning {
  background: #fff6de;
  border: 1px solid #f6d896;
  color: var(--warning-ink);
}
.banner-title {
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.3;
}
.banner-sub {
  font-size: 12px;
  opacity: 0.92;
  margin-top: 2px;
  line-height: 1.35;
}
</style>
