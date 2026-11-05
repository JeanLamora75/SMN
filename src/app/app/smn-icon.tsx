import {isDashboardIcon,type DashboardIconName} from "@/lib/dashboard-builder/icon-catalog";

/** Icône Bootstrap du paquet local. Aucun SVG ni HTML dynamique n'est accepté. */
export function SMNIcon({name,className="",size}:{
 name:DashboardIconName|string;className?:string;size?:number|string;
}){
 if(!isDashboardIcon(name))return null;
 return <i className={`bi bi-${name} ${className}`} style={size?{fontSize:size}:undefined} aria-hidden="true"/>;
}
