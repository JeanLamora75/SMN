import { notFound } from "next/navigation";
import { canVisitPrivate } from "@/server/access-policy";

export default function PrivatePage() {
  if (!canVisitPrivate()) notFound();
  // Impossible pour SMN-11 : l'authentification sera introduite par SMN-14.
  notFound();
}
