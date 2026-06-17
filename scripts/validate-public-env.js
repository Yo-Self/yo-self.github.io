import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const sensitivePublicPattern =
  /(SECRET|SERVICE_ROLE|AUTH_TOKEN|PRIVATE|WEBHOOK_SECRET|STRIPE_SECRET_KEY|GOOGLE_AI_API_KEY)/i;
const frontendRuntimeForbidden = [
  'GOOGLE_AI_API_KEY',
  'POSTHOG_API_KEY',
  'SENTRY_AUTH_TOKEN',
  'STRIPE_SECRET_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SB_SECRET_KEY',
  'TELEGRAM_BOT_TOKEN',
];
const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.cursor',
  'node_modules',
  'out',
]);
const scanExtensions = new Set([
  '.cjs',
  '.js',
  '.jsx',
  '.json',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

const failures = [];

function fail(message) {
  failures.push(message);
}

function isProductionBuild() {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.CI === 'true'
  );
}

function validateEnvironmentNames() {
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('NEXT_PUBLIC_') && sensitivePublicPattern.test(name)) {
      fail(`Public environment variable "${name}" looks sensitive.`);
    }
  }

  for (const name of frontendRuntimeForbidden) {
    if (process.env[name]) {
      fail(`Server-only secret "${name}" is present during the static frontend build.`);
    }
  }
}

function validateHttps() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !isProductionBuild()) {
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.');
    return;
  }

  if (parsed.protocol !== 'https:') {
    fail('NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production builds.');
  }
}

function walkFiles(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }

    const ext = entry.includes('.') ? entry.slice(entry.lastIndexOf('.')) : '';
    if (scanExtensions.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function validateSource() {
  const root = process.cwd();
  for (const file of walkFiles(root)) {
    const rel = relative(root, file);
    if (rel === 'scripts/validate-public-env.js') {
      continue;
    }

    const content = readFileSync(file, 'utf8');

    if (/role"?\s*:\s*"?service_role/i.test(content) || /"role":"service_role"/i.test(content)) {
      fail(`Hardcoded service_role token payload found in ${rel}.`);
    }

    const authSensitivePath = /(auth|supabase\/client)/i.test(rel);
    const tokenLocalStorageLine = content
      .split('\n')
      .some(
        (line) =>
          /localStorage/.test(line) &&
          /(access_token|refresh_token|jwt|auth-token|sb-)/i.test(line),
      );

    if (
      /localStorage/.test(content) &&
      (authSensitivePath || tokenLocalStorageLine)
    ) {
      fail(`localStorage appears in an auth/token-sensitive context: ${rel}.`);
    }
  }
}

validateEnvironmentNames();
validateHttps();
validateSource();

if (failures.length > 0) {
  console.error('[security-env] failed:');
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('[security-env] passed');
