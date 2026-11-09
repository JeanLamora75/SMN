import type {SourceDocument} from "./files";
import type {ExtraInventory} from "./extra-archives";

export type CaptureFence=Readonly<{
 walLsn:string;
 documents:readonly SourceDocument[];
 archives:ExtraInventory;
}>;
/** Positive-only evidence: unknown/invalid WAL positions never certify a capture.
 * No DB or filesystem mutation; independent of the database test infrastructure.
 */
export function captureFenceUnchanged(before:CaptureFence,after:CaptureFence):boolean{
 const wal=/^[a-f0-9]+\/[a-f0-9]+$/i;
 return wal.test(before.walLsn)&&before.walLsn===after.walLsn&&
  JSON.stringify(before.documents)===JSON.stringify(after.documents)&&
  JSON.stringify(before.archives)===JSON.stringify(after.archives);
}
