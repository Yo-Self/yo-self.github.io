'use client'

/**
 * Error Component for App Router
 * Catches errors during rendering and displays a fallback UI
 * Automatically captures errors to PostHog
 * Documentation: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function Error({
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
          error_boundary: 'route',
          source: 'next_error_component',
        },
      })
      console.error('Route error captured by PostHog:', error)
    } catch (captureError) {
      console.error('Failed to capture error in PostHog:', captureError)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Ops! Algo deu errado
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ocorreu um erro ao carregar esta página. Você pode tentar novamente ou voltar para a página inicial.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Tentar Novamente
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            🏠 Ir para Página Inicial
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto text-gray-800 dark:text-gray-200">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
