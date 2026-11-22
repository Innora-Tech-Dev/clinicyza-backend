/**
 * WebSocket (Socket.IO) server.
 *   npm run realtime          (also started by `npm run dev`)
 * Runs outside Next.js because sockets need a long-lived process.
 */
import "./register-alias.mjs";

process.env.CZ_SERVICE = "realtime";
const mongoose = (await import("mongoose")).default;
const { createRealtimeServer } = await import("@/lib/realtime/server");

const server = createRealtimeServer();
await server.listen();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}
