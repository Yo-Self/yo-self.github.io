#!/usr/bin/env node

/**
 * Verifies apple-app-site-association is present in the static export output.
 * Runs after `next build` (output: export → ./out).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aasaPath = path.join(__dirname, '..', 'out', '.well-known', 'apple-app-site-association');
const noJekyllPath = path.join(__dirname, '..', 'out', '.nojekyll');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(aasaPath)) {
  fail(`Missing ${aasaPath}. Ensure the file exists at public/.well-known/apple-app-site-association`);
}

const raw = fs.readFileSync(aasaPath, 'utf8');
let parsed;

try {
  parsed = JSON.parse(raw);
} catch {
  fail('apple-app-site-association is not valid JSON');
}

if (!parsed.applinks?.details?.length) {
  fail('apple-app-site-association is missing applinks.details');
}

if (!parsed.appclips?.apps?.length) {
  fail('apple-app-site-association is missing appclips.apps');
}

const paths = parsed.applinks.details[0]?.paths ?? [];
const requiredPaths = ['/restaurant/*', '/delivery/*'];
for (const required of requiredPaths) {
  if (!paths.includes(required)) {
    fail(`apple-app-site-association paths missing "${required}"`);
  }
}

if (!fs.existsSync(noJekyllPath)) {
  fail(`Missing ${noJekyllPath}. public/.nojekyll should be copied into out/`);
}

console.log('✅ apple-app-site-association verified in out/.well-known/');
console.log(`   applinks paths: ${paths.join(', ')}`);
console.log(`   appclips apps: ${parsed.appclips.apps.join(', ')}`);
