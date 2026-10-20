# Epic 1 Context: Initialiser et utiliser un espace SMN privé

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Mettre à disposition une installation locale privée de Scrum Master Notebook utilisable sur Windows 11 sans privilèges Windows élevés, avec une entrée d'initialisation contrôlée, deux profils au MVP, des accès sécurisés côté serveur et une interface bilingue, responsive et exploitable au quotidien. La création initiale de la base dédiée est prise en charge par l'installation lorsque les droits PostgreSQL le permettent ; aucun accès métier n'est présenté comme fonctionnel avant les vérifications de persistance et d'accès.

## Stories

- Story 1.1: Démarrer SMN localement et vérifier les prérequis
- Story 1.2: Initialiser une installation Express et son Administrateur de manière sûre
- Story 1.3: Accompagner l'initialisation avec un parcours Guidé facultatif
- Story 1.4: Se connecter, se déconnecter et protéger les sessions
- Story 1.5: Créer et administrer les comptes des utilisateurs
- Story 1.6: Faire respecter la matrice Administrateur / Utilisateur côté serveur
- Story 1.7: Révoquer les accès compromis et renouveler son mot de passe
- Story 1.8: Modifier les paramètres généraux sans réécrire l'historique
- Story 1.9: Protéger la configuration privée et les secrets de l'application
- Story 1.10: Suivre les tâches facultatives de configuration depuis le tableau de bord
- Story 1.11: Afficher un tableau de bord fiable et contextualisé par équipe
- Story 1.12: Naviguer entre les grandes fonctions selon son mode et son rôle
- Story 1.13: Conserver le contexte lors des navigations vers les fiches liées
- Story 1.14: Choisir le français ou l'anglais pour l'interface
- Story 1.15: Personnaliser l'apparence avec thèmes clair et sombre
- Story 1.16: Utiliser le socle de SMN sur ordinateur, tablette et smartphone
- Story 1.17: Avertir avant perte de saisie et afficher le résultat réel des sauvegardes
- Story 1.18: Ne transmettre que les informations collectives autorisées aux vues et documents

## Requirements & Constraints

- Usage initial sur PC personnel et navigateur, sans Docker, IDE ni élévation Windows imposés. La session Windows ordinaire doit pouvoir démarrer le service local et obtenir une URL ouvrable.
- MVP limité aux modes Scrum et Kanban, choisis une fois par installation, avec un produit fixe et une seule équipe. SAFe et les ART sont différés.
- Une installation vierge peut présenter une initialisation Express et facultativement guidée ; démarrer le serveur ne crée ni équipe, ni Sprint, ni période. Une installation déjà initialisée ne doit exposer ni assistant anonyme ni données privées.
- Deux profils exactement : Administrateur (Scrum Master) et Utilisateur. Les comptes techniques sont indépendants des membres de l'équipe ; seuls les administrateurs réalisent des mutations. L'Utilisateur accède aux informations collectives et au téléchargement de rapports autorisés, jamais aux données individuelles sensibles.
- Les contrôles d'identité et de privilège doivent être exécutés côté serveur, y compris contre les accès directs aux URL, fichiers et API. Une erreur de connexion ou de migration bloque le parcours métier, sans faux succès.
- Session : 8 h de durée absolue maximale, 30 minutes d'inactivité, aucune mémorisation durable. Une récupération locale du compte administrateur est prévue sans créer de second admin et avec révocation des sessions ; les mécanismes restent à qualifier.
- Diagnostic lisible et relançable des prérequis et des échecs, sans affichage, fichier public ou journal de mot de passe, URL avec identifiants ou secret.
- Interface en français et anglais, Bootstrap 5.3 (sans Tailwind), utilisable clavier et responsive sur ordinateur, tablette et smartphone ; thèmes clair et sombre.

## Technical Decisions

- Monolithe modulaire TypeScript ; Next.js 16 App Router, React 19, Node.js 24 LTS, pnpm, Bootstrap 5.3 ; PostgreSQL et Prisma ORM 7 ; Better Auth avec sessions stockées dans PostgreSQL. Les versions exactes restent à verrouiller par essais I0.
- Couche domaine indépendante des frameworks, de l'ORM et des adaptateurs ; pas de service NestJS séparé. Les autorisations métier s'appliquent côté serveur, non uniquement dans les composants de présentation.
- Serveur PostgreSQL 18.6 rapporté par résultat utilisateur de `SHOW server_version;`; Node 24.21.0 et pnpm 12.10.0 déclarés. Ces versions ne constituent ni validation des dépendances réelles ni tests Windows.
- Base de données dédiée à SMN ; le programme d'installation doit diagnostiquer les droits, présenter la cible et demander confirmation avant création. Aucun droit CREATEDB présumé, aucune création de rôle ou élévation automatique. Reprise explicite si droits insuffisants, base existante ou état partiel.
- Migrations versionnées générées sur base de développement séparée, appliquées dans l'ordre et sous contrôle, sauvegarde préalable si données existantes modifiées ; détecter schéma incompatible et interrompre l'accès métier.
- Distinguer les privilèges de création/migration des droits du runtime. Mettre secrets et clé locale dans un dossier privé hors Git, jamais dans les sorties de diagnostic. Ne pas toucher aux autres bases, dont LMN24.
- Validation progressive du POC Windows/PostgreSQL, des protections serveur et des mécanismes de reprise. Les démonstrations de PDF et de restauration sont réservées aux capacités I0 correspondantes.

## UX & Interaction Patterns

- L'utilisateur ouvre une URL locale compréhensible ; première visite avant initialisation propose d'amorcer l'installation après diagnostic, puis connexion obligatoire.
- Messages d'erreur explicites avec action de relance, sans prétendre que la base ou l'installation est prête avant vérification ; confirmation préalable des opérations structurantes.
- L'interface doit préserver la saisie en cas d'erreur et informer du résultat réel d'une sauvegarde, avec affichage adapté au rôle et au mode Agile.

## Cross-Story Dependencies

- Démarrage et vérification des prérequis (1.1) précèdent l'amorçage (1.2), qui précède les parcours d'accès authentifiés (1.4 à 1.7). Les principes de secrets, migrations et permissions sont transverses dès le premier travail.
- Les capacités 1.2/1.3 définissent et créent l'installation ; aucune implémentation superficielle en 1.1 ne doit rendre l'amorçage anonyme utilisable après une initialisation.
- Les données sensibles nécessaires au reste du MVP et les exports relèvent des contrôles de confidentialité du socle ; l'implémentation complète des rapports et des sauvegardes appartient à d'autres Epics.
