import Link from 'next/link'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import { requestReset } from '@/lib/actions.js'

export default function Recuperar() {
  return (
    <main className="login">
      <ActionForm action={requestReset} submit="Enviar enlace" className="card">
        <div className="alogo" style={{ marginBottom: 6 }}>RUNA<span style={{ color: 'var(--blue)' }}>SPORT</span></div>
        <p style={{ marginTop: 0 }}>Ingresá tu email y te enviamos un enlace para elegir una contraseña nueva.</p>
        <label>Email<input name="email" type="email" required autoComplete="username" /></label>
        <p><Link href="/admin/login">Volver al login</Link></p>
      </ActionForm>
    </main>
  )
}
