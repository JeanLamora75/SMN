# SMN-430 — Guide de distribution et recette Windows 11

**Version documentaire :** 10 novembre 2026 · **Application :** SMN v33, Windows 11 x64 · **Statut :** protocole publié, résultat du PC d'entreprise non encore attesté.

## 1. Principes de sécurité

- Aucune élévation de privilèges requise pour la distribution portable dans un dossier accessible en écriture.
- Aucune connexion à GitHub, npm ou PostgreSQL.org depuis le PC cible pendant une mise à jour locale.
- Le ZIP original **n'est pas** une sauvegarde de la base de données. Conserver séparément la sauvegarde SMN chiffrée et sa phrase de récupération.
- Ne jamais remplacer manuellement `data/`, `runtime/`, `updates/`, le répertoire `%LOCALAPPDATA%\ScrumMasterNotebook` ni les documents utilisateurs.
- Les mises à jour applicatives actuelles exigent PostgreSQL **18**, schéma SMN **v33** et sauvegarde complète, vérifiée, datant de moins de 24 heures. Elles ne migrent pas automatiquement le schéma.
- En cas de blocage de récupération, ne pas renommer ni supprimer les fichiers à la main. Conserver le journal `updates/cutover-journal.json` et le répertoire `updates/rollback/` pour diagnostic sécurisé.

## 2. Transport et vérification (sur un poste sans droits admin)

Récupérer **ensemble** depuis le même run GitHub Actions :

1. `SMN-Setup-Windows-x64-v33.zip` (ou `SMN-Update-<version>.zip`);
2. `<nom>.zip.sha256` contenant l'empreinte SHA-256 ;
3. `<nom>.zip.evidence.json` contenant la taille **exacte en octets**, le SHA-256, le SHA du commit et l'ID du run.

Le triplet doit provenir du même run réussi. Copier ces trois fichiers sur le PC cible, par exemple via une clé USB autorisée. **Ne jamais les modifier** après leur génération.

Exemple PowerShell natif (aucun module à installer) :

```powershell
$zip = "C:\Transfert\SMN-Setup-Windows-x64-v33.zip"
$proof = Get-Content -Raw ($zip + ".evidence.json") | ConvertFrom-Json
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant()
$size = (Get-Item -LiteralPath $zip).Length
$hashFile = (Get-Content -Raw ($zip + ".sha256")).Trim()
if ($proof.archive -ne (Split-Path -Leaf $zip) -or
    $proof.sha256 -ne $hash -or
    $proof.bytes -ne $size -or
    $hashFile -cne ($hash + "  " + (Split-Path -Leaf $zip))) {
  throw "ZIP de transport non conforme : ne pas l'installer."
}
"OK - ZIP vérifié - $size octets - SHA256 $hash - run $($proof.runId)"
```

Ce contrôle détecte corruption/erreur de transfert, **pas** l'authenticité indépendante de la clé de signature de l'éditeur. Pour les mises à jour, l'importateur SMN vérifie aussi la signature Ed25519 avec sa clé publique **installée hors du ZIP**.

Une fois le logiciel installé, un second contrôle est disponible avec le Node embarqué :

```powershell
& "C:\SMN\runtime\node\node.exe" "C:\SMN\scripts\windows\verify-delivery.mjs" $zip ($zip + ".evidence.json") ($zip + ".sha256")
```

Adapter `C:\SMN` au chemin réel. Aucun `uv`, IDE ou droit administrateur n'est requis.

## 3. Installation initiale

Le nouveau paquet SMN-431 ne présente à la racine que `Demarrer SMN.bat`, `app/`, `runtime/`, `data/` et `updates/`. Toute archive contenant les répertoires de développement (`.git`, `.agents`, `_bmad`, `src`, `tests`) doit être refusée. L'ancienne distribution n'est pas interchangeable avec le nouveau contrat d'updates.


1. Choisir un emplacement où l'utilisateur possède lecture/écriture, hors `Program Files` et sans répertoire de données SMN préexistant.
2. Extraire le ZIP de distribution avec l'explorateur Windows. Ne pas extraire une mise à jour par-dessus une installation en place.
3. Vérifier la présence de `SMN-Windows\Demarrer SMN.bat`, `runtime\node\node.exe`, du composant PostgreSQL et des scripts de maintenance.
4. Lancer `Demarrer SMN.bat` depuis la session de l'utilisateur. Vérifier l'accès à `http://127.0.0.1:3003`.
5. Effectuer l'installation Express dans une base neuve, vérifier la connexion administrateur et le diagnostic de schéma v33.
6. Créer des données représentatives **fictives** : deux équipes, membres, sprints, métriques/indicateurs v33, historique de clôture, risques, liens et modèles Word/PPT. Générer des rapports et noter leurs empreintes.
7. Créer et vérifier une sauvegarde complète. Consigner l'identifiant, la date et le statut de vérification sans révéler sa phrase secrète.

Les performances, la politique antivirus, SmartScreen et les restrictions d'exécution propres à l'entreprise exigent une recette séparée sur le PC réellement concerné.

## 4. Mise à jour applicative sans migration

1. Conserver une copie complète de l'installation initiale et une sauvegarde vérifiée des données.
2. Ouvrir **Paramètres → Maintenance → Mises à jour** en compte administrateur.
3. Importer le ZIP signé ; examiner versions source/cible et fichiers concernés.
4. Attendre les précontrôles : signature, version, schéma PostgreSQL 18/v33, sauvegarde vérifiée.
5. Confirmer seulement si toutes les conditions sont remplies ; ne pas interrompre manuellement PostgreSQL. Le lanceur arrête uniquement le serveur web, prépare et active le candidat.
6. Après redémarrage, vérifier la version SMN, le diagnostic de la base, les indicateurs, membres, équipes, historiques et les exports Word/PPT. Comparer les mêmes données fictives et les empreintes de documents.
7. Conserver l'ancien répertoire `updates/rollback/<id>` jusqu'à signature de la recette.

## 5. Recette contradictoire et incidents

| Cas | Manipulation sur installation jetable | Résultat attendu |
|---|---|---|
| ZIP corrompu | Modifier un octet du ZIP de test | Refus avant activation, ancienne version et données conservées |
| Version de base incompatible | Paquet dont `fromVersion` est différente | Refus explicite, aucune permutation |
| PostgreSQL non compatible | Base v32, v34 ou PostgreSQL 17/19 | Refus du précontrôle, aucun DDL implicite |
| Disque insuffisant | Volume de test presque plein, ne jamais remplir le disque professionnel | Échec de préparation, état antérieur accessible et intact |
| Fichier verrouillé | Verrouiller un fichier applicatif du **jeu de test** avec un processus distinct | Refus/reprise sécurisée, pas d'altération des données |
| Interruption applicative | Couper le processus de mise à jour du **jeu de test** entre deux opérations de permutation | Journal persistant, retour arrière avant redémarrage ou blocage si état ambigu |
| Sauvegarde absente/invalide | Désactiver le jeu de sauvegarde dans le **jeu de test** | Confirmation impossible |
| Nouvelle version et même schéma | Mise à jour v33→v33 | Aucune migration DDL, historique et données inchangés |
| Migration véritable | Paquet nécessitant un changement de schéma | **Non supporté dans ce parcours** : rester bloqué tant qu'un workflow séparé versionné n'a pas été livré et qualifié |

**Ne pas provoquer une panne de courant, remplir le disque ou tuer PostgreSQL sur le poste utilisateur.** Ces scénarios se réalisent exclusivement sur un environnement Windows isolé/jetable.

## 6. Matrice de preuve et décision de recette

Chaque essai doit documenter : ID du scénario, Windows 11 édition/build, compte standard ou admin, chemin d'installation, taille ZIP, SHA-256, run CI/commit, version de départ/cible, version PostgreSQL, version schéma, sauvegarde vérifiée, observation, capture expurgée, résultat (PASS/FAIL/BLOCKED) et identifiant d'anomalie.

Les tests GitHub Actions sur `windows-latest` **ne constituent pas** une preuve de conformité à une stratégie d'entreprise. L'absence de migration réelle, de compte Windows sans privilèges contrôlé, de test de saturation disque et de comparaisons Word/PPT ne peut pas être convertie en PASS sur la seule base du bon fonctionnement du workflow.

**Décision de clôture :** AC1 à AC6 doivent être attestés par un responsable de recette et les écarts bloquants corrigés, ou explicitement arbitrés. Dans l'état actuel, la qualification du PC d'entreprise est **à faire**, et l'AC2 relatif à une migration PostgreSQL réelle est **bloqué par le périmètre SMN-429**.
