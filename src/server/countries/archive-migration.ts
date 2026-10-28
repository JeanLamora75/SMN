import type {Client} from "pg";
import {requireCountrySchemaV30} from "./schema-guard";

/** Verrou de sérialisation métier conservé ; ne crée aucun objet SQL. */
export const COUNTRY_LIFECYCLE_LOCK="SELECT pg_advisory_xact_lock(20261026,279)";

export async function ensureCountryArchiveSchema(db:Client):Promise<void>{
 await requireCountrySchemaV30(db);
}
