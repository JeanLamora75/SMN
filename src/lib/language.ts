export type Language = "fr" | "en";

// La préférence explicite de l'utilisateur prime sur l'ordre des langues
// non supportées. q=0 signifie langue refusée, jamais langue préférée.
export function negotiateLanguage(acceptLanguage: string | null | undefined): Language {
  if (!acceptLanguage) return "fr";
  const supported: { lang: Language; q: number; order: number }[] = [];
  for (const [order, part] of acceptLanguage.toLowerCase().split(",").entries()) {
    const [tag, ...params] = part.trim().split(";");
    const language = tag.split("-")[0];
    if (language !== "fr" && language !== "en") continue;
    let q = 1;
    let valid = true;
    for (const p of params) {
      const m = /^\s*q=([0-9]+(?:\.[0-9]+)?)\s*$/.exec(p);
      if (m) q = Number(m[1]);
      else valid = false;
    }
    if (!valid) continue;
    if (q > 0 && q <= 1) supported.push({ lang: language, q, order });
  }
  supported.sort((a, b) => b.q - a.q || a.order - b.order);
  return supported[0]?.lang ?? "fr";
}
