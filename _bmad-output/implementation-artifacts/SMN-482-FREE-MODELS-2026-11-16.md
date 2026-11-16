# SMN-482 — Catalogue des modèles gratuits et quota préventif (Amelia)

Date : 16 novembre 2026. Epic : SMN-479.

## Statut
**Recherche documentaire officielle réalisée le 16/11/2026, qualification sur comptes API encore non réalisée** : l'utilisateur a expressément autorisé les recherches. Les pages officielles de Gemini, Groq et OpenRouter ont été examinées ; aucun compte de test authentifié ni appel génératif payant/gratuit n'ont été utilisés. **L'allowlist est volontairement VIDE** : l'interface ne peut qualifier aucun modèle gratuitement par elle-même ; toutes les demandes d'envoi doivent être refusées jusqu'à un essai authentifié avec une clé sur un compte véritablement Free sans facturation activée, suivi d'un nouveau commit d'approbation.

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

## Recherche officielle du 16 novembre 2026 — résultats vérifiés

| Fournisseur | Modèle exact candidat | Preuve officielle | Conditions / limites | État |
|---|---|---|---|---|
| Gemini | `gemini-2.5-flash-lite` | https://ai.google.dev/gemini-api/docs/pricing | Free Tier : entrée et sortie offertes pour ce modèle, limites effectives par projet vérifiables en AI Studio ; données soumises aux conditions du niveau gratuit et pouvant être utilisées pour améliorer les produits Google | **Documentation vérifiée ; essai compte à faire** |
| Groq | `openai/gpt-oss-20b` | https://console.groq.com/docs/rate-limits et https://console.groq.com/docs/billing-faqs | Free Plan Limits publiées pour ce modèle (table consultée : 30 RPM, 1K RPD, 8K TPM, 200K TPD). Les limites sont celles de l'organisation et peuvent varier. Developer tier facturable après upgrade. | **Documentation vérifiée ; essai compte à faire** |
| OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | https://openrouter.ai/meta-llama/llama-3.3-70b-instruct:free et https://openrouter.ai/collections/free-models | Fiche du modèle : prix nul. Variante `:free` sans achat de crédits ; 50 requêtes/jour et 20/min sur compte sans achat, échecs comptabilisés. Certains fournisseurs peuvent manquer selon région ou disponibilité. | **Documentation vérifiée ; essai compte à faire** |

Autres vérifications officielles :
- https://ai.google.dev/gemini-api/docs/rate-limits : les limites réelles de Gemini sont propres au projet, niveau de compte et modèle, et peuvent évoluer.
- https://openrouter.ai/pricing : offre API gratuite, mais la clé OpenRouter peut aussi accéder à des modèles facturables, d'où une allowlist stricte et aucun fallback.
- https://console.groq.com/docs/models : seuls les modèles listés dans les limites de l'offre gratuite sont candidats.

**Conclusion :** les trois fournisseurs possèdent des offres API gratuites documentées. Il serait inexact de prétendre les avoir testées sur de vrais comptes : la création de comptes et de clés requiert une intervention externe et les identifiants de test ne sont pas disponibles. Le catalogue autorisé reste volontairement **vide**, tandis que l'API publique d'administration expose trois **candidats non sélectionnables** avec preuve, date et état `accountTested:false`. Cette décision garantit qu'aucun modèle n'est approuvé fictivement.

### Procédure de qualification manuelle sans risque de facturation (exécution à venir)

1. Créer un compte **Free** dédié chez chaque fournisseur et confirmer sur la page Billing qu'aucun mode payant n'est activé (capture / attestation sans secrets) ; Google : vérifier projet Free ; Groq : rester Free et non Developer ; OpenRouter : aucune recharge de crédits.
2. Vérifier les quotas propres à ce compte et l'ID exact du modèle ; vérifier les restrictions territoriales, politiques de conservation et confidentialité.
3. Tester avec une phrase artificielle, sans données SMN et sans donnée client. Vérifier le retour du modèle exact, le quota et l'absence de débit facturé ou de mécanisme de repli payant ; documenter date, preuve et configuration.
4. Enregistrer l'ID approuvé dans `REVIEWED_FREE_MODELS` avec fenêtre de validité courte, source officielle, limites conservatrices et attestations réelles. Ne pas hardcoder de booléens `testedWithFreeAccount:true` sans preuves.
5. Écrire les tests correspondants et revalider la CI sur le même commit ; l'envoi final doit recontrôler ces conditions côté serveur dans SMN-484.

**Réserve :** l'absence de facturation chez un fournisseur ne peut être garantie par une application seule ; l'absence de compte facturable et le type d'opération API restent essentiels.

### Preuve de publication

L'actualisation documentaire et du catalogue candidat a été publiée sur `main`. La certification des comptes/API et la clôture fonctionnelle de SMN-482 restent conditionnées à des preuves réelles.
