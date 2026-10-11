// Pivote de 90° les photos "paysage" (image.aspect_ratio > 1) dans l'éditeur Pixfizz de Tipii.
//
// Install :
//   cd ~/tipii-rotate
//   npm init -y
//   npm i playwright
//   npx playwright install chromium
//
// Run :
//   node rotate.mjs
//   node rotate.mjs "https://tipii.fr/products/....?variant=...&project-designer=..."
//
// Ce script reproduit exactement l'action du bouton "Rotate" (tourner l'image à droite)
// de l'éditeur : el.erotation ? el.rotation += 90 : el.crotation += 90

import { chromium } from 'playwright';

const DEFAULT_URL =
  'https://tipii.fr/products/tirage-standard-classique?variant=54198508618057&project-designer=eyJwcm9qZWN0X2lkIjo1NzcyNDY0NywicGFyYW1ldGVycyI6eyJxdWFudGl0eSI6IjEiLCJvcHRpb25fYWRkb25zIjoie30ifSwib3B0aW9ucyI6eyJkZXNpZ25fdG9vbCI6dHJ1ZX19';

const URL = process.argv[2] || DEFAULT_URL;

// Sens du pivot : 90 = tourner à droite, -90 = tourner à gauche.
const STEP = 90;

// Fonction exécutée DANS la page de l'éditeur (design.tipii.fr).
function rotateLandscapePhotos(step) {
  const ed = window.editor;
  const project = ed && ed.store && ed.store.project;
  if (!project) return { ok: false, reason: 'editor/project introuvable' };
  if (!project.loaded) return { ok: false, reason: 'projet pas encore chargé' };

  const pages = project.pages || [];
  let total = 0;
  let rotated = 0;

  pages.forEach((page) => {
    (page.image_elements || []).forEach((el) => {
      total++;
      const img = el.image;
      // "paysage" = image source plus large que haute (aspect_ratio > 1).
      const isLandscape = img && img.aspect_ratio > 1;
      if (!isLandscape) return;

      if (el.erotation) el.rotation = (el.rotation || 0) + step;
      else el.crotation = (el.crotation || 0) + step;
      rotated++;
    });
  });

  return { ok: true, pages: pages.length, total, rotated };
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  console.log('Ouverture de la page produit...');
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // 1. Attendre l'iframe de l'éditeur Pixfizz (design.tipii.fr/v1/editor).
  console.log("Recherche de l'iframe de l'éditeur...");
  let frame = null;
  for (let i = 0; i < 60; i++) {
    frame = page.frames().find((f) => f.url().includes('design.tipii.fr/v1/editor'));
    if (frame) break;
    await page.waitForTimeout(1000);
  }
  if (!frame) throw new Error("iframe de l'éditeur introuvable (l'éditeur ne s'est pas ouvert ?)");

  // 2. Attendre que l'éditeur et le projet soient chargés.
  console.log('Attente du chargement du projet...');
  await frame.waitForFunction(
    () => window.editor && window.editor.store && window.editor.store.project && window.editor.store.project.loaded,
    undefined,
    { timeout: 180000 }
  );
  await page.waitForTimeout(3000); // laisser le rendu des pages se terminer

  // 3. Pivoter les photos paysage.
  const result = await frame.evaluate(rotateLandscapePhotos, STEP);
  console.log('Résultat :', result);
  if (!result.ok) throw new Error(result.reason);

  // 4. Sauvegarder le projet.
  console.log('Sauvegarde...');
  await frame.evaluate(async () => {
    await window.editor.store.saveProject();
  });
  console.log('Sauvegardé.');

  await page.waitForTimeout(2000);
} catch (err) {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
