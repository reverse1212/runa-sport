import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { ROLE_LABEL } from '@/lib/perms.js'
import { fdate } from '@/lib/util.js'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import { createUser, updateUser, adminResetPassword } from '@/lib/actions.js'

export default async function Usuarios() {
  const me = await requireUser('users')
  const users = await db.user.findMany({ orderBy: { id: 'asc' } })
  const roles = Object.entries(ROLE_LABEL)
  return (
    <>
      <h1>Usuarios</h1>
      <p><b>Super Admin:</b> todo. <b>Administrador:</b> productos, stock, imágenes, consultas y estadísticas. <b>Editor:</b> productos, imágenes y contenido.</p>
      <ActionForm key={users.length} action={createUser} submit="Crear usuario" className="card">
        <h2>Nuevo usuario</h2>
        <div className="fgrid">
          <label>Nombre<input name="name" required maxLength={80} /></label>
          <label>Email<input name="email" type="email" required maxLength={200} autoComplete="off" /></label>
          <label>Rol<select name="role" defaultValue="EDITOR">{roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Contraseña (mínimo 10 caracteres)<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        </div>
      </ActionForm>
      <div className="cols" style={{ marginTop: 16 }}>
        {users.map((u) => (
          <div className="card" key={u.id}>
            <ActionForm action={updateUser} submit="Guardar">
              <input type="hidden" name="id" value={u.id} />
              <label>Nombre<input name="name" required maxLength={80} defaultValue={u.name} /></label>
              <p><small>{u.email} · Último acceso: {u.lastLoginAt ? fdate(u.lastLoginAt) : 'nunca'}{u.id === me.id ? ' · Este sos vos' : ''}</small></p>
              <label>Rol<select name="role" defaultValue={u.role} disabled={u.id === me.id}>{roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label><input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} /> Activo</label>
            </ActionForm>
            <ActionForm action={adminResetPassword} submit="Cambiar contraseña" className="pwform">
              <input type="hidden" name="id" value={u.id} />
              <label>Nueva contraseña (mínimo 10)<input name="password" type="password" minLength={10} autoComplete="new-password" /></label>
            </ActionForm>
          </div>
        ))}
      </div>
    </>
  )
}
