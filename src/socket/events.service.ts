import { EventEmitter } from 'events';
import { logger } from '@/config/logger';

// Event types for type safety
export interface ChatEvents {
  'message:created': {
    messageId: string;
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string | null;
    content: string;
    type: 'text' | 'image' | 'media';
    media?: Array<{ id: string; url: string; messageId: string }>;
    sentAt: Date;
    otherUserId: string;
  };
  
  'message:read': {
    messageId: string;
    chatId: string;
    readBy: string;
    readAt: Date | null;
    senderId: string;
  };
  
  'chat:created': {
    chatId: string;
    user1Id: string;
    user2Id: string;
    createdAt: Date;
  };
  
  'user:typing': {
    chatId: string;
    userId: string;
    userName: string;
  };
  
  'user:stopped_typing': {
    chatId: string;
    userId: string;
  };
}

class ChatEventService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase limit for multiple socket connections
    
    // Log all events in development
    if (process.env.NODE_ENV === 'development') {
      this.onAny((eventName, data) => {
        logger.debug(`[CHAT_EVENTS] ${eventName}:`, data);
      });
    }
  }

  // Type-safe event emission
  emitChatEvent<K extends keyof ChatEvents>(
    event: K, 
    data: ChatEvents[K]
  ): boolean {
    logger.info(`[CHAT_EVENTS] Emitting ${event}`);
    return this.emit(event, data);
  }

  // Type-safe event listening
  onChatEvent<K extends keyof ChatEvents>(
    event: K, 
    listener: (data: ChatEvents[K]) => void
  ): this {
    return this.on(event, listener);
  }

  // Remove listener
  offChatEvent<K extends keyof ChatEvents>(
    event: K, 
    listener: (data: ChatEvents[K]) => void
  ): this {
    return this.off(event, listener);
  }

  // Listen to any event (for debugging)
  onAny(listener: (eventName: string, data: any) => void): this {
    return this.on('*', listener);
  }

  // Helper methods for common events
  emitMessageCreated(data: ChatEvents['message:created']) {
    return this.emitChatEvent('message:created', data);
  }

  emitMessageRead(data: ChatEvents['message:read']) {
    return this.emitChatEvent('message:read', data);
  }

  emitChatCreated(data: ChatEvents['chat:created']) {
    return this.emitChatEvent('chat:created', data);
  }

  emitUserTyping(data: ChatEvents['user:typing']) {
    return this.emitChatEvent('user:typing', data);
  }

  emitUserStoppedTyping(data: ChatEvents['user:stopped_typing']) {
    return this.emitChatEvent('user:stopped_typing', data);
  }
}

// Export singleton instance
const chatEvents = new ChatEventService();
export { chatEvents };
export default chatEvents;