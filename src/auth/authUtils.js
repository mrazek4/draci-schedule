import { CLIENT_ID, AUTHORITY, SCOPES, getRedirectUri } from './authConfig.js'

const STORAGE_KEY  = 'draci-auth'
const VERIFIER_KEY = 'pkce_verifier'
const STATE_KEY    = 'pkce_state'

// Zakóduje pole bajtů do Base64URL formátu (bezpečný pro URL, bez paddingu)
function base64urlEncode(array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Vygeneruje náhodný 32bajtový PKCE code verifier
function generateVerifier() {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return base64urlEncode(buf)
}

// Vygeneruje PKCE code challenge jako SHA-256 hash verifieru
async function generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(new Uint8Array(hash))
}

// Spustí OAuth2 PKCE přihlašování – přesměruje prohlížeč na Microsoft login
export async function startLogin() {
  const verifier  = generateVerifier()
  const challenge = await generateChallenge(verifier)
  const state     = crypto.randomUUID()

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          getRedirectUri(),
    scope:                 SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state,
    prompt:                'select_account',
  })
  window.location.href = `${AUTHORITY}/oauth2/v2.0/authorize?${params}`
}

// Zpracuje OAuth2 callback: vymění authorization code za tokeny a uloží přihlášení
export async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code   = params.get('code')
  const state  = params.get('state')
  const error  = params.get('error')

  if (error) throw new Error(params.get('error_description') || error)
  if (!code)  return null

  const verifier   = sessionStorage.getItem(VERIFIER_KEY)
  const savedState = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)

  if (state !== savedState) throw new Error('State mismatch — možný CSRF útok')

  const resp = await fetch(`${AUTHORITY}/oauth2/v2.0/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  getRedirectUri(),
      code_verifier: verifier,
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error_description || 'Token exchange selhal')
  }

  const tokens = await resp.json()

  const [, b64] = tokens.id_token.split('.')
  const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')))

  const auth = {
    user: {
      name:  payload.name || payload.preferred_username,
      email: payload.preferred_username || payload.email || '',
      oid:   payload.oid,
    },
    expiresAt: Date.now() + tokens.expires_in * 1000,
    idToken:   tokens.id_token,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  return auth
}

// Načte uložené přihlášení z localStorage; vrátí null pokud chybí nebo token expiroval
export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const auth = JSON.parse(raw)
    if (auth.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return auth
  } catch {
    return null
  }
}

// Odhlásí uživatele: smaže localStorage a přesměruje na Microsoft logout
export function logout() {
  localStorage.removeItem(STORAGE_KEY)
  const params = new URLSearchParams({ post_logout_redirect_uri: window.location.origin })
  window.location.href = `${AUTHORITY}/oauth2/v2.0/logout?${params}`
}
