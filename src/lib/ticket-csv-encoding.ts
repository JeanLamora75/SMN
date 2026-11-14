/** Decode CSV bytes without silently replacing Windows-1252 accents with U+FFFD. */
export function decodeTicketCsvBytes(bytes: Uint8Array): {
 text: string;
 encoding: "utf-8" | "utf-16le" | "utf-16be" | "windows-1252";
} {
 if (bytes[0] === 0xff && bytes[1] === 0xfe) {
  return { text: new TextDecoder("utf-16le",{fatal:true}).decode(bytes), encoding:"utf-16le" };
 }
 if (bytes[0] === 0xfe && bytes[1] === 0xff) {
  return { text: new TextDecoder("utf-16be",{fatal:true}).decode(bytes), encoding:"utf-16be" };
 }
 try {
  return { text: new TextDecoder("utf-8",{fatal:true}).decode(bytes), encoding:"utf-8" };
 } catch {
  return { text: new TextDecoder("windows-1252").decode(bytes), encoding:"windows-1252" };
 }
}
