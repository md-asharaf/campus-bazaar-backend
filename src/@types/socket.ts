export interface ServerToClientEvents {
  connected: (data: { userId: string }) => void;

  joined_chat: (data: { chatId: string }) => void;
  left_chat: (data: { chatId: string }) => void;

  new_message: (data: { messageId: string; content: string; senderId: string; chatId: string, media?: string[] }) => void;
  message_delivered: (data: { messageId: string; deliveredTo: string }) => void;
  message_read: (data: { messageId: string; readBy: string }) => void;

  user_typing: (data: { userId: string; chatId: string }) => void;
  user_stopped_typing: (data: { userId: string; chatId: string }) => void;

  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;

  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_chat: (data: { chatId: string }) => void;
  leave_chat: (data: { chatId: string }) => void;

  send_message: (data: { chatId: string; content: string }) => void;
  mark_delivered: (data: { messageId: string }) => void;
  mark_read: (data: { messageId: string }) => void;

  typing_start: (data: { chatId: string }) => void;
  typing_stop: (data: { chatId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: string;
}