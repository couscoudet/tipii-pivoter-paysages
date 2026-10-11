// À exécuter DANS LA CONSOLE DE L'ÉDITEUR PIXFIZZ (pas la page tipii.fr).
//
// Comment faire :
//   1. Ouvrir l'éditeur (la page produit avec le paramètre project-designer s'ouvre toute seule).
//   2. Ouvrir les DevTools (F12) > onglet "Console".
//   3. En haut de la Console, changer le contexte ("top" par défaut) et choisir
//      "design.tipii.fr" (l'iframe de l'éditeur).
//   4. Coller ce code et Entrée.
//
// Pivote de 90° chaque photo "paysage" (image plus large que haute).

(() => {
  const STEP = 90; // 90 = à droite, -90 = à gauche

  const ed = window.editor;
  const project = ed && ed.store && ed.store.project;
  if (!project) return console.error('Projet introuvable. L\'éditeur est-il bien chargé ?');
  if (!project.loaded) return console.warn('Projet pas encore chargé, réessaie dans un instant.');

  let total = 0, rotated = 0;
  (project.pages || []).forEach((page) => {
    (page.image_elements || []).forEach((el) => {
      total++;
      const img = el.image;
      if (!img || !(img.aspect_ratio > 1)) return; // garder seulement les paysages
      if (el.erotation) el.rotation = (el.rotation || 0) + STEP;
      else el.crotation = (el.crotation || 0) + STEP;
      rotated++;
    });
  });

  ed.store.saveProject();
  console.log(`Photos: ${total} — paysages pivotés: ${rotated}. Sauvegarde lancée.`);
  return { total, rotated };
})();
