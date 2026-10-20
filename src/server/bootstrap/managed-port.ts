import net from "node:net";

/** Teste la permission réelle d'écoute sur loopback (pas seulement connect()). */
export async function canBindLoopback(port: number): Promise<boolean> {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return false;
  return new Promise(resolve => {
    const server = net.createServer();
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      if (server.listening) server.close(() => resolve(result));
      else resolve(result);
    };
    server.once("error", () => finish(false));
    try { server.listen({ host: "127.0.0.1", port, exclusive: true }, () => finish(true)); }
    catch { finish(false); }
  });
}

/** Demande un port autorisé au système, puis relâche la réservation avant pg_ctl. */
export async function selectLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () => reject(new Error("managed-pg-no-bindable-port")));
    try {
      server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
        const address = server.address();
        const port = address && typeof address === "object" ? address.port : 0;
        server.close(error => error || port < 1024
          ? reject(new Error("managed-pg-no-bindable-port")) : resolve(port));
      });
    } catch { reject(new Error("managed-pg-no-bindable-port")); }
  });
}
