// Migra los datos que estaban hardcodeados en el HTML original. Es idempotente:
// se puede correr varias veces sin pisar lo que edites después desde el panel.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()
const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const sizesOf = (t) => {
  if (t === 'Talle único') return ['Único']
  const [a, b] = t.split(' a ')
  return ORDER.slice(ORDER.indexOf(a), ORDER.indexOf(b) + 1)
}

const CATEGORIES = ['Remeras', 'Shorts', 'Calzas', 'Camperas', 'Buzos', 'Accesorios']
const PRODUCTS = [
  ['Remera dry-fit Sprint', 'Remeras', 18900, 'S a XL', 24, '#2450F5', false],
  ['Remera térmica manga larga', 'Remeras', 24500, 'S a XL', 4, '#0E1A3A', false],
  ['Short running Aire', 'Shorts', 16500, 'S a XL', 18, '#FFD21F', true],
  ['Short training 2 en 1', 'Shorts', 21900, 'M a XXL', 0, '#5A6688', false],
  ['Calza larga Compress', 'Calzas', 27900, 'XS a L', 11, '#0E1A3A', false],
  ['Campera rompeviento Ráfaga', 'Camperas', 58900, 'S a XL', 3, '#2450F5', false],
  ['Buzo con capucha Entreno', 'Buzos', 42500, 'S a XXL', 9, '#DCE3F5', true],
  ['Medias técnicas (pack x3)', 'Accesorios', 9800, 'Talle único', 40, '#FFD21F', true],
]
const SETTINGS = {
  brand_name: 'Runa Sport',
  hero_title: 'Ropa hecha para moverte',
  hero_subtitle: 'Remeras, shorts, calzas y camperas para correr, entrenar y jugar. Mirá qué hay en stock y consultá por WhatsApp.',
  hero_cta_text: 'Ver ropa',
  hero_cta_url: '#stock',
  address: 'Calle Ejemplo 1234, Buenos Aires',
  maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle+Ejemplo+1234+Buenos+Aires',
  phone_display: '+54 11 5555-0123',
  phone_tel: '+541155550123',
  whatsapp_number: '541155550123',
  whatsapp_display: '+54 11 5555-0123',
  whatsapp_template: 'Hola, quiero consultar por: {producto}',
  email: 'hola@runasport.com.ar',
  hours: 'Lunes a sábado, de 10 a 19 h',
  stock_title: 'Stock disponible',
  stock_subtitle: 'Las unidades se actualizan en la tienda. Escribinos para reservar tu talle.',
  footer_text: '© 2026 Runa Sport. Todos los derechos reservados.',
  seo_title: 'Runa Sport | Ropa deportiva',
  seo_description: 'Remeras, shorts, calzas y camperas para entrenar. Stock real y consulta por WhatsApp.',
  social_instagram: '',
  social_facebook: '',
  color_blue: '#2450F5',
  color_dark: '#0E1A3A',
  color_yellow: '#FFD21F',
  color_bg: '#F5F7FB',
  logo_url: '',
  hero_image_url: '',
  favicon_url: '',
}

const catId = {}
for (const [i, name] of CATEGORIES.entries()) {
  const c = await db.category.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), position: i } })
  catId[name] = c.id
}
for (const [name, cat, price, sizes, stock, color, dark] of PRODUCTS) {
  await db.product.upsert({
    where: { slug: slugify(name) },
    update: {},
    create: {
      name, slug: slugify(name), categoryId: catId[cat], price, swatchColor: color, swatchDark: dark,
      sizes: { create: sizesOf(sizes).map((label, position) => ({ label, position })) },
      inventory: { create: { quantity: stock, minStock: 5 } },
      movements: { create: { previous: 0, next: stock, delta: stock, note: 'Migración inicial' } },
    },
  })
}
for (const [key, value] of Object.entries(SETTINGS)) {
  await db.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } })
}

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres')
  await db.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {},
    create: { email: ADMIN_EMAIL.toLowerCase(), name: ADMIN_NAME || 'Administrador', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) },
  })
  console.log('Administrador inicial listo:', ADMIN_EMAIL)
} else {
  console.log('Sin ADMIN_EMAIL/ADMIN_PASSWORD: no se creó administrador.')
}
console.log('Migración de datos lista.')
await db.$disconnect()
