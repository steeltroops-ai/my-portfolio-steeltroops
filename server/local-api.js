/**
 * Local API Development Server
 *
 * This runs the Express app locally.
 * Usage: node server/local-api.js
 */

import dotenv from "dotenv";

// Load environment variables BEFORE importing the app
dotenv.config();

const PORT = process.env.API_PORT || 3001;

import { createServer } from "http";
import { initSocket } from "./socket-hub.js";

async function start() {
  // Dynamic import ensures env vars are loaded first
  const app = (await import("./app.js")).default;
  const httpServer = createServer(app);

  // Initialize WebSockets
  initSocket(httpServer);

  const tryListen = (port, maxRetries = 5) => {
    httpServer.listen(port, () => {
      console.log("");
      console.log("  Tactical API & Socket Server");
      console.log("  =============================");
      console.log("");
      console.log(`  API running at: http://localhost:${port}`);
      console.log(`  WS  running at: ws://localhost:${port}`);
      console.log("");
      console.log("  Available endpoints:");
      console.log("    POST /api/auth?action=login");
      console.log("    GET  /api/auth?action=verify");
      console.log("    GET  /api/posts");
      console.log("    GET  /api/contact");
      console.log("    POST /api/contact/reply");
      console.log("    POST /api/ai/generate-blog");
      console.log("    POST /api/analytics/track");
      console.log("    GET  /api/analytics/stats");
      console.log("");
      console.log("  Press Ctrl+C to stop");
      console.log("");
    });

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE" && maxRetries > 0) {
        console.log(`  Port ${port} in use, trying ${port + 1}...`);
        httpServer.close();
        tryListen(port + 1, maxRetries - 1);
      } else {
        console.error("  Failed to start server:", err.message);
        process.exit(1);
      }
    });
  };

  tryListen(PORT);
}

start();
