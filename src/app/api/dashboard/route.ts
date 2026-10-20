import { NextRequest } from "next/server";
import { authorizeApi } from "@/server/auth/authorization";
import { jsonResult } from "@/server/auth/request";
import { withAuthDb } from "@/server/auth/database";
import { readCollectiveDashboard } from "@/server/dashboard/read";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  // Collection de l'installation active : readCollectiveDashboard résout et valide
  // son contexte singleton avant de retourner sa projection explicite.
  if (!await authorizeApi(request, "read", { type: "collective", exists: true, inScope: true }))
    return jsonResult({ error: "forbidden" }, 403);
  try {
    return jsonResult(await withAuthDb(readCollectiveDashboard));
  } catch {
    return jsonResult({ error: "forbidden" }, 403);
  }
}
