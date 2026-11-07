import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'public/document-assets');
mkdirSync(destination, { recursive: true });
for (const asset of ['build/pdf.worker.min.mjs', 'cmaps', 'standard_fonts']) {
  cpSync(resolve(root, 'node_modules/pdfjs-dist', asset), resolve(destination, asset.replace('build/', '')), { recursive: true });
}