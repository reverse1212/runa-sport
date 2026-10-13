import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth.js'
import { login } from '@/lib/actions.js'
import { ActionForm } from '@/components/admin/ActionForm.jsx'

export const dynamic = 'force-dynamic'

export default async function Login({ searchParams }) {
  if (await getUser()) redirect('/admin')
  return (
    <main className="login">
      <ActionForm action={login} submit="Ingresar" className="card">
        <div className="alogo" style={{ marginBottom: 6 }}>RUNA<span style={{ color: 'var(--blue)' }}>SPORT</span></div>
        <p style={{ marginTop: 0 }}>Panel de administración</p>
        {searchParams?.reset && <p className="aok">Contraseña actualizada. Ya podés ingresar.</p>}
        <label>Email<input name="email" type="email" required autoComplete="username" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        <p><Link href="/admin/recuperar">¿Olvidaste tu contraseña?</Link></p>
      </ActionForm>
    </main>
  )
}
