# SMN-430 — Recette Windows et preuves de distribution

**Epic :** SMN-424 · **Responsable :** Amelia · **Date :** 10 novembre 2026 · **État :** code et protocole publiés ; recette complète non qualifiée.

## Inventaire des modifications

| Source | Résultat vérifiable |
|---|---|
| `scripts/windows/create-delivery-evidence.mjs` | Produit `*.zip.sha256` et `*.zip.evidence.json` : taille exacte, SHA-256, commit, run CI |
| `scripts/windows/verify-delivery.mjs` | Contrôle hors ligne du triplet ZIP/preuve/checksum, sans extraction ni élévation |
| `tests/update-delivery.test.mjs` | Tests de corruption, taille incohérente, manifeste de preuve et checksum invalides |
| `tests/update-import.test.mjs` | Tests additionnels de journal interrompu, collision et original manquant ; aucune altération de `data/postgres` |
| `.github/workflows/portable-package.yml` | Écrit et revérifie les preuves du ZIP d'installation initiale, les publie comme artefacts du run |
| `.github/workflows/update-package.yml` | Tests de livraison sur Windows ; écrit et revérifie les preuves du ZIP de mise à jour signé, les publie comme artefacts du run |
| `scripts/windows/package-portable.mjs` | Le vérificateur de transport est livré avec le paquet Windows |
| `scripts/windows/verify-package.mjs` | Vérifie la présence du vérificateur dans le paquet |
| `docs/SMN-430-GUIDE-WINDOWS-ET-RECETTE.md` | Procédure transport, installation, mise à jour, récupération, recette et sécurité |

## Matrice d'acceptation — état réellement prouvé

| AC | Attente | Preuve disponible | Verdict |
|---|---|---|---|
| AC1 | Installation Windows 11 x64 sans admin | CI Windows initiale existante ; essai compte utilisateur de l'entreprise non réalisé | **PARTIEL** |
| AC2 | Mise à jour mineure ET migration PostgreSQL avec données | Contrats de mise à jour v33 → v33 ; absence de moteur de migration dans les ZIP SMN-429 | **BLOQUÉ** |
| AC3 | ZIP corrompu, incompatibilité, plein disque, fichier verrouillé, interruption | ZIP hostile et scénarios de récupérations simulées ; disque plein et verrou Windows réel non qualifiés | **PARTIEL** |
| AC4 | Données, sauvegarde, Word/PPT, fonctionnalités métier | Contrats de conservation des chemins et sauvegarde SMN-428 ; comparaison avant/après complète non exécutée | **PARTIEL** |
| AC5 | Preuve CI, empreinte, taille exacte, bilan | Mécanismes de génération et de vérification publiés ; un paquet n'est attesté que lorsque son run CI est vert et ses artefacts présents | **À QUALIFIER** |
| AC6 | Guide installation, update, récupération et recette distincte | Guide complet versionné avec contrôles PowerShell sans droits administrateur | **DOCUMENTÉ** |

## Qualification à exécuter

- Contrôler les runs `portable-package.yml` et `update-package.yml` au **dernier commit** qui les contient, pas au commit d'un run antérieur.
- Conserver les artefacts exacts, la taille, le SHA-256 et l'ID du run dans le procès-verbal.
- Sur une installation jetable, vérifier l'évolution de version, la sauvegarde et la restauration avec une base peuplée : équipes multiples, indicateurs v33, archives historiques, documents Office Word/PPT et PDF.
- Tester les échecs réels en environnement isolé : ACL/antivirus, fichier ouvert, espace insuffisant, interruption de la bascule.
- Compléter SMN-429 avec un parcours **explicitement autorisé et versionné de migration PostgreSQL** avant de cocher l'AC2 de SMN-430.
- Faire valider séparément le résultat sur le Windows 11 d'entreprise sans élévation, notamment ses politiques d'exécution et de transfert.

## Restrictions de preuve

- Aucun script `uv` exécuté.
- Aucune exécution sur le PC de l'utilisateur ni sur ses données.
- Aucun succès CI affirmé tant que GitHub Actions ne retourne pas la conclusion `success`.
- La création d'un `*.evidence.json` ne certifie pas indépendamment l'origine du paquet : l'authenticité dépend du run CI consulté et, pour un ZIP de mise à jour, de sa signature Ed25519 vérifiée par une clé déjà approuvée.
- La vérification cryptographique et l'absence d'altération de `data/` ne remplacent pas une véritable recette de sauvegarde/restauration.

**Décision actuelle :** conserver SMN-430 ouverte. Ne pas conclure « livrée et qualifiée » avant les essais Windows, les résultats CI et la migration réelle.
