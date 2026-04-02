<template>
  <div class="panel">
    <Transition name="fade-slide" mode="out-in">
      <WelcomePanel
        v-if="view === 'welcome'"
        :stats="welcomeStats"
        :top-partidos="topPartidos"
        :recent-activity="recentActivity"
        :geo-progress="geoProgress"
        @zone-select="$emit('zone-select', $event)"
      />
      <ZonePanel
        v-else
        :zone="currentZone"
        :inmos="currentInmos"
        @back="$emit('back')"
      />
    </Transition>
  </div>
</template>

<script setup>
import WelcomePanel from './WelcomePanel.vue'
import ZonePanel from './ZonePanel.vue'

defineProps({
  view: { type: String, default: 'welcome' },
  welcomeStats: { type: Object, default: null },
  topPartidos: { type: Array, default: () => [] },
  recentActivity: { type: Array, default: () => [] },
  geoProgress: { type: Number, default: 0 },
  currentZone: { type: Object, default: null },
  currentInmos: { type: Array, default: () => [] }
})

defineEmits(['zone-select', 'back'])
</script>

<style scoped>
.panel {
  width: var(--panel-w);
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
</style>
