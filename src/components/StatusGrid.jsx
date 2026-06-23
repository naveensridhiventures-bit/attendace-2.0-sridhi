import { ATTENDANCE_CODES, STATUS_LABELS, STATUS_COLORS } from '../utils/helpers'

const ICONS = { P: '✓', A: '✗', WO: '○', WOP: '◎', NA: '—' }

export default function StatusGrid({ selected, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8
    }}>
      {ATTENDANCE_CODES.map(code => {
        const isActive = selected === code
        const color = STATUS_COLORS[code]
        return (
          <button
            key={code}
            onClick={() => onChange(code)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 4px', borderRadius: 14, cursor: 'pointer',
              border: isActive ? `2px solid ${color}` : '2px solid #e5e7eb',
              background: isActive ? `${color}18` : '#f9fafb',
              transition: 'all .2s', fontFamily: "'DM Sans', sans-serif",
              gap: 3
            }}
          >
            <span style={{
              fontSize: 18, color: isActive ? color : '#9ca3af',
              lineHeight: 1, fontWeight: 800
            }}>
              {ICONS[code]}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 800, color: isActive ? color : '#374151'
            }}>
              {code}
            </span>
            <span style={{
              fontSize: 8.5, fontWeight: 600, color: '#9ca3af',
              textAlign: 'center', lineHeight: 1.2
            }}>
              {STATUS_LABELS[code].replace(' ', '\n')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
