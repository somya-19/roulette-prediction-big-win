// Generates a unique ID for this browser/device
export async function getDeviceFingerprint() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
    navigator.platform || '',
  ].join('|||')

  const encoded = new TextEncoder().encode(raw)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Human readable label for admin to see in Supabase
export function getDeviceInfo() {
  const ua = navigator.userAgent
  let device = 'Unknown'
  if      (/iPhone/.test(ua))   device = 'iPhone'
  else if (/iPad/.test(ua))     device = 'iPad'
  else if (/Android/.test(ua))  device = 'Android'
  else if (/Windows/.test(ua))  device = 'Windows'
  else if (/Macintosh/.test(ua))device = 'Mac'

  let browser = 'Unknown'
  if      (/CriOS/.test(ua))                        browser = 'Chrome iOS'
  else if (/FxiOS/.test(ua))                        browser = 'Firefox iOS'
  else if (/Chrome/.test(ua) && !/Edge/.test(ua))   browser = 'Chrome'
  else if (/Firefox/.test(ua))                      browser = 'Firefox'
  else if (/Safari/.test(ua))                       browser = 'Safari'
  else if (/Edge/.test(ua))                         browser = 'Edge'

  return `${device} / ${browser} / ${screen.width}x${screen.height}`
}
