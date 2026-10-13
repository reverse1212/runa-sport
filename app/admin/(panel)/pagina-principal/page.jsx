import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { getSettings } from '@/lib/queries.js'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import SiteImageUploader from '@/components/admin/SiteImageUploader.jsx'
import { saveSettings } from '@/lib/actions.js'

export default async function PaginaPrincipal() {
  await requireUser('content')
  const s = await getSettings()
  return (
    <>
      <h1>Página principal</h1>
      <div className="cols">
        <ActionForm action={saveSettings} submit="Guardar hero" className="card">
          <h2>Hero principal</h2>
          <input type="hidden" name="_group" value="hero" />
          <label>Título<input name="hero_title" maxLength={140} defaultValue={s.hero_title} /></label>
          <label>Subtítulo<textarea name="hero_subtitle" rows={3} maxLength={400} defaultValue={s.hero_subtitle} /></label>
          <label>Texto del botón<input name="hero_cta_text" maxLength={40} defaultValue={s.hero_cta_text} /></label>
          <label>URL del botón<input name="hero_cta_url" maxLength={200} defaultValue={s.hero_cta_url} /></label>
        </ActionForm>
        <SiteImageUploader label="Logo" settingKey="logo_url" currentUrl={s.logo_url} hint="Se muestra en el encabezado del sitio (por ahora en texto; el logo se usa desde la próxima visita)." />
      </div>
      <ActionForm action={saveSettings} submit="Guardar datos de la tienda" className="card" style={{ marginTop: 16 }}>
        <h2>Información de la tienda</h2>
        <input type="hidden" name="_group" value="store" />
        <div className="fgrid">
          <label>Nombre de marca<input name="brand_name" maxLength={60} defaultValue={s.brand_name} /></label>
          <label>Dirección<input name="address" maxLength={160} defaultValue={s.address} /></label>
          <label>Link de Google Maps<input name="maps_url" maxLength={300} defaultValue={s.maps_url} /></label>
          <label>Teléfono (texto a mostrar)<input name="phone_display" maxLength={40} defaultValue={s.phone_display} /></label>
          <label>Teléfono (para llamar, solo dígitos y +)<input name="phone_tel" maxLength={20} defaultValue={s.phone_tel} /></label>
          <label>WhatsApp (solo números, con código país)<input name="whatsapp_number" maxLength={20} defaultValue={s.whatsapp_number} /></label>
          <label>WhatsApp (texto a mostrar)<input name="whatsapp_display" maxLength={40} defaultValue={s.whatsapp_display} /></label>
          <label>Email<input name="email" type="email" maxLength={100} defaultValue={s.email} /></label>
          <label>Horarios<input name="hours" maxLength={120} defaultValue={s.hours} /></label>
          <label>Instagram (URL)<input name="social_instagram" maxLength={200} defaultValue={s.social_instagram} /></label>
          <label>Facebook (URL)<input name="social_facebook" maxLength={200} defaultValue={s.social_facebook} /></label>
        </div>
        <label>Mensaje de WhatsApp (usá <code>{'{producto}'}</code> donde va el nombre)<input name="whatsapp_template" maxLength={200} defaultValue={s.whatsapp_template} /></label>
        <label>Texto del footer<input name="footer_text" maxLength={200} defaultValue={s.footer_text} /></label>
      </ActionForm>
    </>
  )
}
