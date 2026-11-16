# SMN — Étude technique de refonte des modèles de briefs IA

**Date :** 15 novembre 2026  
**Agent :** 🏗️ Winston — System Architect (BMAD v6.12.4)  
**Statut :** étude technique préliminaire ; conception fonctionnelle validée ; solution détaillée et migration à qualifier avant développement  
**Périmètre :** page de sprint → « Générer un brief IA » ; préparation et modèles ; générateur TXT ; archives et journal ; catalogue de tags Office.  
**Décision utilisateur :** remplacer le formulaire technique de création de modèles par un éditeur de prompt libre de type bloc-notes et une insertion de tags du système de rapports ; supprimer le code et les structures de base devenus inutiles, après sécurisation des données.  
**Hors périmètre de cette étude :** implémentation, migration effective, mise en place d'une API IA distante et publication de distribution.

## 1. Objectif et principes

- Un modèle de brief est essentiellement **un nom, une description éventuelle et un texte de prompt** contenant des tags SMN.
- Réemployer le catalogue et la syntaxe des tags du configurateur des rapports Office, sans créer un second référentiel de tags.
- Adapter la **résolution** des tags à un rendu textuel (TXT) ; la sérialisation d'un tag et son évaluation sont deux opérations distinctes.
- Préserver la prise en charge Scrum/Kanban, les droits d'accès, les données autorisées, le contrôle de confidentialité, l'intégrité des archives et l'absence de données inventées.
- Éviter les dépendances lourdes, les moteurs IA embarqués et toute installation supplémentaire sur les PC des utilisateurs.
- Supprimer effectivement les reliquats de l'ancien format **y compris en base**, mais seulement après migration, vérification et possibilité de restauration.

## 2. Inventaire confirmé par inspection statique de GitHub/main

| Élément | Chemin/code actuel | Constat |
|---|---|---|
| Bouton sprint | `src/app/app/admin/sprints/[sprintId]/page.tsx` | Lien vers `/app/admin/ai-briefs/prepare?mode=scrum&id=...`. |
| Préparation | `src/app/app/admin/ai-briefs/prepare/page.tsx` | Chargement du cycle, modèles actifs, faits et historique ; autorisation d'écriture ; contexte Scrum/Kanban. |
| Édition ponctuelle | `src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx` | Rubriques/questions/consignes/profondeur/données ; aperçu TXT, contrôle confidentialité, finalisation SHA-256 et copie manuelle. |
| Administration | `src/app/app/admin/ai-briefs/templates/page.tsx` et `template-editor.tsx` | Formulaire complexe, création et activation/désactivation. |
| Modèles natifs | `src/lib/ai-brief-templates.ts` | Trois modèles dans le code : Bilan du cycle, Tendances, Risques et dépendances. |
| Persistance modèles | `src/server/ai-briefs/templates.ts` | Modèles personnalisés dans `public.smn_ai_brief_template`, colonnes `sections`, `questions`, `instructions`, `data` en JSONB ; `depth`, `revision`, `active`. |
| API modèles | `src/app/api/admin/ai-briefs/templates/route.ts` | Accès et mutations transactionnelles, contrôle de révision. |
| Production TXT | `src/lib/ai-brief-txt.ts` | `composeBriefTxt` construit un texte depuis sections/questions/consignes, faits et historique ; adaptation requise. |
| Archives | `src/server/ai-briefs/library.ts`, `src/app/app/ai-briefs/archives/` | Archive TXT originale contrôlée par longueur et SHA-256, référence `template_id` et `template_revision`, réponses IA ajoutées manuellement. |
| Journal | `src/app/app/ai-briefs/journal/page.tsx` | Journal des analyses humaines et réponses IA. |
| Catalogue tags Office | `src/app/app/reports/office-tags.tsx` | Définitions des valeurs simples, indicateurs, tableaux et graphiques. |
| Configurateur de tags | `src/app/app/reports/office-tag-configurator.tsx` | Modal de recherche/choix de famille, gestion indicateurs et styles, actuellement copie vers presse-papiers. |
| Constructeur de tags | `src/lib/office-tag-builder.ts` | `serializeOfficeTag` indépendant de l'interface : scalar, indicator, row, chart. |
| Garde de schéma | `src/server/ai-briefs/schema-ready.ts` | Contrôle l'existence des tables ; n'applique pas de migration. |

**Limite :** cet inventaire résulte d'une revue statique ciblée. Il ne garantit pas l'exhaustivité des références dans les migrations, tests, export/import et moteurs Office. Aucun test, application ni migration n'a été exécuté.

## 3. Proposition d'architecture cible

### 3.1 Contrat de modèle

Proposer `id`, `title`, `description` (facultative), `prompt_text`, `revision`, `active`, `created_by`, `created_at`, `updated_at`, et conserver les autres colonnes techniques nécessaires après inventaire réel du schéma. Éviter de conserver les anciennes colonnes uniquement pour compatibilité interne une fois la migration finalisée.

Les modèles natifs seront transposés en prompts rédigés, chargés comme ressources versionnées et protégées, mais pourront être dupliqués. Les modèles personnalisés seront persistés en PostgreSQL. Éviter de distribuer des clés API ou des secrets avec les modèles.

### 3.2 Éditeur UX

- Nom, description facultative, **grande zone de texte** avec insertion de tags à la position du curseur.
- Catalogue de tags mutualisé et filtrable ; information sur le sens, les données et la disponibilité par contexte.
- Aperçu du prompt résolu, diagnostics de tags invalides ou non disponibles, validation explicite de confidentialité et finalisation.
- Modèles natifs préremplis, duplication et personnalisation simples.
- Le configurateur doit proposer une insertion au curseur et non seulement une copie vers le presse-papiers ; préserver son usage actuel côté rapports.

### 3.3 Résolution et rendu textuel

Réutiliser la définition et la validation des expressions Office, mais prévoir un **adaptateur de rendu texte**. Les tags scalaires sont candidats à un rendu direct ; les `ROW` nécessitent une représentation textuelle lisible (lignes/colonnes, limites et qualité/provenance). Les `CHART` produisent actuellement des artefacts graphiques : ne pas prétendre les résoudre en texte sans règle explicite ; définir une substitution par données textuelles, une représentation adaptée, ou les interdire dans les prompts avec un message explicite.

Exemples de syntaxe existante : `{{TEAM_NAME}}`, `{{SPRINT_NAME}}`, `{{ROW:RISKS}}`, `{{INDICATOR_<TAG>}}`, `{{CHART:TREND|TYPE=line|TAGS=...}}`. Les disponibilités et rendus doivent être validés par les producteurs métier, sans recopier arbitrairement toutes les données individuelles du moteur Office.

**Confidentialité :** les tags Office comportent notamment des listes de membres et des liens ; ne pas exposer automatiquement tout le catalogue comme « autorisé à envoyer à une IA ». Distinguer disponibilité technique, affichage, autorisation métier et partage externe. Relecture explicite du texte intégral avant transmission.

### 3.4 Flux et archives

Conserver le mécanisme de revue du TXT, le SHA-256, l'immutabilité, les références à la version du modèle, le téléchargement TXT et la séparation des analyses humaines et réponses IA. Vérifier que l'ajustement ponctuel du prompt ne modifie pas silencieusement un modèle sauvegardé. L'intégration d'une API IA gratuite constituera un lot distinct et devra garder les clés côté serveur.

## 4. Nettoyage et migration PostgreSQL — exigence obligatoire

Éléments candidats à supprimer **après conversion et vérification** :
- UI ancienne : `template-editor.tsx` (remplacé), anciennes parties de `brief-overrides.tsx`, formulaires de sélection des champs/profondeur/rubriques.
- Contrats et validations TypeScript de l'ancien format.
- Assembleur `composeBriefTxt` basé sur sections/questions/consignes, à remplacer ou restructurer.
- Colonnes `sections`, `questions`, `instructions`, `data`, `depth` de `public.smn_ai_brief_template`, **si** devenues sans consommateurs après migration.
- Tests purement dépendants du format historique, à remplacer par de vrais scénarios comportementaux.
- Index, contraintes, valeurs par défaut et fonctions SQL obsolètes **uniquement après inventaire précis**.

**Ne pas supprimer** sans analyse : tables d'archives (`smn_ai_brief_archive`), réponses IA, analyses humaines, journaux, liens d'audit, identifiants de modèles et numéros de révision existants.

### Séquence de migration recommandée

1. Inventorier le DDL réel, les migrations, les consommateurs directs/indirects et les données existantes (y compris installation multi-PC et sauvegardes).
2. Définir la règle déterministe de conversion pour chaque modèle natif/personnalisé ; y inclure rubriques, questions, instructions et données à l'aide de tags valides, sans perte silencieuse.
3. Préparer une migration PostgreSQL explicite (ajout `prompt_text` et backfill), journal de contrôle avant/après, sauvegarde restaurable et plan de retour arrière.
4. Adapter l'éditeur, les API et le moteur TXT ; conserver la lecture transitoire de l'ancien schéma seulement si nécessaire à un déploiement incrémental.
5. Tester conversion, aperçu, permissions, tags invalides, données absentes, archivage, export/import, sauvegarde/restauration et plusieurs versions de schéma.
6. Supprimer les colonnes, validations, code et artefacts devenus inutiles par une migration de nettoyage, après preuve de non-utilisation ; vérifier le schéma final.
7. Inclure les migrations dans les futures distributions SMN rebâties intégralement depuis les dernières sources.

**Point sensible :** un ancien modèle peut être référencé dans `smn_ai_brief_archive` via `template_id`/`template_revision`. Préserver l'interprétation et la traçabilité de ces archives même si le format courant est simplifié ; ne jamais réécrire leur contenu TXT immuable.

## 5. Questions ouvertes / validations avant développement

1. Règles précises d'évaluation textuelle des tags `ROW`, `CHART` et indicateurs dynamiques.
2. Politique de disponibilité des tags contenant des données personnelles, sensibles ou des URL.
3. Stratégie de conversion des modèles existants et résultats attendus ; présence éventuelle de données de production.
4. Inventaire exhaustif des migrations SQL et dépendances des colonnes obsolètes.
5. Multilingue : noms affichés et modèles natifs localisés sans inflation des fichiers i18n généraux.
6. Intégration au système de sauvegarde/restauration et aux distributions ZIP sur Windows.
7. Scénarios d'erreur et ergonomie de l'éditeur (perte de modifications, mauvais contexte de sprint, tags non résolus).

## 6. Préparation de la phase UX avec Sally

Demander à Sally un parcours simple conforme au référentiel `docs/UX-REFERENTIEL-BMAD.md` :
- administration du catalogue de modèles : liste lisible, création/duplication/modification/désactivation ;
- éditeur plein format « bloc-notes » et catalogue de tags en modal Cockpit Agile ;
- insertion au curseur, recherche, descriptions en langage métier, gestion du clavier ;
- aperçu avec données réelles, provenance, données absentes et erreurs lisibles ;
- revue de confidentialité et confirmation ciblée avant export ou transmission ;
- cohérence FR/EN et extensibilité 6–10 langues ;
- compatibilité des pages sprint, préparation, archives, journal ;
- possibilité de configurer plus tard une IA externe gratuite sans imposer une clé à ce stade.

Sally remettra des décisions UX, parcours, états, règles responsive et critères de recette, **sans modifier le code**. Le résultat sera validé fonctionnellement avant remise à Amelia.

## 7. Références de vérification

- [Éditeur actuel](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/ai-briefs/templates/template-editor.tsx)
- [Persistance actuelle](https://github.com/JeanLamora75/SMN/blob/main/src/server/ai-briefs/templates.ts)
- [Composeur TXT](https://github.com/JeanLamora75/SMN/blob/main/src/lib/ai-brief-txt.ts)
- [Catalogue de tags](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tags.tsx)
- [Configurateur Office](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tag-configurator.tsx)
- [Sérialiseur de tags](https://github.com/JeanLamora75/SMN/blob/main/src/lib/office-tag-builder.ts)
- [Bibliothèque d'archives](https://github.com/JeanLamora75/SMN/blob/main/src/server/ai-briefs/library.ts)
- [Référentiel UX SMN](https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md)

**Traçabilité :** étude rédigée à partir des validations exprimées dans la conversation du 15/11/2026 et de la lecture statique des fichiers ci-dessus. Aucun script `uv` exécuté ; aucun développement ni migration exécutés.

---

## 8. Complément Winston — Connexions multi-IA gratuites (décisions PO du 16/11/2026)

**Statut :** cadrage technique approuvé sur les principes, conception détaillée et audit de l'implémentation restant à mener. **Aucune nouvelle User Story avant finalisation de la spécification technique et UX.**

### 8.1 Décisions impératives

- L'utilisateur peut enregistrer **plusieurs connexions IA**, y compris plusieurs clés pour un même fournisseur, et choisir la connexion **au moment d'envoyer** le prompt depuis le brief IA.
- **Modèles IA uniquement gratuits** : pas de sélection, fallback automatique ni appel à un modèle potentiellement facturable. Une offre d'essai limitée par des crédits de paiement n'équivaut pas à un modèle gratuit autorisé. Toute incertitude sur la gratuité entraîne le blocage de l'envoi, avec explication.
- **Conservation des réponses exclusivement manuelle** : afficher la réponse en session, permettre copie / enregistrement explicite, et ne jamais écrire le contenu de la réponse automatiquement dans les archives, le journal ou une table d'historique. Clarifier la durée de vie temporaire en mémoire et les métadonnées de diagnostic non sensibles.
- Les modèles de briefs restent des **prompts texte libre avec tags SMN** ; la connexion IA est indépendante et ne doit pas restaurer la complexité du système historique de templates.
- Les fournisseurs candidats à qualifier sont Gemini, Groq et OpenRouter ; aucun quota ou modèle précis ne doit être considéré garanti dans le temps. Se fonder sur les catalogues documentés et sur un contrôle effectif au moment de l'usage.

### 8.2 Architecture de référence à détailler

1. Catalogue de fournisseurs (adaptateurs de transport et formats de réponse), registre des connexions (libellé, fournisseur, modèle gratuit autorisé, état), et coffre de secrets séparé des données fonctionnelles.
2. API serveur locale pour créer, tester, désactiver, changer et supprimer une connexion ; ne jamais renvoyer la clé en clair à l'interface. Prévoir droits d'accès et cloisonnement par utilisateur si pertinent ; documenter la politique d'administration et de partage.
3. Pipeline d'exécution : prompt libre → résolution des tags dans le contexte sprint/équipe → aperçu intégral avec contrôle des données sensibles → validation explicite de transmission du contenu exact → choix de la connexion → validation du caractère gratuit du modèle → appel API côté serveur → réponse affichée sans persistance.
4. Gestion des erreurs : clé invalide, quota gratuit épuisé, service indisponible, délai dépassé, modèle retiré/devenu payant, réponse trop longue, prompt invalide ; aucun fallback silencieux vers un modèle payant.
5. Sécurisation : chiffrement authentifié des secrets au repos, séparation et rotation de la clé de chiffrement, exclusion des journaux, suppression vérifiable, protection des erreurs et traces, limites de taille et de durée, contrôle serveur des autorisations. Aucun secret dans les prompts, bundles client, exports non chiffrés ou fichiers de configuration distribués.
6. Portabilité Windows/ZIP : arbitrer la politique des clés lors d'un export/import entre ordinateurs (ressaisie par défaut ou export de secrets **distinct, optionnel et chiffré avec mot de passe**). Le transfert standard ne doit pas dévoiler les secrets, ni exiger PowerShell. Préserver les autres données et la restauration.
7. Respecter FR/EN extensible à 6–10 langues, fonctionnement hors ligne pour l'édition des prompts (mais appel distant impossible hors ligne), et architecture sans installation serveur supplémentaire.

### 8.3 Contrat de persistance et conservation

- Une connexion peut être persistée (métadonnées et secret protégé) ; **ne pas assimiler** ce stockage autorisé à l'enregistrement des **réponses**.
- Par défaut, aucun enregistrement automatique de réponses IA, de contenus de requête distants ni d'historique de conversation. Une action explicite « Enregistrer cette réponse » doit respecter les autorisations, le rattachement au brief et les règles d'archives existantes.
- La modification du prompt, des tags résolus, du sprint ou de la connexion invalide le consentement antérieur à la transmission ; relecture et confirmation requises.
- Déterminer la politique des réponses lors d'une navigation/recharge et informer l'utilisateur qu'une réponse non enregistrée peut être perdue.
- Examiner la compatibilité avec les anciennes réponses IA **déjà enregistrées manuellement** dans SMN : les conserver, sans migration destructive.

### 8.4 Critères de validation avant remise à John

- Audit réel des migrations PostgreSQL, chemins API, droits et mécanismes actuels d'archivage/export/import ; aucune suppression préventive de tables ou colonnes.
- Matrice fournisseur × modèle : documentation officielle, mode gratuit, quotas, conditions d'usage des données, détection des changements et politique de refus.
- Tests envisagés : plusieurs clés par fournisseur, choix à l'envoi, refus de modèle payant/inconnu, quota épuisé, absence de persistance sans clic, sauvegarde manuelle et contrôle des droits, confidentialité des tags, chiffrement et restauration sur un nouveau PC.
- Faire valider la spécification UX correspondante par Sally ; **ne pas créer de nouvelles User Stories et ne pas commencer l'implémentation** avant ce jalon.

**Sources fonctionnelles :** décisions explicites du Product Owner du 16 novembre 2026 ; études BMAD du 15 novembre 2026. **Vérifications officielles à rafraîchir avant implémentation :** https://ai.google.dev/gemini-api/docs/pricing ; https://console.groq.com/docs/rate-limits ; https://openrouter.ai/pricing.

---
## Addendum du 16 novembre 2026 — intégration API IA : conception technique détaillée (Winston)

**Statut :** décisions métier actées ; spécification technique prête pour la décomposition Jira, sous réserve des vérifications d'intégration et de la qualification API. **Aucune implémentation réalisée dans cet addendum.**
**Décisions fermes du Product Owner :** plusieurs clés et connexions par fournisseur ; choix de la connexion lors de chaque envoi ; **modèles uniquement gratuits** ; **une réponse n'est persistée que par action explicite de l'utilisateur**. L'appel distant est facultatif et ne remplace ni l'éditeur, ni le workflow d'archives.

### A. Périmètre, contrats et limites de gratuité

- Fournisseurs candidats initiaux : Gemini, Groq, OpenRouter. Ils ne deviennent **activables** qu'après validation en conditions réelles de l'accès API, de la sélection du modèle gratuit, des conditions d'utilisation et des limites. Toute documentation commerciale évolutive doit être revérifiée avant livraison ; les décisions de conception ne constituent pas une preuve de gratuité permanente.
- Créer un registre serveur de connecteurs `providerId`, configuration d'API et adaptateur par fournisseur (authentification, requête, réponse, limites, mapping d'erreurs) ; ne jamais laisser l'interface appeler directement les API externes.
- Contrat connexion : `id`, `owner/installation scope`, `label`, `provider_id`, `encrypted_secret_ref`, `model_id`, `enabled`, `last_test_status`, `last_test_at`, `created_at`, `updated_at`. Plusieurs connexions d'un même fournisseur autorisées ; contrôle d'unicité seulement sur identifiant technique.
- **Fail closed** : liste d'autorisation explicite `provider+model+freeTierEvidenceVersion` ; interdiction des identifiants non validés, des options qui déclenchent un fallback payant, du basculement automatique vers un autre modèle, du routage opaque non certifié et des modèles hors allowlist. La qualification du routeur `openrouter/free` nécessite une preuve que le routage n'implique aucun modèle payant ; sinon désactiver cette option et privilégier les modèles gratuits explicites.
- Catalogues et quotas peuvent changer : validation serveur à chaque envoi (configuration locale datée + état fournisseur quand disponible) ; en l'absence d'une preuve suffisamment récente de gratuité ou en cas d'ambiguïté, **bloquer l'envoi** et proposer une actualisation volontaire. Ne jamais assimiler une réponse `200` à la preuve de gratuité. Limites quotidiennes locales préventives et messages distincts `quota`, `rate-limit`, `modèle retiré`, `non vérifiable`.
- La restriction applicative réduit le risque mais **ne garantit pas une facture nulle chez un fournisseur** dont la clé est facturable : recommander compte sans moyen de paiement/facturation activée et paramétrage des limites fournisseur quand disponibles ; ne promettre aucune garantie comptable externe.

### B. Coffre local et cycle de vie des clés

- Uniquement serveur Node local : ne jamais renvoyer les clés en JSON, HTML, logs, traces, télémétrie, fichiers de brief ou historiques. Ne restituer au navigateur que `hasKey`, état, empreinte courte non réversible si besoin. Champs de saisie masqués, remplacement explicite sans relecture, aucune variable `NEXT_PUBLIC_*`.
- Proposition de cible : secret chiffré par connexion avec AES-256-GCM, IV aléatoire unique, clef maîtresse aléatoire 256 bits propre à l'installation et conservée dans le dossier privé de SMN **hors PostgreSQL**, hors dépôt, et hors sauvegardes ordinaires ; permissions fichiers/ACL Windows restrictives, protections contre liens symboliques, séparation de rôle et accès administrateur seul pour gérer les connexions. Réutiliser les primitives crypto auditées du projet là où approprié, sans réutiliser aveuglément la clef des archives.
- La clé maîtresse doit être créée atomiquement, avec rotation/versionnement du format, refus sûr en cas de disparition/corruption, et capacité de remplacement/révocation des clés fournisseur. Ne pas stocker la clé maîtresse dans le même ensemble transportable que les secrets chiffrés.
- En cas de compromission, informer que la révocation effective se fait chez le fournisseur ; un changement local seul ne révoque pas une clé externe.
- Respecter l'autorisation SMN au niveau serveur : lecture de la liste selon permissions ; création/test/modification/suppression des connexions réservées à l'administrateur ; droit d'envoyer un brief lié à l'équipe/sprint explicitement contrôlé. Restreindre l'utilisation partagée des clés à l'installation autorisée.

### C. Exécution et minimisation de la donnée

1. Le serveur reçoit l'identifiant du brief/du sprint, de la connexion et du modèle autorisé, et génère le texte résolu avec le moteur de tags validé. Ne jamais croire une version client des données ou du contexte.
2. Produire un **aperçu exact** de ce qui sortira de SMN, incluant les données insérées par tags, le fournisseur, le modèle, les caractères/tokens estimés et un avertissement de transmission à un tiers.
3. Confirmer explicitement cet aperçu pour chaque version : empreinte SHA-256 du contenu, du contexte, du fournisseur/modèle et du jeu de données ; invalider dès toute modification. Le backend recontrôle l'empreinte, les droits, le caractère gratuit et l'absence de tags non résolus avant un envoi unique.
4. POST serveur vers fournisseur avec TLS et endpoint prédéfini en allowlist (pas d'URL paramétrable, redirects non approuvés bloqués, protections SSRF), timeout, limite taille entrée/sortie, validation du retour. Protéger contre les doubles clics et réessais causant plusieurs requêtes ; pas de retry automatique implicite.
5. Fournir la réponse au navigateur **en mémoire volatile uniquement**. Aucune écriture silencieuse de la réponse, du prompt généré en tant que nouvelle archive, ni du contenu brut des échanges dans PostgreSQL, fichiers, journaux ou instrumentation. Conserver au plus des métriques techniques minimisées sans texte et avec politique de rétention distincte.
6. Un bouton explicite **« Enregistrer la réponse »** crée une réponse dans l'archive correspondante via une action autorisée, avec le fournisseur et modèle ; réutiliser `src/server/ai-briefs/responses.ts` et ses contrôles après analyse des contraintes d'archives. Sans clic, rien ne persiste ; fermeture, actualisation ou navigation peuvent faire perdre la réponse. Le bouton « Copier » n'enregistre rien.
7. Jamais d'envoi de prompt automatiquement au chargement d'un écran, ni en arrière-plan, ni après restauration, ni de mode batch en première version.

### D. Sauvegarde, ZIP et restauration inter-PC — décision de sécurité

**Décision cible par défaut : les métadonnées de connexion sont portables, pas les clés API.**
- Métadonnées sans secret présentes dans PostgreSQL, donc intégrées au dump chiffré normal ; le statut de connexion devient **« Clé à renseigner »** sur le PC restauré. La nouvelle clé est saisie dans l'interface, sans PowerShell ; ne jamais annoncer la connexion utilisable tant que la clé n'a pas été ajoutée et testée.
- Le coffre local chiffré et sa clé maîtresse sont exclus de la chaîne ZIP ; pas de coffre exportable par défaut. Une éventuelle exportation chiffrée explicitement autorisée constitue une évolution distincte exigeant un nouvel ADR et une procédure de restauration vérifiée.
- Les archives de briefs et les **réponses volontairement enregistrées** restent dans la sauvegarde PostgreSQL déjà chiffrée ; les réponses temporaires non enregistrées n'y figurent jamais.
- Le ZIP actuel `src/server/backup/portable-transfer-zip.ts` encapsule un `.tar.gz` chiffré avec une liste d'entrées stricte ; `portable-package.ts` et `portable-import.ts` n'autorisent que des composants définis. **Ne pas ajouter de fichier de secrets à cette allowlist** sans refonte du contrat d'archive et audit de sécurité.
- Le mécanisme existant `backup/crypto.ts` fournit AES-256-GCM et récupération par phrase/scrypt pour les archives. La phrase de récupération d'une sauvegarde **ne doit pas implicitement donner accès aux clés API** ; distinguer chiffrement des données restaurées et reconnexion fournisseur.
- Conserver tous les garde-fous de restauration existants : destination vierge, archive vérifiée, compatibilité de schéma, preuves de confidentialité/effacement, rollback, invalidation des sessions. Le succès de l'upload ZIP seul n'est pas le succès d'une restauration active.
- Tester une installation vierge, une sauvegarde/restauration inter-PC, la réauthentification, les métadonnées restaurées sans secret, les liens vers archives/réponses, l'impossibilité d'appeler un fournisseur sans reconfiguration, et l'absence de secrets dans ZIP/SQL/manifest/logs.

### E. Constat de code (lecture ciblée de GitHub/main le 16/11/2026)

- `src/server/backup/crypto.ts` : primitives AES-256-GCM, enveloppe de récupération par scrypt.
- `src/server/backup/portable-transfer-zip.ts` : entrées ZIP strictement limitées (archive tar.gz, reçu de migration et ledger).
- `src/server/backup/portable-package.ts`, `portable-import.ts` : jeu de fichiers transportés strict et contrôle à l'import ; aucun composant de coffre IA.
- `src/app/api/admin/backups/migration/upload/route.ts` : upload ZIP, réception et vérification séparées de l'autorisation de restauration.
- `src/server/ai-briefs/responses.ts` : API métier existante d'ajout volontaire de réponses, liée à une archive et une équipe.
- `src/lib/settings-catalog.ts` : catalogue centralisé de Paramètres avec contrôle d'accès, auquel le futur écran doit être ajouté.
- `ADR-I0-002-MIGRATIONS-SECRETS.md` : obligation de préserver et séparer les secrets de l'installation.
- Revue statique ciblée uniquement ; **pas de test d'intégration, preuve fournisseur, ni exercice de restauration exécuté**.

### F. Critères bloquants avant livraison

1. Aucun modèle facturable sélectionnable ni fallback payant, y compris en cas de changement de catalogue/erreur de quota.
2. Aucune clé retrouvable dans réponse serveur, console navigateur, export ZIP, journaux, et aucun appel API possible par utilisateur non autorisé.
3. Le texte transmis correspond strictement à l'aperçu approuvé, avec révalidation du contexte et des données.
4. Une réponse non enregistrée disparaît sans écriture durable ; une réponse enregistrée conserve ses droits d'accès et son lien à l'archive.
5. Après import ZIP réussi sur PC neuf, métadonnées visibles, clés absentes, fournisseurs inactifs jusqu'à ressaisie/test manuel, aucune exposition de secrets.
6. FR/EN et architecture extensible 6–10 langues ; tests Windows et Linux ; tests de concurrence/double clic, quota, timeout et panne réseau.
7. Migrations évolutives avec sauvegarde préalable, modèle initial d'installation à jour et aucun changement régressif du mécanisme de restauration.

**Relais à John :** décomposer seulement après validation de cette conception et qualification réelle des fournisseurs ; distinguer coffre/permissions, catalogue gratuit, passerelle API, UX, persistance sur clic, sauvegarde et tests. Aucune User Story créée ici.
