'use client'

/**
 * Global Error Component
 * Catches errors in the root layout
 * Automatically captures errors to PostHog
 * Documentation: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'
import NextError from 'next/error'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Capture error in PostHog
    try {
      posthog.captureException(error, {
        extra: {
          digest: error.digest,
        },
        tags: {
          error_boundary: 'global',
          source: 'next_global_error_component',
        },
      })
      console.error('Global error captured by PostHog:', error)
    } catch (captureError) {
      console.error('Failed to capture error in PostHog:', captureError)
    }
  }, [error])

  return (
    // global-error must include html and body tags
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Erro crítico do aplicativo
            </h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro crítico. Por favor, recarregue a página ou entre em contato com o suporte.
            </p>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Tentar Novamente
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ↻ Recarregar Página
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                🏠 Ir para Página Inicial
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
