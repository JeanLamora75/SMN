# SMN — Plan d'adoption du socle multilingue JSON (SMN-27)

**Préparé le 20 octobre 2026 — sans implémentation.**

Ce plan découle de la [décision ADR-I0-004](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md) et du [dossier de réalisation BMAD](../_bmad-output/implementation-artifacts/spec-smn-27-socle-i18n-json.md).

## Résultat attendu

SMN s'affiche intégralement en français ou en anglais selon une **préférence centralisée**, sans libellés dupliqués dans les composants :

```text
src/i18n/
  fr.json                 # Français, catalogue de référence
  en.json                 # Anglais, mêmes clés
  index.ts                # types, chargement, traduction, fallback
  ...                     # adaptateurs RSC/Client selon besoin
```

Les fichiers ci-dessus indiquent **l'organisation cible**, pas des fichiers créés.

## Décisions opérationnelles pour les agents

- Un JSON unique par langue. Conventions de clés `dashboard.title`, `auth.login.submit`, `errors.serviceUnavailable`. Les traductions d'UI et d'exports standardisés partagent les catalogues.
- Pour un écran serveur : obtenir la langue de requête puis le traducteur. Pour un écran client : transmettre uniquement les ressources de cette langue via props/contexte React ; ne pas réimplémenter la détection dans chaque formulaire.
- Langue d'installation initiale : `Accept-Language` avec `fr` par défaut. Après installation : colonne `locale` de SMN-18 consultée **sans mutation**. Respecter `<html lang>` et rafraîchir après sauvegarde.
- Conserver les API et droits actuels. Ne localiser **que les messages présentés** ; ne pas changer les codes d'erreur HTTP ou leurs contrôles de sécurité.
- Le contenu utilisateur, les versions et les archives conservent toujours leur langue d'origine ; seuls les libellés du document produit utilisent la langue de sortie.
- Définir d'abord des tests de parité JSON, placeholders et contrôle visuel des routes ; réaliser la migration par lots afin de réduire les risques. Aucune nouvelle bibliothèque imposée au MVP, sauf nécessité démontrée.

## Ordre de migration prioritaire

1. Socle et tests i18n.
2. Résolution de la locale (installation vs préférence enregistrée) et attribut `html[lang]`.
3. Accueil, installation, connexion et changement de mot de passe.
4. Tableau de bord, navigation et sécurité.
5. Comptes utilisateurs et paramètres généraux.
6. Intégration des prochains modules Scrum/Kanban et futurs exports à mesure de leur développement.

Le développement sera considéré terminé seulement si tous les parcours FR/EN fonctionnent, si les clés sont complètes, si la CI s'exécute et si les régressions d'installation, d'accès et de stockage sont écartées. La recette sur le PC personnel sera à organiser ensuite.

**Points de vigilance existants :** la page racine choisit actuellement la langue navigateur, même lorsque `locale` est sauvegardée ; des textes restent codés en dur, et le formulaire de paramètres référence par erreur SMN-24 pour la langue, au lieu de SMN-27.

**Blocages à surveiller :** Stories Jira SMN-12 et SMN-18 « En cours », SMN-22 « À faire » ; et CI GitHub Actions des développements SMN-19 échouant sans runner attribué. Ne pas changer automatiquement ces statuts sans preuve.
