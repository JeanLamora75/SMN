// Configuration locale unique des ports web SMN. Aucune lecture de secrets.
export const DEFAULT_SMN_PORT = 3003;
export const RESERVED_PORTS = Object.freeze([3000, 3001, 3002]);

export function resolveSmnPort(raw = process.env.SMN_PORT) {
  if (raw === undefined || raw === "") return DEFAULT_SMN_PORT;
  if (!/^[0-9]+$/.test(raw)) {
    throw new Error("SMN_PORT doit contenir un numéro de port entier (1024 à 65535).");
  }
  const port = Number(raw);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
    throw new Error("SMN_PORT doit être compris entre 1024 et 65535.");
  }
  if (RESERVED_PORTS.includes(port)) {
    throw new Error("Les ports 3000, 3001 et 3002 sont réservés à l'autre projet. Choisissez un autre port.");
  }
  return port;
}
