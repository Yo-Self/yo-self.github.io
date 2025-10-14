/**
 * PostHog LLM Analytics Wrapper for Google Gemini
 * Automatically captures $ai_generation events when calling Gemini models
 * Documentation: https://posthog.com/docs/llm-analytics/installation/google
 */

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import posthog from 'posthog-js';

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
  // Preços por 1M tokens (valores de referência)
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free tier
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-pro': { input: 0.50, output: 1.50 },
  };

  const modelPricing = pricing[model] || pricing['gemini-1.5-flash'];
  
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

/**
 * Captura evento $ai_generation no PostHog
 */
function captureAIGeneration(
  input: string,
  output: string,
  metrics: GenerationMetrics,
  options: PostHogLLMOptions = {}
) {
  if (typeof window === 'undefined' || !posthog) {
    // Server-side ou PostHog não disponível
    console.warn('PostHog LLM Analytics: PostHog não está disponível no cliente');
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
    if (options.distinct_id) {
      posthog.identify(options.distinct_id);
    }

    const captureOptions: any = {};
    if (options.groups) {
      captureOptions.groups = options.groups;
    }

    posthog.capture('$ai_generation', properties, captureOptions);

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 PostHog LLM Analytics captured:', {
        model,
        latency: `${latency.toFixed(2)}s`,
        tokens: totalTokens,
        cost: `$${totalCost.toFixed(6)}`,
        trace_id: options.trace_id,
      });
    }
  } catch (error) {
    console.error('Failed to capture LLM analytics:', error);
  }
}

/**
 * Wrapper para GoogleGenerativeAI que captura eventos LLM automaticamente
 */
export class PostHogGeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultOptions: PostHogLLMOptions;

  constructor(apiKey: string, defaultOptions: PostHogLLMOptions = {}) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultOptions = defaultOptions;
  }

  /**
   * Obtém um modelo generativo com tracking do PostHog
   */
  getGenerativeModel(config: any): PostHogGenerativeModel {
    const model = this.genAI.getGenerativeModel(config);
    return new PostHogGenerativeModel(model, config.model, config.generationConfig, this.defaultOptions);
  }
}

/**
 * Wrapper para GenerativeModel que captura eventos
 */
class PostHogGenerativeModel {
  constructor(
    private model: GenerativeModel,
    private modelName: string,
    private config: any,
    private defaultOptions: PostHogLLMOptions
  ) {}

  /**
   * Inicia um chat com tracking
   */
  startChat(config: any): PostHogChatSession {
    const chat = this.model.startChat(config);
    return new PostHogChatSession(chat, this.modelName, this.config, this.defaultOptions);
  }

  /**
   * Gera conteúdo com tracking
   */
  async generateContent(
    prompt: string,
    options: PostHogLLMOptions = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const output = response.text();
      const endTime = Date.now();

      // Capturar evento no PostHog
      captureAIGeneration(
        prompt,
        output,
        {
          startTime,
          endTime,
          model: this.modelName,
          ...this.config,
        },
        { ...this.defaultOptions, ...options }
      );

      return result;
    } catch (error) {
      const endTime = Date.now();
      
      // Capturar erro também
      captureAIGeneration(
        prompt,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          startTime,
          endTime,
          model: this.modelName,
          ...this.config,
        },
        {
          ...this.defaultOptions,
          ...options,
          properties: {
            ...this.defaultOptions.properties,
            ...options.properties,
            $ai_error: true,
            $ai_error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );

      throw error;
    }
  }
}

/**
 * Wrapper para ChatSession que captura eventos
 */
class PostHogChatSession {
  constructor(
    private chat: ChatSession,
    private modelName: string,
    private config: any,
    private defaultOptions: PostHogLLMOptions
  ) {}

  /**
   * Envia mensagem com tracking
   */
  async sendMessage(
    message: string,
    options: PostHogLLMOptions = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const output = response.text();
      const endTime = Date.now();

      // Capturar evento no PostHog
      captureAIGeneration(
        message,
        output,
        {
          startTime,
          endTime,
          model: this.modelName,
          ...this.config,
        },
        { ...this.defaultOptions, ...options }
      );

      return result;
    } catch (error) {
      const endTime = Date.now();
      
      // Capturar erro também
      captureAIGeneration(
        message,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          startTime,
          endTime,
          model: this.modelName,
          ...this.config,
        },
        {
          ...this.defaultOptions,
          ...options,
          properties: {
            ...this.defaultOptions.properties,
            ...options.properties,
            $ai_error: true,
            $ai_error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );

      throw error;
    }
  }
}

export type { PostHogLLMOptions };
