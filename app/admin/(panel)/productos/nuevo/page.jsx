import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import ProductForm from '@/components/admin/ProductForm.jsx'

export default async function Nuevo() {
  await requireUser('products')
  const categories = await db.category.findMany({ orderBy: { position: 'asc' } })
  return (<><h1>Nuevo producto</h1><ProductForm categories={categories} /></>)
}
