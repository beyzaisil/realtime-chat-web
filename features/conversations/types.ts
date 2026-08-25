export interface ConversationUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface DirectConversation {
  id: string;
  type: "DIRECT";
  title: string | null;
  createdAt: string;
  otherUser: ConversationUser;
}

export interface ConversationListItem extends DirectConversation {
  lastMessageAt: string | null;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface ConversationPage {
  items: ConversationListItem[];
  nextCursor: string | null;
}
