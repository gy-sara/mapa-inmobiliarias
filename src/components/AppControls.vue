<template>
  <div class="controls">
    <div class="select-wrap">
      <div class="select-label">Partido</div>
      <select :value="selectedProvincia" @change="$emit('update:provincia', $event.target.value)">
        <option value="">Todos los partidos</option>
        <option v-for="p in provincias" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>
    <div class="select-wrap">
      <div class="select-label">Localidad</div>
      <select :value="selectedBarrio" @change="$emit('update:barrio', $event.target.value)" :disabled="!barrios.length">
        <option value="">Seleccioná una localidad</option>
        <option v-for="b in barrios" :key="b.nombre" :value="b.nombre.toUpperCase()">{{ b.nombre }}</option>
      </select>
    </div>
    <div class="mode-group">
      <div class="select-label">Vista</div>
      <div class="mode-toggle">
        <button :class="['mode-btn', { active: mode === 'markers' }]" @click="$emit('update:mode', 'markers')">
          📍 Marcadores
        </button>
        <button :class="['mode-btn', { active: mode === 'heat' }]" :disabled="!heatReady" @click="$emit('update:mode', 'heat')">
          🔥 Calor
        </button>
        <button :class="['mode-btn', { active: mode === 'temp' }]" :disabled="!heatReady" @click="$emit('update:mode', 'temp')">
          🌡️ Temperatura
        </button>
      </div>
    </div>
    <button class="btn-clear" @click="$emit('clear')" title="Limpiar selección">✕</button>
  </div>
</template>

<script setup>
defineProps({
  provincias: { type: Array, default: () => [] },
  barrios: { type: Array, default: () => [] },
  mode: { type: String, default: 'markers' },
  heatReady: { type: Boolean, default: false },
  selectedProvincia: { type: String, default: '' },
  selectedBarrio: { type: String, default: '' }
})

defineEmits(['update:provincia', 'update:barrio', 'update:mode', 'clear'])
</script>

<style scoped>
.controls {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 10;
}

.select-wrap {
  position: relative;
  flex: 1;
  max-width: 240px;
}

.select-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 4px;
}

.select-wrap select {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  padding: 0 32px 0 12px;
  height: 36px;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  transition: border-color .2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%238888a0' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select-wrap select:focus {
  border-color: var(--accent);
}

.select-wrap select:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.mode-group {
  flex-shrink: 0;
}

.mode-toggle {
  display: flex;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  height: 36px;
}

.mode-btn {
  padding: 0 13px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: background .15s, color .15s;
  white-space: nowrap;
  border-right: 1px solid var(--border);
}

.mode-btn:last-child {
  border-right: none;
}

.mode-btn:hover:not(:disabled) {
  background: rgba(255,255,255,.05);
  color: var(--text);
}

.mode-btn.active {
  background: var(--accent);
  color: white;
}

.mode-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.btn-clear {
  height: 36px;
  width: 36px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  transition: background .15s, color .15s;
  flex-shrink: 0;
}

.btn-clear:hover {
  background: rgba(240,101,101,.12);
  color: var(--danger);
  border-color: var(--danger);
}
</style>
