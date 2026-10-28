import type {Client} from "pg";
import {requireCountrySchemaV30} from "./schema-guard";

/** Compatibilité des services Pays : aucune migration implicite dans les requêtes. */
export async function ensureCountryNameSchema(db:Client):Promise<void>{
 await requireCountrySchemaV30(db);
}
