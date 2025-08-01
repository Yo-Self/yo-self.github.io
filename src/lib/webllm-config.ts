import { CreateMLCEngine, MLCEngineInterface, InitProgressCallback } from '@mlc-ai/web-llm';

// Configurações otimizadas para o WebLLM
export const WEBLLM_CONFIG = {
  // Modelo principal (menor para melhor performance)
  primaryModel: "Llama-2-7b-chat-q4f16_1",
  
  // Configurações de performance
  performance: {
    maxTokens: 512,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },
  
  // Configurações de inicialização
  init: {
    progressCallback: ((report) => {
      console.log(`WebLLM loading: ${Math.round(report.progress * 100)}%`);
    }) as InitProgressCallback,
    errorCallback: (error: any) => {
      console.error('WebLLM error:', error);
    },
  }
};

// Função para inicializar o WebLLM com configurações otimizadas
export async function initializeWebLLM(): Promise<MLCEngineInterface | null> {
  try {
    // Cria o engine MLC
    const engine = await CreateMLCEngine(WEBLLM_CONFIG.primaryModel, {
      initProgressCallback: WEBLLM_CONFIG.init.progressCallback,
    });
    
    console.log('WebLLM initialized successfully');
    return engine;
    
  } catch (error) {
    console.error('Failed to initialize WebLLM:', error);
    return null;
  }
}

// Função para verificar se o WebLLM é suportado
export function isWebLLMSupported(): boolean {
  try {
    // Verifica se WebAssembly é suportado
    if (typeof WebAssembly === 'undefined') {
      return false;
    }
    
    // Verifica se fetch é suportado (para baixar modelos)
    if (typeof fetch === 'undefined') {
      return false;
    }
    
    // Verifica se CreateMLCEngine está disponível
    if (typeof CreateMLCEngine === 'undefined') {
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