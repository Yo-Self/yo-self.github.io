/**
 * Recompress Supabase Storage images (bucket: images) safely.
 *
 * Safety guarantees:
 * - Dry-run by default (no writes). Pass --execute to apply changes.
 * - Never deletes originals or backups.
 * - Copies each file to _backup/{path} before any mutation (skipped if backup exists).
 * - Uploads compressed bytes to _staging/{path} first, verifies, then upserts the live path.
 * - On post-replace verification failure, restores the live file from _backup.
 * - Writes a local disk copy + JSON manifest for audit and rollback.
 *
 * Usage:
 *   node scripts/recompress-storage-images.js                    # dry-run
 *   node scripts/recompress-storage-images.js --execute          # apply
 *   node scripts/recompress-storage-images.js --execute --limit 5
 *   node scripts/recompress-storage-images.js --execute --file  foo.png
 *   node scripts/recompress-storage-images.js --rollback scripts/recompress-manifest-123.json
 *
 * Required env (.env.local):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (legacy JWT) OR SUPABASE_SECRET_KEY (sb_secret_...)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const BUCKET = 'images';
const BACKUP_PREFIX = '_backup';
const STAGING_PREFIX = '_staging';
const LOCAL_BACKUP_DIR = path.join(__dirname, '.recompress-backups');
const CACHE_CONTROL = '3155695200';

const MAX_DIMENSION = 800;
const WEBP_QUALITY = 82;
const SKIP_IF_BYTES_BELOW = 120 * 1024;
const MIN_SAVINGS_RATIO = 0.9;

const SKIP_EXTENSIONS = new Set(['svg', 'gif', 'ico']);

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const dryRun = !execute && !args.includes('--rollback');
const rollbackManifest = args.includes('--rollback')
  ? args[args.indexOf('--rollback') + 1]
  : null;
const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : null;
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

function getAdminApiKey() {
  const key =
    process.env.SB_SECRET_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    console.error('❌ Missing admin API key in .env.local');
    console.error('   Use ONE of:');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY  (Legacy → service_role JWT)');
    console.error('   - SUPABASE_SECRET_KEY        (API Keys → sb_secret_...)');
    console.error('');
    console.error('   Dashboard: Project Settings → API Keys');
    console.error('   https://supabase.com/dashboard/project/wulazaggdihidadkhilg/settings/api-keys');
    process.exit(1);
  }
  return key;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local');
  process.exit(1);
}
const serviceRoleKey = getAdminApiKey();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extOf(fileName) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function backupPath(fileName) {
  return `${BACKUP_PREFIX}/${fileName}`;
}

function stagingPath(fileName) {
  return `${STAGING_PREFIX}/${fileName}`;
}

function isSkippableName(name) {
  if (!name || name === '.emptyFolderPlaceholder') return true;
  if (name.startsWith(`${BACKUP_PREFIX}/`) || name.startsWith(`${STAGING_PREFIX}/`)) return true;
  return SKIP_EXTENSIONS.has(extOf(name));
}

async function listRootImageFiles() {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) throw new Error(`List failed: ${error.message}`);

  return (data || []).filter((entry) => {
    if (!entry?.name) return false;
    if (entry.id === null) return false;
    if (entry.name === BACKUP_PREFIX || entry.name === STAGING_PREFIX) return false;
    if (isSkippableName(entry.name)) return false;
    return true;
  });
}

async function downloadToBuffer(storagePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error) throw new Error(`Download failed (${storagePath}): ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function verifyImageBuffer(buffer, label) {
  if (!buffer || buffer.length === 0) {
    throw new Error(`${label}: empty buffer`);
  }
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`${label}: invalid image metadata`);
  }
  return meta;
}

async function verifyCompressedUpload(originalBuffer, downloadedBuffer, label) {
  await verifyImageBuffer(downloadedBuffer, label);

  if (downloadedBuffer.length >= originalBuffer.length) {
    throw new Error(`${label}: not smaller than original`);
  }

  const meta = await sharp(downloadedBuffer).metadata();
  if ((meta.width || 0) > MAX_DIMENSION + 1 || (meta.height || 0) > MAX_DIMENSION + 1) {
    throw new Error(`${label}: dimensions exceed max`);
  }
}

async function compressBuffer(originalBuffer, fileName) {
  const meta = await sharp(originalBuffer).metadata();

  if (meta.format && SKIP_EXTENSIONS.has(meta.format)) {
    return { skipped: true, reason: `unsupported-format:${meta.format}` };
  }

  if (originalBuffer.length <= SKIP_IF_BYTES_BELOW && (meta.width || 0) <= MAX_DIMENSION && (meta.height || 0) <= MAX_DIMENSION) {
    return { skipped: true, reason: 'already-small-enough' };
  }

  let pipeline = sharp(originalBuffer, { failOn: 'none' }).rotate();

  if ((meta.width || 0) > MAX_DIMENSION || (meta.height || 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const compressedBuffer = await pipeline
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  if (compressedBuffer.length >= originalBuffer.length * MIN_SAVINGS_RATIO) {
    return {
      skipped: true,
      reason: 'compression-not-worthwhile',
      originalBytes: originalBuffer.length,
      compressedBytes: compressedBuffer.length,
    };
  }

  return {
    skipped: false,
    buffer: compressedBuffer,
    contentType: 'image/webp',
    originalBytes: originalBuffer.length,
    compressedBytes: compressedBuffer.length,
  };
}

async function uploadBuffer(storagePath, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    upsert: true,
    contentType,
    cacheControl: CACHE_CONTROL,
  });
  if (error) throw new Error(`Upload failed (${storagePath}): ${error.message}`);
}

async function replaceLiveFile(fileName, buffer, contentType) {
  const { error: updateError } = await supabase.storage.from(BUCKET).update(fileName, buffer, {
    contentType,
    cacheControl: CACHE_CONTROL,
  });

  if (updateError) {
    await uploadBuffer(fileName, buffer, contentType);
  }
}

async function getRemoteFileSize(storagePath) {
  const parts = storagePath.split('/');
  const fileName = parts.pop();
  const folder = parts.join('/');

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 1000,
  });

  if (error) {
    throw new Error(`List meta failed (${storagePath}): ${error.message}`);
  }

  const file = (data || []).find((entry) => entry.name === fileName);
  const size = file?.metadata?.size;

  if (typeof size !== 'number') {
    throw new Error(`Remote metadata missing for ${storagePath}`);
  }

  return size;
}

async function downloadFreshBuffer(storagePath) {
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 120);

  if (signError || !signed?.signedUrl) {
    return downloadToBuffer(storagePath);
  }

  const response = await fetch(`${signed.signedUrl}&cb=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Signed download failed (${storagePath}): ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function backupExists(fileName) {
  const { data, error } = await supabase.storage.from(BUCKET).list(BACKUP_PREFIX, {
    limit: 1000,
  });
  if (error) return false;
  return (data || []).some((f) => f.name === fileName);
}

function writeLocalBackup(fileName, buffer) {
  fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const localPath = path.join(LOCAL_BACKUP_DIR, `${hash}__${fileName}`);
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

async function ensureRemoteBackup(fileName, originalBuffer, manifestEntry) {
  const remoteBackup = backupPath(fileName);

  if (await backupExists(fileName)) {
    manifestEntry.backupStatus = 'already-existed';
    return;
  }

  if (dryRun) {
    manifestEntry.backupStatus = 'would-create';
    return;
  }

  await uploadBuffer(remoteBackup, originalBuffer, contentTypeFromName(fileName));
  const verified = await downloadToBuffer(remoteBackup);
  if (sha256(verified) !== sha256(originalBuffer)) {
    throw new Error(`Backup verification content mismatch for ${fileName}`);
  }
  manifestEntry.backupStatus = 'created';
}

async function restoreFromBackup(fileName) {
  const remoteBackup = backupPath(fileName);
  const backupBuffer = await downloadToBuffer(remoteBackup);
  await uploadBuffer(fileName, backupBuffer, contentTypeFromName(fileName));
  await verifyImageBuffer(await downloadToBuffer(fileName), `restore:${fileName}`);
}

function contentTypeFromName(fileName) {
  const ext = extOf(fileName);
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  return map[ext] || 'application/octet-stream';
}

async function processFile(fileName, manifest) {
  const entry = {
    fileName,
    status: 'pending',
    startedAt: new Date().toISOString(),
  };
  manifest.files.push(entry);

  try {
    console.log(`\n📷 ${fileName}`);

    const originalBuffer = await downloadToBuffer(fileName);
    entry.originalBytes = originalBuffer.length;
    entry.localBackupPath = writeLocalBackup(fileName, originalBuffer);

    const compression = await compressBuffer(originalBuffer, fileName);
    if (compression.skipped) {
      entry.status = 'skipped';
      entry.reason = compression.reason;
      if (compression.compressedBytes) {
        entry.compressedBytes = compression.compressedBytes;
      }
      console.log(`   ⏭️  Skipped (${compression.reason})`);
      return;
    }

    entry.compressedBytes = compression.compressedBytes;
    entry.savingsPercent = Number(
      ((1 - compression.compressedBytes / compression.originalBytes) * 100).toFixed(1)
    );
    console.log(
      `   📉 ${(compression.originalBytes / 1024).toFixed(0)} KB → ${(compression.compressedBytes / 1024).toFixed(0)} KB (${entry.savingsPercent}% saved)`
    );

    await ensureRemoteBackup(fileName, originalBuffer, entry);

    if (dryRun) {
      entry.status = 'dry-run';
      console.log('   🔍 Dry-run: no remote changes applied');
      return;
    }

    const staged = stagingPath(fileName);
    await uploadBuffer(staged, compression.buffer, compression.contentType);
    const stagedBuffer = await downloadToBuffer(staged);
    await verifyCompressedUpload(originalBuffer, stagedBuffer, `staging:${fileName}`);
    const stagedHash = sha256(stagedBuffer);
    entry.stagingVerified = true;

    await replaceLiveFile(fileName, compression.buffer, compression.contentType);
    await sleep(600);

    const remoteSize = await getRemoteFileSize(fileName);
    if (remoteSize >= originalBuffer.length) {
      throw new Error(`Live metadata size still original for ${fileName}`);
    }

    const liveBuffer = await downloadFreshBuffer(fileName);
    await verifyCompressedUpload(originalBuffer, liveBuffer, `live:${fileName}`);

    if (sha256(liveBuffer) !== stagedHash) {
      throw new Error(`Live/staging content mismatch for ${fileName}`);
    }

    entry.liveBytes = liveBuffer.length;
    entry.remoteBytes = remoteSize;

    entry.status = 'replaced';
    entry.contentType = compression.contentType;
    console.log('   ✅ Replaced safely (backup kept at _backup/)');
  } catch (err) {
    entry.status = 'error';
    entry.error = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Error: ${entry.error}`);

    if (execute) {
      try {
        if (await backupExists(fileName)) {
          await restoreFromBackup(fileName);
          entry.status = 'error-restored';
          console.log('   ♻️  Restored live file from _backup/');
        }
      } catch (restoreErr) {
        entry.restoreError =
          restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
        console.error(`   🚨 Restore failed: ${entry.restoreError}`);
        console.error(`   🚨 Local backup: ${entry.localBackupPath}`);
      }
    }
  }
}

async function runRollback(manifestPath) {
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    console.error('❌ Manifest not found for rollback');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const replaced = (manifest.files || []).filter((f) => f.status === 'replaced');

  console.log(`♻️  Rolling back ${replaced.length} files from manifest...`);

  for (const entry of replaced) {
    try {
      await restoreFromBackup(entry.fileName);
      console.log(`   ✅ Restored ${entry.fileName}`);
      await sleep(150);
    } catch (err) {
      console.error(
        `   ❌ Failed ${entry.fileName}: ${err instanceof Error ? err.message : err}`
      );
      if (entry.localBackupPath && fs.existsSync(entry.localBackupPath)) {
        console.error(`      Local backup available: ${entry.localBackupPath}`);
      }
    }
  }
}

async function main() {
  if (rollbackManifest) {
    await runRollback(path.isAbsolute(rollbackManifest) ? rollbackManifest : path.join(projectRoot, rollbackManifest));
    return;
  }

  console.log('🖼️  Supabase Storage image recompression');
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   Mode: ${dryRun ? 'DRY-RUN (pass --execute to apply)' : 'EXECUTE'}`);

  let files = await listRootImageFiles();
  if (fileArg) {
    files = files.filter((f) => f.name === fileArg);
    if (files.length === 0) {
      console.error(`❌ File not found in bucket root: ${fileArg}`);
      process.exit(1);
    }
  }
  if (limitArg && Number.isFinite(limitArg)) {
    files = files.slice(0, limitArg);
  }

  console.log(`   Files to process: ${files.length}`);

  const manifest = {
    createdAt: new Date().toISOString(),
    bucket: BUCKET,
    dryRun,
    supabaseUrl,
    files: [],
  };

  for (const file of files) {
    await processFile(file.name, manifest);
    await sleep(120);
  }

  const manifestPath = path.join(
    __dirname,
    `recompress-manifest-${Date.now()}.json`
  );
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const summary = manifest.files.reduce(
    (acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    },
    {}
  );

  console.log('\n📊 Summary:', summary);
  console.log(`📝 Manifest: ${manifestPath}`);

  if (dryRun) {
    console.log('\nℹ️  No remote files were modified. Re-run with --execute to apply.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
