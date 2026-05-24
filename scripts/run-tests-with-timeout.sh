#!/bin/bash

# Script para executar testes com timeout e recuperação de erros
# Evita que os testes fiquem rodando indefinidamente

set -e

# Fallback do comando timeout para Mac OS
if ! command -v timeout >/dev/null 2>&1; then
  if command -v gtimeout >/dev/null 2>&1; then
    timeout() { gtimeout "$@"; }
  else
    timeout() {
      # Formato simples: timeout DURATION COMMAND
      # Exemplo: timeout 60s command ou timeout 10m command
      local duration=$1
      shift
      
      # Converter duração para segundos
      local seconds=0
      if [[ $duration =~ ^([0-9]+)s$ ]]; then
        seconds=${BASH_REMATCH[1]}
      elif [[ $duration =~ ^([0-9]+)m$ ]]; then
        seconds=$(( ${BASH_REMATCH[1]} * 60 ))
      else
        seconds=$duration
      fi
      
      # Executar o comando em segundo plano
      "$@" &
      local pid=$!
      
      # Iniciar timer em segundo plano
      (
        sleep $seconds
        if kill -0 $pid 2>/dev/null; then
          echo "⏰ Timeout atingido! Encerrando processo $pid..."
          kill -9 $pid 2>/dev/null || true
        fi
      ) &
      local timer_pid=$!
      
      # Aguardar o comando terminar
      wait $pid 2>/dev/null
      local exit_code=$?
      
      # Matar o timer se o comando terminou antes
      kill $timer_pid 2>/dev/null || true
      wait $timer_pid 2>/dev/null || true
      
      return $exit_code
    }
  fi
fi

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

# Garantir que a porta 3000 está livre antes de iniciar
echo "🧹 Garantindo que a porta 3000 está livre..."
if lsof -t -i:3000 > /dev/null; then
  echo "⚠️ Porta 3000 ocupada. Encerrando processos..."
  lsof -t -i:3000 | xargs kill -9 || true
  sleep 1
fi

# Iniciar servidor de desenvolvimento para testes standalone
echo "🟢 Iniciando servidor de desenvolvimento para testes standalone..."
NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=true NODE_ENV=test npm run dev:test &
DEV_SERVER_PID=$!

# Aguardar servidor ficar pronto
echo "⏳ Aguardando servidor (http://localhost:3000) ficar pronto..."
if ! timeout 60s bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'; then
  echo "❌ Servidor não ficou pronto em 60s. Encerrando."
  kill $DEV_SERVER_PID || true
  if lsof -t -i:3000 > /dev/null; then
    lsof -t -i:3000 | xargs kill -9 || true
  fi
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
if lsof -t -i:3000 > /dev/null; then
  echo "🧹 Forçando encerramento de processos na porta 3000..."
  lsof -t -i:3000 | xargs kill -9 || true
fi
sleep 2

# Iniciar servidor para suíte principal (também sem webServer do Playwright)
echo "🟢 Iniciando servidor de desenvolvimento para suíte principal..."
# Sempre desabilitar chamadas de API na suíte principal para evitar 404s em dados inexistentes
echo "🔒 Desabilitando chamadas de API para suíte principal (modo fallback para testes estáveis)"
NEXT_PUBLIC_DISABLE_SW=true DISABLE_API_CALLS=true NODE_ENV=test npm run dev:test &
MAIN_SERVER_PID=$!

# Aguardar servidor principal ficar pronto
echo "⏳ Aguardando servidor (http://localhost:3000) ficar pronto..."
if ! timeout 60s bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'; then
  echo "❌ Servidor (principal) não ficou pronto em 60s. Encerrando."
  kill $MAIN_SERVER_PID || true
  if lsof -t -i:3000 > /dev/null; then
    lsof -t -i:3000 | xargs kill -9 || true
  fi
  exit 1
fi

echo "✅ Servidor principal pronto (PID: $MAIN_SERVER_PID)"

# Executar testes principais com timeout geral (sem webServer do Playwright)
echo "🚀 Executando testes principais..."
if timeout $TEST_TIMEOUT bash -c '
    DISABLE_API_CALLS=true NEXT_PUBLIC_DISABLE_SW=true NODE_ENV=test npx playwright test --config=playwright.config.ci-standalone.cjs --project=chromium --grep="^(?!.*Standalone).*"
'; then
    echo "🎉 Todos os testes executaram com sucesso!"
    kill $MAIN_SERVER_PID || true
    if lsof -t -i:3000 > /dev/null; then
      lsof -t -i:3000 | xargs kill -9 || true
    fi
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
        if lsof -t -i:3000 > /dev/null; then
          lsof -t -i:3000 | xargs kill -9 || true
        fi
        exit 1
    else
        echo "❌ Testes falharam com código $exit_code"
        kill $MAIN_SERVER_PID || true
        if lsof -t -i:3000 > /dev/null; then
          lsof -t -i:3000 | xargs kill -9 || true
        fi
        exit $exit_code
    fi
fi
