import "server-only";
import { headers } from "next/headers";
import { negotiateLanguage } from "./language";
import type { Language } from "./language";
import type { DiagnosticStatus } from "@/server/installation/diagnostic";

export type { Language } from "./language";
export async function browserLanguage(): Promise<Language> {
  return negotiateLanguage((await headers()).get("accept-language"));
}

export const translations: Record<Language, Record<DiagnosticStatus, string>> = {
  fr: {
    "configuration-missing": "La connexion à la base SMN n'est pas encore configurée.",
    "configuration-invalid": "Le paramétrage SMN doit désigner une base dédiée sur PostgreSQL local.",
    "database-missing": "La base SMN n'existe pas encore : elle sera créée par le futur installateur après confirmation.",
    "connection-error": "Connexion PostgreSQL impossible. Vérifiez le service et les paramètres locaux, puis réessayez.",
    "permissions-insufficient": "Le compte PostgreSQL ne possède pas les accès nécessaires pour vérifier cette installation.",
    "server-version-unsupported": "Version de PostgreSQL non qualifiée pour SMN I0 : vérifiez la version 18 avant l'installation.",
    virgin: "Base SMN vierge détectée. Vous pouvez consulter la préparation de l'installation.",
    initialized: "Installation SMN existante : une authentification sera nécessaire pour accéder aux données.",
    "schema-incompatible": "Le schéma de la base n'est pas reconnu ; aucune modification ne sera appliquée automatiquement.",
    "installation-incomplete": "L'installation paraît partielle. Aucun accès métier n'est autorisé.",
  },
  en: {
    "configuration-missing": "The SMN database connection has not been configured.",
    "configuration-invalid": "SMN must target a dedicated local PostgreSQL database.",
    "database-missing": "The SMN database does not exist yet. The upcoming installer will request confirmation before creating it.",
    "connection-error": "Could not connect to PostgreSQL. Check the local service and settings, then retry.",
    "permissions-insufficient": "The PostgreSQL account lacks the permissions required to inspect this installation.",
    "server-version-unsupported": "This PostgreSQL version has not been qualified for SMN I0. Check for version 18.",
    virgin: "An empty SMN database was detected. You can review the installation preparation.",
    initialized: "An existing SMN installation was found. Authentication will be required to access data.",
    "schema-incompatible": "The database schema is not recognized. No automatic changes will be applied.",
    "installation-incomplete": "The installation appears incomplete. Private data access remains blocked.",
  },
};
