#!/usr/bin/env node
/**
 * Post-processing for the GitHub Pages mirror (https://modern-business-app-angular.github.io/pli-demo/).
 *
 *  - copies index.html → 404.html so deep links survive a refresh (GitHub Pages has no SPA rewrite)
 *  - writes .nojekyll so files starting with "_" (e.g. _headers) are published untouched
 *  - rewrites the canonical / Open Graph URLs from the Cloudflare origin to the GitHub Pages origin,
 *    so link previews (LinkedIn, etc.) fetch the image from the same host
 *
 * Run automatically by `npm run build:gh-pages`.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'pli-demo', 'browser');
const FROM_ORIGIN = 'https://pli-demo.pages.dev';
const TO_ORIGIN = process.env.GH_PAGES_ORIGIN ?? 'https://modern-business-app-angular.github.io/pli-demo';

const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const before = html;
html = html.split(`${FROM_ORIGIN}/`).join(`${TO_ORIGIN}/`).split(FROM_ORIGIN).join(TO_ORIGIN);
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(DIST, '404.html'));
writeFileSync(join(DIST, '.nojekyll'), '');

console.log(`✔ index.html: ${before === html ? 'no' : 'canonical/OG'} URL rewrite → ${TO_ORIGIN}`);
console.log('✔ 404.html (SPA fallback) and .nojekyll written');
