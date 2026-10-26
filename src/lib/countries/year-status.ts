/**
 * Administrative presentation is independent from technical holiday coverage.
 * Historical "configured" coverage is not evidence of a human validation.
 */
export type TechnicalCoverage={
 year:number;
 status:"configured"|"partial"|"not-configured"|"invalid";
 count:number;
 diagnostic:string|null;
 administrativeValidated?:boolean;
};
export type AnnualDisplayStatus="configured"|"review"|"not-configured"|"invalid"|"unknown";

export function annualDisplayStatus(coverage:TechnicalCoverage|undefined):AnnualDisplayStatus{
 if(!coverage)return "unknown";
 if(coverage.status==="invalid")return "invalid";
 if(!Number.isInteger(coverage.count)||coverage.count<0)return "unknown";
 if(coverage.count===0)return coverage.status==="not-configured"?"not-configured":"unknown";
 // Only a server-verified attestation may set this to true (future validation workflow).
 return coverage.administrativeValidated===true?"configured":"review";
}
export function normalizeCountrySearch(value:string):string{
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase("fr").trim();
}
export function currentParisYear(now:Date=new Date()):number{
 return Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",year:"numeric"}).format(now));
}
