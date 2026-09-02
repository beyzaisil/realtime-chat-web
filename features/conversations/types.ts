import type {
  Conversation as ContractConversation,
  ConversationListResponse,
  DirectConversation as ContractDirectConversation,
  GroupConversation as ContractGroupConversation,
  GroupMember as ContractGroupMember,
  ListedConversation as ContractListedConversation,
  ListedDirectConversation as ContractListedDirectConversation,
  ListedGroupConversation as ContractListedGroupConversation,
  PublicPeerUser,
} from "../../lib/api/types";

export type ConversationUser = PublicPeerUser;
export type Conversation = ContractConversation;
export type DirectConversation = ContractDirectConversation;
export type GroupConversation = ContractGroupConversation;
export type GroupMember = ContractGroupMember;
export type ConversationListItem = ContractListedConversation;
export type ListedDirectConversation = ContractListedDirectConversation;
export type ListedGroupConversation = ContractListedGroupConversation;
export type ConversationPage = ConversationListResponse;

export function isDirectConversation(
  conversation: Conversation,
): conversation is DirectConversation {
  return conversation.type === "DIRECT";
}

export function isGroupConversation(
  conversation: Conversation,
): conversation is GroupConversation {
  return conversation.type === "GROUP";
}

export function isListedDirectConversation(
  conversation: ConversationListItem,
): conversation is ListedDirectConversation {
  return conversation.type === "DIRECT";
}

export function isListedGroupConversation(
  conversation: ConversationListItem,
): conversation is ListedGroupConversation {
  return conversation.type === "GROUP";
}
