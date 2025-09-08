import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

interface LogContext {
  userId?: string;
  restaurantId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export function useSentryLogger() {
  const { logger } = Sentry;

  const logTrace = useCallback((message: string, context?: LogContext) => {
    logger.trace(message, context);
  }, [logger]);

  const logDebug = useCallback((message: string, context?: LogContext) => {
    logger.debug(message, context);
  }, [logger]);

  const logInfo = useCallback((message: string, context?: LogContext) => {
    logger.info(message, context);
  }, [logger]);

  const logWarn = useCallback((message: string, context?: LogContext) => {
    logger.warn(message, context);
  }, [logger]);

  const logError = useCallback((message: string, context?: LogContext) => {
    logger.error(message, context);
  }, [logger]);

  const logFatal = useCallback((message: string, context?: LogContext) => {
    logger.fatal(message, context);
  }, [logger]);

  // Métodos específicos para o contexto do restaurante
  const logRestaurantAction = useCallback((
    action: string, 
    restaurantId: string, 
    additionalContext?: LogContext
  ) => {
    logger.info(`Restaurant action: ${action}`, {
      restaurantId,
      action,
      ...additionalContext,
    });
  }, [logger]);

  const logUserAction = useCallback((
    action: string, 
    userId?: string, 
    additionalContext?: LogContext
  ) => {
    logger.info(`User action: ${action}`, {
      userId,
      action,
      ...additionalContext,
    });
  }, [logger]);

  const logPerformance = useCallback((
    operation: string, 
    duration: number, 
    context?: LogContext
  ) => {
    logger.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
    });
  }, [logger]);

  const logApiCall = useCallback((
    endpoint: string, 
    method: string, 
    statusCode: number, 
    duration?: number,
    context?: LogContext
  ) => {
    logger.info(`API call: ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      duration,
      ...context,
    });
  }, [logger]);

  return {
    logTrace,
    logDebug,
    logInfo,
    logWarn,
    logError,
    logFatal,
    logRestaurantAction,
    logUserAction,
    logPerformance,
    logApiCall,
  };
}
