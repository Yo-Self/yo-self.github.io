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

# Executar testes standalone primeiro
echo "🔧 Executando testes standalone..."
run_test_with_timeout \
    "NODE_ENV=test npx playwright test tests/standalone-tests.spec.cjs --project=chromium --config=playwright.config.cjs" \
    "Testes Standalone"

# Executar testes principais com timeout geral
echo "🚀 Executando testes principais..."
if [ -n "$TIMEOUT_CMD" ]; then
    # Com timeout
    if $TIMEOUT_CMD $TEST_TIMEOUT bash -c '
        npx playwright test --config=playwright.config.ci.cjs --project=chromium --grep="^(?!.*Standalone).*"
    '; then
        echo "🎉 Todos os testes executaram com sucesso!"
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
            
            exit 1
        else
            echo "❌ Testes falharam com código $exit_code"
            exit $exit_code
        fi
    fi
else
    # Sem timeout
    if npx playwright test --config=playwright.config.ci.cjs --project=chromium --grep="^(?!.*Standalone).*"; then
        echo "🎉 Todos os testes executaram com sucesso!"
        exit 0
    else
        exit_code=$?
        echo "❌ Testes falharam com código $exit_code"
        exit $exit_code
    fi
fi
