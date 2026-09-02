import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
const client = resolve(output, 'client');
const server = resolve(output, 'server');

const files = [
  'admin.css',
  'admin.html',
  'admin.js',
  'config.js',
  'index.html',
  'manifest.webmanifest',
  'minstrels.css',
  'minstrels.html',
  'minstrels.js',
  'site.js',
  'styles.css',
  'sw.js',
  'travail-program.css',
  'travail-program.js'
];

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && (url.pathname === '/travailProgram' || url.pathname === '/travailProgram/')) {
      const programUrl = new URL('/travailProgram/index.html', request.url);
      return env.ASSETS.fetch(new Request(programUrl, request));
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const fallbackUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  }
};
`;

await rm(output, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });

await Promise.all(files.map((file) => cp(resolve(root, file), resolve(client, file))));
await cp(resolve(root, 'Assets'), resolve(client, 'Assets'), { recursive: true });
await cp(resolve(root, 'travailProgram'), resolve(client, 'travailProgram'), { recursive: true });
await writeFile(resolve(server, 'index.js'), worker, 'utf8');

console.log('Built static site into dist/client with the Travail program route.');
