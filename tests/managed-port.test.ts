import assert from "node:assert/strict";
import { describe, it } from "node:test";
import net from "node:net";
import { canBindLoopback, selectLoopbackPort } from "../src/server/bootstrap/managed-port";

describe("SMN-12 — choix de port PostgreSQL local", () => {
  it("teste les droits de bind plutôt que la seule présence d'un listener", async () => {
    const port = await selectLoopbackPort();
    assert.ok(port >= 1024 && port <= 65535);
    assert.equal(await canBindLoopback(port), true);
    const socket = net.createServer();
    try {
      await new Promise<void>((resolve, reject) => {
        socket.once("error", reject);
        socket.listen(port, "127.0.0.1", resolve);
      });
      assert.equal(await canBindLoopback(port), false, "Port réservé par notre serveur de test");
    } finally {
      await new Promise<void>(resolve => socket.close(() => resolve()));
    }
  });
  it("refuse les ports invalides et les ports privilégiés", async () => {
    for (const port of [0, 80, 1023, 65536, -1, 12.5]) {
      assert.equal(await canBindLoopback(port), false);
    }
  });
});
