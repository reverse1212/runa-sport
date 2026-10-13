import './admin.css'

export const metadata = { title: 'Admin · Runa Sport', robots: { index: false, follow: false } }

export default function AdminLayout({ children }) {
  return <div className="adm">{children}</div>
}
