# SMN-43 — Compléter une fiche membre

[Lien Jira](https://lmn24.atlassian.net/browse/SMN-43) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-43-fiche-centrale-membre.md)

Dans **Administration → Membres de l'équipe**, après la création initiale SMN-42, cliquez sur **Modifier la fiche** à côté d'un membre.

Vous pouvez renseigner ou corriger son **nom**, ainsi qu'une **adresse e-mail facultative**. Si vous modifiez le nom provisoire « Membre 2 » pour un nom réel, la fiche devient « Confirmée ». Ajouter uniquement une adresse e-mail à une fiche provisoire ne la confirme pas.

L'e-mail peut être laissé vide, ajouté plus tard, modifié ou supprimé. Il demeure attaché à la même identité centrale ; SMN ne crée aucun compte de connexion ou e-mail sortant. Les autres membres, leurs affectations datées et les calendriers ne changent pas.

Une sauvegarde réussie affiche la nouvelle valeur, qui persiste après rechargement. En cas d'édition concurrente, SMN refuse l'écriture et demande de recharger la liste, plutôt que d'écraser silencieusement l'autre modification.

**Confidentialité :** le référentiel individuel, dont les e-mails, reste réservé aux Administrateurs par les vérifications du serveur. Un Utilisateur n'a pas accès à l'écran ou à l'API des membres ; la fiche collective d'équipe ne montre pas les e-mails.

**Capacité :** la fiche peut conserver les pourcentages de référence déjà initialisés, mais ne produit ni JH calculés ni KPI de cycle. Les calendriers et affectations détaillées seront gérés dans les Stories ultérieures.

## Recette sur Windows 11

Sur une installation pilote, récupérer `main` via GitHub Desktop puis exécuter :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier ensuite : création d'un membre provisoire ; nom confirmé et identifiant conservé ; e-mail absent, valide puis vidé ; e-mail invalide refusé ; profil Utilisateur refusé ; affectation/datation intactes ; statut et données conservés après changement de page et rechargement.

**Migration :** version PostgreSQL du schéma de 9 à **10**, additive. Tester les migrations sur une installation pilote et disposer d'une sauvegarde indépendante préalablement qualifiée avant application à des données importantes.
