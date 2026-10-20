import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
export async function passwordHash(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:1:${salt.toString("hex")}:${derived.toString("hex")}`;
}
// Fonction d'épreuve destinée à l'authentification SMN-14 : pas de session ici.
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "1" ||
      !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{128}$/.test(parts[3])) return false;
  const expected = Buffer.from(parts[3], "hex");
  const actual = await scrypt(password, Buffer.from(parts[2], "hex"), 64) as Buffer;
  return timingSafeEqual(expected, actual);
}
