import ShopHeader from '../../components/shop/ShopHeader.jsx'
import ShopFooter from '../../components/shop/ShopFooter.jsx'
import Tracker from '../../components/Tracker.jsx'
import { getSettings, getCategories } from '../../lib/queries.js'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ])

  return (
    <>
      <Tracker />
      <ShopHeader
        brandName={settings.brand_name || 'Runa Sport'}
        logoUrl={settings.logo_url}
        categories={categories}
      />
      <main id="main-content">
        {children}
      </main>
      <ShopFooter
        settings={settings}
        categories={categories}
      />
    </>
  )
}
