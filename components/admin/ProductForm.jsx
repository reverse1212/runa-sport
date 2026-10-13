import { ActionForm } from './ActionForm.jsx'
import { saveProduct } from '@/lib/actions.js'
import { STATUS } from '@/lib/util.js'

export default function ProductForm({ product: p, categories }) {
  const v = (k, d = '') => p?.[k] ?? d
  return (
    <ActionForm action={saveProduct} submit="Guardar cambios" className="card">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="fgrid">
        <label>Nombre<input name="name" required maxLength={120} defaultValue={v('name')} /></label>
        <label>Categoría<select name="categoryId" defaultValue={v('categoryId')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Precio ($)<input name="price" type="number" min="0" required defaultValue={v('price')} /></label>
        <label>Precio anterior ($)<input name="oldPrice" type="number" min="0" defaultValue={v('oldPrice')} /></label>
        <label>Precio promocional ($)<input name="promoPrice" type="number" min="0" defaultValue={v('promoPrice')} /></label>
        <label>Estado<select name="status" defaultValue={v('status', 'PUBLISHED')}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Talles (separados por coma)<input name="sizes" placeholder="S, M, L, XL" defaultValue={p?.sizes.map((s) => s.label).join(', ') ?? ''} /></label>
        <label>Colores (separados por coma)<input name="colors" placeholder="Negro, Azul" defaultValue={p?.colors.map((c) => c.name).join(', ') ?? ''} /></label>
        {p ? <p>Stock actual: <b>{p.inventory?.quantity ?? 0}</b> — se modifica desde la sección Stock.</p>
           : <label>Stock inicial<input name="stock" type="number" min="0" defaultValue="0" /></label>}
        <label>Stock mínimo<input name="minStock" type="number" min="0" defaultValue={p?.inventory?.minStock ?? 5} /></label>
        <label>SKU<input name="sku" maxLength={60} defaultValue={v('sku')} /></label>
        <label>Código interno<input name="internalCode" maxLength={60} defaultValue={v('internalCode')} /></label>
        <label>Etiquetas (coma)<input name="tags" defaultValue={p?.tags.join(', ') ?? ''} /></label>
        <label>URL amigable<input name="slug" placeholder="se genera desde el nombre" defaultValue={v('slug')} /></label>
        <label>Color de la tarjeta<input name="swatchColor" type="color" defaultValue={v('swatchColor', '#2450F5')} /></label>
      </div>
      <label>Descripción<textarea name="description" rows={3} maxLength={2000} defaultValue={v('description')} /></label>
      <div className="fgrid">
        <label>Meta title (SEO)<input name="metaTitle" maxLength={120} defaultValue={v('metaTitle')} /></label>
        <label>Meta description (SEO)<input name="metaDescription" maxLength={300} defaultValue={v('metaDescription')} /></label>
      </div>
      <label><input type="checkbox" name="featured" defaultChecked={!!p?.featured} /> Producto destacado</label>
      <label><input type="checkbox" name="swatchDark" defaultChecked={!!p?.swatchDark} /> Texto oscuro sobre el color (para colores claros)</label>
    </ActionForm>
  )
}
