import { useState, useCallback } from 'react'

let _setToasts = null

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.icon && <span>{t.icon}</span>}
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}

export function toast(message, type = 'default', icon = null, duration = 2800) {
  if (!_setToasts) return
  const id = Date.now()
  _setToasts(prev => [...prev, { id, message, type, icon }])
  setTimeout(() => {
    _setToasts(prev => prev.filter(t => t.id !== id))
  }, duration)
}
