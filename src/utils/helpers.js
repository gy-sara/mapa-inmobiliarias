export function daysAgo(dateStr) {
  if (!dateStr) return 9999
  const d = new Date(dateStr)
  if (isNaN(d)) return 9999
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

export function formatDate(s) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d)) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatAgo(days) {
  if (days === 9999 || days == null) return '—'
  if (days === 0) return 'hoy'
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months}m`
}

export function tagInfo(days) {
  if (days <= 30) return { label: 'Reciente', cls: 'recent' }
  if (days <= 90) return { label: 'Activa', cls: 'mid' }
  return { label: 'Inactiva', cls: 'old' }
}

export function activityScore(inmos) {
  if (!inmos || !inmos.length) return 0
  return inmos.reduce((acc, inmo) => {
    const d = daysAgo(inmo.Fecha_Ultima_Venta)
    if (d <= 30) return acc + 3
    if (d <= 90) return acc + 1.5
    if (d <= 180) return acc + 0.5
    return acc + 0.1
  }, 0)
}

export function tempColor(score) {
  if (score >= 20) return '#e8385e'
  if (score >= 10) return '#f5a623'
  if (score >= 4) return '#e8c97e'
  return '#4a90d9'
}

export function animateCounter(el, target, duration = 1200, delay = 0) {
  if (!el) return
  const start = performance.now() + delay
  const step = (now) => {
    if (now < start) {
      requestAnimationFrame(step)
      return
    }
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.round(eased * target).toLocaleString('es-AR')
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
