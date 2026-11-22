import crypto from "node:crypto";
import http from "node:http";
import { Server } from "socket.io";
import { env } from "@/config/env";
import { verifyRealtimeTicket } from "@/lib/auth/tokens";
import { connectDB } from "@/lib/db/connect";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/monitoring/reportError";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { rooms } from "./rooms";

const SESSION_RECHECK_MS = 30_000;
const MAX_BODY_BYTES = 64 * 1024;

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Is this socket's session still valid? (signed out, password reset, account disabled → no) */
async function sessionIsActive({ userId, sessionId, role }) {
  const [session, user] = await Promise.all([
    Session.findById(sessionId).select("revokedAt user expiresAt").lean(),
    User.findById(userId).select("role isActive").lean(),
  ]);
  return Boolean(
    session && !session.revokedAt && session.expiresAt > new Date() &&
      String(session.user) === userId && user && user.isActive && user.role === role,
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) reject(new Error("Body too large"));
      else chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * WebSocket server (Socket.IO).
 *  - Clients authenticate with a ticket from POST /api/v1/{role}/realtime-token.
 *  - Each socket joins its private rooms: user:<id> and role:<role>.
 *  - Sessions are re-checked every 30s; revoked sessions are disconnected.
 *  - The API broadcasts through POST /internal/emit (shared secret, not public).
 */
export function createRealtimeServer() {
  const log = logger.child({ service: "realtime" });

  const httpServer = http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/health") {
      return send(200, { success: true, data: { status: "ok", service: "clinicyza-realtime", connections: io.engine.clientsCount } });
    }
    if (req.method === "POST" && req.url === "/internal/emit") {
      if (!safeEqual(req.headers["x-internal-secret"] || "", env.realtimeInternalSecret)) {
        return send(401, { success: false, error: { code: "UNAUTHORIZED", message: "Bad secret" } });
      }
      try {
        const { room, event, data } = JSON.parse(await readBody(req));
        if (typeof room !== "string" || typeof event !== "string") throw new Error("room and event are required");
        io.to(room).emit(event, data ?? null);
        return send(200, { success: true, data: null });
      } catch (error) {
        return send(400, { success: false, error: { code: "BAD_REQUEST", message: error.message } });
      }
    }
    return send(404, { success: false, error: { code: "NOT_FOUND", message: "Not found" } });
  });

  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    serveClient: false,
  });

  // ---- Authentication on connect ----
  io.use(async (socket, next) => {
    try {
      const payload = await verifyRealtimeTicket(socket.handshake.auth?.token || "");
      const identity = { userId: payload.sub, role: payload.role, sessionId: payload.sid };
      await connectDB();
      if (!(await sessionIsActive(identity))) throw new Error("Session ended");
      socket.data = identity;
      next();
    } catch (error) {
      const err = new Error("UNAUTHORIZED");
      err.data = { code: error.code || "UNAUTHORIZED", message: "Sign in again to receive live updates" };
      next(err);
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.data;
    socket.join([rooms.user(userId), rooms.role(role)]);
    socket.emit("ready", { userId, role, serverTime: new Date().toISOString() });
    log.debug("socket connected", { userId, role, socketId: socket.id });

    socket.on("ping", (ack) => typeof ack === "function" && ack({ pong: true, at: Date.now() }));

    socket.on("disconnect", (reason) => log.debug("socket disconnected", { userId, reason }));
    socket.on("error", (error) => reportError(error, { source: "realtime", context: { event: "socket-error" } }));
  });

  // ---- Disconnect sockets whose session was revoked ----
  const recheck = setInterval(async () => {
    try {
      for (const socket of await io.fetchSockets()) {
        if (!(await sessionIsActive(socket.data))) {
          socket.emit("session:revoked", { message: "You have been signed out" });
          socket.disconnect(true);
        }
      }
    } catch (error) {
      await reportError(error, { source: "realtime", context: { phase: "session-recheck" } });
    }
  }, SESSION_RECHECK_MS);

  return {
    io,
    async listen(port = env.realtimePort) {
      await connectDB();
      await new Promise((resolve) => httpServer.listen(port, resolve));
      log.info("realtime server listening", { port });
    },
    async close() {
      clearInterval(recheck);
      await new Promise((resolve) => io.close(() => resolve()));
    },
  };
}
