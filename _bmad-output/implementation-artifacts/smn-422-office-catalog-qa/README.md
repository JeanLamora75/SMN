# SMN-422 — Documentation, recette et bilan qualité final des styles graphiques Office

**Date :** 8 novembre 2026 · **BMAD :** Amelia (implémentation), Sally (UX à vérifier), TEA (recette à vérifier), Winston (architecture à vérifier).  
**Story :** [SMN-422](https://lmn24.atlassian.net/browse/SMN-422) · **État actuel : En cours, non validé en recette réelle.**

**Attention : la recette Windows/Office n'a pas été exécutée dans cette session. Elle reste non exécutée jusqu'à présentation des preuves réelles.**

## 1. Livré et vérifiable

- Documentation interactive **Rapports → Tags** enrichie dans **FR/EN** : six types, références au catalogue global M1, à l'éditeur M2, au sélecteur d'export M3, syntaxe facultative `STYLE=identifiant`, exemples copiables, ordre de priorité et limites.
- Contrats réels de SMN-416 à SMN-421 : trois prédéfinis **Cockpit Agile, Corporate, Minimal** ; styles personnalisés versionnés v1 ; un défaut pour chaque type ; six familles de graphiques ; export d'images PNG dans DOCX/PPTX.
- Le tag `{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6|STYLE=corporate}}` applique Corporate à ce graphique ; `{{CHART:TREND|TYPE=bar|STYLE=legacy}}` force le moteur historique. Un tag `STYLE` valide est prioritaire sur le sélecteur facultatif du rapport.
- Aucune modification des valeurs des indicateurs v33, des archives existantes ou des modèles Office stockés n'est demandée par SMN-422.
- Contrôles contractuels `tests/smn-422-office-catalog-qa.test.ts` et workflow CI SMN-422, en complément des suites SMN-415 à SMN-421.

### État de la documentation

Documentation d'utilisation : `src/app/app/reports/office-tags.tsx` (affichée dans **Rapports → Tags**). Les réglages présents dans l'éditeur M2 sont ceux du contrat `src/server/reports/chart-style-contract.ts`, sans options fictives : fond, texte, typographie, titres, palette, légendes, labels/arrondi de précision, espacements ; barres (orientation, groupement, empilement, écart et arrondi), lignes (trait, marqueurs, lissage), aires (opacité et empilement), secteurs (séparation et %), anneaux (rayon intérieur et valeur centrale), jauges (bornes, épaisseur et seuils). Le rendu Office demeure une **image PNG**, pas un graphique natif éditable dans Word/PowerPoint.

**Règles d'usage :** un catalogue présent applique ses défauts par type. La sélection M3 est temporaire et n'écrit pas en base. Un `STYLE` dans le tag prévaut sur M3 ; une référence explicite manquante ou invalide entraîne une erreur plutôt qu'une substitution silencieuse. La demande `STYLE=legacy` conserve l'ancien moteur. Sans tables du catalogue, les exports historiques restent disponibles (hors sélection explicite indisponible).

## 2. Matrice de recette M1 / M2 / M3, à exécuter sur Windows 11

Chaque ligne doit recevoir un identifiant de preuve (capture, journal ou document), statut **OK / KO / Bloqué / Non exécuté**, responsable et date. La validation visuelle doit être faite sous MS Office réel.

| ID | Écran ou service | Scénario | Attendu | Résultat |
| --- | --- | --- | --- | --- |
| UX-01 | M1 Galerie | Ouvrir Paramètres → Rapports → Styles graphiques ; recherche, origine, type, écran 1440/768/390 px | Trois prédéfinis, cartes lisibles 3/2/1 colonnes, filtres corrects | Non exécuté |
| UX-02 | M1 Galerie | Dupliquer Corporate, renommer, conserver source | Nouveau style distinct, copie non liée | Non exécuté |
| UX-03 | M1 Galerie | Supprimer style prédéfini ou style en défaut | Opération interdite, erreur lisible | Non exécuté |
| UX-04 | M1 Galerie | Changer les six défauts et recharger | Six choix globaux persistés indépendamment | Non exécuté |
| UX-05 | M2 Éditeur | Ouvrir style personnel, tester accordéons / défilement / mobile | Sections pliables, aperçu visible, aucune perte de champ | Non exécuté |
| UX-06 | M2 Éditeur | Modifier palette puis vérifier réseau avant clic | Brouillon marqué non enregistré ; **aucun POST /preview** | Non exécuté |
| UX-07 | M2 Éditeur | Cliquer Actualiser l'aperçu | Un POST, graphique en français ou anglais, données fictives, brouillon inchangé | Non exécuté |
| UX-08 | M2 Éditeur | Déclencher validation invalide et perte réseau | Erreur intelligible, aucun brouillon perdu | Non exécuté |
| UX-09 | M2 Éditeur | Deux onglets A/B : A sauvegarde puis B sauvegarde sur ancienne révision | Conflit détecté ; B peut recharger sans effacement automatique | Non exécuté |
| UX-10 | M2 Éditeur | Tester Escape, Tab, focus et contraste actif/erreur sur fonds clair/sombre | Parcours clavier, focus visible et contraste satisfaisants | Non exécuté |
| UX-11 | M3 Modèles | Ouvrir DOCX et PPTX, style vide, téléchargement | « Styles par défaut » initial, aucun champ obligatoire de plus | Non exécuté |
| UX-12 | M3 Modèles | Rapport à 3 graphiques, style Corporate, un tag STYLE=minimal | 2 graphiques Corporate ; 1 Minimal | Non exécuté |
| UX-13 | M3 Modèles | Vérifier → confirmer écrasement → enregistrer, style supprimé entre étapes | Erreur avant écrasement, archive antérieure intacte | Non exécuté |
| UX-14 | Permissions | Non-admin, accès hors équipe, tentative POST directe | Opérations interdites suivant les droits applicables | Non exécuté |
| UX-15 | Internationalisation | Parcours complet FR et EN, dates, décimales et messages erreur | Tous les libellés, avertissements et valeurs cohérents | Non exécuté |
| UX-16 | Modèles historiques | Rapport sans STYLE, puis STYLE=legacy, avec catalogue installé / absent | Compatibilité préservée, pas de modification des tags historiques | Non exécuté |

**Attention :** la majorité des actions de génération Office sont administrateur uniquement selon la politique actuelle SMN ; un utilisateur non administrateur ne doit pas obtenir une génération simplement parce que le catalogue est lisible. Vérifier les droits dans le contexte réel.

## 3. Recette Microsoft Office — matrice d'images et de documents

### Scénarios documentaires

Les validations doivent être réalisées dans **Microsoft Word** et **Microsoft PowerPoint** sur Windows 11, pas seulement avec des tests de structure OOXML.

- **DOCX réels :** 1/3/6 graphiques, Word Windows 11, titres accentués, zones de tableaux, en-têtes, images/drapeaux, logos, alignements, pages multiples ; vérifier l'ouverture sans réparation de document et la qualité à 100 %.
- **PPTX réels :** 1/3/6 graphiques dans des diapositives réelles ; ratios **horizontal, carré, vertical** ; graphique non tronqué, bonne typographie FR/EN, aucune collision ou modification de formes voisines ; vérifier mode diaporama et, si disponible, export PDF par PowerPoint.
- **Types :** `bar, line, area, pie, donut, gauge` ; styles Cockpit Agile, Corporate, Minimal et un personnalisé. Vérifier unités, labels, légendes, états N/D, zéros, valeurs négatives autorisées, longueurs des noms de sprints.
- **Données et sécurité :** 1/6/24 cycles et 1/2/6 séries lorsque la famille le permet. Jauge : une série en pourcentage avec bornes compatibles. Secteurs : valeurs négatives refusées. Tester un tag introuvable, un STYLE supprimé et une équipe non autorisée : aucune archive écrasée.
- **Archives :** comparer avant/après les empreintes SHA256 des rapports archivés existants et des modèles source ; toute différence non demandée est une anomalie.

**Statut documentaire et visuel : Manuel — non validé.** Les fichiers ZIP/OpenXML synthétiques fournis par les suites ne valent pas une ouverture Office réelle. Les captures, noms de fichiers et journaux de cette recette restent à produire.

## 4. Baseline performance et comparaison SMN-415 → SMN-418/421

La baseline a été **exécutée par l'utilisateur sur Windows** et a déclaré **48 images, 36 scénarios de stress et 6 packages**. Les tests de SMN-415 avaient **4 succès et 1 échec d'assertion smoke**, corrigé ensuite dans le test mais non rejoué ici sur la machine de l'utilisateur. Ne pas présenter cette sortie comme une mesure post-refonte.

À partir de la baseline historique `$env:TEMP\smn-415-before`, mesurer de nouveau sur **la même machine, le même Node, la même puissance disponible, le même nombre de répétitions (3), la même locale et les mêmes jeux de données** :

```powershell
pnpm exec tsx scripts/poc/smn-418-compare-baseline.ts --before "$env:TEMP\smn-415-before" --out "$env:TEMP\smn-418-after" --repeats 3 --style cockpit-agile
```

Résultat attendu : `smn-418-after/comparison.json` et `smn-418-after/images` (48 PNG). Conserver également `baseline.json` **inchangé** dans le répertoire avant.

Pour mesurer le **CPU par scénario**, les durées et le RSS sur les deux moteurs dans **le même processus Node**, rejouer les cas SMN-422 sur Windows 11 :

```powershell
pnpm exec tsx scripts/poc/smn-422-performance-replay.ts --out "$env:TEMP\smn-422-replay" --repeats 3 --style cockpit-agile
```

Le fichier `replay.json` contient **48 scénarios de matrice et 36 scénarios de stress**, chacun mesuré avant/après (temps médian, CPU utilisateur+système en ms, RSS échantillonné). Le mode `--smoke` ne mesure que 4 cas de matrice et 2 stress ; il ne constitue pas une recette de performance. L'outil ne modifie pas la baseline d'origine, n'ouvre pas Word/PowerPoint et ne garantit pas la mesure de pics mémoire. Le seuil de 10 % sert à signaler les anomalies.


`comparison.json` permet de mesurer dimensions, empreintes et temps médians. Il inclut des échantillons RSS observés à certains instants, **pas une mémoire pic validée**. La baseline SMN-415 ne contient **pas de valeur CPU** directement comparable ; la consommation CPU et les pics mémoire doivent donc être instrumentés lors de nouvelles exécutions avant et après. Un seuil cible provisoire de régression médiane **≤ 10 %** est utilisé comme signal : tout scénario dépassant 10 % doit donner lieu à une **anomalie documentée**, et non à une conformité déclarée. Les changements de hash d'image ne signifient pas automatiquement une régression, car le rendu Word est volontairement différent après unification SVG.

### Fiche de mesure à compléter

| Indicateur | Avant | Après | Écart | Conclusion |
| --- | --- | --- | --- | --- |
| Images / scénarios / packages | 48 / 36 / 6 (historique communiqué) | Non exécuté sur poste | N/D | À mesurer |
| Temps médian par cas (48) | `baseline.json` disponible localement | `comparison.json` attendu | N/D | À mesurer |
| Durée des cas de stress 1/6/24 | Baseline initiale locale | Comparaison à instrumenter | N/D | À mesurer |
| CPU du processus (ms par cas) | Rejeu SMN-422 à effectuer | Rejeu SMN-422 à effectuer | N/D | Non exécuté sur le poste |
| RSS maximum (observé) | Baseline locale | Comparaison locale | N/D | À mesurer |
| Mémoire pic Windows | Non mesuré | Non mesuré | N/D | À instrumenter |
| Qualité visuelle Word/PPTX | Référence manuelle absente | Non exécuté | N/D | Manuel — non validé |

**Aucune dégradation mesurée ni conformité au seuil ≤ 10 % ne peut être affirmée à ce stade.**

## 5. Contrôles techniques et non-régression

Après mise à jour de `main` avec GitHub Desktop :

```powershell
pnpm test:smn-422
pnpm test:smn-421
pnpm test:smn-420
pnpm test:smn-419
pnpm test:smn-418
node --test tests/smn-415-office-baseline.test.mjs
pnpm typecheck
pnpm lint
pnpm i18n:check
```

Le workflow `SMN-422 — Recette catalogue graphique Office` s'exécute sur Windows et Linux avec Node 24/pnpm. **Les scripts uv ne sont ni exécutables ni utilisés sur GitHub.** L'exécution des tests et de la CI doit être confirmée par des logs, jamais déduite de la simple présence d'un workflow.

## 6. Bilan d'acceptation au 8 novembre 2026

| AC | État | Preuves et réserves |
| --- | --- | --- |
| AC-01 Documentation FR/EN live | Documentation publiée ; CI à confirmer | Vérifier `office-tags.tsx` sous Rapports > Tags |
| AC-02 Recette M1/M2/M3 | Protocole livré ; manuel non exécuté | 16 scénarios à renseigner |
| AC-03 Vrais DOCX/PPTX Windows | **Manuel — non validé** | Ouvertures Office réelles et captures manquantes |
| AC-04 Non-régression v33 et anciens modèles | Tests ajoutés ; suite CI à confirmer | Vérifier résultats automatisés et données d'équipe |
| AC-05 Performance ≤ 10 % | **Non mesuré sur poste** | Réexécuter comparatif sur même environnement ; instrumenter CPU/pic mémoire ; ouvrir anomalies en cas d'écart |
| AC-06 Bilan complet traçable | Document présent ; preuves à consolider | Journaux CI et Windows ; limites connues |

**Décision : NO GO pour la clôture de SMN-422 tant que AC-03 et AC-05 ne disposent pas de preuves réelles.** Conserver SMN-422 au statut **En cours**, sans fermer automatiquement les Stories SMN-402/SMN-414 ni aucune autre Story.

## 7. Correctif de cohérence aperçu / export (8 novembre 2026)

**Constat :** les miniatures M1 de SMN-419 étaient dessinées à la main, indépendamment du moteur SVG/resvg de SMN-418. Elles pouvaient donc laisser croire qu'un style n'était pas appliqué dans le rapport Word ou PowerPoint.

**Correction publiée sur main :** la carte M1 charge maintenant un véritable PNG depuis le même endpoint de prévisualisation utilisé en M2 (`/api/admin/reports/chart-styles/preview`), lui-même relié à `renderAdaptiveChartPng` utilisé pour les exports DOCX/PPTX. Le type de démonstration est **bar**, les données sont **fictives**, le format est **960 × 560 px**, la locale est FR/EN. Une légende indique qu'il s'agit d'un aperçu Office sur données fictives. Les URL locales du PNG sont révoquées et les requêtes annulées lorsqu'une carte disparaît ; aucun style ni indicateur n'est modifié.

**Preuves automatisées :** `tests/office-style-render-consistency.test.ts` vérifie les palettes dans la composition SVG, les empreintes des PNG produits avec Corporate/Minimal/Cockpit Agile et les PNG effectivement intégrés dans les packages synthétiques DOCX et PPTX. Les tests vérifient aussi qu'un tag `STYLE` explicite prime sur le choix du rapport.

**Limites :** une miniature M1 sur données fictives ne peut pas reproduire la courbe ou les valeurs réelles d'un rapport ; son moteur, ses règles de mise en page et son rendu sont en revanche les mêmes pour une configuration, un type et une géométrie identiques. L'ouverture effective d'un document Microsoft Office reste à valider séparément.

## 8. Références

- [Jira SMN-422](https://lmn24.atlassian.net/browse/SMN-422)
- [UX Sally](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/catalogue-graphiques-2026-11-08/EXPERIENCE.md)
- [Architecture Winston](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/catalogue-graphiques-2026-11-08/ARCHITECTURE-SPINE.md)
- [Baseline SMN-415](https://github.com/JeanLamora75/SMN/blob/main/scripts/poc/smn-415-office-baseline.mjs)
- [Comparateur SMN-418](https://github.com/JeanLamora75/SMN/blob/main/scripts/poc/smn-418-compare-baseline.ts)
- [Rapports > Tags](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tags.tsx)
