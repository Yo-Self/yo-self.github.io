const SENSITIVE_QUERY_PARAMS = [
  'order_token',
  'access_token',
  'token',
  'session_id',
  'payment_intent',
  'payment_intent_client_secret',
]

export function stripSensitiveQueryParams(urlString: string): string {
  if (typeof window === 'undefined') return urlString

  try {
    const parsed = new URL(urlString, window.location.origin)
    for (const key of SENSITIVE_QUERY_PARAMS) {
      parsed.searchParams.delete(key)
    }
    return parsed.href
  } catch {
    return urlString
  }
}

export function redactSensitiveProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!properties) return properties

  const redacted = { ...properties }

  if (typeof redacted.page_url === 'string') {
    redacted.page_url = stripSensitiveQueryParams(redacted.page_url)
  }

  if (typeof redacted.$current_url === 'string') {
    redacted.$current_url = stripSensitiveQueryParams(redacted.$current_url)
  }

  return redacted
}
