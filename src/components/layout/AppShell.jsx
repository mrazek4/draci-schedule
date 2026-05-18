import './AppShell.css'

export default function AppShell({ sidebar, children }) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">{sidebar}</aside>
      <main className="app-shell__main">{children}</main>
    </div>
  )
}
