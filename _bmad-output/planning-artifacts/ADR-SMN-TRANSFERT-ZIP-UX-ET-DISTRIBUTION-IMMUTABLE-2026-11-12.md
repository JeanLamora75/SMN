# ADR — Transfert SMN par ZIP via interface, distribution fiable (12 novembre 2026)

## Décision utilisateur impérative

SMN doit permettre **sans PowerShell, terminal, IDE, ni commandes techniques** :

1. **PC source** → Paramètres / Sauvegardes → « Exporter vers un autre PC » : télécharger un **ZIP unique**, contenant une archive complète chiffrée, ses preuves d'intégrité et les informations de compatibilité.
2. **PC cible** → Paramètres / Sauvegardes → « Importer depuis un autre PC » : sélectionner ou déposer le ZIP, donner la phrase de récupération dans une interface sécurisée, voir les contrôles et l'impact, confirmer, laisser SMN gérer la reprise, la vérification, le retour arrière et la réauthentification.
3. Les données restaurées comprennent les équipes, membres nommés légitimement présents, affectations, calendriers, cycles, registres, indicateurs, réglages métier, rapports Office et documents. Aucun effacement irréversible démontré n'est réintroduit.

**Aucune procédure d'exploitation en lignes de commande n'est un parcours utilisateur admissible.** Les opérations techniques internes peuvent être déclenchées par un superviseur propre au lanceur Windows, jamais présentées à l'utilisateur.

## Sécurité / architecture

- ZIP authentifié, format borné, manifeste strict : nombres de fichiers, chemins, tailles compressées/non compressées, signatures, version de schéma, provenance et empreintes ; refuser zip-slip, liens, symlinks, zip bombes, payloads non signés ou partiels.
- Phrase de récupération absente des logs, des arguments de processus et des fichiers temporaires en clair ; dérivation côté serveur dans un canal protégé ; les secrets du profil Windows ne sont pas exportés tels quels.
- Upload streaming borné ; stockage temporaire sous le dossier privé de l'installation et suppression contrôlée après qualification ; les fichiers ZIP ne sont jamais accessibles depuis `public/`.
- Précontrôle de la destination, compatibilité PG18 et schéma v33, compte administrateur ; validation du registre d'effacements et du gel source ; refus explicite de l'archive obsolète pouvant réintroduire un effacement.
- Préparer la candidate dans un espace isolé, vérifier bases/fichiers par empreintes, bloquer les écritures de la destination, préserver l'ancienne base et les dossiers ; bascule et rollback atomiques lorsque possible avec journal persistant.
- Même en cas d'erreur, aucune donnée active n'est effacée automatiquement, pas de faux succès ; les sessions sont invalidées à la réouverture ; afficher les étapes, états et aides en FR/EN centralisés.

## Distribution (règle normative)

**Toute** demande de nouvelle distribution impose un checkout propre du **dernier commit validé de main**, une compilation et un packaging neufs, une recette Windows vierge, puis la publication d'un **nouvel artefact**. Une ancienne archive dont le nom est identique ne doit **jamais** être qualifiée de dernier ZIP.

- L'archive contient `distribution-version.json` (commit complet, run, horodatage et version), une liste de fichiers, une empreinte SHA256 et la preuve du workflow ; toute archive proposée est liée au **run précis** et à son commit.
- Les tests obligatoires incluent le portail Paramètres V2 (SMN-434), ses six familles, la navigation, les pages pleine largeur en fond blanc, la sélection IANA et les traductions FR/EN, en plus des tests de restauration et distribution.
- Pas de `pnpm`, `uv`, IDE ou téléchargement requis sur la machine cliente.
- Installer une distribution complète dans un autre dossier **n'est pas** la procédure de mise à jour d'une installation avec données ; le mécanisme de mise à jour doit préserver `config/` et `data/`.

## Découpage / preuves

- Jira **SMN-441** : ZIP exportable depuis UI.
- Jira **SMN-442** : upload, prévisualisation, restauration transactionnelle, rollback et réauthentification UI.
- Jira **SMN-443** : reconstruction complète, surveillance du commit, tests Paramètres obligatoires, recette distribution.
- Dépendances : SMN-34, SMN-39, SMN-40, SMN-430/431, SMN-434.
- Définition de terminé : tests automatiques et recette UI Windows sur deux installations séparées réussis, paquet ZIP correctement reconnu, données intégralement comparées avant/après, rollback réellement exécuté, lien GitHub Actions correspondant au commit. **Un guide PowerShell ou un build CI isolé ne satisfait pas la demande.**
