import Link from 'next/link'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import { resetPassword } from '@/lib/actions.js'

export default function Restablecer({ searchParams }) {
  const token = String(searchParams.token || '')
  return (
    <main className="login">
      <ActionForm action={resetPassword} submit="Guardar contraseña" className="card">
        <div className="alogo" style={{ marginBottom: 6 }}>RUNA<span style={{ color: 'var(--blue)' }}>SPORT</span></div>
        <p style={{ marginTop: 0 }}>Elegí tu contraseña nueva (mínimo 10 caracteres).</p>
        <input type="hidden" name="token" value={token} />
        <label>Contraseña nueva<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label>Repetir contraseña<input name="password2" type="password" required minLength={10} autoComplete="new-password" /></label>
        <p><Link href="/admin/recuperar">Pedir otro enlace</Link></p>
      </ActionForm>
    </main>
  )
}
