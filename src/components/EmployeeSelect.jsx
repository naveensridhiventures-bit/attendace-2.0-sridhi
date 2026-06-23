import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, User } from 'lucide-react'
import { gradient, getInitials } from '../utils/helpers'
import { api } from '../utils/api'

// Cached in module scope (not localStorage — see project storage rules) so
// every EmployeeSelect on the page shares one fetch instead of each firing
// its own request, and switching tabs doesn't re-fetch every time.
let _employeesCache = null
let _employeesPromise = null

function loadEmployees() {
  if (_employeesCache) return Promise.resolve(_employeesCache)
  if (!_employeesPromise) {
    _employeesPromise = api.employees()
      .then(d => { _employeesCache = (d.employees || []).map(e => e.name); return _employeesCache })
      .catch(() => { _employeesPromise = null; return [] })
  }
  return _employeesPromise
}

// Call this after any action that might change who's active (rarely needed —
// mainly here so a future "refresh employees" button has something to call).
export function invalidateEmployeesCache() {
  _employeesCache = null
  _employeesPromise = null
}

export default function EmployeeSelect({ value, onChange, placeholder = 'Choose employee…' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState(_employeesCache || [])
  const ref = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    loadEmployees().then(setEmployees)
  }, [])

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
  }, [open])

  const filtered = employees.filter(n => n.toLowerCase().includes(search.toLowerCase()))

  function select(name) {
    onChange(name)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="emp-select-btn"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', borderRadius: 14,
          border: open ? '1.5px solid var(--leaf)' : '1.5px solid #e5e7eb',
          background: open ? 'white' : '#f9fafb',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          boxShadow: open ? '0 0 0 3px rgba(34,197,94,.12)' : 'none',
          transition: 'all .2s',
        }}
      >
        {value ? (
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: gradient(value),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: 'white'
          }}>{getInitials(value)}</div>
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af'
          }}><User size={14} /></div>
        )}
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 15, fontWeight: value ? 600 : 400,
          color: value ? 'var(--text-dark)' : '#9ca3af'
        }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} style={{
          color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .2s'
        }} />
      </button>

      {open && (
        <div className="emp-dropdown" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,.15), 0 4px 16px rgba(0,0,0,.08)',
          border: '1px solid rgba(34,197,94,.15)',
          zIndex: 999, overflow: 'hidden',
          animation: 'dropIn .18s ease'
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search employee…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                color: 'var(--text-dark)', width: '100%',
                fontWeight: 500
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No employee found
              </div>
            ) : filtered.map(name => (
              <button
                key={name}
                onClick={() => select(name)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: value === name ? 'rgba(34,197,94,.08)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  transition: 'background .15s'
                }}
                onMouseEnter={e => { if (value !== name) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (value !== name) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: gradient(name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'white'
                }}>{getInitials(name)}</div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{name}</span>
                {value === name && (
                  <span style={{ marginLeft: 'auto', color: 'var(--leaf)', fontSize: 16 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
