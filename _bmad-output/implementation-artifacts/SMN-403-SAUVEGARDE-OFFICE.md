# SMN-403 — Sauvegarde des rapports Word/PowerPoint

**Jira :** https://lmn24.atlassian.net/browse/SMN-403  
**Statut :** En cours — recette CI Windows/Linux, puis validation fonctionnelle sur installation SMN réelle.

## Fonctionnement

Depuis **Rapports > Modèles**, l'utilisateur sélectionne un modèle, un sprint autorisé et la langue FR/EN. Le nom de sortie est proposé `nom du modèle - nom du sprint`, et reste éditable. Deux actions distinctes sont proposées :
- **Générer et télécharger** : comportement historique du navigateur conservé.
- **Enregistrer dans SMN** : sauvegarde dans un dossier Office dédié, sans création d'enregistrement en base.

Avant d'écrire, le navigateur demande au serveur si le fichier existe. S'il existe, une modale Bootstrap/Cockpit Agile affiche **le nom exact et le chemin de destination**, ainsi que deux actions **Annuler** et **Remplacer le fichier**. L'annulation n'appelle pas l'opération d'écriture.

## Dossier de sortie

- Par défaut Windows : `%LOCALAPPDATA%\ScrumMasterNotebook\office-reports`.
- Surcharge facultative `SMN_OFFICE_REPORTS_DIR` : chemin **absolu**.
- Le dossier de sortie est distinct de `office-templates`. Pas d'historique ni de version de rapport en PostgreSQL.
- Les fichiers `.docx` et `.pptx` héritent automatiquement de l'extension du modèle. Les chemins et noms Windows réservés sont refusés. Les liens symboliques directs de destination sont refusés.

## Protection contre la destruction de fichiers

1. La route de génération contrôle toujours session, équipe, sprint et modèle avant d'écrire.
2. Une vérification préliminaire du fichier en place renvoie au navigateur une **empreinte** (SHA-256 + longueur + date de modification), sans fournir ses octets.
3. Une sauvegarde exige une empreinte attendue, `absent` pour une nouvelle destination, ou celle de l'ancien fichier après confirmation.
4. Le serveur ouvre un verrou exclusif `wx` par nom de fichier entre opérations de SMN, recontrôle l'empreinte et crée le fichier à produire dans un temporaire adjacent `wx`, avec `fsync`.
5. Pour une destination absente, un lien dur `link` crée le fichier sans remplacer une destination apparue entre-temps ; un conflit renvoie HTTP 409.
6. Pour une destination préexistante, la promotion finale utilise `rename` après une seconde vérification d'empreinte ; une erreur ou un verrouillage bloque la promotion. Aucune écriture directe n'est faite dans le fichier existant et les temporaires sont supprimés.
7. En cas de conflit de version, l'interface impose de relancer la vérification et la confirmation au lieu d'écraser sans avis.

**Limite de garantie :** le verrou est **coopératif** : il sérialise les écritures SMN mais un logiciel externe ignorant ce verrou pourrait modifier le même fichier dans les microsecondes entre le dernier contrôle et le `rename`. Pour une preuve absolue contre cette course, une primitive de promotion native conditionnelle ou un verrouillage OS exclusif serait nécessaire. Le mécanisme documenté est une protection renforcée, pas une transaction CAS native.

**Périmètre de contrôle :** 20 Mio de sortie maximum, protection technique et erreur explicite. Les fichiers Windows verrouillés peuvent faire échouer `rename` : l'ancien rapport reste en place dans ce cas, mais un test avec le vrai Microsoft Office doit encore le confirmer.

## Sources

- [Stockage sécurisé](../../src/server/reports/office-storage.ts)
- [API de génération, vérification et sauvegarde](../../src/app/api/admin/reports/office-templates/generate/route.ts)
- [Interface et modale de confirmation](../../src/app/app/reports/office-template-catalog.tsx)
- [Tests](../../tests/smn-403-office-storage.test.ts)
- [CI dédiée Windows/Linux](../../.github/workflows/smn-403-office-storage.yml)

## Critères d'acceptation

- **CA-7.1 et 7.7 :** nom obligatoire, dossier autorisé, extension conservée, nom suggéré et modifiable.
- **CA-7.2 :** destination affichée et confirmation explicite en présence d'un fichier existant.
- **CA-7.3 :** annulation sans écriture, fichier initial inchangé.
- **CA-7.4 :** génération avant promotion, temporaire protégé, échec explicite, ancien fichier conservé lorsqu'une promotion n'a pas eu lieu.
- **CA-7.5 :** vérification finale par empreinte et verrou SMN, gestion de conflits ; reste la course avec un acteur externe non coopératif.
- **CA-7.6 :** aucune table ni nouvelle écriture PostgreSQL pour conserver un historique Office.

**Recettes restantes avant clôture :** CI complète, tests Windows 11 sur poste utilisateur et vrais fichiers verrouillés Microsoft Office, test intégré avec la base PostgreSQL locale et vérification manuelle de la confirmation. Aucune validation Microsoft Office réelle n'est présumée.
