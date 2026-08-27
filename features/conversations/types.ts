import type {
  ConversationListResponse,
  DirectConversation as ContractDirectConversation,
  ListedConversation,
  PublicPeerUser,
} from "../../lib/api/types";

export type ConversationUser = PublicPeerUser;
export type DirectConversation = ContractDirectConversation;
export type ConversationListItem = ListedConversation;
export type ConversationPage = ConversationListResponse;
