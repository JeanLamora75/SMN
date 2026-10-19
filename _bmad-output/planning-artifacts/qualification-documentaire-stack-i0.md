# SMN — Qualification documentaire de la stack I0

**Consultation : 19 octobre 2026. Autorisation web explicitement donnée par l'utilisateur à 21:51 (Europe/Paris).**
**Portée :** documentations officielles uniquement. Aucun paquet installé, aucune base connectée, aucun essai Windows, aucun audit exhaustif de vulnérabilités ou développement réalisé.

Les versions ci-dessous sont des observations des pages consultées et des candidats pour le POC ; elles ne sont ni une configuration testée ensemble ni un fichier de dépendances verrouillé. La version réellement présente sur le PC SMN reste inconnue.

## 1. Recommandation pour le POC I0

**Proposition technique : Node.js 24 LTS, Next.js 16 App Router avec React 19, TypeScript compatible, Bootstrap 5.3 ; PostgreSQL local supporté ; Prisma ORM 7 à qualifier en premier ; Better Auth comme candidat d'authentification locale ; Playwright/Chromium comme candidat PDF et tests navigateur.**

Cette proposition réutilise le monolithe modulaire et les candidats de la spine. UI/API → Application → Domaine demeure obligatoire ; ni Prisma ni Next.js ne deviennent des dépendances du domaine. L'ajout d'un serveur NestJS distinct n'est pas proposé pour ce MVP. Aucun choix fonctionnel validé n'est modifié.

## 2. Faits vérifiés, conséquences et limites

| Composant | Observation officielle | Conséquence proposée pour SMN |
| --- | --- | --- |
| Node.js | La page des versions classe 24 en LTS et 26 en Current ; la publication 24.22.0 est accessible comme LTS. | Retenir la ligne 24 LTS pour le POC. Relever le correctif installé avant de proposer une mise à jour ; ne pas imposer Node 26. |
| Next.js | La documentation consultée affiche 16.4.2 ; la politique classe 16.x en Active LTS. Installation : Windows supporté, Node ≥20.9, TypeScript ≥5.1. | Next.js 16 est un candidat documenté pour Windows et Node 24. Le minimum Node indiqué n'est pas une recommandation de rester sur une version EOL. |
| React | Le site présente 19.3 comme version récente. Le guide Next distingue React déclaré et fonctionnalités React intégrées à App Router. | Utiliser des versions React/react-dom compatibles avec le correctif Next retenu ; ne pas juxtaposer arbitrairement des tags latest. |
| TypeScript | Prisma ORM 7 exige 5.4+ ; Next exige 5.1+. Les notes officielles de TypeScript 5.9 sont disponibles. | Plancher documentaire commun 5.4 ; qualifier une version stable compatible, puis l'épingler. Ce plancher ne vaut pas choix final de correctif. |
| Bootstrap | La documentation 5.3 fournit des exemples et un pied de page en 5.3.8. | Candidat 5.3.8, ressources embarquées localement pour SMN. Désactiver Tailwind dans le starter Next par défaut ; ne pas modifier le choix Bootstrap. |
| pnpm | La page d'installation courante décrit pnpm 12 ; son tableau inclut Node 24 pour les lignes 10/11/12. Les pages et résultats indexés de versions antérieures ne doivent pas être confondus avec la page courante. | Relever la version existante et qualifier son usage avant toute montée de majeure. Épingler la version du projet et conserver le lockfile. Compatibilité listée ≠ preuve de maintenance/sécurité de chaque ancienne version. |
| PostgreSQL | La politique liste 18/17/16 supportés ; correctifs affichés 18.6/17.11/16.15. La ligne 14 approche sa fin de support au 12/11/2026. | Examiner d'abord l'instance existante. Si 16/17/18 supporté et adapté, pas de migration majeure imposée pour SMN. Pour une instance neuve, 18 est candidat, sans installation automatique. |
| Prisma ORM | Les pages lues sont explicitement celles de v7, même si le site propose aussi une génération v8. V7 : Node ^20.19/^22.12/^24, TypeScript 5.4+, Windows ; PostgreSQL 16/17/18 sont listés. | Prisma 7 est candidat pour un premier POC documenté, pas présenté comme dernière majeure. Vérifier correctif, adaptateur PostgreSQL, transactions et migrations avant décision finale. |
| Drizzle | Le guide PostgreSQL utilise node-postgres et montre actuellement des installations @rc ; les migrations SQL sont documentées. | Solution de comparaison si Prisma ne passe pas les contraintes. Ne pas reprendre les commandes @rc pour figer le socle SMN. |
| Better Auth | Installation documentée avec PostgreSQL, adaptateur Prisma et intégration Next ; la page affiche 1.7.11. Sessions stockées côté serveur et paramètres d'expiration documentés. | Candidat à qualifier, sans SaaS d'identité obligatoire. Vérifier la compatibilité exacte avec Prisma retenu et les garanties SMN avant choix final. |
| Playwright | La documentation annonce Node 24 et Windows 11 compatibles ; page.pdf produit un PDF à partir du rendu de page. | Candidat pour POC de rendu local et tests navigateur. Le téléchargement/lancement de Chromium et les règles du poste restent à vérifier. |

## 3. Contraintes Windows et migrations découvertes

**Prérequis Visual C++ :** la page système Prisma v7 mentionne Microsoft Visual C++ Redistributable 2015 ou ultérieur sur Windows. Cela ne prouve ni sa présence sur le poste ni que tous les modes de déploiement Prisma ont exactement le même besoin. Le vérifier pour la configuration choisie ; s'il manque et exige une élévation, ne pas imposer son installation à l'utilisateur. Examiner l'adaptateur et une alternative autorisée.

**Base temporaire de génération :** Prisma migrate dev utilise une shadow database. Sa création automatique PostgreSQL demande des droits de création de base ; une base dédiée peut être préconfigurée séparément. Elle doit être strictement distincte de la base métier. Les commandes de livraison migrate deploy/resolve n'utilisent pas cette base temporaire.

**Séparation à respecter :** création/génération des migrations dans un environnement de développement isolé ; application de migrations versionnées dans l'installation SMN. Le compte runtime n'a pas à recevoir CREATEDB ni des privilèges d'administration. Ne pas proposer migrate dev/reset comme procédure de démarrage sur les données utilisateur. Les migrations sont à relire, notamment pour contraintes PostgreSQL natives et opérations non transactionnelles.

**Packaging local :** Next documente l'exécution auto-hébergée par son serveur Node. Pour SMN, qualifier un build de production et un lancement loopback sous compte standard ; le succès éventuel de next dev seul ne suffira pas. La documentation n'atteste pas le passage des restrictions antivirus ou des droits effectifs du PC.

**Outils de sauvegarde :** PostgreSQL documente qu'un pg_dump plus ancien que la majeure serveur refuse la sauvegarde. Relever les versions des clients et du serveur ; préférer un ensemble cohérent, puis tester la restauration dans un emplacement isolé. La présence du client ne prouve pas la version serveur.

## 4. Contrat d'accès à qualifier

Pour le premier POC, examiner une bibliothèque d'authentification avec sessions conservées en PostgreSQL. La documentation Next recommande l'emploi d'une bibliothèque et distingue authentification, gestion de session et autorisation. Better Auth fait partie des intégrations citées.

Les décisions SMN priment sur les valeurs par défaut : pas d'inscription libre après amorçage ; comptes créés par l'Administrateur ; exactement deux profils ; aucun droit de mutation/génération du profil Utilisateur. Vérifier désactivation, révocation et changement de rôle sur la requête suivante ; éviter qu'un cache de session conserve les anciens privilèges. La documentation d'une bibliothèque n'est pas une preuve que ces cas fonctionnent dans SMN.

Secret initial à usage contrôlé, durée de session, limitation des tentatives, stratégie CSRF, stockage des secrets et récupération de l'administrateur restent à spécifier avant mise en service. Aucun mécanisme de récupération par courriel externe n'est présumé. Aucune valeur d'exemple d'une documentation n'est adoptée comme politique métier.

## 5. Points restants avant verrouillage

1. Relever Windows/architecture, Node et pnpm du PC SMN.
2. Relever version serveur PostgreSQL, outils clients et droits du compte dédié ; ne pas copier de mot de passe ou d'URL de connexion dans une réponse.
3. Vérifier les prérequis Windows, les téléchargements nécessaires et les droits réellement disponibles.
4. Qualifier les versions exactes et adaptateurs retenus, puis produire un lockfile lors de la construction autorisée.
5. Jouer les POC prévus et conserver les résultats ; les critères d'intégration et de sécurité n'ont pas encore été exécutés.

**C3 : partiellement instruite par les sources, non levée. C4 : ordre de réalisation à affiner avec les résultats. Verdict CONCERNS maintenu. Aucun sprint-status.yaml généré et aucune fusion.**

## 6. Sources officielles consultées

- Node : https://nodejs.org/en/about/previous-releases ; https://nodejs.org/en/blog/release/v24.22.0
- Next : https://nextjs.org/docs/app/getting-started/installation ; https://nextjs.org/support-policy ; https://nextjs.org/docs/app/guides/self-hosting
- React : https://react.dev/versions
- TypeScript : https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
- Bootstrap : https://getbootstrap.com/docs/5.3/getting-started/introduction/
- pnpm : https://pnpm.io/installation
- PostgreSQL : https://www.postgresql.org/support/versioning/ ; https://www.postgresql.org/docs/current/app-pgdump.html
- Prisma v7 : https://www.prisma.io/docs/orm/v7/reference/system-requirements ; https://www.prisma.io/docs/orm/v7/reference/supported-databases ; https://www.prisma.io/docs/orm/v7/prisma-migrate/understanding-prisma-migrate/shadow-database
- Drizzle : https://orm.drizzle.team/docs/get-started/postgresql-new ; https://orm.drizzle.team/docs/migrations
- Auth : https://nextjs.org/docs/app/guides/authentication ; https://better-auth.com/docs/installation ; https://better-auth.com/docs/concepts/session-management ; https://better-auth.com/docs/adapters/prisma
- PDF : https://playwright.dev/docs/intro ; https://playwright.dev/docs/api/class-page#page-pdf

**Confiance : élevée sur les observations documentaires datées ; moyenne sur la stack proposée tant que l'inventaire du poste et les POC ne sont pas réalisés.** Les recommandations d'assemblage et de priorisation sont une analyse SMN, pas une certification des éditeurs.
