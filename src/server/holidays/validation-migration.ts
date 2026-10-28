import type {Client} from "pg";
import {requireCountrySchemaV30} from "../countries/schema-guard";

/** Validation annuelle disponible uniquement après migration explicite v30. */
export async function ensureAnnualValidationSchema(db:Client):Promise<void>{
 await requireCountrySchemaV30(db);
}
