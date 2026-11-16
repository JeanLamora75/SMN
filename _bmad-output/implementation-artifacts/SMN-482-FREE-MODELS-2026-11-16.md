# SMN-482 — Catalogue des modèles gratuits et quota préventif (Amelia)

Date : 16 novembre 2026. Epic : SMN-479.

## Statut
**Incrément technique publié, qualification API externe non réalisée** : l'utilisateur demande confirmation avant toute nouvelle recherche Web avancée. Aucune consultation fraîche des pages officielles, aucun compte test Gemini/Groq/OpenRouter et aucun appel authentifié n'ont eu lieu dans cette intervention. **L'allowlist est volontairement VIDE** : l'interface ne peut qualifier aucun modèle gratuitement par elle-même ; toutes les demandes d'envoi doivent être refusées jusqu'à un nouvel examen officiel/documenté et un nouveau commit de qualification.

## Contrats techniques
- `src/server/ai-connections/free-catalog.ts` : déclaration locale relue en revue de code, provider/model, lien officiel de preuve, fenêtres temporelles, limites et essais d'accès réellement gratuit ; interdiction stricte `openrouter/free` et routeurs auto tant qu'une preuve déterministe n'existe pas. Un modèle absent, expiré, ambigu ou à fallback non maîtrisé reste interdit.
- `src/server/ai-connections/registry.ts` : empêche les créations/modifications avec un modèle explicitement non qualifié ; une connexion sans modèle peut être préparée et reste inactive. Ce contrôle doit aussi être répété juste avant l'appel sortant dans SMN-484.
- `src/server/ai-connections/free-quota.ts` : réservation SQL atomique par connexion et jour UTC ; les échecs de requête restent comptés pour éviter des répétitions automatiques.
- Aucun modèle inconnu n'est admis à partir du retour d'un fournisseur, des variables d'environnement ou d'une saisie administrateur.
- Une table additive de quota est fournie en migration explicite avec sauvegarde exigée sur une instance existante. Installation Windows neuve et ZIP incluent le nouveau SQL.
- Erreurs de quota, authentification, facturation interdite et indisponibilité séparées sans fuite de réponse brute.

## Risques et suites
1. Faire approuver une recherche sur les **sources officielles actuelles** et confirmer avec des comptes test (sans activer une facturation) les modèles exacts, plafonds et contraintes de données ; dater et borner les preuves.
2. N'autoriser que les identifiants exacts validés dans un commit relu ; ne jamais promettre « facture garantie nulle » si le compte peut être facturé par le prestataire.
3. SMN-484 doit appeler `reserveFreeAiRequest` juste avant chaque appel, ne jamais réessayer automatiquement, interdire les fallbacks et recontrôler l'autorisation du modèle.
4. La vérification des ACL de SMN-481, de la restauration SMN-487 et de la CI Linux/Windows reste requise. **Ne pas clore SMN-482 avant preuves documentaires et tests API réels.**
