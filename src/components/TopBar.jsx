import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { nowIndia, formatTime } from '../utils/helpers'

export default function TopBar({ title = 'Sridhi Ventures', onBell }) {
  const [time, setTime] = useState(formatTime(nowIndia()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(nowIndia())), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      width: '100%', maxWidth: 'var(--max-w)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 16, padding: '0 2px'
    }}>
      <div className="logo-pill">
        <div className="logo-mark">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L13.5 4.75V11.25L8 14.5L2.5 11.25V4.75L8 1.5Z" fill="white" opacity="0.9"/>
            <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="rgba(5,46,22,0.5)"/>
            <circle cx="8" cy="8" r="1.8" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 13, letterSpacing: .5, lineHeight: 1, color: 'white' }}>
            {title}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.6)', letterSpacing: 1.2, fontWeight: 700, marginTop: 2 }}>
            SINCE 2018
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="time-chip">
          <span className="time-dot" />
          {time}
        </div>
        {onBell && (
          <button onClick={onBell} style={{
            background: 'white', border: '1px solid rgba(34,197,94,.2)',
            borderRadius: 100, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--forest)',
            boxShadow: '0 2px 8px rgba(0,0,0,.05)'
          }}>
            <Bell size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
