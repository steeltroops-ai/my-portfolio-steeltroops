import { Server } from "socket.io";
import { parseCookies, verifyAuth } from "./api/utils.js";
import { neon } from "@neondatabase/serverless";

let io = null;

/**
 * Socket.io Initialization & Security Handshake
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true, // Allow any origin to connect (vital for LAN/Phone testing)
      methods: ["GET", "POST"],
      credentials: true, // Vital for HttpOnly Cookies
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  const sql = neon(process.env.DATABASE_URL || "");

  /**
   * Security Middleware: handshakes must validate the session cookie
   */
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.request);
      const token = cookies.auth_token;

      if (!token) {
        console.warn("  [Socket Auth] Anonymous connection effort rejected");
        return next(new Error("Authentication Required"));
      }

      const session = await verifyAuth(socket.request, sql);
      if (session && session.role === "admin") {
        socket.user = session;
        return next();
      }

      next(new Error("Unauthorized: Admin Access Required"));
    } catch (err) {
      console.error("  [Socket Auth] Error during handshake:", err.message);
      next(new Error("Internal Auth Error"));
    }
  });

  console.log("  [Nerve Center] WebSocket Intelligence Hub Initialized");

  io.on("connection", (socket) => {
    const transport = socket.conn.transport.name;
    const user = socket.user?.display_name || "Admin";

    socket.join("admin_vault");

    console.log(
      `  [Uplink] ${user} connected [ID: ${socket.id}] [Transport: ${transport}]`
    );

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    socket.on("disconnect", (reason) => {
      console.log(`  [Downlink] Admin disconnected: ${reason}`);
    });
  });

  return io;
};

/**
 * Global Emission Helper
 */
export const emitToAdmins = (event, data) => {
  if (!io) return;
  io.to("admin_vault").emit(event, data);
};

export const getIO = () => io;
