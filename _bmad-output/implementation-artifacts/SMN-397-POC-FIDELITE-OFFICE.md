# SMN-397 — Première preuve de faisabilité Office (état au 06/11/2026)

**Jira :** https://lmn24.atlassian.net/browse/SMN-397
**Agent :** Amelia — BMAD Senior Software Engineer
**Statut :** En cours — **POC partiel**, ne pas clôturer la Story
**Branche de référence publiée :** `main`

## Contexte d'exécution et adaptation

L'environnement ChatGPT ne dispose pas du répertoire local Windows 11 de l'utilisateur. Le script BMAD `uv run --no-cache .../_bmad/scripts/render_skill.py` n'a pas été exécuté : l'environnement du dépôt de l'utilisateur n'était pas monté ; l'implémentation POC isolée a été conduite avec Node.js disponible dans le conteneur, en adaptant explicitement la procédure.

La preuve décrit **les essais réellement exécutés**, distincts des vérifications Windows/Office nécessaires pour clôturer SMN-397.

## Tests exécutés

Un prototype expérimental indépendant a été écrit avec les modules natifs Node `node:zlib` et `Buffer`, sans dépendance npm ni modification du système de rapports existant. Il lit les entrées ZIP (avec contrôles de tailles, CRC et chemins), remplace des valeurs simples dans les éléments `w:t` ou `a:t` et recrée le package en laissant inchangé le contenu XML non ciblé. Les balises de texte fragmentées entre plusieurs runs ont été testées.

Commande exécutée : `node --test smn-397-office-poc.test.mjs` sur Node.js 22.16.0 dans l'environnement isolé.

**Résultat final : 4 tests réussis / 4.** Un premier essai de test de corruption ne ciblait pas un octet couvert par le contrôle CRC : le test a été corrigé, puis relancé avec succès. Les tests incluent :
- Word : remplacement de tag fragmenté ; préservation des styles, du texte voisin et du tag inconnu.
- PowerPoint : remplacement de valeur zéro ; préservation des propriétés de run, texte voisin et thème.
- `N/D`, tags inconnus, non-franchissement des frontières de paragraphe.
- Rejet des archives non ZIP, des packages incomplets et d'une entrée dont le CRC est falsifié.

## Essais avec de vrais fichiers Office

Deux fixtures ont été générées par des bibliothèques Python présentes **dans l'environnement de test uniquement** : `python-docx` et `python-pptx`. Elles ne constituent **pas** des dépendances SMN.

| Format | Paquet source | Transformation ciblée | Ouverture après transformation |
|---|---:|---|---|
| DOCX | 18 parties ZIP | `word/document.xml` uniquement (1/18) | Succès via `python-docx` ; tableau et en-tête conservés |
| PPTX | 38 parties ZIP | `ppt/slides/slide1.xml` uniquement (1/38) | Succès via `python-pptx` ; seconde zone textuelle conservée |

Les octets **décompressés** des autres parties étaient identiques dans l'inspection effectuée. Les archives ont été réécrites ; cela ne prouve pas l'identité binaire complète du fichier ZIP.

## Couverture des critères

- **CA-1.1 — Partielle :** DOCX ouvrable, tag fragmenté et composants hors cible inchangés dans l'échantillon ; aucun contrôle visuel Microsoft Word réel.
- **CA-1.2 — Partielle :** PPTX ouvrable, diapositive et forme hors cible préservées dans l'échantillon ; masques/notes complexes et rendu PowerPoint réel non inspectés.
- **CA-1.3 — Non prouvé :** tableaux dynamiques 0/1/N et dépassements réels non testés.
- **CA-1.4 — Non prouvé :** tests réalisés sous Node 22 dans un conteneur, **pas** Node 24 / Windows 11 ; décision définitive bibliothèque/licence en attente.
- **CA-1.5 — Partielle :** tags scalaires librement placés ; graphiques-images et tags de tableaux non encore éprouvés.

## Limites et risques

1. Le prototype cible des tags scalaires de forme `{{NOM}}`, sans validation de parseur XML dédié ni prise en charge générale des documents Office complexes. Il ne doit pas être exposé en production.
2. Le processeur XML utilise une détection textuelle limitée aux éléments `w:t` et `a:t` ; vérifier tags divisés par des constructions plus complexes, entités XML, propriétés de runs et déplacements involontaires.
3. Des packages ZIP64, chiffrés, multi-disques ou malformés sont hors du contrat expérimental. Les protections devront être qualifiées et renforcées avant usage utilisateur.
4. À prouver : génération dynamique de tableaux, images graphiques, ancres, dimensions, thèmes, formes groupées, notes, tests de performance, traitement de fichiers verrouillés et conditions Windows.
5. Aucun résultat ne vaut preuve de fidélité visuelle dans Word ou PowerPoint. Les deux outils Python ont seulement permis de rouvrir et d'inspecter les packages.
6. **Aucun test de la CI GitHub ou de Windows 11 n'est revendiqué.**

## Suite requise pour clore SMN-397

Le harness expérimental a été publié sur `main` dans [`scripts/smn-397-office-poc.mjs`](../../../scripts/smn-397-office-poc.mjs), avec ses [tests de contrat](../../../tests/smn-397-office-poc.test.mjs). Il reste à construire des fixtures Word/PPTX réalistes incluant tableaux et graphiques, qualifier P1–P6 de l'architecture, exécuter les tests sur Node 24/Windows 11, identifier une bibliothèque ZIP/XML maintenue et compatible/licence, réaliser un examen visuel Microsoft Office, puis documenter les preuves et échecs.

**La Story reste En cours.**

## Publication et CI GitHub

- Script POC publié sur `main` : `scripts/smn-397-office-poc.mjs`, commit `18141fd70c255ba6dc4997e01df5b6739fbde48e`.
- Test de contrat POC publié sur `main` : `tests/smn-397-office-poc.test.mjs`, commit `4c6e1c3ccee1f1ec630e3aa8a57a01ada78b5531`.
- Les résultats 4/4 et l'ouverture des fichiers Office concernent le banc d'essai local isolé. **L'exécution CI du fichier de tests effectivement publié doit être vérifiée séparément** avant d'affirmer que sa validation est acquise.
- CI au moment de la dernière vérification : des workflows GitHub Actions sont encore `in_progress` ; aucune conclusion globale n'est revendiquée.
