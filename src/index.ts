import "./config/moduleAlias";
import { createServer } from "http";
import app from "./app";
import { logger } from "./config/logger";
import { initializeSocket } from "./socket";

const PORT = process.env.PORT || 3000;

const server = createServer(app);

const socketManager = initializeSocket(server);

server.listen(PORT, () => {
    logger.info(`[SERVER] Backend running on http://localhost:${PORT}`);
});

export { socketManager };
