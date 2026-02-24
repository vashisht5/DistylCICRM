import { useEffect, useRef } from 'react'

export function useSSE(url: string, onMessage: (data: unknown) => void, enabled = true) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!enabled) return
    const es = new EventSource(url)
    es.onmessage = (e) => {
      try { cbRef.current(JSON.parse(e.data)) } catch { /* ignore */ }
    }
    return () => es.close()
  }, [url, enabled])
}
