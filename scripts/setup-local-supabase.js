import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    return execSync(command, { cwd: projectRoot, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
  } catch (error) {
    // Se o comando falhar, retornamos o stdout/stderr capturado se houver
    return error.stdout || '';
  }
}

async function setup() {
  console.log('🚀 Starting Local Supabase Setup...');

  // 1. Verificar se o Docker está rodando
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Error: Docker is not running. Please start Docker Desktop and try again.');
    process.exit(1);
  }

  // 2. Iniciar o Supabase local
  console.log('📦 Starting local Supabase containers (this may take a minute on first run)...');
  const startOutput = runCommand('npx supabase start');
  
  if (startOutput.includes('is already running')) {
    console.log('ℹ️ Local Supabase is already running.');
  }

  // 3. Obter status para ler as chaves locais
  console.log('🔍 Retrieving local credentials in JSON format...');
  const statusOutput = runCommand('npx supabase status -o json');

  if (!statusOutput) {
    console.error('❌ Error: Could not get Supabase status. Make sure the CLI started successfully.');
    process.exit(1);
  }

  let credentials;
  try {
    // npx supabase status -o json might have leading/trailing logs, so let's find the JSON boundary
    const jsonStart = statusOutput.indexOf('{');
    const jsonEnd = statusOutput.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Could not find JSON object in status output');
    }
    const jsonString = statusOutput.slice(jsonStart, jsonEnd + 1);
    credentials = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('❌ Error: Failed to parse supabase status JSON output:', parseError);
    console.log('Status Output was:\n', statusOutput);
    process.exit(1);
  }

  const supabaseUrl = credentials.API_URL;
  let anonKey = credentials.ANON_KEY;

  // If the local ANON_KEY is not in HS256 format (starts with eyJhbGciOiJIUzI1Ni),
  // we re-sign it locally using the local JWT_SECRET so that PostgREST accepts it.
  if (anonKey && !anonKey.startsWith('eyJhbGciOiJIUzI1Ni')) {
    console.log('🔄 Local anon key is not in HS256 format. Re-signing locally using JWT_SECRET...');
    const jwtSecret = credentials.JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
    
    const base64url = (str) => Buffer.from(str).toString('base64url');
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({ role: 'anon', iss: 'supabase', exp: 2096026924 }));
    const signature = crypto.createHmac('sha256', jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    anonKey = `${header}.${payload}.${signature}`;
  }

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Error: Missing API_URL or ANON_KEY in parsed credentials.');
    console.log('Credentials object:', credentials);
    process.exit(1);
  }

  console.log(`✅ Supabase Local URL: ${supabaseUrl}`);
  console.log('✅ Supabase Local Anon Key retrieved.');

  // 4. Criar/Atualizar o arquivo .env.development
  const envPath = path.join(projectRoot, '.env.development');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Atualizar ou inserir NEXT_PUBLIC_SUPABASE_URL
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`;
  }

  // Atualizar ou inserir NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`;
  }

  // Configurar modo de imagem padrão se não estiver presente
  if (!envContent.includes('NEXT_PUBLIC_DEV_IMAGE_MODE=')) {
    envContent += '\n# Image mode: unsplash-fallback | local-storage | production\nNEXT_PUBLIC_DEV_IMAGE_MODE=unsplash-fallback';
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log('📝 .env.development updated successfully!');

  console.log('\n🎉 Local Supabase setup complete!');
  console.log('👉 You can now run the app locally with: npm run dev');
  console.log('ℹ️ Local Supabase Studio is available at: http://127.0.0.1:54323');
}

setup().catch(error => {
  console.error('❌ Setup failed with error:', error);
});
