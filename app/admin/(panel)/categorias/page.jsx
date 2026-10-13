import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { ActionForm, ConfirmForm } from '@/components/admin/ActionForm.jsx'
import { saveCategory, deleteCategory } from '@/lib/actions.js'

export default async function Categorias() {
  await requireUser('products')
  const cats = await db.category.findMany({ orderBy: { position: 'asc' }, include: { _count: { select: { products: true } } } })
  return (
    <>
      <h1>Categorías</h1>
      <ActionForm key={cats.length} action={saveCategory} submit="Crear categoría" className="card">
        <div className="fgrid">
          <label>Nombre<input name="name" required maxLength={60} /></label>
          <label>Descripción<input name="description" maxLength={300} /></label>
          <label>Posición<input name="position" type="number" min="0" defaultValue={cats.length} /></label>
        </div>
        <label><input type="checkbox" name="visible" defaultChecked /> Visible en el sitio</label>
      </ActionForm>
      <div className="cols" style={{ marginTop: 16 }}>
        {cats.map((c) => (
          <div className="card" key={c.id}>
            <ActionForm action={saveCategory} submit="Guardar">
              <input type="hidden" name="id" value={c.id} />
              <label>Nombre<input name="name" required maxLength={60} defaultValue={c.name} /></label>
              <label>Descripción<input name="description" maxLength={300} defaultValue={c.description ?? ''} /></label>
              <label>Posición<input name="position" type="number" min="0" defaultValue={c.position} /></label>
              <label><input type="checkbox" name="visible" defaultChecked={c.visible} /> Visible</label>
            </ActionForm>
            {c._count.products > 0
              ? <p><small>{c._count.products} producto(s): no se puede eliminar.</small></p>
              : <ConfirmForm action={deleteCategory.bind(null, c.id)} message={`¿Eliminar la categoría "${c.name}"?`}><button className="abtn sm warn">Eliminar</button></ConfirmForm>}
          </div>
        ))}
      </div>
    </>
  )
}
