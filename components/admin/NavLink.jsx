'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, children }) {
  const p = usePathname()
  const on = href === '/admin' ? p === href : p.startsWith(href)
  return <Link href={href} className={on ? 'on' : ''} onClick={() => { const c = document.getElementById('nav'); if (c) c.checked = false }}>{children}</Link>
}
