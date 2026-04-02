<template>
  <header>
    <div class="logo">
      <img class="logo-img" :src="LOGO_URL" alt="GarantíaYa" />
      GarantíaYa <span class="logo-sub">/ Mapa</span>
    </div>

    <div class="global-search">
      <div class="gs-wrap" :class="{ focused: isFocused }">
        <span class="gs-icon">⌕</span>
        <input
          ref="inputRef"
          v-model="query"
          @focus="isFocused = true"
          @blur="onBlur"
          @keydown.esc="clear"
          placeholder="Buscar inmobiliaria..."
        />
        <button v-if="query" class="gs-clear" @click="clear">✕</button>
      </div>
      <Transition name="dropdown">
        <div v-if="showDropdown" class="gs-dropdown">
          <div v-if="!results.length" class="gs-empty">Sin resultados</div>
          <div
            v-for="item in results"
            :key="item.id || item.Account_Name"
            class="gs-result"
            @mousedown.prevent="select(item)"
          >
            <span class="gs-result-icon">🏠</span>
            <div class="gs-result-info">
              <div class="gs-result-name">{{ item.Account_Name }}</div>
              <div class="gs-result-meta">
                {{ item.Billing_City || '—' }}{{ item.Comercial_GarantiaYa ? ' · ' + item.Comercial_GarantiaYa : '' }}
              </div>
            </div>
            <span class="inmo-tag" :class="tagInfo(daysAgo(item.Fecha_Ultima_Venta)).cls">
              {{ tagInfo(daysAgo(item.Fecha_Ultima_Venta)).label }}
            </span>
          </div>
        </div>
      </Transition>
    </div>

    <div class="header-stats">
      <div class="stat">
        <div class="stat-val">{{ totalInmos.toLocaleString('es-AR') }}</div>
        <div class="stat-label">Inmobiliarias</div>
      </div>
      <div class="stat">
        <div class="stat-val">{{ totalZonas }}</div>
        <div class="stat-label">Partidos</div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { daysAgo, tagInfo } from '../utils/helpers.js'

const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/storage-files-b4831.appspot.com/o/isologo_color_positivo%20(1).jpg?alt=media&token=ab83edb4-0bc0-42cb-b320-a236cc6d2952'

const props = defineProps({
  totalInmos: { type: Number, default: 0 },
  totalZonas: { type: Number, default: 0 },
  allInmos: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate-to-inmo'])

const query = ref('')
const isFocused = ref(false)
const inputRef = ref(null)

const results = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.toLowerCase()
  return props.allInmos.filter(i => i.Account_Name?.toLowerCase().includes(q)).slice(0, 12)
})

const showDropdown = computed(() => query.value.length > 0 && isFocused.value)

function select(inmo) {
  emit('navigate-to-inmo', inmo)
  query.value = ''
  isFocused.value = false
}

function clear() {
  query.value = ''
  isFocused.value = false
}

function onBlur() {
  setTimeout(() => { isFocused.value = false }, 150)
}
</script>

<style scoped>
header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 10;
}

.logo {
  font-family: 'DM Serif Display', serif;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  color: var(--text);
}

.logo-img {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  object-fit: contain;
  background: white;
  padding: 2px;
}

.logo-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 400;
}

.global-search {
  flex: 1;
  max-width: 340px;
  position: relative;
}

.gs-wrap {
  display: flex;
  align-items: center;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 0 14px 0 12px;
  gap: 8px;
  transition: border-color .2s, box-shadow .2s;
  height: 36px;
}

.gs-wrap.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(91,106,247,.12);
}

.gs-icon {
  color: var(--text-muted);
  font-size: 16px;
  flex-shrink: 0;
}

.gs-wrap input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
}

.gs-wrap input::placeholder {
  color: var(--text-muted);
}

.gs-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  flex-shrink: 0;
}

.gs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
  overflow: hidden;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}

.gs-empty {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.gs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background .12s;
}

.gs-result:hover {
  background: rgba(255,255,255,.04);
}

.gs-result-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.gs-result-info {
  flex: 1;
  min-width: 0;
}

.gs-result-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gs-result-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-stats {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-left: auto;
}

.stat {
  text-align: right;
}

.stat-val {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--text);
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all .15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
