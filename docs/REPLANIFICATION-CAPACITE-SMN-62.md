# SMN-62 — Prévisualiser une replanification de capacité

[Jira SMN-62](https://lmn24.atlassian.net/browse/SMN-62) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-62-replanification.md)

## Depuis l'écran Administrateur

Ouvrir **Calendrier d'équipe → Calculer la capacité en JH**, sélectionner la période d'origine et demander le calcul. Le bloc **Prévisualiser une replanification** permet de saisir une nouvelle date de début et de fin, puis de cliquer sur **Prévisualiser les effets**.

Le tableau affiche **Avant / Après** : dates, références calculées en JH et capacité prévisionnelle retenue. L'écart JH n'apparaît **que lorsque les deux références sont fiables**. Sinon, il apparaît « Non calculable », jamais 0 par défaut. La valeur **initiale figée** reste visible séparément, sans être réécrite.

Si la période d'origine contient une saisie manuelle de 32 JH et que le calcul passe de 30 à 28 JH, la proposition montre **32 JH retenus**. Une saisie manuelle de 0 JH demeure 0, même si la référence augmente. La valeur du réalisé manuel est également affichée séparément : le moteur ne la convertit jamais en nouvelle capacité prévisionnelle.

**Aucune donnée n'est enregistrée lors de la prévisualisation.** Si la période est clôturée, si une autre période utilise déjà les dates cibles, si la période proposée est identique ou si une référence requise n'est pas calculable, le bouton de confirmation est bloqué. En cas de changement des données depuis la prévisualisation, la confirmation refuse la sauvegarde et demande un nouveau calcul.

**Confirmer cette replanification** enregistre les nouvelles bornes dans un **registre de replanification de capacité**, ainsi que son audit atomique. Cela **ne modifie pas un cycle Scrum ou Kanban opérationnel** : les futures Stories des Epics 4/7 connecteront ce registre aux véritables cycles et à la procédure de réouverture autorisée. Cette confirmation ne modifie pas les anciens PDF, les capacités manuelles, les archives initiales ou les réalisés clôturés.

## Recette locale Windows / PostgreSQL 18.6 — non exécutée

Synchroniser `main`, sauvegarder une base pilote, puis vérifier la migration **v25 → v26**. Exécuter :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Tester : référence Avant 30 / Après 28 ⇒ delta −2 JH ; initiale figée 40 inchangée ; manuel prévu 32 ou 0 et réel 17 conservés après confirmation ; absence de toute écriture au GET ; référence manquante ⇒ delta absent et confirmation impossible ; modification manuelle ou absence entre prévisualisation et confirmation ⇒ conflit et rollback ; période clôturée ⇒ HTTP 423 ; destination déjà utilisée ⇒ HTTP 409 ; rejeu d'un événement après sauvegarde ⇒ une seule trace ; aucune mise à jour de PDF ni de snapshot. Tester également une période uniquement calculée : elle ne crée sa ligne technique qu'après confirmation.

**Restent à valider** : compilation, tests réels, migration PostgreSQL, accès HTTP et recette navigateur. GitHub Actions reste hors circuit. Jira En cours et BMAD review tant que la recette n'a pas apporté de preuves.
