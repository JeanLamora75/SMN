// Isolated SMN-397 feasibility probe: simple table rows and pre-linked PNG images.
// Not production-ready. Complex merged cells and free text-tag-to-image are unsupported.
import { readZip, writeZip, replaceOfficeXml } from "./smn-397-office-poc.mjs";

export function expandTableRows(xml, format, datasets) {
  if (!["docx", "pptx"].includes(format)) throw Error("Format invalide");
  const rowTag = format === "docx" ? "w:tr" : "a:tr";
  const rows = new RegExp("<" + rowTag + "(?=[\\s>])[^>]*>[\\s\\S]*?<\\/" + rowTag + ">", "g");
  let tables = 0;
  const transformed = xml.replace(rows, row => {
    const markers = [...row.matchAll(/\{\{ROW:([A-Z][A-Z0-9_]*)\}\}/g)];
    if (!markers.length) return row;
    if (markers.length !== 1) throw Error("Une seule source par ligne modèle");
    const key = markers[0][1];
    if (!Object.hasOwn(datasets, key)) return row;
    const records = datasets[key];
    if (!Array.isArray(records)) throw Error("Jeu de données invalide");
    if (/<w:vMerge\b|\browSpan="[2-9]/.test(row))
      throw Error("Fusion verticale non prise en charge");
    if (/<w:tbl\b|<a:tbl\b/.test(row))
      throw Error("Tableau imbriqué non pris en charge");
    // Technical guard against resource exhaustion, never silent truncation.
    if (records.length > 10000) throw Error("Protection technique : trop de lignes");
    tables++;
    const makeRow = record => {
      const template = row.replace(/\{\{ROW:[A-Z][A-Z0-9_]*\}\}/g, "");
      return replaceOfficeXml(template, record).xml;
    };
    if (records.length) return records.map(makeRow).join("");
    const fields = [...row.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)].map(m => [m[1], "N/D"]);
    return makeRow(Object.fromEntries(fields));
  });
  return { xml: transformed, tables };
}

export function expandOfficeTables(source, format, datasets) {
  if (!["docx", "pptx"].includes(format)) throw Error("Format invalide");
  const entries = readZip(source), changed = [];
  const target = format === "docx"
    ? /^word\/(?:document|header\d+|footer\d+)\.xml$/
    : /^ppt\/slides\/slide\d+\.xml$/;
  const mapped = entries.map(part => {
    if (!target.test(part.name)) return part;
    const result = expandTableRows(part.data.toString("utf8"), format, datasets);
    if (!result.tables) return part;
    changed.push({ part: part.name, tables: result.tables });
    return { ...part, data: Buffer.from(result.xml) };
  });
  return { output: writeZip(mapped), changed };
}

// Replace a PNG already referenced by an Office image relationship.
// Image anchors, slide geometry and relationships are deliberately untouched.
export function replaceLinkedPng(source, replacements) {
  const entries = readZip(source), changed = [];
  const mapped = entries.map(part => {
    if (!Object.hasOwn(replacements, part.name)) return part;
    if (!/^(word|ppt)\/media\/[^/]+\.png$/i.test(part.name))
      throw Error("Image hors dossier média");
    const png = replacements[part.name];
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!Buffer.isBuffer(png) || png.length < 24 ||
        !png.subarray(0, 8).equals(signature)) throw Error("PNG invalide");
    changed.push(part.name);
    return { ...part, data: png };
  });
  for (const path of Object.keys(replacements))
    if (!changed.includes(path)) throw Error("Image de destination inexistante");
  return { output: writeZip(mapped), changed };
}
