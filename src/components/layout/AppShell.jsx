import { useState } from 'react'
import './AppShell.css'

// Layout komponenta: sidebar + hlavní obsah s hamburger tlačítkem na mobilech
export default function AppShell({ sidebar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const close = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      <aside className={`app-shell__sidebar${sidebarOpen ? ' app-shell__sidebar--open' : ''}`}>
        <button className="app-shell__sidebar-close" onClick={close} aria-label="Zavřít menu">×</button>
        {sidebar}
      </aside>

      {sidebarOpen && <div className="app-shell__backdrop" onClick={close} />}

      <main className="app-shell__main">
        {children}
      </main>

      <button className="app-shell__menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Otevřít menu">
        ☰
      </button>
    </div>
  )
}
