<template>
  <LoadingOverlay :visible="showOverlay" :message="loaderMsg" />
  <AppHeader
    :total-inmos="totalInmos"
    :total-zonas="totalZonas"
    :all-inmos="raw?.inmobiliarias || []"
    @navigate-to-inmo="handleNavigateToInmo"
  />
  <AppControls
    :provincias="provincias"
    :barrios="barrios"
    :mode="mode"
    :heat-ready="heatReady"
    :selected-provincia="selectedProvincia"
    :selected-barrio="selectedBarrio"
    @update:provincia="handleProvinciaChange"
    @update:barrio="handleBarrioChange"
    @update:mode="mode = $event"
    @clear="handleClear"
  />
  <div class="loading-bar" :class="{ active: isLoading }"></div>
  <div class="layout">
    <MapView
      ref="mapViewRef"
      :loc-by-provincia="locByProvincia"
      :inmos-by-barrio="inmosByBarrio"
      :mode="mode"
      :selected-provincia="selectedProvincia"
      :geo-cache="geoCache"
      @zone-click="handleZoneClick"
    />
    <SidePanel
      :view="panelView"
      :welcome-stats="welcomeStats"
      :top-partidos="topPartidos"
      :recent-activity="recentActivity"
      :geo-progress="geoProgress"
      :current-zone="currentZone"
      :current-inmos="currentInmos"
      @zone-select="handleZoneSelect"
      @back="handleBack"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import AppHeader from './components/AppHeader.vue'
import AppControls from './components/AppControls.vue'
import MapView from './components/MapView.vue'
import SidePanel from './components/SidePanel.vue'
import { daysAgo, activityScore } from './utils/helpers.js'

const GMAPS_KEY = 'AIzaSyD3TyurpPf8hTBVBNpDwGNDyjZHPIzIHY8'

// State
const showOverlay = ref(true)
const loaderMsg = ref('Conectando con los datos...')
const isLoading = ref(false)
const raw = ref(null)
const locByProvincia = ref(new Map())
const inmosByBarrio = ref(new Map())
const selectedProvincia = ref('')
const selectedBarrio = ref('')
const mode = ref('markers')
const panelView = ref('welcome')
const currentZone = ref(null)
const heatReady = ref(false)
const geoProgress = ref(0)
const mapViewRef = ref(null)

// GeoCache: plain object loaded from localStorage
const geoCache = (() => {
  try {
    return JSON.parse(localStorage.getItem('gy_gc') || '{}')
  } catch {
    return {}
  }
})()

function saveGeoCache() {
  try {
    localStorage.setItem('gy_gc', JSON.stringify(geoCache))
  } catch {}
}

// Computed
const provincias = computed(() => {
  const keys = [...locByProvincia.value.keys()]
  return keys.sort((a, b) => a.localeCompare(b, 'es'))
})

const barrios = computed(() => {
  if (!selectedProvincia.value) return []
  return locByProvincia.value.get(selectedProvincia.value) || []
})

const totalInmos = computed(() => {
  if (!raw.value?.inmobiliarias) return 0
  return raw.value.inmobiliarias.length
})

const totalZonas = computed(() => {
  let count = 0
  for (const [, inmos] of inmosByBarrio.value) {
    if (inmos.length > 0) count++
  }
  return count
})

const currentInmos = computed(() => {
  if (!currentZone.value) return []
  return inmosByBarrio.value.get(currentZone.value.barrio) || []
})

const welcomeStats = computed(() => {
  if (!raw.value) return null
  const all = raw.value.inmobiliarias || []
  return {
    total: all.length,
    activas30: all.filter(i => daysAgo(i.Fecha_Ultima_Venta) <= 30).length,
    zonas: totalZonas.value
  }
})

const topPartidos = computed(() => {
  const counts = new Map()
  for (const [prov, locs] of locByProvincia.value) {
    let total = 0
    for (const loca of locs) {
      const inmos = inmosByBarrio.value.get(loca.nombre.toUpperCase()) || []
      total += inmos.length
    }
    if (total > 0) counts.set(prov, total)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
})

const recentActivity = computed(() => {
  if (!raw.value?.inmobiliarias) return []
  return [...raw.value.inmobiliarias]
    .filter(i => i.Fecha_Ultima_Venta)
    .sort((a, b) => new Date(b.Fecha_Ultima_Venta) - new Date(a.Fecha_Ultima_Venta))
    .slice(0, 6)
})

// Methods
function loadGoogleMaps() {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve()
      return
    }
    window.__gmInit = resolve
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=visualization&callback=__gmInit`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

async function loadData() {
  try {
    const res = await fetch('/api/datos')
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    raw.value = data

    const byProv = new Map()
    const byBarrio = new Map()

    const inmobiliarias = data.inmobiliarias || []
    const localidades = data.localidades || []

    // Build locByProvincia from localidades
    for (const loca of localidades) {
      const prov = loca.provincia?.toUpperCase()?.trim()
      if (!prov) continue
      if (!byProv.has(prov)) byProv.set(prov, [])
      byProv.get(prov).push(loca)
    }

    // Build inmosByBarrio
    for (const inmo of inmobiliarias) {
      const city = inmo.Billing_City?.toUpperCase()?.trim()
      if (!city) continue
      if (!byBarrio.has(city)) byBarrio.set(city, [])
      byBarrio.get(city).push(inmo)
    }

    // If no localidades in data, build provinces from inmobiliarias' Billing_State
    if (localidades.length === 0) {
      for (const inmo of inmobiliarias) {
        const prov = inmo.Billing_State?.toUpperCase()?.trim()
        const city = inmo.Billing_City?.trim()
        if (!prov || !city) continue
        if (!byProv.has(prov)) byProv.set(prov, [])
        const existing = byProv.get(prov)
        if (!existing.find(l => l.nombre?.toUpperCase() === city.toUpperCase())) {
          existing.push({ nombre: city, provincia: prov })
        }
      }
    }

    locByProvincia.value = byProv
    inmosByBarrio.value = byBarrio
  } catch (e) {
    console.error('loadData error:', e)
  }
}

function geocodeForBackground(address) {
  return new Promise((resolve) => {
    if (geoCache[address]) {
      resolve(geoCache[address])
      return
    }
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        }
        geoCache[address] = loc
        saveGeoCache()
        resolve(loc)
      } else {
        resolve(null)
      }
    })
  })
}

function checkHeatReady() {
  let total = 0
  let cached = 0
  for (const [prov, locs] of locByProvincia.value) {
    for (const loca of locs) {
      const barrioKey = loca.nombre.toUpperCase()
      const inmos = inmosByBarrio.value.get(barrioKey) || []
      if (!inmos.length) continue
      total++
      const address = `${loca.nombre}, ${prov}, Argentina`
      if (geoCache[address] || geoCache[barrioKey]) cached++
    }
  }
  return total > 0 && (cached / total) >= 0.7
}

async function geocodeAllInBackground() {
  const tasks = []
  for (const [prov, locs] of locByProvincia.value) {
    for (const loca of locs) {
      const barrioKey = loca.nombre.toUpperCase()
      const inmos = inmosByBarrio.value.get(barrioKey) || []
      if (!inmos.length) continue
      tasks.push({ prov, loca, barrioKey })
    }
  }

  if (!tasks.length) {
    heatReady.value = true
    return
  }

  let done = 0
  for (const task of tasks) {
    const address = `${task.loca.nombre}, ${task.prov}, Argentina`
    await geocodeForBackground(address)
    // Also cache with barrioKey for MapView
    if (geoCache[address] && !geoCache[task.barrioKey]) {
      geoCache[task.barrioKey] = geoCache[address]
    }
    done++
    geoProgress.value = done / tasks.length
    if (!heatReady.value && done / tasks.length >= 0.7) {
      heatReady.value = true
    }
    await new Promise(r => setTimeout(r, 120))
  }

  geoProgress.value = 1
  heatReady.value = true
  saveGeoCache()
}

function autoSelectCABA() {
  setTimeout(() => {
    const key = [...locByProvincia.value.keys()].find(k =>
      k.includes('AUTÓNOMA') || k.includes('AUTONOMA') || k.includes('BUENOS AIRES') || k.includes('CIUDAD')
    )
    if (key) handleProvinciaChange(key)
  }, 400)
}

function handleZoneClick(barrio, loca) {
  currentZone.value = { barrio, loca }
  panelView.value = 'zone'
  selectedBarrio.value = barrio
}

function handleProvinciaChange(prov) {
  selectedProvincia.value = prov
  selectedBarrio.value = ''
  currentZone.value = null
  if (!prov) {
    panelView.value = 'welcome'
  }
}

function handleBarrioChange(barrio) {
  selectedBarrio.value = barrio
  if (!barrio) return

  const locs = barrios.value
  const loca = locs.find(l => l.nombre.toUpperCase() === barrio.toUpperCase())
  if (loca) {
    currentZone.value = { barrio, loca }
    panelView.value = 'zone'
    if (mapViewRef.value) {
      mapViewRef.value.panToZone(loca)
    }
  }
}

function handleClear() {
  selectedProvincia.value = ''
  selectedBarrio.value = ''
  currentZone.value = null
  panelView.value = 'welcome'
  mode.value = 'markers'
}

function handleZoneSelect(prov) {
  handleProvinciaChange(prov)
}

function handleNavigateToInmo(inmo) {
  const city = inmo.Billing_City?.toUpperCase()?.trim()
  const state = inmo.Billing_State?.toUpperCase()?.trim()

  // Find the province that contains this city
  let foundProv = null
  for (const [prov, locs] of locByProvincia.value) {
    if (locs.find(l => l.nombre?.toUpperCase() === city)) {
      foundProv = prov
      break
    }
    if (state && prov.includes(state.split(' ')[0])) {
      foundProv = prov
    }
  }

  if (!foundProv && state) {
    foundProv = [...locByProvincia.value.keys()].find(k => k.includes(state.split(' ')[0])) || null
  }

  if (foundProv) {
    handleProvinciaChange(foundProv)
    setTimeout(() => {
      if (city) handleBarrioChange(city)
    }, 500)
  }
}

function handleBack() {
  panelView.value = 'welcome'
  currentZone.value = null
}

// Loader message rotation
const LOADER_MSGS = ['Conectando con los datos...', 'Preparando el mapa...', 'Cargando inmobiliarias...']
let msgIdx = 0
let msgInterval = null

function startMsgRotation() {
  msgIdx = 0
  loaderMsg.value = LOADER_MSGS[0]
  msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADER_MSGS.length
    loaderMsg.value = LOADER_MSGS[msgIdx]
  }, 1800)
}

function stopMsgRotation() {
  if (msgInterval) {
    clearInterval(msgInterval)
    msgInterval = null
  }
}

onMounted(async () => {
  startMsgRotation()
  await Promise.all([loadGoogleMaps(), loadData()])
  mapViewRef.value?.initMap()
  stopMsgRotation()
  showOverlay.value = false

  if (checkHeatReady()) {
    heatReady.value = true
  }

  autoSelectCABA()
  geocodeAllInBackground()
})
</script>
