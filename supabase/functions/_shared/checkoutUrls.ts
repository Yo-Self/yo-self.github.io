export class CheckoutUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckoutUrlError'
  }
}

const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  'yo-self.com',
  'localhost',
  '127.0.0.1',
  'vercel.app',
]

function collectAllowedHostSuffixes(): string[] {
  const suffixes = new Set(DEFAULT_ALLOWED_HOST_SUFFIXES.map((host) => host.toLowerCase()))

  const envValues = [
    Deno.env.get('SITE_URL'),
    Deno.env.get('PUBLIC_SITE_URL'),
    Deno.env.get('NEXT_PUBLIC_SITE_URL'),
    Deno.env.get('CHECKOUT_ALLOWED_HOST_SUFFIXES'),
  ]

  for (const raw of envValues) {
    if (!raw) continue

    if (raw.includes(',')) {
      for (const part of raw.split(',')) {
        const trimmed = part.trim().toLowerCase()
        if (trimmed) suffixes.add(trimmed)
      }
      continue
    }

    try {
      suffixes.add(new URL(raw).hostname.toLowerCase())
    } catch {
      suffixes.add(raw.toLowerCase())
    }
  }

  return [...suffixes]
}

function hostMatchesAllowlist(hostname: string, suffixes: string[]): boolean {
  const host = hostname.toLowerCase()
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

export function assertAllowedCheckoutUrl(urlString: string, label = 'URL'): string {
  let parsed: URL

  try {
    parsed = new URL(urlString)
  } catch {
    throw new CheckoutUrlError(`${label} inválida`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CheckoutUrlError(`${label} deve usar HTTP ou HTTPS`)
  }

  if (!hostMatchesAllowlist(parsed.hostname, collectAllowedHostSuffixes())) {
    throw new CheckoutUrlError(`${label} com host não permitido`)
  }

  return parsed.href
}
