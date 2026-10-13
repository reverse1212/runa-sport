import { requireUser } from '@/lib/auth.js'
import { getSettings } from '@/lib/queries.js'
import { ActionForm } from '@/components/admin/ActionForm.jsx'
import SiteImageUploader from '@/components/admin/SiteImageUploader.jsx'
import { saveSettings } from '@/lib/actions.js'

export default async function Configuracion() {
  await requireUser('content')
  const s = await getSettings()
  return (
    <>
      <h1>Configuración</h1>
      <div className="cols">
        <ActionForm action={saveSettings} submit="Guardar SEO" className="card">
          <h2>SEO</h2>
          <input type="hidden" name="_group" value="seo" />
          <label>Meta title<input name="seo_title" maxLength={120} defaultValue={s.seo_title} /></label>
          <label>Meta description<textarea name="seo_description" rows={3} maxLength={300} defaultValue={s.seo_description} /></label>
          <p><small>El alt de cada imagen se edita desde la sección Imágenes de cada producto.</small></p>
        </ActionForm>
        <SiteImageUploader label="Favicon" settingKey="favicon_url" currentUrl={s.favicon_url} square hint="Se recorta cuadrada automáticamente." />
      </div>
      <ActionForm action={saveSettings} submit="Guardar colores" className="card" style={{ marginTop: 16 }}>
        <h2>Colores de la marca</h2>
        <input type="hidden" name="_group" value="design" />
        <div className="fgrid">
          <label>Azul principal<input name="color_blue" type="color" defaultValue={s.color_blue || '#2450F5'} /></label>
          <label>Azul oscuro<input name="color_dark" type="color" defaultValue={s.color_dark || '#0E1A3A'} /></label>
          <label>Amarillo<input name="color_yellow" type="color" defaultValue={s.color_yellow || '#FFD21F'} /></label>
          <label>Fondo claro<input name="color_bg" type="color" defaultValue={s.color_bg || '#F5F7FB'} /></label>
        </div>
      </ActionForm>
      <ActionForm action={saveSettings} submit="Guardar textos" className="card" style={{ marginTop: 16 }}>
        <h2>Textos generales</h2>
        <input type="hidden" name="_group" value="texts" />
        <label>Título de la sección de stock<input name="stock_title" maxLength={80} defaultValue={s.stock_title} /></label>
        <label>Subtítulo de la sección de stock<input name="stock_subtitle" maxLength={200} defaultValue={s.stock_subtitle} /></label>
      </ActionForm>
    </>
  )
}
