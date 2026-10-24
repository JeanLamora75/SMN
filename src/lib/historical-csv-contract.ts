export const HISTORICAL_CSV_COLUMNS=["cycle_id","metric_code","value","quality"] as const;
export const HISTORICAL_CSV_CATALOG={
 scrum:[
  {code:"SP_INITIAL",description:"Engagement initial en story points"},
  {code:"SP_ADDED",description:"Story points ajoutés"},
  {code:"SP_REMOVED",description:"Story points retirés"},
  {code:"SP_DONE",description:"Story points terminés"}
 ],
 kanban:[
  {code:"STARTED",description:"Tickets commencés"},
  {code:"THROUGHPUT",description:"Tickets terminés (Throughput)"},
  {code:"WIP_FINAL",description:"WIP en fin de période"},
  {code:"CYCLE_TIME_AVG",description:"Cycle Time moyen (jours)"},
  {code:"LEAD_TIME_AVG",description:"Lead Time moyen (jours)"}
 ]
} as const;
export type HistoricalCsvMode=keyof typeof HISTORICAL_CSV_CATALOG;
export const historicalCsvCodes=(mode:HistoricalCsvMode)=>HISTORICAL_CSV_CATALOG[mode];
export function historicalCsvTemplate():string{
 return HISTORICAL_CSV_COLUMNS.join(",")+"\r\n";
}
export function historicalCsvCodeAllowed(mode:HistoricalCsvMode,code:string):boolean{
 return historicalCsvCodes(mode).some(row=>row.code===code);
}
