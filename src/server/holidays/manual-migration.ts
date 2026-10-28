import type {Client} from "pg";
import {requireCountrySchemaV30} from "../countries/schema-guard";

/** Compatibilité des services jours fériés : migration explicite préalable obligatoire. */
export async function ensureManualHolidaySchema(db:Client):Promise<void>{
 await requireCountrySchemaV30(db);
}
