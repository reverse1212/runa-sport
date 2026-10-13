'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ImageEditor from './ImageEditor.jsx'
import { uploadProductImage, replaceProductImage, restoreProductImage, setImageMeta, setPrimaryImage, deleteProductImage, reorderProductImages } from '@/lib/actions.js'

const asFile = (blob) => new File([blob], 'imagen', { type: blob.type || 'image/jpeg' })

function ReplaceBox({ onSave }) {
  const [blob, setBlob] = useState(null)
  const [busy, setBusy] = useState(false)
  const [k, setK] = useState(0)
  return (
    <div>
      <ImageEditor key={k} label="imagen" onReady={setBlob} />
      <button type="button" className="abtn sm" style={{ marginTop: 8 }} disabled={busy || !blob}
              onClick={async () => { setBusy(true); const ok = await onSave(blob); setBusy(false); if (ok) { setBlob(null); setK((n) => n + 1) } }}>
        {busy ? 'Guardando…' : 'Guardar reemplazo'}
      </button>
    </div>
  )
}

export default function ImageManager({ productId, images }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pendingBlob, setPendingBlob] = useState(null)
  const [editorKey, setEditorKey] = useState(0)
  const [alt, setAlt] = useState('')
  const [title, setTitle] = useState('')
  const [order, setOrder] = useState(images.map((i) => i.id))
  const dragId = useRef(null)

  const byId = Object.fromEntries(images.map((i) => [i.id, i]))
  const known = new Set(order)
  const ids = [...order.filter((id) => byId[id]), ...images.map((i) => i.id).filter((id) => !known.has(id))]
  const refresh = () => router.refresh()

  async function upload() {
    if (!pendingBlob) { setError('Elegí una imagen primero.'); return }
    setError(''); setBusy(true)
    try {
      const fd = new FormData()
      fd.set('productId', productId); fd.set('alt', alt); fd.set('title', title); fd.set('file', asFile(pendingBlob))
      const r = await uploadProductImage(fd)
      if (r?.error) { setError(r.error); return }
      setPendingBlob(null); setAlt(''); setTitle(''); setEditorKey((n) => n + 1); refresh()
    } catch (e) {
      setError('No se pudo subir la imagen. Revisá que pese menos de 8 MB y que la terminal de npm run dev no muestre errores.')
    } finally { setBusy(false) }
  }
  async function replace(imageId, blob) {
    setError('')
    try {
      const fd = new FormData()
      fd.set('imageId', imageId); fd.set('file', asFile(blob))
      const r = await replaceProductImage(fd)
      if (r?.error) { setError(r.error); return false }
      refresh(); return true
    } catch (e) { setError('No se pudo reemplazar la imagen.'); return false }
  }
  function saveMeta(id, a, t) { const fd = new FormData(); fd.set('id', id); fd.set('alt', a); fd.set('title', t); start(async () => { await setImageMeta(fd); refresh() }) }
  function onDrop(targetId) {
    if (dragId.current == null || dragId.current === targetId) return
    const next = [...ids]
    const from = next.indexOf(dragId.current), to = next.indexOf(targetId)
    next.splice(to, 0, next.splice(from, 1)[0])
    setOrder(next)
    start(async () => { await reorderProductImages(productId, next); refresh() })
  }

  return (
    <div className="card" id="imagenes">
      <h2>Imágenes</h2>
      {error && <p className="aerr" role="alert">{error}</p>}
      <ul className="imglist">
        {ids.map((id) => {
          const img = byId[id]
          return (
            <li key={id} draggable onDragStart={() => (dragId.current = id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(id)}>
              <img src={img.url} alt={img.alt} className="thumb" />
              <div className="thumbmeta">
                <input defaultValue={img.alt} placeholder="Texto ALT" onBlur={(e) => saveMeta(id, e.target.value, img.title)} />
                <input defaultValue={img.title} placeholder="Título" onBlur={(e) => saveMeta(id, img.alt, e.target.value)} />
                <div className="arow">
                  {img.isPrimary ? <span className="badge b-ok">Principal</span> : <button type="button" className="abtn sm alt" disabled={pending} onClick={() => start(async () => { await setPrimaryImage(id, productId); refresh() })}>Hacer principal</button>}
                  {img.previousUrl && <button type="button" className="abtn sm alt" disabled={pending} onClick={() => start(async () => { await restoreProductImage(id); refresh() })}>Restaurar anterior</button>}
                  <button type="button" className="abtn sm warn" disabled={pending} onClick={() => { if (confirm('¿Eliminar esta imagen?')) start(async () => { await deleteProductImage(id); refresh() }) }}>Eliminar</button>
                </div>
                <details><summary>Reemplazar imagen</summary><ReplaceBox onSave={(blob) => replace(id, blob)} /></details>
              </div>
            </li>
          )
        })}
        {!ids.length && <li>Todavía no hay imágenes. Se muestra el color de la categoría.</li>}
      </ul>
      <h2 style={{ marginTop: 18 }}>Agregar imagen</h2>
      <ImageEditor key={editorKey} label="imagen nueva" onReady={setPendingBlob} />
      <div className="fgrid" style={{ marginTop: 10 }}>
        <label>Texto ALT<input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={160} /></label>
        <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} /></label>
      </div>
      <button type="button" className="abtn" disabled={busy || !pendingBlob} onClick={upload}>{busy ? 'Subiendo…' : 'Subir imagen'}</button>
    </div>
  )
}
