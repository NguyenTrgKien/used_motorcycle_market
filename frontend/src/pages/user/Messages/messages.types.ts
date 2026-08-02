export interface ChatRouteState {
  postId?: number;
  conversationId?: number;
}

export interface ConversationPost {
  id: number;
  slug: string;
  title: string;
  price: number;
  imageUrl?: string;
}

export interface ConversationParticipant {
  id: number;
  fullName?: string;
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
}

export interface ConversationItem {
  id: number;
  buyerId: number;
  sellerId: number;
  postId: number;
  participant?: ConversationParticipant;
  post?: ConversationPost;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = "text" | "image" | "icon" | "file";

export interface ChatMessage {
  id: number;
  senderId: number;
  conversationId: number;
  content: string;
  messageType: MessageType;
  publicId?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: number;
    fullName?: string;
    avatar?: string;
  };
}

export interface ConversationUpdatedPayload {
  conversationId: number;
  senderId: number;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
}

export interface FileMessageContent {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}
