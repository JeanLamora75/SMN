import type {DashboardMetric} from "./dashboard-data-contract";

/**
 * Rapport numérique neutre pour DEUX mesures comparables d'un même Sprint.
 * Ne constitue ni une performance individuelle ni un avancement global.
 * Aucun résultat si la mesure initiale est 0, absente, ou si la qualité
 * de l'une des deux mesures n'est pas confirmée.
 */
export function dashboardMetricRatio(
 initial:DashboardMetric|undefined,
 actual:DashboardMetric|undefined
):Readonly<{percentage:number;visualFill:number}>|null{
 if(initial?.state!=="available"||actual?.state!=="available")return null;
 if(initial.quality!=="known"||actual.quality!=="known"||
  initial.value<=0||actual.value<0)return null;
 const percentage=100*(actual.value/initial.value);
 if(!Number.isFinite(percentage))return null;
 return {percentage:Math.round(percentage),visualFill:Math.max(0,Math.min(100,percentage))};
}
