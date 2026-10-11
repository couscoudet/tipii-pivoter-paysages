# Tipii — Pivoter les photos paysages

Un **userscript** qui ajoute un bouton dans l'éditeur photo de [Tipii](https://tipii.fr) pour faire **pivoter de 90° toutes les photos au format paysage en un seul clic**.

Quand on commande un gros lot de tirages (par ex. 144 photos), pivoter chaque photo paysage à la main est fastidieux. Ce script le fait pour vous.

![Aperçu](https://placehold.co/248x150/1c1c1e/ffffff?text=Tipii+%E2%80%94+Pivoter+les+paysages)

## ⚠️ Disclaimer

- Outil **non officiel**, **non affilié** à Tipii, Pixfizz ou l'une de leurs sociétés.
- Il utilise une **API JavaScript interne et non documentée** de l'éditeur Pixfizz. Elle peut **changer ou disparaître à tout moment** et casser le script sans préavis.
- **Aucune donnée ne quitte votre navigateur** : le script manipule uniquement le projet déjà chargé dans la page.
- Fourni **« tel quel », sans aucune garantie**. Utilisation à vos propres risques.
- « Tipii » et « Pixfizz » sont des marques de leurs propriétaires respectifs, utilisées ici à titre purement descriptif (usage nominatif).

## Installation

1. Installez [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge) — ou un gestionnaire compatible (Violentmonkey, Greasemonkey).
2. Installez le script :
   - **depuis GitHub** : ouvrez [tipii-pivoter-paysages.user.js](./tipii-pivoter-paysages.user.js) puis cliquez sur *Raw*. Tampermonkey proposera l'installation.
   - **depuis un fichier** : Tampermonkey → *Tableau de bord → Utilitaires → Importer depuis un fichier*.

## Utilisation

1. Ouvrez l'éditeur Tipii (page produit → bouton **Personnaliser**, ou votre lien de projet).
2. Un panneau **« Pivoter les paysages »** apparaît en bas à droite.
3. Choisissez le sens (**À droite** / **À gauche**), puis cliquez sur **Pivoter les paysages**.
4. Le projet est enregistré automatiquement. Le bouton **Annuler** revient à l'état précédent.

> Le script ne s'active que sur `https://design.tipii.fr/*/v1/editor`.

## Développement

Le fichier est du JavaScript pur, sans dépendance ni build. Pour tester : importez le `.user.js` dans Tampermonkey et rechargez l'éditeur.

API de debug exposée dans la page de l'éditeur :

```js
window.__tipiiRotate.rotate();  // pivote les paysages
window.__tipiiRotate.revert();  // annule
window.__tipiiRotate.count();   // nombre de photos paysage
window.__tipiiRotate.isReady(); // l'éditeur est-il prêt ?
```

### Fichiers annexes

- `console-snippet.js` — version à coller dans la console DevTools de l'iframe `design.tipii.fr`.
- `rotate.mjs` — automatisation Playwright (ouvre la page, attend l'éditeur, pivote, sauvegarde).

## Licence

[MIT](./LICENSE)
