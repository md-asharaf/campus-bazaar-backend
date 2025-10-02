import "./config/moduleAlias";
import { createServer } from "http";
import app from "./app";
import { logger } from "./config/logger";
import { initializeSocket } from "./socket";
import realtimeChatService from "./socket/chat.service";

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with event-driven architecture
const socketManager = initializeSocket(server);

// Initialize realtime service with socket manager reference
realtimeChatService.initialize(socketManager);

// Start server
server.listen(PORT, () => {
    logger.info(`[SERVER] Backend is live on http://localhost:${PORT}`);
    logger.info(`[SERVER] Socket.IO initialized with event-driven architecture`);
    logger.info(`[SERVER] HTTP controllers and Socket.IO are properly separated`);
});

export { socketManager };
