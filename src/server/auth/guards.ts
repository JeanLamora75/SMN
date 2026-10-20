export const SESSION_COOKIE = "smn_session";
export const SESSION_SECONDS = 8 * 60 * 60;
export function validLocalHost(host: string | null): boolean {
  return !!host && /^(localhost|127\.0\.0\.1):\d{2,5}$/i.test(host);
}
export function validMutationOrigin(host: string | null, origin: string | null): boolean {
  if (!validLocalHost(host) || !origin) return false;
  return origin === "http://" + host || origin === "https://" + host;
}
export function cookieSecure(protocol: string): boolean {
  return protocol === "https:";
}
export function validJsonLength(text: string, max = 4096): boolean {
  return text.length > 0 && text.length <= max;
}
