/**
 * Script de teste para verificar o error tracking do PostHog
 * Execute no console do navegador para testar diferentes tipos de captura de erros
 */

// ============================================================================
// TESTES CLIENT-SIDE
// ============================================================================

console.log('🧪 PostHog Error Tracking - Scripts de Teste\n');

/**
 * Teste 1: Exception Autocapture
 * Deve ser capturado automaticamente pelo PostHog
 */
export function testAutocapture() {
  console.log('📝 Teste 1: Exception Autocapture');
  console.log('Lançando erro não tratado...');
  
  setTimeout(() => {
    throw new Error('Teste de exception autocapture - Este erro deve aparecer no PostHog');
  }, 100);
  
  console.log('✅ Erro lançado. Verifique em: https://app.posthog.com/error_tracking\n');
}

/**
 * Teste 2: Captura Manual
 * Usa posthog.captureException() diretamente
 */
export function testManualCapture() {
  console.log('📝 Teste 2: Captura Manual');
  
  if (typeof window !== 'undefined' && window.posthog) {
    const testError = new Error('Teste de captura manual de erro');
    
    window.posthog.captureException(testError, {
      extra: {
        test_type: 'manual_capture',
        timestamp: new Date().toISOString(),
      },
      tags: {
        test: 'true',
        feature: 'error_tracking_test',
      },
    });
    
    console.log('✅ Erro capturado manualmente. Verifique no PostHog.\n');
  } else {
    console.error('❌ PostHog não está disponível. Verifique se NEXT_PUBLIC_POSTHOG_KEY está configurado.\n');
  }
}

/**
 * Teste 3: Erro Assíncrono (Promise Rejection)
 * Deve ser capturado pelo exception autocapture
 */
export function testAsyncError() {
  console.log('📝 Teste 3: Erro Assíncrono (Promise Rejection)');
  
  Promise.reject(new Error('Teste de promise rejection - Deve ser capturado automaticamente'))
    .catch((error) => {
      console.log('Promise rejeitada:', error.message);
      console.log('✅ Erro assíncrono lançado. Verifique no PostHog.\n');
    });
}

/**
 * Teste 4: Erro com Stack Trace Customizado
 */
export function testWithContext() {
  console.log('📝 Teste 4: Erro com Contexto Adicional');
  
  if (typeof window !== 'undefined' && window.posthog) {
    const contextError = new Error('Erro com contexto rico');
    
    window.posthog.captureException(contextError, {
      extra: {
        user_action: 'testing_error_tracking',
        page_url: window.location.href,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      tags: {
        severity: 'high',
        category: 'test',
        environment: process.env.NODE_ENV || 'unknown',
      },
    });
    
    console.log('✅ Erro com contexto capturado. Verifique no PostHog.\n');
  } else {
    console.error('❌ PostHog não está disponível.\n');
  }
}

/**
 * Teste 5: Simular Erro de Rede
 */
export async function testNetworkError() {
  console.log('📝 Teste 5: Erro de Rede');
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/999999999');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.captureException(error, {
        extra: {
          error_type: 'network_error',
          url: 'https://jsonplaceholder.typicode.com/posts/999999999',
        },
        tags: {
          category: 'network',
        },
      });
      console.log('✅ Erro de rede capturado:', error.message);
      console.log('Verifique no PostHog.\n');
    }
  }
}

/**
 * Teste 6: Verificar se PostHog está configurado
 */
export function checkPostHogStatus() {
  console.log('📝 Teste 6: Status do PostHog\n');
  
  if (typeof window !== 'undefined' && window.posthog) {
    console.log('✅ PostHog está inicializado');
    console.log('📊 Configurações:');
    console.log('  - API Host:', window.posthog.config?.api_host);
    console.log('  - Exception Autocapture:', window.posthog.config?.capture_exceptions);
    console.log('  - Performance:', window.posthog.config?.capture_performance);
    console.log('  - Autocapture:', window.posthog.config?.autocapture);
    console.log('  - Distinct ID:', window.posthog.get_distinct_id());
    console.log('\n✅ Tudo configurado corretamente!\n');
  } else {
    console.error('❌ PostHog não está disponível');
    console.error('Verifique:');
    console.error('  1. NEXT_PUBLIC_POSTHOG_KEY está definido no .env.local');
    console.error('  2. PostHogProvider está envolvendo a aplicação');
    console.error('  3. A página foi recarregada após adicionar as variáveis de ambiente\n');
  }
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

export function runAllTests() {
  console.log('🚀 Executando todos os testes de error tracking...\n');
  
  checkPostHogStatus();
  
  setTimeout(() => {
    testManualCapture();
  }, 500);
  
  setTimeout(() => {
    testWithContext();
  }, 1000);
  
  setTimeout(() => {
    testNetworkError();
  }, 1500);
  
  setTimeout(() => {
    testAsyncError();
  }, 2000);
  
  setTimeout(() => {
    console.log('⚠️  ATENÇÃO: O próximo teste lançará um erro não tratado.');
    console.log('Isso é esperado e deve ser capturado automaticamente.\n');
  }, 2500);
  
  setTimeout(() => {
    testAutocapture();
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✅ Todos os testes foram executados!');
    console.log('📊 Verifique os erros em: https://app.posthog.com/error_tracking');
    console.log('📈 Verifique a atividade em: https://app.posthog.com/activity/explore\n');
  }, 3500);
}

// ============================================================================
// INSTRUÇÕES DE USO
// ============================================================================

console.log('Para testar o error tracking, execute no console:');
console.log('');
console.log('// Verificar status');
console.log('checkPostHogStatus()');
console.log('');
console.log('// Testar exception autocapture');
console.log('testAutocapture()');
console.log('');
console.log('// Testar captura manual');
console.log('testManualCapture()');
console.log('');
console.log('// Testar erro assíncrono');
console.log('testAsyncError()');
console.log('');
console.log('// Testar com contexto');
console.log('testWithContext()');
console.log('');
console.log('// Testar erro de rede');
console.log('testNetworkError()');
console.log('');
console.log('// Executar todos os testes');
console.log('runAllTests()');
console.log('');

// ============================================================================
// SERVER-SIDE TEST INSTRUCTIONS
// ============================================================================

console.log('\n📝 Para testar error tracking SERVER-SIDE:');
console.log('');
console.log('1. Adicione este código em uma Server Action ou API Route:');
console.log('');
console.log('   import { getPostHogServer } from "@/lib/posthog"');
console.log('');
console.log('   export async function testServerError() {');
console.log('     const posthog = getPostHogServer()');
console.log('     try {');
console.log('       throw new Error("Teste de erro server-side")');
console.log('     } catch (error) {');
console.log('       if (posthog) {');
console.log('         await posthog.captureException(error, {');
console.log('           distinct_id: "test-user",');
console.log('           $set: { test: true }');
console.log('         })');
console.log('         await posthog.flush()');
console.log('       }');
console.log('     }');
console.log('   }');
console.log('');
console.log('2. Ou simplesmente lance um erro em qualquer Server Component');
console.log('   O instrumentation.ts capturará automaticamente');
console.log('');
