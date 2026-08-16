import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const envText = await readFile(resolve(root, '.env'), 'utf8');
const values = Object.fromEntries(
  envText.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    })
);

const supabaseUrl = values.SUPABASE_URL;
const supabasePublishableKey = values.SUPABASE_PUBLISHABLE_KEY;
const adminUsername = values.ADMIN_USERNAME;
const adminPassword = values.ADMIN_PASSWORD;
const hasSupabase = Boolean(supabaseUrl && supabasePublishableKey);
const hasLocalAdmin = Boolean(adminUsername && adminPassword);

if (!hasSupabase && !hasLocalAdmin) {
  throw new Error('Add either Supabase credentials or ADMIN_USERNAME and ADMIN_PASSWORD to .env');
}
if (Boolean(supabaseUrl) !== Boolean(supabasePublishableKey)) {
  throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be provided together');
}
if (Boolean(adminUsername) !== Boolean(adminPassword)) {
  throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be provided together');
}

const passwordIterations = 310000;
const passwordSalt = hasLocalAdmin ? randomBytes(16).toString('hex') : '';
const passwordHash = hasLocalAdmin
  ? pbkdf2Sync(adminPassword, Buffer.from(passwordSalt, 'hex'), passwordIterations, 32, 'sha256').toString('hex')
  : '';

const browserConfig = `/* Generated from .env. Browser-public values only. */
window.YAM_CONFIG = Object.freeze({
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabasePublishableKey: ${JSON.stringify(supabasePublishableKey)},
  adminUsername: ${JSON.stringify(adminUsername || '')},
  adminPasswordSalt: ${JSON.stringify(passwordSalt)},
  adminPasswordHash: ${JSON.stringify(passwordHash)},
  adminPasswordIterations: ${passwordIterations},
  smsFunctionName: 'send-sms'
});
`;

await writeFile(resolve(root, 'config.js'), browserConfig, 'utf8');
console.log('Generated config.js with browser-safe connection and admin values.');
