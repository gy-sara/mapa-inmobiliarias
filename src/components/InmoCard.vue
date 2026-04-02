<template>
  <div class="inmo-card">
    <div class="inmo-name">{{ inmo.Account_Name }}</div>
    <div v-if="inmo.Comercial_GarantiaYa" class="inmo-row">
      <span>👤</span>
      <span class="val">{{ inmo.Comercial_GarantiaYa }}</span>
    </div>
    <div v-if="inmo.Billing_Street" class="inmo-row">
      <span>📍</span>
      <span class="val">{{ inmo.Billing_Street }}</span>
    </div>
    <span class="inmo-tag" :class="tag.cls">{{ tag.label }}</span>
    <div class="inmo-footer">
      <div class="footer-links">
        <a v-if="inmo.url" :href="inmo.url" target="_blank" rel="noopener">Ver CRM →</a>
        <a v-if="inmo.Website" :href="websiteUrl" target="_blank" rel="noopener">🌐 Web</a>
      </div>
      <div class="date-badge">Última venta: {{ formatDate(inmo.Fecha_Ultima_Venta) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { daysAgo, tagInfo, formatDate } from '../utils/helpers.js'

const props = defineProps({
  inmo: { type: Object, required: true }
})

const days = computed(() => daysAgo(props.inmo.Fecha_Ultima_Venta))
const tag = computed(() => tagInfo(days.value))
const websiteUrl = computed(() => {
  const w = props.inmo.Website
  if (!w) return ''
  return w.startsWith('http') ? w : 'https://' + w
})
</script>

<style scoped>
.inmo-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  position: relative;
  transition: transform .15s, box-shadow .15s;
  overflow: hidden;
}

.inmo-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  opacity: 0;
  transition: opacity .15s;
}

.inmo-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
}

.inmo-card:hover::before {
  opacity: 1;
}

.inmo-name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 7px;
  color: var(--text);
  line-height: 1.3;
}

.inmo-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.inmo-row .val {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.inmo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.footer-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 11px;
  color: var(--accent2);
  text-decoration: none;
  transition: color .15s;
}

.footer-links a:hover {
  color: var(--accent);
  text-decoration: underline;
}

.date-badge {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
