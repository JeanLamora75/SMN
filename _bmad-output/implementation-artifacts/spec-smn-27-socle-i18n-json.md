---
title: "SMN-27 — Préparation technique du socle i18n JSON FR/EN"
story: "SMN-27"
epic: "SMN-1"
type: implementation-preparation
status: prepared-with-gates
created: "2026-10-20"
implementation: not-started
tests: not-executed
decision: "ADR-I0-004"
baseline: "main après décision d'architecture i18n"
---

# SMN-27 — Dossier de préparation au développement

**Story Jira :** [SMN-27 — Choisir le français ou l'anglais pour l'interface](https://lmn24.atlassian.net/browse/SMN-27).  
**Décision obligatoire :** [ADR-I0-004](../planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md).  
**Portée :** spécification prête à être reprise par Amelia/BMAD Dev, sans code produit ni tests exécutés à ce stade.

## 1. Constats vérifiés sur le dépôt

| Élément actuel | Fichier | Impact |
| --- | --- | --- |
| Détection du navigateur par `Accept-Language` (fr/en, q-values) | `src/lib/language.ts` | À conserver pour l'installation non initialisée |
| Dictionnaire de diagnostics FR/EN dans un fichier TypeScript `server-only` | `src/lib/messages.ts` | À migrer dans deux catalogues JSON, sans casse des messages publics |
| Racine `<html lang>` alimentée par la langue du navigateur | `src/app/layout.tsx` | À aligner sur une sélection de langue unique |
| État `locale: fr/en` conservé dans la base et modifiable par l'Administrateur | `src/server/settings/manager.ts`, `src/app/api/admin/settings/route.ts` | Réutiliser la colonne actuelle ; **aucune migration PostgreSQL** |
| Libellés FR et ternaires FR/EN directement dans TSX | `src/app/page.tsx`, `src/app/app/page.tsx` | Migration en clés de traduction |
| Formulaires clients avec notifications FR intégrées | `src/app/login/login-form.tsx`, `src/app/app/admin/settings/settings-form.tsx`, `src/app/app/admin/users/users-admin.tsx` | Prévoir une API de traduction côté Client Components |
| Référence de Story incorrecte : le formulaire indique SMN-24 pour la langue, or la Story est SMN-27 | `src/app/app/admin/settings/settings-form.tsx` | Corriger lors de la migration |
| Node 24 / pnpm 12.10.0, Next 16, TypeScript strict, `resolveJsonModule` | `package.json`, `tsconfig.json` | Pas de dépendance i18n externe nécessaire au socle MVP |
| CI présente Linux/PostgreSQL et Windows | `.github/workflows/verify-i0.yml` | Tous les jobs devront effectivement s'exécuter ; leur simple présence ne prouve aucun test |

## 2. Contrat de conception du socle

1. **Source unique des textes statiques :** `src/i18n/fr.json` et `src/i18n/en.json`, strictement un catalogue par langue. Catégories : `common`, `installation`, `auth`, `dashboard`, `navigation`, `settings`, `accounts`, `security`, `errors`, `reports`, `briefs`. Les deux fichiers partagent la **même forme et les mêmes feuilles**. Éviter les clés numérotées ou liées à un composant fragile.
2. **Moteur léger TypeScript partagé** dans `src/i18n/` : déclarer `SupportedLocale = "fr" | "en"`, le catalogue français comme référence de clés, `translate(locale, key, params?)` sans API ni accès DB, `getServerTranslator` pour les Server Components, et contexte de traduction léger pour les Client Components. Utiliser les imports JSON statiques ; ne transmettre au navigateur que le dictionnaire utile. Ne pas répliquer une table de libellés en TypeScript.
3. **Interpolation sécurisée :** placeholders nommés `{name}`, `{count}`, etc. Valeurs rendues en texte React, non HTML : aucun `dangerouslySetInnerHTML`. Formatage des dates/nombres via `Intl.DateTimeFormat` et `Intl.NumberFormat` selon la langue résolue (le pays, le fuseau et la langue sont des dimensions distinctes). Les messages d'erreur remontent comme **codes techniques contrôlés**, associés côté interface à des clés `errors.*` ; ne jamais présenter de message brut de PostgreSQL/fichier.
4. **Sélection de langue (une source de vérité par requête) :**
   - Installation vierge, diagnostic/public avant installation : conserver `negotiateLanguage(Accept-Language)`, défaut `fr`.
   - Installation initialisée : charger **en lecture seule** la préférence `smn_general_settings.locale` de SMN-18 et l'appliquer aux pages publiques et privées (y compris `<html lang>` et les composants clients) ; ne pas déclencher `ensureAccountsSchema`, migrations ou créations d'objets à chaque rendu. Éviter les requêtes répétées de chaque composant, résoudre une fois par frontière de requête et propager la valeur.
   - Si la configuration initialisée n'est pas lisible, échouer de façon non sensible vers `fr` pour le rendu **sans ouvrir les pages privées ni contourner les gardes**. Ne pas déduire la préférence de l'URL, du rôle ou du pays de référence.
   - Une mise à jour autorisée des paramètres par l'Administrateur s'applique au rendu après rafraîchissement (y compris autres sessions à leur prochaine requête). Un éventuel sélecteur ponctuel utilisateur ne peut pas modifier la configuration globale sans autorisation ; sa sémantique devra rester distincte.
5. **Routage stable :** conserver les routes actuelles `/login`, `/app`, `/setup` etc. Pas de préfixe obligatoire `/fr` ou `/en` et pas de réécriture des URLs publiques ni schéma de BDD.
6. **Traductions seules :** préserver littéralement noms, objectifs, commentaires, membres, historiques, catégories propres aux utilisateurs et instantanés. Les libellés standards de restitution HTML/PDF/TXT à venir réemploient ces catalogues et peuvent dépendre de la langue de **sortie** distincte de l'interface.

### Exemple de contrat attendu (illustration, fichiers non encore créés)

```json
{
  "common": { "retry": "Réessayer", "save": "Enregistrer" },
  "auth": { "login": { "title": "Se connecter", "submit": "Connexion" } },
  "dashboard": { "title": "Tableau de bord" },
  "errors": { "serviceUnavailable": "Service temporairement indisponible." }
}
```

La version `en.json` conservera exactement ces clés et proposera leurs traductions. Cet exemple n'est **pas** un catalogue de production complet.

## 3. Séquencement technique (une Story SMN-27, livraisons contrôlées)

| Lot | Travaux | Condition de sortie |
| --- | --- | --- |
| 0 — filet de sécurité | Établir snapshot des textes et parcours actuels, fixer les clés, tests de comportement avant migration ; vérifier les prérequis et l'état CI | Pas de rupture du parcours d'installation/authentification ; contrôles existants conservés |
| 1 — infrastructure | Créer les deux JSON, le chargeur typé pur TS, l'interpolation sûre, le mécanisme de repli et l'outillage de parité | Tests unitaires JSON/parité, clés absentes et injection ; pas de DB nouvelle |
| 2 — résolution | Résoudre langue navigateur avant installation puis `locale` PostgreSQL après installation ; synchroniser `<html lang>` et les clients | Les paramètres SMN-18 pilotent le rendu après sauvegarde ; défaut, erreurs et accès refusés corrects |
| 3 — pages d'accès | Migrer accueil, installation Express/Guidée, diagnostic, `/welcome`, `/setup`, connexion, renouvellement du mot de passe et pages de secours | Captures/contrôles fr/en, messages d'erreur sécurisés, installation sans régression |
| 4 — espace privé | Migrer tableau de bord, navigation, session/activité, sécurité, déconnexion | Menus, boutons, états vides et alternatives accessibles dans les deux langues |
| 5 — administration | Migrer comptes utilisateurs et paramètres généraux, dont erreurs, libellés de pays, dates et lien d'aide erroné vers SMN-24 | Enregistrement de `locale` fr/en correct ; utilisateur sans droit de modification |
| 6 — qualité/transmission | Vérifier absence de libellés statiques oubliés, parité, export futur et intégration des nouveaux développements ; documenter pour les autres Epics | Tests réellement exécutés sur Linux/Windows, lint, typecheck, build, packaging, parcours manuels à recetter ensuite |

**Politique de livraison :** ne pas combiner la migration des textes avec une refonte d'UI, un nouveau système d'authentification, une migration PostgreSQL ou l'ajout de langues autres que fr/en. Les tâches peuvent être des commits successifs au sein de SMN-27, mais la fermeture de la Story attend la vérification d'ensemble.

## 4. Couverture des sources actuelles

**Public/installation :** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/welcome/{page,welcome-form}.tsx`, `src/app/setup/{page,setup-form}.tsx`.

**Authentification :** `src/app/login/{page,login-form}.tsx`, `src/app/change-password/{page,password-form}.tsx`.

**Espace privé :** `src/app/app/page.tsx`, `src/app/app/{logout-control,session-activity}.tsx`, `src/app/app/security/{page,security-form}.tsx`.

**Administration :** `src/app/app/admin/settings/{page,settings-form}.tsx`, `src/app/app/admin/users/{page,users-admin}.tsx`.

**Traductions/paramètres :** `src/lib/{language,messages}.ts`, `src/server/settings/manager.ts`, `src/app/api/admin/settings/route.ts`. Les réponses API conservent leurs **codes** stables ; leur texte visible se trouve dans les JSON.

**Restitution :** interfaces HTML/PDF/TXT absentes ou encore évolutives au stade inspecté : ne pas inventer de fonctionnalités ni promettre une preuve d'export non implémenté. Fournir une convention d'intégration des catalogues aux futures Epics 6 et 9.

## 5. Matrice de recette SMN-27

| ID | Cas vérifiable | Résultat exigé |
| --- | --- | --- |
| I18N-01 | Compare récursivement `fr.json` et `en.json` | mêmes clés, chaînes valides non vides, placeholders cohérents, JSON valide |
| I18N-02 | Installation neuve, navigateur en anglais / français / allemand | en/fr/fr avant configuration ; aucune écriture ni migration issue d'un rendu |
| I18N-03 | Installation initialisée, préférence en, navigateur fr | interface, page `lang` et composants clients en anglais |
| I18N-04 | Admin change préférence fr → en depuis paramètres | valeur persistée, droits inchangés, rechargement affiche en (autres sessions à prochaine requête) |
| I18N-05 | Utilisateur sans droit d'édition tente changement du paramétrage global | écriture refusée ; les textes restent lisibles |
| I18N-06 | Traduction ou locale absente, clé inconnue à l'exécution | repli sûr en fr ; pas de clé technique dans la vue ; en CI les manques statiques provoquent échec |
| I18N-07 | Placeholders, apostrophes, accents, données contenant balises HTML | pas d'injection HTML, aucun texte corrompu ni secret affiché |
| I18N-08 | Diagnostic d'installation, erreur de connexion, clé absente (si SMN-19 intégrée) | message localisé et générique sans erreur brute |
| I18N-09 | Dashboard, comptes, formulaires, erreurs et états vides sur FR/EN | aucun texte visible codé en dur restant, focus et labels accessibles |
| I18N-10 | Export HTML/PDF/TXT **lorsqu'il existe** | libellés standards dans la langue de sortie ; contenus libres et anciens snapshots inchangés |
| I18N-11 | Lint, typecheck, tests Node/PG, build Next, paquet Windows | toutes les vérifications pertinentes **effectivement exécutées et vertes** avant déclaration de fin |

## 6. Dépendances, risques, état de livraison

- **Prérequis explicites Jira :** SMN-12 (Story 1.2, installation Express) et SMN-18 (Story 1.8, paramètres généraux) sont au statut « En cours » ; SMN-22 (Story 1.12, navigation) et SMN-27 sont « À faire » lors de la préparation. Vérifier leur état avant les migrations associées.
- **Concurrence avec SMN-19 :** [PR #14](https://github.com/JeanLamora75/SMN/pull/14) est encore **draft non mergée** lors de la préparation. Ses nouveaux diagnostics de clé manquante doivent rejoindre les catalogues lors de son intégration, sans copier un code de PR non fusionnée dans `main`.
- **Vérification CI :** les exécutions de SMN-19 échouaient avant attribution d'un runner (voir PR #14). Vérifier ce blocage avant de prétendre que les tests i18n sont passés. Ne pas prendre un statut « workflow failed » sans étapes pour un échec des tests eux-mêmes.
- **Risques principaux :** désynchronisation `<html lang>`/textes client, écriture pendant une lecture publique, oubli de libellés, encodage/formatage des dates, clé technique brute, fuite d'erreur et bascule de langue incomplète dans un état hydraté.
- **Hors périmètre :** i18n des textes libres, SAFe 1.0, traduction IA, langue espagnole/allemande, localisation des jours fériés, évolution des rôles et migrations de données.
- **Statut BMAD retenu :** préparation technique documentée ; ne pas déclarer Story réalisée ni `ready-for-dev` sans lever les dépendances techniques et de workflow. Ne pas modifier le statut Jira tant qu'aucun développement n'a commencé.

## 7. Transmission à Amelia et au Reviewer indépendant

**Amelia :** relire ADR-I0-004 + ce dossier + Jira SMN-27 ; réaliser les lots en préservant les flux installés, ajouter les tests, consigner les commandes/runs effectivement exécutés, actualiser BMAD et Jira, et ne demander aucune revalidation de la décision « un JSON par langue ». Ne pas fusionner avec SMN-19 non validée.

**Verification Gap Reviewer :** comparer le diff et les tests I18N-01 à 11, distinguer tests exécutés/ignorés/simulés, repérer les textes résiduels, les différences SSR/CSR, les accès aux paramètres globaux et les failles de fuite des erreurs. La simple présence de fichiers JSON ne constitue pas la conformité.

**Livrable de cette étape : ce dossier de préparation et les liens dans Jira/BMAD. Aucun code runtime n'est ajouté.**
