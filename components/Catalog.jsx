'use client'
import { useState } from 'react'
import { track } from '../lib/track.js'

const money = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function Catalog({ products, categories, title, subtitle, wa, template }) {
  const [cat, setCat] = useState('Todo')
  const list = products.filter((p) => cat === 'Todo' || p.category === cat)
  return (
    <div className="wrap">
      <div className="stock-head">
        <div>
          <h2 className="title" id="stock-t">{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="chips" role="group" aria-label="Filtrar por categoría">
          {['Todo', ...categories].map((c) => (
            <button key={c} className="chip" aria-pressed={c === cat} onClick={() => { setCat(c); track('filtro', { detail: c }) }}>{c}</button>
          ))}
        </div>
      </div>
      <div className="grid">
        {list.length === 0 && <p>Todavía no hay productos publicados.</p>}
        {list.map((p) => {
          const out = p.stock === 0
          const low = !out && p.stock <= p.minStock
          const q = out ? 'Sin stock' : low ? `Últimas ${p.stock} unidades` : `${p.stock} en stock`
          const href = `https://wa.me/${wa}?text=${encodeURIComponent(template.replace('{producto}', p.name))}`
          return (
            <article className="item" key={p.id}>
              <div className={`swatch${p.dark ? ' dark' : ''}${p.image ? ' has-img' : ''}`} style={{ '--c': p.color }}>
                {p.image ? <img src={p.image.url} alt={p.image.alt || p.name} loading="lazy" /> : p.category}
              </div>
              <div className="body">
                <h3>{p.name}</h3>
                <span className="price">{money(p.price)}{p.compareAt ? <s className="was">{money(p.compareAt)}</s> : null}</span>
                <span className="meta">Talles: {p.sizes}</span>
                <span className={`qty${out ? ' out' : low ? ' low' : ''}`}>{q}</span>
                <a className="btn" href={href} target="_blank" rel="noopener"
                   onClick={() => { if (!out) track('consulta', { detail: p.name, productId: p.id }) }}
                   {...(out ? { 'aria-disabled': 'true', tabIndex: -1 } : {})}>{out ? 'No disponible' : 'Consultar'}</a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
