<template>
  <div id="map" ref="mapEl"></div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { activityScore, tempColor } from '../utils/helpers.js'

const GMAPS_KEY = 'AIzaSyD3TyurpPf8hTBVBNpDwGNDyjZHPIzIHY8'

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8888a0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#13131a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d2d42' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#24243a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2a2a40' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#30304a' }] },
  { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d58' }] },
]

const HEATMAP_GRADIENT = [
  'rgba(0,0,0,0)',
  'rgba(30,80,200,.6)',
  'rgba(0,200,200,.8)',
  'rgba(0,220,100,1)',
  'rgba(255,200,0,1)',
  'rgba(255,100,0,1)',
  'rgba(220,30,60,1)'
]

const props = defineProps({
  locByProvincia: { type: Object, default: () => new Map() },
  inmosByBarrio: { type: Object, default: () => new Map() },
  mode: { type: String, default: 'markers' },
  selectedProvincia: { type: String, default: '' },
  geoCache: { type: Object, default: () => ({}) },
  mapsReady: { type: Boolean, default: false }
})

const emit = defineEmits(['zone-click'])

const mapEl = ref(null)
let map = null
let markers = []
let heatmapLayer = null
let infoWindow = null

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    if (props.geoCache[address]) {
      resolve(props.geoCache[address])
      return
    }
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        }
        props.geoCache[address] = loc
        resolve(loc)
      } else {
        reject(new Error(`Geocode failed: ${status}`))
      }
    })
  })
}

function initMap() {
  if (!mapEl.value || !window.google) return
  map = new google.maps.Map(mapEl.value, {
    center: { lat: -34.62, lng: -58.65 },
    zoom: 10,
    styles: MAP_STYLES,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  })
  infoWindow = new google.maps.InfoWindow()
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null))
  markers = []
  if (infoWindow) infoWindow.close()
  if (heatmapLayer) {
    heatmapLayer.setMap(null)
    heatmapLayer = null
  }
}

async function placeMarkersForProvincia(prov) {
  if (!map) return
  const localidades = props.locByProvincia.get ? props.locByProvincia.get(prov) : props.locByProvincia[prov]
  if (!localidades) return

  const bounds = new google.maps.LatLngBounds()
  let hasPoint = false

  for (const loca of localidades) {
    const barrioKey = loca.nombre.toUpperCase()
    const inmos = props.inmosByBarrio.get ? props.inmosByBarrio.get(barrioKey) : props.inmosByBarrio[barrioKey]
    if (!inmos || !inmos.length) continue

    const address = `${loca.nombre}, ${prov}, Argentina`
    let pos
    try {
      pos = await geocodeAddress(address)
    } catch {
      continue
    }

    const count = inmos.length
    let fillColor = '#e8c97e'
    if (count >= 10) fillColor = '#5b6af7'
    else if (count >= 5) fillColor = '#7c8bf9'

    const marker = new google.maps.Marker({
      position: pos,
      map,
      title: loca.nombre,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: Math.min(8 + count * 1.5, 22),
        fillColor,
        fillOpacity: 0.9,
        strokeColor: 'rgba(255,255,255,0.3)',
        strokeWeight: 1.5,
      }
    })

    marker.addListener('click', () => {
      const content = `<div class="info-popup">
        <h3>${loca.nombre}</h3>
        <div class="info-meta">${prov}</div>
        <span class="info-badge">${count} inmobiliaria${count !== 1 ? 's' : ''}</span>
      </div>`
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
      emit('zone-click', barrioKey, loca)
    })

    markers.push(marker)
    bounds.extend(pos)
    hasPoint = true
  }

  if (hasPoint) {
    map.fitBounds(bounds)
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() > 13) map.setZoom(13)
    })
  }
}

function buildHeatmap() {
  if (!map) return
  const points = []
  const inmosByBarrio = props.inmosByBarrio
  const entries = inmosByBarrio.entries ? [...inmosByBarrio.entries()] : Object.entries(inmosByBarrio)

  for (const [barrio, inmos] of entries) {
    if (!inmos || !inmos.length) continue
    const cached = props.geoCache[barrio] || findCachedByPartialKey(barrio)
    if (!cached) continue
    const score = activityScore(inmos)
    points.push({
      location: new google.maps.LatLng(cached.lat, cached.lng),
      weight: score
    })
  }

  if (!points.length) return

  heatmapLayer = new google.maps.visualization.HeatmapLayer({
    data: points,
    map,
    radius: 35,
    opacity: 0.75,
    gradient: HEATMAP_GRADIENT
  })
}

function buildTempMarkers() {
  if (!map) return
  const inmosByBarrio = props.inmosByBarrio
  const entries = inmosByBarrio.entries ? [...inmosByBarrio.entries()] : Object.entries(inmosByBarrio)

  for (const [barrio, inmos] of entries) {
    if (!inmos || !inmos.length) continue
    const cached = props.geoCache[barrio] || findCachedByPartialKey(barrio)
    if (!cached) continue

    const score = activityScore(inmos)
    const color = tempColor(score)

    const marker = new google.maps.Marker({
      position: { lat: cached.lat, lng: cached.lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: color,
        fillOpacity: 0.85,
        strokeColor: 'rgba(255,255,255,0.2)',
        strokeWeight: 1,
      }
    })
    markers.push(marker)
  }
}

function findCachedByPartialKey(barrio) {
  // Try direct match first
  if (props.geoCache[barrio]) return props.geoCache[barrio]
  // Try finding a cached key that contains the barrio name
  const keys = Object.keys(props.geoCache)
  const match = keys.find(k => k.toUpperCase().startsWith(barrio.toUpperCase()))
  return match ? props.geoCache[match] : null
}

async function panToZone(loca) {
  if (!map || !loca) return
  const address = `${loca.nombre}, ${loca.provincia || ''}, Argentina`
  try {
    const pos = await geocodeAddress(address)
    map.panTo(pos)
    map.setZoom(14)
  } catch (e) {
    console.warn('panToZone geocode failed:', e)
  }
}

defineExpose({ panToZone, initMap })

watch(() => props.selectedProvincia, async (prov) => {
  clearMarkers()
  if (!prov) {
    if (props.mode === 'heat') buildHeatmap()
    if (props.mode === 'temp') buildTempMarkers()
    return
  }
  if (props.mode === 'markers') await placeMarkersForProvincia(prov)
  else if (props.mode === 'heat') buildHeatmap()
  else if (props.mode === 'temp') buildTempMarkers()
})

watch(() => props.mode, (m) => {
  clearMarkers()
  if (m === 'heat') buildHeatmap()
  else if (m === 'temp') buildTempMarkers()
  else if (props.selectedProvincia) placeMarkersForProvincia(props.selectedProvincia)
})

// Watch mapsReady prop as primary trigger
watch(() => props.mapsReady, async (ready) => {
  if (ready && mapEl.value && !map) {
    await nextTick()
    initMap()
  }
})

onMounted(() => {
  // Fallback for hot-reload in dev (Maps already loaded)
  if (window.google?.maps && mapEl.value) initMap()
})
</script>

<style scoped>
#map {
  flex: 1;
  height: 100%;
}
</style>
