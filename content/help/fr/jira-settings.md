# Lien Jira : retrouvez les tickets importés depuis leur identifiant

Lorsque vous importez un fichier CSV de tickets dans SMN, les lignes contiennent généralement un identifiant tel que `ABC-123`. Le réglage **Lien Jira** permet de transformer cet identifiant en **lien cliquable vers le ticket d'origine**, sans synchroniser SMN avec Jira.

> **Bon réflexe :** choisissez l'adresse de base de votre instance Jira et vérifiez l'exemple proposé avant d'enregistrer. Le lien ne sera utile que si les personnes qui le consultent disposent aussi des droits d'accès sur Jira.

## 1. Quel est l'intérêt de ce réglage ?

Après un import CSV dans le module Tickets, SMN utilise l'identifiant de chaque ticket pour reconstruire son URL. Vous pouvez ainsi consulter le ticket directement sur Jira, au lieu de le rechercher manuellement.

**Exemple :** avec une adresse de base telle que `https://exemple.atlassian.net`, SMN peut former un lien vers `https://exemple.atlassian.net/browse/ABC-123`.

Ce réglage **ne télécharge pas les tickets**, ne vérifie pas leur existence dans Jira et ne met pas automatiquement à jour les données CSV importées.

## 2. Quel champ faut-il renseigner ?

La page contient un champ principal : **URL de base Jira**.

Saisissez l'adresse de votre instance ou site Jira, et non l'adresse complète d'un ticket. Le formulaire contrôle le format de l'URL et propose un **aperçu du lien** construit pour un identifiant d'exemple.

La commande **Effacer** vide le champ ; **Recharger** relit la configuration enregistrée. **Enregistrer** n'est disponible que lorsqu'une modification valide est détectée.

## 3. Configurez le lien étape par étape

1. Ouvrez [Paramètres → Lien Jira](/app/admin/settings/jira) avec un compte administrateur.
2. Renseignez l'**URL de base** de votre site Jira.
3. Examinez l'**aperçu** : le lien proposé doit utiliser le bon domaine et le chemin du ticket.
4. Cliquez sur **Enregistrer** et vérifiez le message de confirmation.
5. Ouvrez le [module Tickets](/app/tickets), sélectionnez une photographie CSV et testez le lien d'un ticket importé.

> **Conseil :** si vous changez d'instance Jira, mettez à jour cette adresse avant de partager des rapports ou d'utiliser les liens des tickets.

## 4. Si un lien ne fonctionne pas

- **Le champ est refusé :** vérifiez que l'adresse est complète et au format URL valide.
- **Le lien pointe sur le mauvais Jira :** corrigez l'adresse de base, puis contrôlez l'aperçu.
- **Le ticket n'est pas accessible :** vérifiez son identifiant `id` dans le CSV et vos permissions sur Jira.
- **La configuration ne s'enregistre pas :** si un conflit de modification est signalé, utilisez **Recharger** avant de recommencer.

## Votre point de contrôle

L'aperçu pointe vers la bonne instance et un ticket importé s'ouvre sur le bon site Jira. **C'est tout ce que configure cette page** : la collecte et l'historisation des tickets restent gérées dans le module Tickets / CSV.
