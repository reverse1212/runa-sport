import { db } from './db.js'

export async function getSettings() {
  try {
    const rows = await db.siteSetting.findMany()
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch (e) {
    return {}
  }
}

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { visible: true },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    })
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    }))
  } catch (e) {
    console.error('getCategories error (DB offline?):', e.message)
    return []
  }
}

export async function getCategoryBySlug(slug) {
  try {
    return await db.category.findFirst({
      where: { slug, visible: true },
      include: {
        products: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ featured: 'desc' }, { id: 'asc' }],
          include: {
            category: true,
            sizes: { orderBy: { position: 'asc' } },
            inventory: true,
            images: { orderBy: { position: 'asc' } },
          },
        },
      },
    })
  } catch (e) {
    console.error('getCategoryBySlug error:', e.message)
    return null
  }
}

export async function getFeaturedProducts(limit = 8) {
  try {
    const rows = await db.product.findMany({
      where: { status: 'PUBLISHED', featured: true, category: { visible: true } },
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        category: true,
        sizes: { orderBy: { position: 'asc' } },
        inventory: true,
        images: { orderBy: { position: 'asc' } },
      },
    })
    return rows.map(formatProductSummary)
  } catch (e) {
    console.error('getFeaturedProducts error:', e.message)
    return []
  }
}

export async function getProducts({ categorySlug, query, onSale, limit = 50, sort = 'default' } = {}) {
  try {
    const where = {
      status: 'PUBLISHED',
      category: { visible: true },
    }

    if (categorySlug) {
      where.category = { slug: categorySlug, visible: true }
    }

    if (onSale) {
      where.onSale = true
    }

    if (query && query.trim()) {
      const q = query.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    let orderBy = [{ featured: 'desc' }, { id: 'asc' }]
    if (sort === 'price-asc') orderBy = [{ price: 'asc' }]
    if (sort === 'price-desc') orderBy = [{ price: 'desc' }]
    if (sort === 'newest') orderBy = [{ createdAt: 'desc' }]

    const rows = await db.product.findMany({
      where,
      take: limit,
      orderBy,
      include: {
        category: true,
        sizes: { orderBy: { position: 'asc' } },
        inventory: true,
        images: { orderBy: { position: 'asc' } },
      },
    })

    return rows.map(formatProductSummary)
  } catch (e) {
    console.error('getProducts error:', e.message)
    return []
  }
}

export async function getProductBySlug(slug) {
  try {
    const p = await db.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        sizes: { orderBy: { position: 'asc' } },
        colors: true,
        variants: { orderBy: { id: 'asc' } },
        inventory: true,
        relatedTo: {
          where: { status: 'PUBLISHED' },
          take: 4,
          include: {
            category: true,
            inventory: true,
            images: { orderBy: { position: 'asc' } },
          },
        },
      },
    })

    if (!p) return null

    return {
      ...p,
      priceEffective: p.promoPrice ?? p.price,
      compareAt: p.promoPrice ? p.price : p.oldPrice,
      stock: p.inventory?.quantity ?? 0,
      minStock: p.inventory?.minStock ?? 5,
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || p.name,
        isPrimary: img.isPrimary,
      })),
      related: p.relatedTo.map(formatProductSummary),
    }
  } catch (e) {
    console.error('getProductBySlug error:', e.message)
    return null
  }
}

function formatProductSummary(p) {
  const img = p.images?.find((i) => i.isPrimary) || p.images?.[0]
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    categorySlug: p.category.slug,
    price: p.promoPrice ?? p.price,
    compareAt: p.promoPrice ? p.price : p.oldPrice,
    sizes: p.sizes?.map((s) => s.label).join(' / ') || '',
    stock: p.inventory?.quantity ?? 0,
    minStock: p.inventory?.minStock ?? 5,
    color: p.swatchColor,
    dark: p.swatchDark,
    featured: p.featured,
    onSale: p.onSale,
    image: img ? { url: img.url, alt: img.alt } : null,
  }
}

export async function getCatalog() {
  try {
    const [cats, rows] = await Promise.all([
      db.category.findMany({ where: { visible: true }, orderBy: { position: 'asc' } }),
      db.product.findMany({
        where: { status: 'PUBLISHED', category: { visible: true } },
        orderBy: [{ featured: 'desc' }, { id: 'asc' }],
        include: { category: true, sizes: { orderBy: { position: 'asc' } }, inventory: true, images: { orderBy: { position: 'asc' } } },
      }),
    ])
    const products = rows.map(formatProductSummary)
    const categories = cats.map((c) => c.name).filter((n) => products.some((p) => p.category === n))
    return { categories, products }
  } catch (e) {
    console.error('getCatalog error:', e.message)
    return { categories: [], products: [] }
  }
}
