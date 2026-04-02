<template>
  <div class="zone-panel">
    <div class="panel-header">
      <button class="btn-back" @click="$emit('back')">← Volver</button>
      <div class="panel-title-wrap">
        <div class="panel-title">{{ zone?.loca?.nombre }}</div>
        <div class="panel-subtitle">{{ zone?.loca?.provincia }} · {{ inmos.length }} inmobiliaria{{ inmos.length !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <div v-if="inmos.length > 5" class="panel-search">
      <span class="search-icon">⌕</span>
      <input v-model="searchQuery" placeholder="Buscar en esta zona..." />
    </div>

    <div class="zona-summary" v-if="inmos.length">
      <div class="zona-name">{{ inmos.length }} inmobiliarias</div>
      <div class="zona-stats">
        <div class="zona-stat">
          <div class="zona-stat-val">{{ activas }}</div>
          <div class="zona-stat-label">Activas (30d)</div>
        </div>
        <div class="zona-stat">
          <div class="zona-stat-val">{{ comerciales }}</div>
          <div class="zona-stat-label">Comerciales</div>
        </div>
      </div>
    </div>

    <div class="panel-body">
      <TransitionGroup name="fade-up" tag="div" class="cards-list">
        <InmoCard
          v-for="(inmo, idx) in filteredInmos"
          :key="inmo.id || inmo.Account_Name"
          :inmo="inmo"
          :style="{ '--i': idx }"
        />
      </TransitionGroup>
      <div v-if="filteredInmos.length === 0 && searchQuery" class="no-results">
        Sin resultados para "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { daysAgo } from '../utils/helpers.js'
import InmoCard from './InmoCard.vue'

const props = defineProps({
  zone: { type: Object, default: null },
  inmos: { type: Array, default: () => [] }
})

defineEmits(['back'])

const searchQuery = ref('')

const filteredInmos = computed(() => {
  if (!searchQuery.value.trim()) return props.inmos
  const q = searchQuery.value.toLowerCase()
  return props.inmos.filter(i =>
    i.Account_Name?.toLowerCase().includes(q) ||
    i.Comercial_GarantiaYa?.toLowerCase().includes(q) ||
    i.Billing_Street?.toLowerCase().includes(q)
  )
})

const activas = computed(() =>
  props.inmos.filter(i => daysAgo(i.Fecha_Ultima_Venta) <= 30).length
)

const comerciales = computed(() =>
  props.inmos.filter(i => i.Comercial_GarantiaYa).length
)
</script>

<style scoped>
.zone-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-back {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.btn-back:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.panel-title-wrap {
  min-width: 0;
}

.panel-title {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  color: var(--text);
  line-height: 1.2;
}

.panel-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
}

.panel-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.search-icon {
  color: var(--text-muted);
  font-size: 15px;
}

.panel-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
}

.panel-search input::placeholder {
  color: var(--text-muted);
}

.zona-summary {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.zona-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.zona-stats {
  display: flex;
  gap: 16px;
}

.zona-stat {
  text-align: right;
}

.zona-stat-val {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}

.zona-stat-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--surface2) transparent;
}

.cards-list {
  display: flex;
  flex-direction: column;
}

.no-results {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 24px 0;
}
</style>
