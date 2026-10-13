'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageEditor from './ImageEditor.jsx'
import { uploadSiteImage } from '@/lib/actions.js'

export default function SiteImageUploader({ label, settingKey, currentUrl, square = false, hint }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [blob, setBlob] = useState(null)
  const [k, setK] = useState(0)
  const [error, setError] = useState('')

  async function save() {
    if (!blob) { setError('Elegí una imagen primero.'); return }
    setError(''); setBusy(true)
    try {
      const fd = new FormData()
      fd.set('key', settingKey); fd.set('file', new File([blob], 'imagen', { type: blob.type || 'image/jpeg' }))
      const r = await uploadSiteImage(fd)
      if (r?.error) { setError(r.error); return }
      setBlob(null); setK((n) => n + 1); router.refresh()
    } catch (e) {
      setError('No se pudo subir la imagen. Revisá que pese menos de 8 MB.')
    } finally { setBusy(false) }
  }
  return (
    <div className="card">
      <h2>{label}</h2>
      {hint && <p><small>{hint}</small></p>}
      {currentUrl && <p><img src={currentUrl} alt="" style={{ maxWidth: 180, maxHeight: 100, borderRadius: 6, border: '1px solid var(--line)' }} /></p>}
      {error && <p className="aerr" role="alert">{error}</p>}
      <ImageEditor key={k} label={label} initialUrl={currentUrl} onReady={setBlob} square={square} />
      <button type="button" className="abtn" style={{ marginTop: 10 }} disabled={busy || !blob} onClick={save}>{busy ? 'Guardando…' : 'Guardar imagen'}</button>
    </div>
  )
}
