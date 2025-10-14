/**
 * PostHog LLM Analytics Wrapper for Google Gemini (Server-Side)
 * Automatically captures $ai_generation events when calling Gemini models
 * Documentation: https://posthog.com/docs/llm-analytics/installation/google
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPostHogServer } from './posthog';

interface PostHogLLMOptions {
  distinct_id?: string;
  trace_id?: string;
  properties?: Record<string, any>;
  groups?: Record<string, string>;
  privacy_mode?: boolean;
}

interface GenerationMetrics {
  startTime: number;
  endTime: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

/**
 * Estima tokens baseado no texto (aproximado)
 * 1 token ≈ 4 caracteres em inglês, ~3 em português
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Calcula custo estimado em USD para modelos Gemini
 * Preços aproximados (podem variar)
 */
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Preços por 1M tokens (valores de referência - Out/2025)
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free tier experimental
    'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-pro': { input: 0.50, output: 1.50 },
  };

  const modelPricing = pricing[model] || pricing['gemini-1.5-flash'];
  
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

/**
 * Captura evento $ai_generation no PostHog (server-side)
 */
async function captureAIGeneration(
  input: string,
  output: string,
  metrics: GenerationMetrics,
  options: PostHogLLMOptions = {}
) {
  const posthog = getPostHogServer();
  
  if (!posthog) {
    console.warn('PostHog LLM Analytics: PostHog server não está disponível');
    return;
  }

  const { startTime, endTime, inputTokens, outputTokens, model, temperature, topK, topP, maxOutputTokens } = metrics;
  const latency = (endTime - startTime) / 1000; // Segundos

  const estimatedInputTokens = inputTokens || estimateTokens(input);
  const estimatedOutputTokens = outputTokens || estimateTokens(output);
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;
  
  const totalCost = calculateCost(estimatedInputTokens, estimatedOutputTokens, model);

  const properties: Record<string, any> = {
    // Propriedades padrão do PostHog LLM Analytics
    $ai_model: model,
    $ai_latency: latency,
    $ai_input: input,
    $ai_input_tokens: estimatedInputTokens,
    $ai_output_choices: [{ message: { content: output, role: 'assistant' } }],
    $ai_output_tokens: estimatedOutputTokens,
    $ai_total_tokens: totalTokens,
    $ai_input_cost_usd: calculateCost(estimatedInputTokens, 0, model),
    $ai_output_cost_usd: calculateCost(0, estimatedOutputTokens, model),
    $ai_total_cost_usd: totalCost,
    
    // Configurações do modelo
    $ai_temperature: temperature,
    $ai_top_k: topK,
    $ai_top_p: topP,
    $ai_max_output_tokens: maxOutputTokens,
    
    // Metadados adicionais
    $ai_provider: 'google',
    $ai_timestamp: new Date().toISOString(),
    
    // Propriedades customizadas do usuário
    ...options.properties,
  };

  // Trace ID para agrupar conversas
  if (options.trace_id) {
    properties.$ai_trace_id = options.trace_id;
  }

  // Capturar evento
  try {
    const distinctId = options.distinct_id || 'anonymous';

    await posthog.capture({
      distinctId,
      event: '$ai_generation',
      properties,
      groups: options.groups,
    });

    await posthog.flush();

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 PostHog LLM Analytics captured (server):', {
        model,
        latency: `${latency.toFixed(2)}s`,
        tokens: totalTokens,
        cost: `$${totalCost.toFixed(6)}`,
        trace_id: options.trace_id,
        distinct_id: distinctId,
      });
    }
  } catch (error) {
    console.error('Failed to capture LLM analytics (server):', error);
  }
}

/**
 * Wrapper para chat.sendMessage com tracking do PostHog
 */
export async function sendMessageWithTracking(
  chat: any,
  message: string,
  modelName: string,
  config: any,
  options: PostHogLLMOptions = {}
): Promise<{ result: any; text: string }> {
  const startTime = Date.now();
  
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    const endTime = Date.now();

    // Capturar evento no PostHog
    await captureAIGeneration(
      message,
      text,
      {
        startTime,
        endTime,
        model: modelName,
        ...config,
      },
      options
    );

    return { result, text };
  } catch (error) {
    const endTime = Date.now();
    
    // Capturar erro também
    await captureAIGeneration(
      message,
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        startTime,
        endTime,
        model: modelName,
        ...config,
      },
      {
        ...options,
        properties: {
          ...options.properties,
          $ai_error: true,
          $ai_error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    );

    throw error;
  }
}

/**
 * Utilitário para gerar trace_id único para sessões de chat
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export type { PostHogLLMOptions };
