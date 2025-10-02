// Socket.IO event types for type safety

export interface ServerToClientEvents {
  // Connection events
  connected: (data: { message: string; userId: string }) => void;
  
  // One-to-one conversation events
  joined_chat: (data: { 
    chatId: string; 
    otherUser: {
      id: string;
      name: string;
      avatar?: string | null;
    };
    conversationType: 'one-to-one';
  }) => void;
  left_chat: (data: { chatId: string }) => void;
  
  // Conversation partner status
  conversation_partner_online: (data: {
    userId: string;
    userName: string;
    avatar?: string | null;
  }) => void;
  
  conversation_partner_offline: (data: {
    userId: string;
    userName: string;
  }) => void;
  
  // Message events
  new_message: (data: {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    sentAt: Date;
    deliveredAt?: Date | null;
    readAt?: Date | null;
    sender: {
      id: string;
      name: string;
      avatar?: string | null;
    };
    tempId?: string;
    type: 'text' | 'image' | 'media';
    media?: Array<{
      id: string;
      url: string;
      messageId: string;
    }>;
  }) => void;
  
  new_message_notification: (data: {
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string | null;
    otherUserName: string;
    preview: string;
    timestamp: Date;
    type: 'text' | 'image' | 'media';
  }) => void;
  
  message_read: (data: {
    messageId: string;
    readBy: string;
    readAt: Date | null;
  }) => void;
  
  // Typing indicators
  user_typing: (data: {
    userId: string;
    userName: string;
    chatId: string;
  }) => void;
  
  user_stopped_typing: (data: {
    userId: string;
    chatId: string;
  }) => void;
  
  // System notifications
  system_notification: (data: { 
    message: string; 
    timestamp: Date;
  }) => void;
  
  // Error events
  error: (data: { message: string }) => void;
  message_error: (data: { tempId?: string; error: string }) => void;
}

export interface ClientToServerEvents {
  // Chat room events
  join_chat: (data: { chatId: string }) => void;
  leave_chat: (data: { chatId: string }) => void;
  
  // Message events
  send_message: (data: {
    chatId: string;
    content: string;
    tempId?: string;
  }) => void;
  
  // Read receipts
  mark_message_read: (data: { messageId: string }) => void;
  
  // Typing indicators
  typing_start: (data: { chatId: string }) => void;
  typing_stop: (data: { chatId: string }) => void;
}

export interface InterServerEvents {
  // Events between server instances (for scaling)
  ping: () => void;
}

export interface SocketData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    isVerified: boolean;
    isActive: boolean;
  };
}