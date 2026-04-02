<template>
  <div class="welcome-panel">
    <div class="panel-header">
      <div class="panel-title">Panorama general</div>
      <div class="panel-subtitle">Explorá el mapa o usá los accesos rápidos</div>
    </div>

    <div class="panel-body">
      <!-- Live badge -->
      <div class="live-badge">
        <span class="live-dot"></span>
        En vivo · Actualizado hoy
      </div>

      <!-- Stats grid -->
      <div class="welcome-stats-grid" v-if="stats">
        <div class="ws-card">
          <div class="ws-val" ref="totalRef">0</div>
          <div class="ws-label">Total</div>
        </div>
        <div class="ws-card">
          <div class="ws-val" ref="activasRef">0</div>
          <div class="ws-label">Activas 30d</div>
        </div>
        <div class="ws-card">
          <div class="ws-val" ref="zonasRef">0</div>
          <div class="ws-label">Partidos</div>
        </div>
      </div>

      <!-- Geo progress -->
      <div v-if="geoProgress > 0 && geoProgress < 1" class="geo-progress">
        <div class="geo-progress-label">Preparando mapa de calor ({{ Math.round(geoProgress * 100) }}%)</div>
        <div class="geo-progress-bar">
          <div class="geo-progress-fill" :style="{ width: (geoProgress * 100) + '%' }"></div>
        </div>
      </div>

      <!-- Quick access -->
      <div class="section-title">Acceso rápido</div>
      <div class="quick-chips">
        <button
          v-for="(chip, idx) in topPartidos"
          :key="chip[0]"
          :class="['chip', { featured: idx === 0 }]"
          @click="$emit('zone-select', chip[0])"
        >
          {{ idx === 0 ? '★ ' : '' }}{{ chip[0] }}
          <span class="chip-count">{{ chip[1] }}</span>
        </button>
      </div>

      <!-- Top partidos -->
      <div class="section-title">Top partidos</div>
      <div class="top-zonas-list">
        <div
          v-for="(item, idx) in topPartidos"
          :key="item[0]"
          class="top-zona-item"
          @click="$emit('zone-select', item[0])"
        >
          <span class="tz-rank">{{ idx + 1 }}</span>
          <div class="tz-info">
            <div class="tz-name">{{ item[0] }}</div>
            <div class="tz-bar-wrap">
              <div
                class="tz-bar"
                ref="barRefs"
                :data-width="topPartidos.length ? (item[1] / topPartidos[0][1] * 100) : 0"
                :style="{ width: barWidths[idx] + '%' }"
              ></div>
            </div>
          </div>
          <span class="tz-count">{{ item[1] }}</span>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="section-title">Actividad reciente</div>
      <TransitionGroup name="fade-up" tag="div" class="activity-list">
        <div
          v-for="(inmo, idx) in recentActivity"
          :key="inmo.id || inmo.Account_Name"
          class="activity-item"
          :style="{ '--i': idx }"
        >
          <div class="act-left">
            <span class="act-dot" :class="dotClass(daysAgo(inmo.Fecha_Ultima_Venta))"></span>
            <div class="act-info">
              <div class="act-name">{{ inmo.Account_Name }}</div>
              <div class="act-city">{{ inmo.Billing_City || '—' }}</div>
            </div>
          </div>
          <div class="act-ago">{{ formatAgo(daysAgo(inmo.Fecha_Ultima_Venta)) }}</div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { daysAgo, formatAgo, animateCounter } from '../utils/helpers.js'

const props = defineProps({
  stats: { type: Object, default: null },
  topPartidos: { type: Array, default: () => [] },
  recentActivity: { type: Array, default: () => [] },
  geoProgress: { type: Number, default: 0 }
})

defineEmits(['zone-select'])

const totalRef = ref(null)
const activasRef = ref(null)
const zonasRef = ref(null)
const barWidths = ref(props.topPartidos.map(() => 0))

function dotClass(days) {
  if (days <= 30) return 'dot-recent'
  if (days <= 90) return 'dot-mid'
  return 'dot-old'
}

onMounted(() => {
  if (props.stats) {
    animateCounter(totalRef.value, props.stats.total || 0, 1200, 100)
    animateCounter(activasRef.value, props.stats.activas30 || 0, 1200, 200)
    animateCounter(zonasRef.value, props.stats.zonas || 0, 1200, 300)
  }

  // Animate bars with staggered delay
  setTimeout(() => {
    barWidths.value = props.topPartidos.map((item, idx) => {
      return props.topPartidos.length ? (item[1] / props.topPartidos[0][1] * 100) : 0
    })
  }, 400)
})
</script>

<style scoped>
.welcome-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  color: var(--text);
}

.panel-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--surface2) transparent;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(78,203,138,.08);
  border: 1px solid rgba(78,203,138,.2);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--success);
  margin-bottom: 14px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(.8); }
}

.welcome-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.ws-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
}

.ws-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
}

.ws-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.geo-progress {
  margin-bottom: 14px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
}

.geo-progress-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.geo-progress-bar {
  height: 3px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.geo-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width .3s ease;
}

.section-title {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 600;
  margin: 14px 0 8px;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.chip {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all .15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(91,106,247,.08);
}

.chip.featured {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(232,201,126,.07);
}

.chip-count {
  font-size: 10px;
  opacity: .7;
}

.top-zonas-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
}

.top-zona-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
}

.top-zona-item:hover {
  background: rgba(255,255,255,.04);
}

.tz-rank {
  font-size: 11px;
  color: var(--text-muted);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.tz-info {
  flex: 1;
  min-width: 0;
}

.tz-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tz-bar-wrap {
  height: 3px;
  background: var(--border);
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
}

.tz-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width .6s cubic-bezier(.25,1,.5,1);
}

.tz-count {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  transition: background .15s;
}

.activity-item:hover {
  background: rgba(255,255,255,.03);
}

.act-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.act-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.act-dot.dot-recent { background: var(--success); }
.act-dot.dot-mid { background: var(--gold); }
.act-dot.dot-old { background: var(--danger); }

.act-info {
  min-width: 0;
}

.act-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.act-city {
  font-size: 11px;
  color: var(--text-muted);
}

.act-ago {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
