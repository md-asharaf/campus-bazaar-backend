import { logger } from '@/config/logger';

/**
 * RealtimeChatService - Utility service for Socket.IO management
 * 
 * This service provides utility methods to interact with the Socket.IO system
 * without mixing business logic with real-time concerns.
 * 
 * Business logic stays in HTTP controllers and services.
 * Real-time logic is handled by the Socket.IO manager through events.
 */
class RealtimeChatService {
    private socketManager: any = null;

    // Initialize with socket manager reference
    initialize(manager: any) {
        this.socketManager = manager;
        logger.info('[REALTIME_CHAT] Service initialized with Socket manager');
    }

    /**
     * Get online status of users
     */
    getOnlineUsers(): string[] {
        if (!this.socketManager) return [];
        return this.socketManager.getOnlineUsers();
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: string): boolean {
        if (!this.socketManager) return false;
        return this.socketManager.isUserOnline(userId);
    }

    /**
     * Get count of online users
     */
    getOnlineUsersCount(): number {
        if (!this.socketManager) return 0;
        return this.socketManager.getOnlineUsersCount();
    }

    /**
     * Send a custom notification to a user (for system notifications, not chat)
     */
    sendSystemNotification(userId: string, message: string): boolean {
        if (!this.socketManager) return false;
        return this.socketManager.sendNotificationToUser(userId, 'system_notification', {
            message,
            timestamp: new Date()
        });
    }

    /**
     * Get connection status
     */
    isInitialized(): boolean {
        return this.socketManager !== null;
    }
}

export default new RealtimeChatService();