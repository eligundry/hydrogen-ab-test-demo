import cookie from 'cookie'

export const getGoogleAnalyticsClientIdFromCookie = (strCookie: string) => {
  const cookies = cookie.parse(strCookie)
  const gaClientId = cookies['_ga']?.substring(6)
  return gaClientId ?? null
}
