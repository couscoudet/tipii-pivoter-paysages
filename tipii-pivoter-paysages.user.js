// ==UserScript==
// @name         Tipii — Pivoter les photos paysages
// @name:en      Tipii — Rotate landscape photos
// @namespace    https://github.com/couscoudet/tipii-pivoter-paysages
// @version      1.0.0
// @description  Ajoute un bouton dans l'éditeur photo Tipii (Pixfizz) pour faire pivoter de 90° toutes les photos au format paysage en un clic.
// @description:en Adds a button to the Tipii (Pixfizz) photo editor to rotate all landscape photos by 90° in one click.
// @author       couscoudet
// @match        https://design.tipii.fr/*
// @run-at       document-idle
// @grant        unsafeWindow
// @license      MIT
// @homepageURL  https://github.com/couscoudet/tipii-pivoter-paysages
// @supportURL   https://github.com/couscoudet/tipii-pivoter-paysages/issues
// ==/UserScript==

/*
 * ---------------------------------------------------------------------------
 * DISCLAIMER — À LIRE
 * ---------------------------------------------------------------------------
 * Cet outil est NON OFFICIEL et n'est ni affilié, ni approuvé, ni sponsorisé par
 * Tipii, Pixfizz ou l'une de leurs sociétés.
 *
 * Il utilise une API JavaScript INTERNE et NON DOCUMENTÉE de l'éditeur Pixfizz
 * (window.editor.store.project...). Elle peut changer ou disparaître à tout
 * moment, à chaque mise à jour de l'éditeur, et casser ce script sans préavis.
 *
 * Aucune donnée ne quitte votre navigateur : le script ne fait que manipuler
 * l'objet du projet déjà chargé dans la page.
 *
 * Fourni "tel quel", sans aucune garantie. Utilisez-le à vos propres risques.
 * "Tipii" et "Pixfizz" sont des marques de leurs propriétaires respectifs et ne
 * sont utilisées ici qu'à titre descriptif (usage nominatif).
 *
 * Licence MIT.
 * ---------------------------------------------------------------------------
 */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------- *
   * Configuration
   * ---------------------------------------------------------------------- */
  const CONFIG = {
    step: 90,        // pas de rotation, en degrés
    autoSave: true,  // enregistre le projet après chaque action
    readyTimeoutMs: 180000, // abandonne l'attente de l'éditeur après 3 min
  };

  // Le userscript tourne dans un bac à sable : `unsafeWindow` donne accès au
  // vrai `window` de la page (celui qui porte `window.editor`).
  const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // On ne s'active que dans l'éditeur Pixfizz, pas sur les autres pages.
  if (!/\/v1\/editor(\b|\/|\?|$)/.test(location.pathname + location.search)) return;

  /* ---------------------------------------------------------------------- *
   * Accès à l'éditeur (API interne)
   * ---------------------------------------------------------------------- */
  function getStore() {
    const ed = pageWindow.editor;
    return (ed && ed.store) || null;
  }

  function getProject() {
    const store = getStore();
    return (store && store.project) || null;
  }

  function isReady() {
    const project = getProject();
    return !!(project && project.loaded);
  }

  // Renvoie les éléments image dont la photo source est au format paysage
  // (plus large que haute). On ignore les cadres vides (el.id absent).
  function getLandscapeImages() {
    const project = getProject();
    if (!project) return [];
    const out = [];
    (project.pages || []).forEach(function (page) {
      (page.image_elements || []).forEach(function (el) {
        const img = el && el.image;
        if (el && el.id && img && img.aspect_ratio > 1) out.push(el);
      });
    });
    return out;
  }

  // Reproduit exactement l'action du bouton « Rotate » de l'éditeur.
  function applyDelta(el, delta) {
    if (el.erotation) {
      el.rotation = (Number(el.rotation) || 0) + delta;
    } else {
      el.crotation = (Number(el.crotation) || 0) + delta;
    }
  }

  function save() {
    if (!CONFIG.autoSave) return;
    try {
      const store = getStore();
      if (store && typeof store.saveProject === 'function') store.saveProject();
    } catch (err) {
      console.warn('[tipii-rotate] échec de la sauvegarde :', err);
    }
  }

  /* ---------------------------------------------------------------------- *
   * Actions
   * ---------------------------------------------------------------------- */
  // WeakMap : élément -> delta appliqué par ce script (pour pouvoir annuler).
  const applied = new WeakMap();
  let direction = 1; // 1 = à droite, -1 = à gauche

  function rotateLandscape() {
    const els = getLandscapeImages();
    let rotated = 0;
    els.forEach(function (el) {
      if (applied.has(el)) return; // déjà pivoté dans cette session
      const delta = direction * CONFIG.step;
      applyDelta(el, delta);
      applied.set(el, delta);
      rotated++;
    });
    save();
    return { total: els.length, rotated: rotated };
  }

  function revert() {
    let reverted = 0;
    getLandscapeImages().forEach(function (el) {
      const delta = applied.get(el);
      if (delta == null) return;
      applyDelta(el, -delta);
      applied.delete(el);
      reverted++;
    });
    save();
    return { reverted: reverted };
  }

  function countLandscape() {
    return getLandscapeImages().length;
  }

  /* ---------------------------------------------------------------------- *
   * Interface (Shadow DOM : aucun conflit avec le CSS de l'éditeur)
   * ---------------------------------------------------------------------- */
  let ui = null;

  function buildUI() {
    const host = document.createElement('div');
    host.id = 'tipii-rotate-host';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = [
      '<style>',
      '  :host { all: initial; }',
      '  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',
      '  .panel { width: 248px; background: #1c1c1e; color: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.4); overflow: hidden; font-size: 13px; }',
      '  .head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #2c2c2e; }',
      '  .head h1 { flex: 1; margin: 0; font-size: 13px; font-weight: 600; }',
      '  .head button { width: 22px; height: 22px; border: 0; border-radius: 6px; background: #3a3a3c; color: #fff; cursor: pointer; font-size: 13px; line-height: 1; }',
      '  .body { display: flex; flex-direction: column; gap: 10px; padding: 12px; }',
      '  .panel.collapsed .body { display: none; }',
      '  .seg { display: flex; border: 1px solid #3a3a3c; border-radius: 8px; overflow: hidden; }',
      '  .seg button { flex: 1; padding: 7px; border: 0; background: transparent; color: #c7c7cc; cursor: pointer; font-size: 12px; }',
      '  .seg button[aria-pressed="true"] { background: #0a84ff; color: #fff; }',
      '  .action { padding: 9px; border: 0; border-radius: 8px; background: #0a84ff; color: #fff; font-weight: 600; cursor: pointer; }',
      '  .action:disabled { opacity: .45; cursor: not-allowed; }',
      '  .ghost { padding: 8px; border: 1px solid #3a3a3c; border-radius: 8px; background: transparent; color: #c7c7cc; cursor: pointer; }',
      '  .ghost:disabled { opacity: .45; cursor: not-allowed; }',
      '  .status { min-height: 15px; font-size: 11px; line-height: 1.4; color: #8e8e93; }',
      '  .status.ok { color: #30d158; }',
      '  .status.err { color: #ff453a; }',
      '  .hint { font-size: 10px; line-height: 1.4; color: #636366; }',
      '</style>',
      '<div class="panel">',
      '  <div class="head">',
      '    <h1>Pivoter les paysages</h1>',
      '    <button class="collapse" type="button" title="Réduire / déplier" aria-label="Réduire">–</button>',
      '  </div>',
      '  <div class="body">',
      '    <div class="seg" role="group" aria-label="Sens de rotation">',
      '      <button type="button" data-dir="1" aria-pressed="true">À droite</button>',
      '      <button type="button" data-dir="-1" aria-pressed="false">À gauche</button>',
      '    </div>',
      '    <button class="action rotate" type="button" disabled>Pivoter les paysages</button>',
      '    <button class="ghost revert" type="button" disabled>Annuler</button>',
      '    <div class="status" role="status" aria-live="polite"></div>',
      '    <div class="hint">Pivote de 90° les photos plus larges que hautes. Fonctionne sur votre projet en cours ; enregistre automatiquement.</div>',
      '  </div>',
      '</div>',
    ].join('\n');

    const $ = (sel) => shadow.querySelector(sel);
    const panel = $('.panel');
    const statusEl = $('.status');
    const rotateBtn = $('.action.rotate');
    const revertBtn = $('.ghost.revert');

    function setStatus(msg, kind) {
      statusEl.textContent = msg || '';
      statusEl.className = 'status' + (kind ? ' ' + kind : '');
    }

    $('.collapse').addEventListener('click', function () {
      panel.classList.toggle('collapsed');
    });

    shadow.querySelectorAll('.seg button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        direction = Number(btn.dataset.dir) || 1;
        shadow.querySelectorAll('.seg button').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
      });
    });

    rotateBtn.addEventListener('click', function () {
      try {
        const res = rotateLandscape();
        if (res.rotated === 0) {
          setStatus(res.total === 0 ? 'Aucune photo paysage détectée.' : 'Déjà pivotées.', '');
        } else {
          setStatus(res.rotated + ' / ' + res.total + ' photo(s) paysage pivotée(s).', 'ok');
        }
        revertBtn.disabled = res.total === 0;
      } catch (err) {
        setStatus('Erreur : ' + err.message, 'err');
        console.error('[tipii-rotate]', err);
      }
    });

    revertBtn.addEventListener('click', function () {
      try {
        const res = revert();
        setStatus(res.reverted + ' rotation(s) annulée(s).', 'ok');
        revertBtn.disabled = true;
      } catch (err) {
        setStatus('Erreur : ' + err.message, 'err');
        console.error('[tipii-rotate]', err);
      }
    });

    return {
      host: host,
      setStatus: setStatus,
      setEnabled: function (enabled) {
        rotateBtn.disabled = !enabled;
      },
    };
  }

  function boot() {
    if (ui) return;
    ui = buildUI();
    document.body.appendChild(ui.host);
    ui.setStatus('Chargement de l’éditeur…');

    // Tant que le projet n'est pas prêt, on sonde.
    const startedAt = Date.now();
    (function poll() {
      if (isReady()) {
        ui.setStatus(countLandscape() + ' photo(s) paysage détectée(s).', '');
        ui.setEnabled(true);
        return;
      }
      if (Date.now() - startedAt > CONFIG.readyTimeoutMs) {
        ui.setStatus('Éditeur introuvable (API modifiée ?).', 'err');
        return;
      }
      setTimeout(poll, 500);
    })();
  }

  /* ---------------------------------------------------------------------- *
   * API de debug (facultatif) : window.__tipiiRotate
   * ---------------------------------------------------------------------- */
  try {
    pageWindow.__tipiiRotate = {
      rotate: rotateLandscape,
      revert: revert,
      count: countLandscape,
      isReady: isReady,
    };
  } catch (e) { /* ignore */ }

  boot();
})();
