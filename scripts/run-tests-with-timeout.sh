#!/bin/bash

# Script para executar testes com timeout e recuperação de erros
# Evita que os testes fiquem rodando indefinidamente

set -e

echo "🚀 Iniciando execução dos testes com timeout..."

# Configurações
TEST_TIMEOUT=10m  # 10 minutos máximo para todos os testes
INDIVIDUAL_TIMEOUT=2m  # 2 minutos máximo para cada teste individual
MAX_RETRIES=2

# Função para executar testes com timeout
run_test_with_timeout() {
    local test_command="$1"
    local test_name="$2"
    local retry_count=0
    
    echo "🧪 Executando: $test_name"
    
    while [ $retry_count -le $MAX_RETRIES ]; do
        echo "📝 Tentativa $((retry_count + 1)) de $((MAX_RETRIES + 1))"
        
        if timeout $INDIVIDUAL_TIMEOUT bash -c "$test_command"; then
            echo "✅ $test_name: Sucesso!"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 124 ]; then
                echo "⏰ $test_name: Timeout após $INDIVIDUAL_TIMEOUT"
            else
                echo "❌ $test_name: Falhou com código $exit_code"
            fi
            
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -le $MAX_RETRIES ]; then
                echo "🔄 Aguardando 5 segundos antes da próxima tentativa..."
                sleep 5
            fi
        fi
    done
    
    echo "💥 $test_name: Falhou após $MAX_RETRIES tentativas"
    return 1
}

# Iniciar servidor de desenvolvimento para testes standalone
echo "🟢 Iniciando servidor de desenvolvimento para testes standalone..."
NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=true NODE_ENV=test npm run dev:test &
DEV_SERVER_PID=$!

# Aguardar servidor ficar pronto
echo "⏳ Aguardando servidor (http://localhost:3000) ficar pronto..."
if ! timeout 60s bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'; then
  echo "❌ Servidor não ficou pronto em 60s. Encerrando."
  kill $DEV_SERVER_PID || true
  exit 1
fi

echo "✅ Servidor pronto (PID: $DEV_SERVER_PID)"

# Executar testes standalone primeiro (sem webServer do Playwright)
echo "🔧 Executando testes standalone..."
run_test_with_timeout \
    "SKIP_WEBSERVER=1 NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=true NODE_ENV=test npx playwright test tests/standalone-tests.spec.cjs --project=chromium --config=playwright.config.cjs" \
    "Testes Standalone"

# Parar servidor standalone
echo "🛑 Encerrando servidor de desenvolvimento (standalone)"
kill $DEV_SERVER_PID || true
sleep 2

# Iniciar servidor para suíte principal (também sem webServer do Playwright)
echo "🟢 Iniciando servidor de desenvolvimento para suíte principal..."
# Detectar credenciais do Supabase para decidir habilitar chamadas de API
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "🔓 Credenciais do banco detectadas – habilitando chamadas de API para suíte principal"
  NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=false NODE_ENV=test npm run dev:test &
else
  echo "🔒 Sem credenciais do banco – desabilitando chamadas de API para suíte principal"
  NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=true NODE_ENV=test npm run dev:test &
fi
MAIN_SERVER_PID=$!

# Aguardar servidor principal ficar pronto
echo "⏳ Aguardando servidor (http://localhost:3000) ficar pronto..."
if ! timeout 60s bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'; then
  echo "❌ Servidor (principal) não ficou pronto em 60s. Encerrando."
  kill $MAIN_SERVER_PID || true
  exit 1
fi

echo "✅ Servidor principal pronto (PID: $MAIN_SERVER_PID)"

# Executar testes principais com timeout geral (sem webServer do Playwright)
echo "🚀 Executando testes principais..."
if timeout $TEST_TIMEOUT bash -c '
    SKIP_WEBSERVER=1 NEXT_PUBLIC_DISABLE_SW=true NODE_ENV=test npx playwright test --config=playwright.config.ci-no-server.cjs --project=chromium --grep="^(?!.*Standalone).*"
'; then
    echo "🎉 Todos os testes executaram com sucesso!"
    kill $MAIN_SERVER_PID || true
    exit 0
else
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "⏰ Timeout geral após $TEST_TIMEOUT - alguns testes podem ter falhado"
        echo "📊 Verificando resultados parciais..."
        
        # Tentar gerar relatório mesmo com timeout
        if [ -d "test-results" ]; then
            echo "📋 Resultados parciais disponíveis em test-results/"
            ls -la test-results/
        fi
        kill $MAIN_SERVER_PID || true
        exit 1
    else
        echo "❌ Testes falharam com código $exit_code"
        kill $MAIN_SERVER_PID || true
        exit $exit_code
    fi
fi
