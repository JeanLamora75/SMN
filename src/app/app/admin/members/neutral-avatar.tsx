/** Pictogramme MVP neutre commun, sans photo ni indication de genre. */
export default function NeutralAvatar({size=62}:{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Avatar neutre">
  <circle cx="32" cy="32" r="30" fill="var(--bs-tertiary-bg)" stroke="var(--bs-border-color)"/>
  <circle cx="32" cy="24" r="10" fill="var(--bs-secondary-color)"/>
  <path d="M15 49c0-10 7-16 17-16s17 6 17 16" fill="var(--bs-secondary-color)"/>
 </svg>;
}
