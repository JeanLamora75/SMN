import type {Client} from "pg";
/** Read-only cross-PC compatibility gate. Never upgrades a restored DB implicitly. */
export async function assertPortableAiBriefSchema(db:Pick<Client,"query">):Promise<void>{
 const tables=await db.query<{models:string|null;archives:string|null}>(`
  SELECT to_regclass('public.smn_ai_brief_template')::text AS models,
         to_regclass('public.smn_ai_brief_archive')::text AS archives`);
 if(!tables.rows[0]?.models||!tables.rows[0]?.archives)
  throw Error("migration-brief-schema-missing");
 const columns=await db.query<{column_name:string;is_nullable:string}>(`
  SELECT column_name,is_nullable FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
 const available=new Map(columns.rows.map(c=>[c.column_name,c.is_nullable]));
 if(available.get("prompt_text")!=="NO")
  throw Error("migration-brief-schema-upgrade-required");
 for(const legacy of ["sections","questions","instructions","data","depth"])
  if(available.has(legacy))throw Error("migration-brief-schema-upgrade-required");
 const bad=await db.query<{n:string}>(`
  SELECT count(*)::text n FROM public.smn_ai_brief_template
  WHERE prompt_text IS NULL OR length(btrim(prompt_text))=0 OR length(prompt_text)>100000`);
 if(bad.rows[0]?.n!=="0")throw Error("migration-brief-prompt-invalid");
}
