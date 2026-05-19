import logo from '../assets/1629729771_club_logo.webp'
import { useAuth } from './AuthProvider.jsx'
import './login.css'

export default function LoginPage() {
  const { login, error } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="FBC Draci" className="login-logo" />
        <h1 className="login-title">FBC Draci Říčany</h1>
        <p className="login-subtitle">Plánování tréninků</p>
        {error && <p className="login-error">{error}</p>}
        <button className="btn btn--primary login-btn" onClick={login}>
          Přihlásit se přes Microsoft
        </button>
      </div>
    </div>
  )
}
