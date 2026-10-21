# SMN-52 — Administration des catégories d’absence

[Story Jira SMN-52](https://lmn24.atlassian.net/browse/SMN-52) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-52-categories-absences.md) · [Absences individuelles SMN-53](ABSENCES-INDIVIDUELLES-SMN-53.md)

## Utilisation

Ouvrir **Administration → Membres → Gérer les catégories d’absence** (ou accéder au même lien depuis le calendrier individuel d’un membre). Seul l’Administrateur peut lire et modifier ce catalogue.

Les quatre catégories intégrées lors de SMN-53 sont déjà disponibles : **Congés**, **Formation**, **Maladie** et **Autre**. Chacune a une couleur et un statut actif.

- **Ajouter** : saisir un nom obligatoire et une couleur `#RRGGBB` (sélecteur visuel disponible) puis **Créer la catégorie**. Une nouvelle catégorie est active immédiatement.
- **Modifier** : choisir **Modifier** sur une ligne, changer le nom et/ou la couleur puis **Enregistrer les modifications**.
- **Désactiver** : décocher **Catégorie active**, enregistrer. L’ancienne catégorie reste visible dans l’historique mais disparaît des choix proposés pour une nouvelle absence.
- **Réactiver** : choisir la catégorie inactive, cocher l’activation et enregistrer. Elle redevient sélectionnable.

Les noms sont distincts sans tenir compte de la casse (une seconde catégorie « congés » est refusée si « Congés » existe). Une édition concurrente demande de recharger les valeurs avant d’enregistrer. L’interface signale le nombre d’absences référençant chaque catégorie.

## Conservation des absences anciennes

Une absence référence l’identifiant durable de sa catégorie, **pas une copie du nom ou de la couleur**. Lorsque l’Administrateur modifie la catégorie, les calendriers dynamiques (y compris les absences passées) reflètent les nouvelles valeurs après rechargement. Le motif d’absence reste inchangé.

Il n’existe **aucune action de suppression définitive**. Le schéma PostgreSQL v19 empêche de détruire une catégorie utilisée (`ON DELETE RESTRICT`) ; la désactivation ne fait aucune suppression. Les anciens PDF et les capacités initiales figées ne sont pas modifiés.

La catégorie **Maladie** n’invite pas à saisir un diagnostic médical. Utiliser un nom/motif générique, par exemple « Indisponibilité », dans le formulaire d’absence.

## Schéma et traçabilité

Le catalogue exploite le schéma **v19 existant** de SMN-53 : aucune migration supplémentaire. Le serveur réalise les opérations sous transaction, contrôle l’existence d’une catégorie et sa date de dernière modification, et empêche les créations concurrentes portant un nom identique. La création d’une absence verrouille la catégorie lue (`FOR SHARE`) pour tenir compte de sa désactivation sans course.

Le registre `smn_member_absence_history` continue de tracer les modifications d’absences, pas les changements de nom/couleur du catalogue. Le catalogue ne conserve que son `updated_at` courant ; une piste d’audit complète des renommages serait une évolution distincte à décider.

## Recette locale — environnement isolé

Synchroniser `main` et démarrer une **base pilote PostgreSQL 18.6** (pas la base personnelle sans sauvegarde). Vérifier d’abord les commandes disponibles :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Dans l’administration des membres, vérifier successivement : présence des quatre catégories et de leurs couleurs, création d’une catégorie personnalisée, refus du nom/couleur vide et d’un code couleur erroné, refus de nom identique avec casse différente, renommage/recoloration d’une catégorie déjà utilisée, mise à jour de sa couleur/son nom dans une ancienne absence après rechargement sans modification du motif, désactivation puis impossibilité de choisir la catégorie pour une nouvelle absence, visibilité des anciennes absences et réactivation, absence de bouton/route DELETE, saisie Maladie sans diagnostic, accès refusé en lecture/écriture au non-Administrateur (403), conflit d’édition depuis deux fenêtres (409).

**État :** tests de contrat rédigés ; exécution locale, intégration PostgreSQL/HTTP et recette navigateur non réalisées dans cette session. GitHub Actions exclu par politique SMN. La Story reste **En cours** et l'artifact BMAD `review` tant que les preuves de recette ne sont pas apportées.
