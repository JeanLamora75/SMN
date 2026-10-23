export type ReportLanguage="fr"|"en";
export const DEFAULT_REPORT_LANGUAGE:ReportLanguage="fr";
export const isReportLanguage=(v:unknown):v is ReportLanguage=>v==="fr"||v==="en";
export function resolveReportLanguage(chosen:unknown):ReportLanguage{
 return isReportLanguage(chosen)?chosen:DEFAULT_REPORT_LANGUAGE;
}
