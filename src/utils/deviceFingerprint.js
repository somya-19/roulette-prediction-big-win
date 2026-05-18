// Generates a unique fingerprint for the current device/browser
export async function getDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
    navigator.platform || '',
  ].join('|')

  // Hash it using SubtleCrypto
  const encoder = new TextEncoder()
  const data     = encoder.encode(components)
  const hashBuf  = await crypto.subtle.digest('SHA-256', data)
  const hashArr  = Array.from(new Uint8Array(hashBuf))
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Human readable device description for admin to see
export function getDeviceInfo() {
  const ua = navigator.userAgent
  let device = 'Unknown'
  if (/iPhone/.test(ua))       device = 'iPhone'
  else if (/iPad/.test(ua))    device = 'iPad'
  else if (/Android/.test(ua)) device = 'Android'
  else if (/Windows/.test(ua)) device = 'Windows PC'
  else if (/Mac/.test(ua))     device = 'Mac'
  else if (/Linux/.test(ua))   device = 'Linux'

  let browser = 'Unknown'
  if (/Chrome/.test(ua) && !/Edge/.test(ua)) browser = 'Chrome'
  else if (/Firefox/.test(ua))               browser = 'Firefox'
  else if (/Safari/.test(ua))                browser = 'Safari'
  else if (/Edge/.test(ua))                  browser = 'Edge'

  return `${device} — ${browser} — ${screen.width}x${screen.height}`
}
