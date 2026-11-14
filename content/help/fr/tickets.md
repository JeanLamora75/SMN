# Tickets : consulter et importer un CSV

## Accéder au module

- Ouvrez [Tickets](/app/tickets) après avoir sélectionné une équipe et un cycle dans SMN.
- Les onglets permettent de consulter les fichiers importés, de parcourir leurs tickets et, lorsque plusieurs photographies existent, de les comparer.
- L'import, le remplacement et la suppression de photographies sont réservés aux comptes autorisés et peuvent être indisponibles si le cycle est clôturé.

## Format CSV attendu

La première ligne du fichier doit contenir les **six noms de colonnes** suivants, sans les anciens libellés Jira :

`id,type,resume,priority,status,sp`

- **id** : identifiant du ticket.
- **type** : type du ticket.
- **resume** : titre ou résumé.
- **priority** : priorité.
- **status** : statut.
- **sp** : story points.

L'ordre peut varier si chaque colonne requise est présente une seule fois. Les colonnes supplémentaires sont acceptées selon le contrat de validation actuel. Les séparateurs reconnus sont la virgule, le point-virgule et la tabulation. Le fichier doit porter l'extension `.csv` et ne pas dépasser **8 Mio**, ni **20 000 tickets**.

## Importer une photographie

- Sur [Tickets](/app/tickets), sélectionnez un cycle disponible et cliquez sur **Importer CSV** si ce bouton est activé.
- Choisissez le fichier, puis renseignez sa date de référence.
- Dans la modale, dépliez les en-têtes requis si vous devez vérifier la structure.
- Lancez la validation. Corrigez toute colonne manquante, répétée, tout identifiant manquant/dupliqué, ou toute syntaxe CSV invalide.
- Si une photographie existe déjà à la même date, la confirmation de remplacement est obligatoire. Revérifiez la date et les données avant de confirmer.
- Une fois l'opération terminée, contrôlez la photographie dans la liste puis utilisez Consultation ou Comparaison.

## Dépannage

- **Bouton d'import désactivé** : vérifiez la sélection d'équipe/cycle, son état et vos permissions.
- **Fichier refusé** : vérifiez l'extension, la date, les six en-têtes techniques, les identifiants et les limites de taille.
- **Remplacement demandé** : une photographie existe à la date choisie. Le remplacement n'est jamais implicite.
- **Comparaison indisponible** : sélectionnez un contexte comportant au moins deux photographies.

La consultation de ce guide n'importe aucun fichier.
