import { spawn } from "node:child_process";
import path from "node:path";

export async function runManagedProcess(exe: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error("managed-process-failed:" + path.basename(exe)));
    try {
      // PostgreSQL may outlive pg_ctl and inherit its handles. Pipes would keep
      // the close event pending after pg_ctl has already exited successfully.
      const child = spawn(exe, args, { windowsHide: true, shell: false, stdio: "ignore" });
      child.once("error", fail);
      child.once("close", code => { if (code === 0) resolve(); else fail(); });
    } catch { fail(); }
  });
}
