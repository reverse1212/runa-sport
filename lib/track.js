let sid
function session() {
  if (sid) return sid
  try {
    sid = sessionStorage.getItem('rs_sid')
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 10)
      sessionStorage.setItem('rs_sid', sid)
    }
  } catch {
    sid = 'anon'
  }
  return sid
}

export function track(type, extra = {}) {
  const body = JSON.stringify({ type, sid: session(), ...extra })
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))) return
  } catch {}
  fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
