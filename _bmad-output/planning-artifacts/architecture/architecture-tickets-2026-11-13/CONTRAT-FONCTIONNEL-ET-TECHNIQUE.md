# SMN — Module Tickets : contrat fonctionnel et technique

**Date :** 13 novembre 2026  
**Statut :** cadrage général validé ; architecture de proposition ; détails UX et règles complémentaires à arbitrer  
**Référence normative :** [ARCHITECTURE-SPINE.md](ARCHITECTURE-SPINE.md) ; architecture principale BMAD conservée.

## 1. Parcours attendu

1. Dans la navigation privée, l'utilisateur ouvre **Tickets** ; le sprint Scrum ou la période Kanban sélectionné dans le header est présélectionné.
2. La page présente les **photographies CSV** de ce cycle, ordonnées par date métier, avec leur date réelle d'import.
3. L'utilisateur autorisé importe un CSV au format contraint ; SMN vérifie sa validité, demande ou conserve la **date métier** choisie (qui peut être antérieure au dépôt), et publie le CSV avec son fichier JSON.
4. L'utilisateur consulte la liste des tickets d'une photographie, avec tri, filtres, regroupements, somme de Story Points, comptes par type et par préfixe Jira.
5. L'utilisateur compare **deux** photographies du même cycle ; la plus récente est confrontée à la plus ancienne, selon les dates métier : ajoutés, retirés, terminés, rouverts et modifications selon colonnes effectivement disponibles.
6. Un bouton **Indicateurs** ouvre une modale Cockpit Agile pour la **saisie manuelle** des indicateurs du cycle, sans source automatique CSV.
7. Les listes, totaux et comparaisons sont mobilisables depuis les rapports Word et PowerPoint par les mécanismes de projection Office SMN.
8. Dans Paramètres, une URL Jira validée permet de générer les liens des tickets à partir des clés Jira ; aucune connexion distante Jira n'est exigée.

## 2. Règles temporelles

- Une photographie décrit l'état des tickets **à la date métier attribuée par l'utilisateur**, indépendamment de sa date d'import réelle.
- Chaque import garde une trace de sa véritable date/heure d'arrivée.
- Les résultats d'une photographie ne doivent **jamais être automatiquement additionnés** à ceux d'autres photographies du même cycle.
- Le défaut de consultation envisagé est la dernière photographie **par date métier**, sans faire de cette proposition une règle définitive.
- Pour toute comparaison, si les dates métier sont identiques, le comportement est **à arbitrer**.
- L'absence dans le second CSV signifie « absent de la photographie » ; ce n'est **pas** une preuve de suppression du ticket dans Jira.

## 3. Format des données — modèle provisoire

**Format CSV :** colonnes fixes, en-têtes exacts et types à déterminer avec le métier. Les candidats identifiés (non encore validés comme schéma) sont : `Jira Key`, `Summary`, `Issue Type`, `Status`, `Story Points`, `Assignee`, `Priority`.

**Identifiant Jira :** chaîne de type `PREFIXE-123` ; extraire le préfixe précédant le tiret et le numéro suffixe ; ne pas supposer qu'un préfixe correspond à une équipe SMN.

**Métadonnées JSON proposées :** version du schéma, identifiant de photographie, identifiants équipe et cycle, mode Scrum/Kanban, nom d'origine, date métier, date/heure d'import réelle, utilisateur importateur si autorisé, nombre de lignes, empreinte SHA-256 du CSV. Ce modèle n'est pas un contrat public figé.

**Stockage :** `<data-root>/tickets/<team-id>/<cycle-id>/<snapshot-id>.csv` et `<snapshot-id>.metadata.json` ; noms et dates déclarés non utilisés comme segments de chemin.

## 4. Comparaison — sémantique métier proposée

| Cas | Règle de détection |
|---|---|
| Ajouté | Clé absente de l'ancienne photographie et présente de la nouvelle |
| Retiré | Clé présente dans l'ancienne et absente de la nouvelle |
| Terminé | Même clé présente dans les deux, transition d'un état non terminé vers terminé |
| Rouvert | Transition d'un état terminé vers non terminé |
| SP modifiés | Même clé, variation des Story Points valides |
| Autres changements | Même clé, colonnes modifiées parmi celles retenues dans le CSV définitif |

La liste des **statuts terminés** est une décision fonctionnelle ouverte. Les catégories peuvent se chevaucher (exemple : ticket terminé avec SP modifiés) ; les métriques doivent expliciter leur définition et ne pas additionner indistinctement des catégories non exclusives.

## 5. Indicatifs d'intégration au projet vérifiés

- **Navigation :** `src/lib/private-navigation.ts`, `src/app/app/private-navigation.tsx` et `src/app/app/private-shell.tsx`. Le contexte de cycle actuellement propagé au header doit être étendu à /app/tickets et non simplement copié.
- **Validation CSV :** `src/lib/historical-csv-validator.ts` est dédié aux imports historiques d'indicateurs ; créer un validateur tickets autonome, sans détourner son contrat.
- **Rapports :** `src/lib/report-data-contract.ts` et `src/app/app/reports/` servent de points d'intégration. Exiger une projection commune versionnée et identifier la source CSV précise.
- **Indicateurs :** intégrer la modale aux permissions et aux opérations de saisie manuelle du moteur v33, sans création de pont d'alimentation.
- **Distribution Windows :** traiter le répertoire comme donnée persistante, préserver lors d'une mise à jour ; inclure dans l'archive de sauvegarde/restauration.
- **Internationalisation :** textes FR/EN via ressources JSON, pas de libellés codés en dur.

## 6. Tests à prévoir dans les futures Stories

- CSV invalide, mauvais encodage/en-tête, clé dupliquée, SP non numérique, fichier malveillant et limites.
- Dates métier historiques, collision de dates, tri des photographies, différence date réelle/date métier.
- Concurrence d'import, interruption au milieu de l'écriture, nettoyage des temporaires, empreintes.
- Cycle inexistant, équipe non autorisée, droits en lecture/écriture/téléchargement, traversée de chemin, aucune lecture hors racine privée.
- Ajout/retrait/terminaison/réouverture et agrégations déterministes, dont comptage par préfixe.
- Même résultat entre tableau UI, comparaison et rapports ; aucune écriture SQL de tickets et aucune modification d'indicateur v33 depuis une analyse CSV.
- Sauvegarde et restauration hors ligne vers une seconde installation Windows, avec fichiers et métadonnées inchangés.

## 7. À valider avec Sally / produit avant US Jira

Schéma CSV exact ; statut de terminaison ; droits de suppression et traitement des cycles clôturés ; collisions de dates ; limites et performance ; format des exports Office ; sélection des photographies ; nommage/stockage par équipe/instance ; gestion éventuelle de plusieurs URL Jira ; ergonomie Cockpit Agile.

**Pas de développement, test, migration SQL, modification Jira ou validation BMAD officielle réalisé par ce document.**

## Avenant décisionnel — 13/11/2026 : colonnes et gestion des fichiers (validé)

Les six colonnes du CSV sont **obligatoirement**, dans cet ordre : **Id jira**, **Type de ticket**, **Titre du ticket**, **Priorité**, **Statut**, **Story points**. Aucune autre colonne n'est exigée dans le contrat initial. L'orthographe/casse et le séparateur/format numérique seront précisés dans la Story de validation ; conserver ces intitulés fonctionnels exacts comme référence. L'identifiant Jira est une clé ticket `PREFIXE-NUMERO` ; le préfixe permet les regroupements.

**Un fichier par date métier et par équipe/cycle.** À l'upload, si une photographie existe déjà pour la date choisie, **demander confirmation explicite du remplacement** dans une modale Cockpit Agile, avec date et fichier concerné. Si l'utilisateur annule, le CSV et JSON existants restent inchangés ; s'il confirme, valider entièrement le nouveau CSV puis remplacer atomiquement la paire CSV+JSON. L'horodatage réel d'import du nouveau fichier doit correspondre à l'opération effective. Ne jamais exposer une paire partielle ou perdre le fichier précédent à la suite d'un échec. Les modalités de journalisation/audit de l'ancienne version restent à vérifier auprès des services existants.

**Suppression autorisée depuis la liste des fichiers**, par action de ligne et confirmation explicite dans une modale Cockpit Agile mentionnant la date métier et le fichier. Supprimer la photographie CSV et son JSON de façon cohérente, avec contrôle des permissions serveur et rafraîchissement de la liste. Les règles en cas de sprint clôturé et la politique d'audit/récupération restent à valider avec l'architecture existante.

Ces décisions **remplacent** les mentions antérieures « colonnes à décider », « collisions de date à arbitrer », « suppression à arbitrer » dans ce document. Elles ne valident pas les autres décisions ouvertes (statuts terminés, performance, droits sur cycle clôturé, etc.).

## Avenant fonctionnel — 13/11/2026 : statut, souplesse des colonnes, clôture

1. Une valeur de **Statut** égale à **Done** ou **Terminé** est considérée comme terminée. Lors de la comparaison, un ticket présent dans les deux photographies devient « terminé » s'il passe d'un autre statut à l'une de ces valeurs ; le cas inverse est une réouverture.
2. Les six champs métier annoncés restent la référence. **Aucune contrainte métier supplémentaire n'est imposée sur les valeurs des colonnes** : ne pas figer la liste des types de tickets, des priorités ou des statuts, ni inventer de limite de Story points. Les calculs utilisent les valeurs interprétables et signalent les données non interprétables sans les assimiler à zéro. La rigidité exacte des noms/ordre des en-têtes précédemment rédigée reste à réconcilier avec la demande de souplesse.
3. **Suppression interdite pour un sprint clôturé** : aucune action Supprimer dans la liste pour ce sprint ; refus impératif de l'API même en cas d'appel direct. Le motif doit être compréhensible. Cette règle s'applique au CSV et au JSON, et concerne le statut réel du sprint côté serveur, non un statut transmis par le navigateur.

Les dispositions antérieures contradictoires sur les contraintes de colonnes et l'ouverture des droits de suppression sont remplacées par cet avenant.
