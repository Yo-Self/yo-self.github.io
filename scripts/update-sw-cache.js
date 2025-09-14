#!/usr/bin/env node

/**
 * Updates the service worker cache version for deployment
 * This script runs cross-platform and works in GitHub Actions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');

try {
  // Read the current service worker file
  let swContent = fs.readFileSync(SW_PATH, 'utf8');
  
  // Generate new cache version based on current timestamp
  const newVersion = Date.now();
  
  // Update the cache version using regex
  const updatedContent = swContent.replace(
    /const CACHE_VERSION = \d+;/,
    `const CACHE_VERSION = ${newVersion};`
  );
  
  // Write the updated content back
  fs.writeFileSync(SW_PATH, updatedContent, 'utf8');
  
  console.log(`✅ Updated service worker cache version to: ${newVersion}`);
  
  // Verify the change was made
  const verifyContent = fs.readFileSync(SW_PATH, 'utf8');
  const versionMatch = verifyContent.match(/const CACHE_VERSION = (\d+);/);
  
  if (versionMatch && versionMatch[1] === newVersion.toString()) {
    console.log(`✅ Verified: Cache version successfully updated`);
  } else {
    console.error('❌ Error: Cache version update verification failed');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error updating service worker cache version:', error.message);
  process.exit(1);
}