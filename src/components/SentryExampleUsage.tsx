"use client";

import { useState } from 'react';
import { useSentryLogger } from '@/hooks/useSentryLogger';
import { useSentryPerformance } from '@/hooks/useSentryPerformance';
import { SentryErrorBoundary } from './SentryErrorBoundary';

export default function SentryExampleUsage() {
  const [loading, setLoading] = useState(false);
  const { logInfo, logError, logUserAction, logPerformance } = useSentryLogger();
  const { measureOperation, measureUserInteraction } = useSentryPerformance();

  const handleButtonClick = async () => {
    const interaction = measureUserInteraction('Example Button Click');
    
    try {
      logUserAction('button_click', undefined, { component: 'SentryExampleUsage' });
      
      setLoading(true);
      
      // Simular uma operação assíncrona
      await measureOperation(
        'Example Async Operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          logInfo('Operation completed successfully');
        },
        { component: 'SentryExampleUsage', action: 'async_operation' }
      );
      
      logPerformance('Button click operation', 1000);
      
    } catch (error) {
      logError('Failed to complete operation', { 
        component: 'SentryExampleUsage',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
      interaction.end();
    }
  };

  const handleErrorButton = () => {
    logUserAction('error_button_click', undefined, { component: 'SentryExampleUsage' });
    throw new Error('This is a test error for Sentry!');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Sentry Integration Example</h2>
      
      <div className="space-y-4">
        <button
          onClick={handleButtonClick}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Performance Monitoring'}
        </button>
        
        <SentryErrorBoundary>
          <button
            onClick={handleErrorButton}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Test Error Boundary
          </button>
        </SentryErrorBoundary>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>• First button tests performance monitoring and logging</p>
        <p>• Second button tests error boundary and error capture</p>
        <p>• Check your Sentry dashboard to see the captured data</p>
      </div>
    </div>
  );
}
