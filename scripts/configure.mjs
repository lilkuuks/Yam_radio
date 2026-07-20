import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required in .env');
}

const browserConfig = `/* Generated from .env. Browser-public values only. */
window.YAM_CONFIG = Object.freeze({
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabasePublishableKey: ${JSON.stringify(supabasePublishableKey)},
  smsFunctionName: 'send-sms'
});
`;

await writeFile(resolve(root, 'config.js'), browserConfig, 'utf8');
console.log('Generated config.js from public Supabase values.');
