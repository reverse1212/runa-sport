import { notFound } from 'next/navigation'
import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import ProductForm from '@/components/admin/ProductForm.jsx'
import ImageManager from '@/components/admin/ImageManager.jsx'

export default async function Editar({ params }) {
  await requireUser('products')
  const id = Number(params.id)
  if (!Number.isInteger(id)) notFound()
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { sizes: { orderBy: { position: 'asc' } }, colors: true, inventory: true, images: { orderBy: { position: 'asc' } } } }),
    db.category.findMany({ orderBy: { position: 'asc' } }),
  ])
  if (!product) notFound()
  return (<><h1>Editar producto</h1><ProductForm product={product} categories={categories} /><div style={{ marginTop: 16 }}><ImageManager productId={product.id} images={product.images} /></div></>)
}
