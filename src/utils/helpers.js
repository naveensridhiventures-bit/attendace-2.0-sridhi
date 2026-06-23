export const ATTENDANCE_CODES = ['P', 'A', 'WO', 'WOP', 'NA']

export const STATUS_LABELS = {
  P: 'Present', A: 'Absent', WO: 'Week Off', WOP: 'WO + Present', NA: 'Not Marked'
}

export const STATUS_COLORS = {
  P: '#22c55e', A: '#ef4444', WO: '#f59e0b', WOP: '#8b5cf6', NA: '#64748b'
}

export function gradient(name) {
  const palettes = [
    ['#f97316','#ea580c'], ['#8b5cf6','#7c3aed'], ['#06b6d4','#0891b2'],
    ['#ec4899','#db2777'], ['#10b981','#059669'], ['#f59e0b','#d97706'],
    ['#6366f1','#4f46e5'], ['#14b8a6','#0d9488'], ['#f43f5e','#e11d48'],
    ['#a855f7','#9333ea'],
  ]
  let h = 0
  for (const c of String(name)) {
    h = ((h << 5) - h) + c.charCodeAt(0)
    h = h >>> 0
  }
  const [a, b] = palettes[h % palettes.length]
  return `linear-gradient(135deg,${a},${b})`
}

export function getInitials(name) {
  return String(name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function nowIndia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
}
