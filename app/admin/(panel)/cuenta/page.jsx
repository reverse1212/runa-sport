import { requireUser } from '@/lib/auth.js'
import { ROLE_LABEL } from '@/lib/perms.js'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import { changeOwnPassword } from '@/lib/actions.js'

export default async function Cuenta() {
  const user = await requireUser()
  return (
    <>
      <h1>Mi cuenta</h1>
      <p>{user.name} · {user.email} · {ROLE_LABEL[user.role]}</p>
      <ActionForm action={changeOwnPassword} submit="Cambiar contraseña" className="card" >
        <h2>Cambiar contraseña</h2>
        <label>Contraseña actual<input name="current" type="password" required autoComplete="current-password" /></label>
        <label>Contraseña nueva (mínimo 10 caracteres)<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label>Repetir contraseña nueva<input name="password2" type="password" required minLength={10} autoComplete="new-password" /></label>
      </ActionForm>
    </>
  )
}
