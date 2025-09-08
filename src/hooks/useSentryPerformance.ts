import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

interface PerformanceContext {
  component?: string;
  action?: string;
  userId?: string;
  restaurantId?: string;
  [key: string]: any;
}

export function useSentryPerformance() {
  // Hook para medir performance de operações
  const measureOperation = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    context?: PerformanceContext
  ): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'function',
        name: operation,
        attributes: context,
      },
      async (span) => {
        try {
          const result = await fn();
          span.setStatus('ok');
          return result;
        } catch (error) {
          span.setStatus('internal_error');
          span.recordException(error as Error);
          throw error;
        }
      }
    );
  }, []);

  // Hook para medir performance de componentes
  const measureComponentRender = useCallback((
    componentName: string,
    context?: PerformanceContext
  ) => {
    return Sentry.startSpan(
      {
        op: 'ui.render',
        name: `Render ${componentName}`,
        attributes: {
          component: componentName,
          ...context,
        },
      },
      (span) => {
        return {
          end: () => span.end(),
        };
      }
    );
  }, []);

  // Hook para medir performance de interações do usuário
  const measureUserInteraction = useCallback((
    interaction: string,
    context?: PerformanceContext
  ) => {
    return Sentry.startSpan(
      {
        op: 'ui.interaction',
        name: interaction,
        attributes: {
          interaction,
          ...context,
        },
      },
      (span) => {
        return {
          end: () => span.end(),
        };
      }
    );
  }, []);

  // Hook para medir performance de API calls
  const measureApiCall = useCallback(async <T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>,
    context?: PerformanceContext
  ): Promise<T> => {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `${method} ${endpoint}`,
        attributes: {
          'http.method': method,
          'http.url': endpoint,
          ...context,
        },
      },
      async (span) => {
        try {
          const result = await apiCall();
          span.setStatus('ok');
          return result;
        } catch (error) {
          span.setStatus('internal_error');
          span.recordException(error as Error);
          throw error;
        }
      }
    );
  }, []);

  // Hook para medir performance de operações de carrinho
  const measureCartOperation = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    restaurantId?: string,
    userId?: string
  ): Promise<T> => {
    return measureOperation(
      `Cart ${operation}`,
      fn,
      {
        operation,
        restaurantId,
        userId,
        component: 'CartProvider',
      }
    );
  }, [measureOperation]);

  // Hook para medir performance de operações de restaurante
  const measureRestaurantOperation = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    restaurantId: string,
    context?: PerformanceContext
  ): Promise<T> => {
    return measureOperation(
      `Restaurant ${operation}`,
      fn,
      {
        operation,
        restaurantId,
        component: 'RestaurantProvider',
        ...context,
      }
    );
  }, [measureOperation]);

  return {
    measureOperation,
    measureComponentRender,
    measureUserInteraction,
    measureApiCall,
    measureCartOperation,
    measureRestaurantOperation,
  };
}
