import { randomBytes } from 'crypto'
import { put, del } from '@vercel/blob'

// Subir una imagen a Vercel Blob y devolver su URL.
// El formato de URL dependerá del tipo de store (public o private) y la configuración.
export async function saveImageBuffer(buffer, { subdir, maxWidth = 1600, square = false, quality = 82, format = 'webp' } = {}) {
  const safeSub = subdir.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\//, '') // Remove leading slash
  const ext = format === 'png' ? 'png' : 'webp'
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
  const pathname = `${safeSub}/${name}`

  // Subir a Vercel Blob. Usamos access: 'public' para que la imagen sea accesible sin auth.
  const blob = await put(pathname, buffer, {
    access: 'public',
    // contentType: `image/${format}`, // Se detecta automáticamente desde la extensión
  })

  // blob.url es la URL pública de la imagen en Vercel Blob
  return { url: blob.url, storageKey: pathname }
}

// Borrar una imagen de Vercel Blob usando su storageKey (pathname).
export async function deleteImageFile(storageKey) {
  if (!storageKey) return
  // storageKey es el pathname como se generó en saveImageBuffer
  try {
    await del(storageKey)
  } catch (e) {
    console.error('Error deleting image from Blob:', e)
  }
}

// Alias para compatibilidad con imports existentes que usen saveImageBuffer
export { put, del } from '@vercel/blob'

export const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_UPLOAD_BYTES = 16 * 1024 * 1024