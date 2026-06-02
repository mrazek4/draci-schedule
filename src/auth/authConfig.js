export const CLIENT_ID = 'b8d9033b-0ed0-41d8-948d-c711680c250a'
export const AUTHORITY = 'https://login.microsoftonline.com/florbaldraci.cz'
export const SCOPES    = 'openid profile email User.Read'

// Vrátí redirect URI pro OAuth2 callback (protokol + doména + /auth)
export function getRedirectUri() {
  return window.location.origin + '/auth'
}
