import './globals.css'
import { getSettings } from '../lib/queries.js'

export default async function RootLayout({ children }) {
  const s = await getSettings()
  const vars = { '--blue': s.color_blue, '--ink': s.color_dark, '--sun': s.color_yellow, '--chalk': s.color_bg }
  const cssVars = Object.entries(vars).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';')
  return (
    <html lang="es">
      <head>
        {s.favicon_url && <link rel="icon" type={s.favicon_url.endsWith('.png') ? 'image/png' : 'image/webp'} href={s.favicon_url} />}
        {s.favicon_url && <link rel="shortcut icon" href={s.favicon_url} />}
        {cssVars && <style>{`:root{${cssVars}}`}</style>}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
