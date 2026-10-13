'use client'
import { useEffect, useRef, useState } from 'react'

const MAXW = 520

// onReady(blob): recibe siempre lo que se va a subir. La imagen original apenas se elige,
// o la versión recortada después de "Recortar selección". null = todavía no hay nada para subir.
export default function ImageEditor({ label = 'Imagen', initialUrl, onReady, square = false }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const boxRef = useRef(null)
  const originalRef = useRef(null)
  const [rect, setRect] = useState(null)
  const [drag, setDrag] = useState(null)
  const [hasImg, setHasImg] = useState(false)
  const [over, setOver] = useState(false)
  const [cropped, setCropped] = useState(false)

  function draw() {
    const canvas = canvasRef.current, img = imgRef.current
    if (!canvas || !img) return
    const w = Math.min(MAXW, img.width)
    const h = Math.round(w * (img.height / img.width))
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    if (rect) {
      ctx.fillStyle = 'rgba(14,26,58,.45)'
      ctx.fillRect(0, 0, w, h)
      ctx.clearRect(rect.x, rect.y, rect.w, rect.h)
      ctx.drawImage(img, rect.x * (img.width / w), rect.y * (img.height / h), rect.w * (img.width / w), rect.h * (img.height / h), rect.x, rect.y, rect.w, rect.h)
      ctx.strokeStyle = '#FFD21F'; ctx.lineWidth = 2; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    }
  }
  useEffect(draw)

  function fromFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    originalRef.current = file
    const img = new Image()
    img.onload = () => { imgRef.current = img; setHasImg(true); setRect(null); setCropped(false); onReady(file) }
    img.src = URL.createObjectURL(file)
  }
  function fromUrl(url) {
    originalRef.current = null
    const img = new Image()
    img.onload = () => { imgRef.current = img; setHasImg(true); setRect(null); setCropped(false); onReady(null) }
    img.src = url
  }

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: Math.max(0, Math.min(t.clientX - r.left, canvasRef.current.width)), y: Math.max(0, Math.min(t.clientY - r.top, canvasRef.current.height)) }
  }
  function onDown(e) { const p = pos(e); setDrag(p); setRect({ ...p, w: 0, h: 0 }) }
  function onMove(e) {
    if (!drag) return
    const p = pos(e)
    let x = Math.min(drag.x, p.x), y = Math.min(drag.y, p.y), w = Math.abs(p.x - drag.x), h = Math.abs(p.y - drag.y)
    if (square) { const s = Math.min(w, h); w = s; h = s }
    setRect({ x, y, w, h })
  }
  function onUp() { setDrag(null) }

  function applyCrop() {
    const canvas = canvasRef.current, img = imgRef.current
    if (!rect || rect.w < 12 || rect.h < 12) return
    const sx = img.width / canvas.width, sy = img.height / canvas.height
    const out = document.createElement('canvas')
    out.width = Math.round(rect.w * sx); out.height = Math.round(rect.h * sy)
    out.getContext('2d').drawImage(img, rect.x * sx, rect.y * sy, rect.w * sx, rect.h * sy, 0, 0, out.width, out.height)
    out.toBlob((blob) => { if (blob) { setCropped(true); onReady(blob) } }, 'image/jpeg', 0.92)
  }
  function resetCrop() { setRect(null); setCropped(false); onReady(originalRef.current) }
  function clear() { imgRef.current = null; originalRef.current = null; setHasImg(false); setRect(null); setCropped(false); onReady(null) }

  return (
    <div className="imgedit">
      {!hasImg && (
        <div ref={boxRef} className={`dropzone${over ? ' over' : ''}`}
             onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
             onDrop={(e) => { e.preventDefault(); setOver(false); fromFile(e.dataTransfer.files?.[0]) }}
             onClick={() => boxRef.current.querySelector('input').click()}>
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => fromFile(e.target.files?.[0])} />
          <p>Arrastrá una imagen acá o hacé click para elegirla</p>
          <small>JPG, PNG o WEBP · hasta 8 MB</small>
          {initialUrl && <button type="button" className="abtn sm alt" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); fromUrl(initialUrl) }}>Ver imagen actual</button>}
        </div>
      )}
      {hasImg && (
        <div>
          <canvas ref={canvasRef} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                  onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} className="cropcanvas" />
          <div className="arow" style={{ marginTop: 8 }}>
            <button type="button" className="abtn sm alt" onClick={applyCrop} disabled={!rect || rect.w < 12}>Recortar selección</button>
            <button type="button" className="abtn sm alt" onClick={resetCrop}>Quitar recorte</button>
            <button type="button" className="abtn sm alt" onClick={clear}>Elegir otra imagen</button>
          </div>
          <small>{cropped ? 'Recorte aplicado: se va a subir solo esa parte.' : 'Se sube la imagen completa. Si querés recortarla, arrastrá sobre la imagen para marcar el área y tocá "Recortar selección".'}</small>
        </div>
      )}
    </div>
  )
}
