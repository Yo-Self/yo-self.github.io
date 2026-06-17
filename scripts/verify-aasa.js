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

const assetlinksPath = path.join(__dirname, '..', 'out', '.well-known', 'assetlinks.json');

if (!fs.existsSync(assetlinksPath)) {
  fail(`Missing ${assetlinksPath}. Ensure the file exists at public/.well-known/assetlinks.json`);
}

const assetlinksRaw = fs.readFileSync(assetlinksPath, 'utf8');
let assetlinks;

try {
  assetlinks = JSON.parse(assetlinksRaw);
} catch {
  fail('assetlinks.json is not valid JSON');
}

const target = assetlinks[0]?.target;
if (target?.package_name !== 'com.yoself.app') {
  fail('assetlinks.json must target package com.yoself.app');
}

if (!target?.sha256_cert_fingerprints?.length) {
  fail('assetlinks.json is missing sha256_cert_fingerprints');
}

console.log('✅ assetlinks.json verified in out/.well-known/');
console.log(`   package: ${target.package_name}`);
console.log(`   fingerprints: ${target.sha256_cert_fingerprints.length}`);
