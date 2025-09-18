'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import CacheCleaner from './CacheCleaner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showCacheCleaner: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showCacheCleaner: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, showCacheCleaner: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and analytics
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Detectar se é erro relacionado a cache ou service worker
    const isCacheRelatedError = 
      error.message.includes('service worker') ||
      error.message.includes('cache') ||
      error.message.includes('chunk') ||
      error.message.includes('webpack') ||
      error.message.includes('Failed to fetch') ||
      error.stack?.includes('sw.js') ||
      error.stack?.includes('cache');

    if (isCacheRelatedError) {
      console.log('Cache-related error detected, showing cache cleaner');
      this.setState({ showCacheCleaner: true });
    }
  }

  private handleRetry = () => {
    // Clear all caches and reload
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FORCE_REFRESH'
      });
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Mostrar CacheCleaner se for erro relacionado a cache
      if (this.state.showCacheCleaner) {
        return <CacheCleaner />;
      }

      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 mb-6">
              Parece que houve um problema com o aplicativo. 
              Vamos tentar corrigir isso para você.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Recarregar Aplicativo
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                🏠 Ir para Página Inicial
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
