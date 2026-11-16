/** SMN-482: approval is code-reviewed and shipped; user input never grants free status.
 * Until a provider's free offer and exact model ID have been verified with
 * real test accounts, this registry intentionally authorizes ZERO models.
 */
export const FREE_CATALOG_VERSION="2026-11-16.1";
export type ProviderId="gemini"|"groq"|"openrouter";
export type FreeModelEvidence=Readonly<{
 providerId:ProviderId;modelId:string;sourceUrl:string;
 verifiedAt:string;expiresAt:string;dailyRequestLimit:number;
 maxInputTokens:number;maxOutputTokens:number;
 testedWithFreeAccount:true;billingDisabledVerified:true;
 routing:"direct";fallbackAllowed:false;
}>;
/** Release-gated evidence: never populate from a remote API response or env var. */
export const REVIEWED_FREE_MODELS:readonly FreeModelEvidence[]=Object.freeze([]);

export type FreeDecision=
 |Readonly<{allowed:true;evidence:FreeModelEvidence;catalogVersion:string}>
 |Readonly<{allowed:false;reason:"model-unverified"|"model-expired"|"model-ambiguous"|"model-routing-untrusted"}>;
const MODEL=/^[a-zA-Z0-9][a-zA-Z0-9._:/+-]{0,159}$/;
const PROVIDERS=new Set<ProviderId>(["gemini","groq","openrouter"]);
export function evaluateFreeModel(provider:unknown,model:unknown,at:Date=new Date()):FreeDecision{
 if(typeof provider!=="string"||!PROVIDERS.has(provider as ProviderId)||
    typeof model!=="string"||!MODEL.test(model))
  return {allowed:false,reason:"model-unverified"};
 // Auto-router is forbidden even if it contains the word 'free'.
 if(provider==="openrouter"&&(model==="openrouter/free"||model.includes(":auto")))
  return {allowed:false,reason:"model-routing-untrusted"};
 const rows=REVIEWED_FREE_MODELS.filter(e=>e.providerId===provider&&e.modelId===model);
 if(rows.length!==1)return {allowed:false,reason:rows.length?"model-ambiguous":"model-unverified"};
 const e=rows[0];
 if(e.routing!=="direct"||e.fallbackAllowed!==false||e.testedWithFreeAccount!==true||
    e.billingDisabledVerified!==true||!/^https:\/\//.test(e.sourceUrl)||
    !Number.isSafeInteger(e.dailyRequestLimit)||e.dailyRequestLimit<1||
    !Number.isSafeInteger(e.maxInputTokens)||e.maxInputTokens<1||
    !Number.isSafeInteger(e.maxOutputTokens)||e.maxOutputTokens<1)
  return {allowed:false,reason:"model-unverified"};
 const validFrom=Date.parse(e.verifiedAt),validTo=Date.parse(e.expiresAt);
 if(!Number.isFinite(validFrom)||!Number.isFinite(validTo)||validTo<=validFrom||
    at.getTime()<validFrom||at.getTime()>=validTo)
  return {allowed:false,reason:"model-expired"};
 return {allowed:true,evidence:e,catalogVersion:FREE_CATALOG_VERSION};
}
export function freeCatalogSnapshot(at:Date=new Date()){
 return {version:FREE_CATALOG_VERSION,requiresManualQualification:REVIEWED_FREE_MODELS.length===0,
  qualified:REVIEWED_FREE_MODELS.filter(m=>evaluateFreeModel(m.providerId,m.modelId,at).allowed)
   .map(m=>({providerId:m.providerId,modelId:m.modelId,expiresAt:m.expiresAt,
    sourceUrl:m.sourceUrl,quotaPerDay:m.dailyRequestLimit})),
  candidates:[
   {providerId:"gemini" as const,modelId:"gemini-2.5-flash-lite",
    documentationUrl:"https://ai.google.dev/gemini-api/docs/pricing",
    evidence:"Free input/output on the Free tier; account-project quotas must be checked",
    documentationCheckedAt:"2026-11-16",accountTested:false,selectable:false},
   {providerId:"groq" as const,modelId:"openai/gpt-oss-20b",
    documentationUrl:"https://console.groq.com/docs/rate-limits",
    evidence:"Listed in Free Plan Limits; billing requires Developer upgrade",
    documentationCheckedAt:"2026-11-16",accountTested:false,selectable:false},
   {providerId:"openrouter" as const,modelId:"inclusionai/ling-3.2-flash:free",
    documentationUrl:"https://openrouter.ai/inclusionai/ling-3.2-flash:free",
    evidence:"Listed in public /api/v1/models with prompt=0 and completion=0; free variants 50/day, 20/min without credits",
    documentationCheckedAt:"2026-11-16",accountTested:false,selectable:false}
  ],
  caveat:"An application allowlist cannot guarantee that an externally billable account incurs no charges."
 };
}
