#!/usr/bin/env node
/**
 * Captures the README screenshots and the Open Graph image from the production build.
 *
 *   npm run build && npm run screenshots
 *
 * Serves dist/pli-demo/browser locally, logs in as the admin persona and screenshots a
 * handful of pages at 1440×900. The mock latency is disabled through `?latency=0`.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 4311;
const BASE = `http://localhost:${PORT}`;
const OUT = join(process.cwd(), 'docs', 'screenshots');
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start on ${url}`);
}

async function settle(page, ms = 700) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

async function shoot(page, name, options = {}) {
  await page.screenshot({ path: join(OUT, `${name}.png`), ...options });
  console.log(`✔ ${name}.png`);
}

try {
  await waitForServer(`${BASE}/index.html`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // Skip the guided tour and start from a clean demo database.
  await page.addInitScript(() => {
    localStorage.setItem('pli_demo_tour_done', '1');
    localStorage.removeItem('pli_demo_db');
  });

  // 1. Login page
  await page.goto(`${BASE}/auth?latency=0`);
  await settle(page);
  await shoot(page, 'login');

  // 2. Dashboard (via persona button)
  await page.getByRole('button', { name: /Administrateur/ }).click();
  await page.waitForURL(/\/dashboard/);
  await settle(page, 1000);
  await shoot(page, 'dashboard');

  // Open Graph image: dashboard framed at 1200×630
  await page.setViewportSize({ width: 1200, height: 630 });
  await settle(page, 400);
  await page.screenshot({ path: join(process.cwd(), 'public', 'og-image.png') });
  console.log('✔ public/og-image.png');
  await page.setViewportSize(VIEWPORT);

  // 3. Courriers entrants
  await page.goto(`${BASE}/courriers/entrant?latency=0`);
  await settle(page, 1000);
  await shoot(page, 'courriers-entrants');

  // 4. Détail courrier
  await page.goto(`${BASE}/courriers/entrant/5?latency=0`);
  await settle(page, 1000);
  await shoot(page, 'courrier-detail');

  // 5. Recherche avancée
  await page.goto(`${BASE}/courriers/recherche?latency=0`);
  await settle(page, 1000);
  await shoot(page, 'recherche-avancee');

  // 6. Demandes
  await page.goto(`${BASE}/demandes?latency=0`);
  await settle(page, 1000);
  await shoot(page, 'demandes');

  // 7. Maquettes (administration)
  await page.goto(`${BASE}/parametres/maquettes?latency=0`);
  await settle(page, 1000);
  await shoot(page, 'maquettes');

  // 8. À propos drawer
  await page.getByRole('button', { name: 'À propos de cette démo' }).first().click();
  await page.waitForTimeout(600);
  await shoot(page, 'a-propos');

  await browser.close();
} finally {
  server.kill();
}
