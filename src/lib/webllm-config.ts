import * as webllm from '@mlc-ai/web-llm';

// Configurações otimizadas para o WebLLM
export const WEBLLM_CONFIG = {
  // Modelo principal (menor para melhor performance)
  primaryModel: "Llama-2-7b-chat-q4f16_1",
  primaryModelPath: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat/Llama-2-7b-chat-q4f16_1-ctx4k.wasm",
  
  // Modelo de fallback (ainda menor)
  fallbackModel: "Llama-2-7b-chat-q4f16_1",
  fallbackModelPath: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat/Llama-2-7b-chat-q4f16_1-ctx4k.wasm",
  
  // Configurações de performance
  performance: {
    maxTokens: 512,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },
  
  // Configurações de cache
  cache: {
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    enableCache: true,
  },
  
  // Configurações de inicialização
  init: {
    progressCallback: (progress: number) => {
      console.log(`WebLLM loading: ${Math.round(progress * 100)}%`);
    },
    errorCallback: (error: any) => {
      console.error('WebLLM error:', error);
    },
  }
};

// Função para inicializar o WebLLM com configurações otimizadas
export async function initializeWebLLM(): Promise<webllm.ChatModule | null> {
  try {
    const chatModule = new webllm.ChatModule();
    
    // Configura callbacks de progresso
    chatModule.setInitProgressCallback(WEBLLM_CONFIG.init.progressCallback);
    
    // Tenta carregar o modelo principal
    try {
      await chatModule.reload(WEBLLM_CONFIG.primaryModel, {
        model_lib_path: WEBLLM_CONFIG.primaryModelPath,
        max_gen_len: WEBLLM_CONFIG.performance.maxTokens,
        temperature: WEBLLM_CONFIG.performance.temperature,
        top_p: WEBLLM_CONFIG.performance.topP,
        frequency_penalty: WEBLLM_CONFIG.performance.frequencyPenalty,
        presence_penalty: WEBLLM_CONFIG.performance.presencePenalty,
      });
      
      console.log('WebLLM initialized successfully with primary model');
      return chatModule;
      
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback:', primaryError);
      
      // Tenta o modelo de fallback
      try {
        await chatModule.reload(WEBLLM_CONFIG.fallbackModel, {
          model_lib_path: WEBLLM_CONFIG.fallbackModelPath,
          max_gen_len: WEBLLM_CONFIG.performance.maxTokens,
          temperature: WEBLLM_CONFIG.performance.temperature,
          top_p: WEBLLM_CONFIG.performance.topP,
          frequency_penalty: WEBLLM_CONFIG.performance.frequencyPenalty,
          presence_penalty: WEBLLM_CONFIG.performance.presencePenalty,
        });
        
        console.log('WebLLM initialized successfully with fallback model');
        return chatModule;
        
      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError);
        return null;
      }
    }
    
  } catch (error) {
    console.error('Failed to initialize WebLLM:', error);
    return null;
  }
}

// Função para verificar se o WebLLM é suportado
export function isWebLLMSupported(): boolean {
  try {
    // Verifica se o WebLLM está disponível
    if (typeof webllm === 'undefined') {
      return false;
    }
    
    // Verifica se WebAssembly é suportado
    if (typeof WebAssembly === 'undefined') {
      return false;
    }
    
    // Verifica se fetch é suportado (para baixar modelos)
    if (typeof fetch === 'undefined') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('WebLLM support check failed:', error);
    return false;
  }
}

// Função para obter informações de performance do dispositivo
export function getDeviceInfo(): {
  isMobile: boolean;
  hasWebGL: boolean;
  memoryInfo: any;
  userAgent: string;
} {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  })();
  
  const memoryInfo = (navigator as any).deviceMemory ? {
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  } : {
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
  
  return {
    isMobile,
    hasWebGL,
    memoryInfo,
    userAgent: navigator.userAgent,
  };
} 