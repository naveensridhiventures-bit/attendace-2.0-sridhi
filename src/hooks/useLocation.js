import { useState, useCallback } from 'react'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation not supported'
        setError(err); reject(err); return
      }
      setLoading(true); setError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(loc); setLoading(false); resolve(loc)
        },
        (err) => {
          const msg = 'Could not get location. Please allow location access.'
          setError(msg); setLoading(false); reject(msg)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }, [])

  return { location, loading, error, fetchLocation: fetch }
}
