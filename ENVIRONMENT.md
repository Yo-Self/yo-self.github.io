# Configuração de Ambiente

Este projeto usa variáveis de ambiente para configurar a conexão com o Supabase de forma segura.

## Arquivos de Ambiente

### `.env` (Secreto - Não versionado)
Contém as credenciais reais do Supabase:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### `.env.local` (Desenvolvimento Local)
Contém apenas comentários explicativos. As credenciais reais devem estar no arquivo `.env`.

## Segurança

- ✅ O arquivo `.env` está no `.gitignore` e não será versionado
- ✅ Credenciais hardcoded foram removidas do código
- ✅ Validação de variáveis de ambiente implementada
- ✅ Fallback para variáveis `NEXT_PUBLIC_*` para compatibilidade

## Configuração

1. **Crie o arquivo `.env`** na raiz do projeto
2. **Adicione suas credenciais do Supabase**:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```
3. **Para produção**, configure as variáveis de ambiente no seu provedor de hospedagem

## Validação

O código verifica se as variáveis estão definidas e lança um erro claro se estiverem faltando:

```typescript
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables');
}
```

## Compatibilidade

O sistema suporta tanto as variáveis `SUPABASE_*` (recomendadas) quanto `NEXT_PUBLIC_SUPABASE_*` (para compatibilidade com código existente).
