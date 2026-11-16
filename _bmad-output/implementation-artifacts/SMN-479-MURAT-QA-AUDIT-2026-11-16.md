# Murat — Audit QA des tests de l'Epic SMN-479

Date : 16 novembre 2026. Périmètre : SMN-480 à SMN-488. Branche : `main`.
Méthode : lecture des 10 suites spécifiques, des critères Jira de chaque Story, de l'implémentation des services et des preuves GitHub Actions. Pas d'accès à des clés ou données client et pas d'appel à un fournisseur réel.

## Diagnostic initial

- La CI était verte au commit `ea84686346895d6c036d07d617cef7a2533fb95a` (workflow I0, qualification 488 et Windows pilote). Une CI verte ne signifie pas couverture complète des 45 critères d'acceptation ni essai du compte Free.
- Beaucoup de tests 480/482/483/485 se limitent à `readFileSync` / `assert.match` : ils détectent la disparition d'un contrat de code, mais ne prouvent ni l'absence d'accès croisé HTTP ni les interactions de la modale.
- Les tests 481/484/486/487 comprennent des scénarios exécutables. Manques corrigés : chiffrement multi-connexions et falsification d'enveloppes, tous les parseurs des fournisseurs, mauvaise réponse HTTP, ambiguïté de destinataire, collision d'UUID d'une réponse dans un autre périmètre, rejet des entrées avant transaction, rollback simulé avec restauration effective des données du mock, coffre de destination sous lien symbolique.
- Le faux positif corrigé antérieurement dans SMN-485 interdisait la présence du bouton Save introduit par SMN-486 ; le test vérifie maintenant uniquement le corps de l'action Send.
- Le catalogue Free demeure volontairement vide, faute de compte de démonstration attestant la gratuité : les scénarios doivent *attendre un rejet sûr*. Les tests avec un catalogue qualifié, le quota journalier en PostgreSQL et l'envoi réel restent non réalisables sans une qualification externe et une recette contrôlée.

## Évolutions QA de ce lot

| Story | Tests revus | Renforcement |
| --- | --- | --- |
| 480 | contrat SQL et permissions | Audit d'acceptation, maintien des contrôles structurels et migration |
| 481 | chiffrement et coffre | Deux connexions isolées, IV uniques, falsification de nonce/texte/provider/version, rejet tailles/master incorrects |
| 482 | modèles et quotas | Catalogue non qualifié refusé, revue des gardes. Quota réel avec modèle Free encore non attesté |
| 483 | écran admin | Revue accessibilité/FR-EN et filtres. Tests navigateur réels à renforcer |
| 484 | proxy et approbation | Parsers Gemini/Groq/OpenRouter mockés, MIME/JSON/troncature, HMAC falsifié, scope de destinataire |
| 485 | aperçu/consentement | Revue du contrôle strict entre TXT source/preview et de l'absence de save pendant Send |
| 486 | archivage volontaire | Collisions d'UUID inter-auteurs/équipes/archives, rejet des entrées sans début de transaction |
| 487 | ZIP et bascule | Mock de rollback vérifiant l'état original réellement restauré, destination symlink non modifiée |
| 488 | qualification transversale | Vérification de la suite Linux/Windows/PG18 et du chemin de livraison Windows |

## Réserves et limites — ne pas clôturer comme « validé intégralement »

1. **UI** : les tests source/regex ne prouvent pas la navigation clavier, les aides d'écran, le focus des modales, le responsive ni la gestion concurrente de plusieurs administrateurs. Prévoir Chromium réel + PostgreSQL isolé.
2. **SMN-480 / permissions** : les routes sont réservées aux administrateurs, et l'envoi vérifie le scope de l'installation. Le scénario utilisateur « Scrum Master autorisé » et l'isolement multi-équipe ne sont pas validés en bout en bout.
3. **SMN-481** : la résistance à une interruption réelle de la machine au milieu d'une rotation de clé doit être démontrée avec un coffre de test et une base isolée ; les tests de primitives AES ne suffisent pas.
4. **SMN-482** : aucune qualification réelle de compte et absence de facturation attestée ; aucun modèle activable. Le taux des quotas locaux et l'absence de fallback payant doivent être validés avec comptes Free de test.
5. **SMN-484 / 485** : la source de vérité est l'archive TXT finalisée, pas une résolution à la volée de tags après finalisation. Le parcours est plus restrictif que certains critères ; test réel de conservation du périmètre et modification concurrente à réaliser.
6. **SMN-486** : les mocks montrent l'idempotence et la séparation des auteurs, mais un concurrent PostgreSQL réel et une perte d'accusé réseau ne sont pas encore démontrés sur deux processus.
7. **SMN-487** : les tests ne valent pas une restauration complète ZIP source→PC cible avec coffre, sessions, interruption et rollback. Le reçu signé post-quarantaine est contrôlé en test, mais pas une reprise physique de crash.
8. **SMN-488** : ne publier un ZIP officiel qu'après contrôle sur le même commit, provenance du build, antivirus, recette source→destination, et approbation des modèles Free ; `workflow_dispatch` reste explicite.

## Contrôles demandés

`pnpm test:smn-488` : contrats des 9 Stories, incluant les nouveaux scénarios de ce lot.
`pnpm test:smn-472-476`, `pnpm test:smn-477`, `pnpm test:smn-478` : non-régression du brief.
`pnpm typecheck`, `pnpm i18n:check` : statique/FR-EN.
Workflow dédié SMN-488 (Linux, Windows, PG18), I0 global et paquet pilote : inspecter chaque résultat sur **le même SHA**. Une exécution sur un autre SHA ne vaut pas preuve pour le commit courant.

## Décision Murat

Réparer les tests trompeurs et renforcer l'exécutable est indispensable mais **ne permet pas d'annoncer une recette physique ou financière qui n'a pas eu lieu**. Ne pas passer les Stories ni l'Epic à « Terminé » sur la seule base des tests de structure.
