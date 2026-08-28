import type { components, operations } from "./generated/schema";

type Schemas = components["schemas"];

export type PublicUser = Schemas["PublicUser"];
export type LoginRequest = Schemas["LoginRequest"];
export type RegisterRequest = Schemas["RegisterRequest"];
export type AuthResponse = Schemas["AuthResponse"];
export type RefreshResponse = Schemas["RefreshResponse"];
export type CurrentUserResponse = Schemas["CurrentUserResponse"];

export type PublicPeerUser = Schemas["PublicPeerUser"];
export type UserSearchResponse = Schemas["UserSearchResponse"];

export type CreateDirectConversationRequest =
  Schemas["CreateDirectConversationRequest"];
export type DirectConversation = Schemas["DirectConversation"];
export type ListedConversation = Schemas["ListedConversation"];
export type ConversationListResponse = Schemas["ConversationListResponse"];

export type CreateMessageRequest = Schemas["CreateMessageRequest"];
export type UpdateMessageRequest = Schemas["UpdateMessageRequest"];
export type Message = Schemas["Message"];
export type MessageHistoryResponse = Schemas["MessageHistoryResponse"];
export type UpdateReadRequest = Schemas["UpdateReadRequest"];
export type ReadWatermarkResponse = Schemas["ReadWatermarkResponse"];

export type LoginOperationRequest =
  operations["login"]["requestBody"]["content"]["application/json"];
export type LoginOperationResponse =
  operations["login"]["responses"][200]["content"]["application/json"];
export type RegisterOperationRequest =
  operations["register"]["requestBody"]["content"]["application/json"];
export type RegisterOperationResponse =
  operations["register"]["responses"][201]["content"]["application/json"];
export type RefreshOperationResponse =
  operations["refreshAccessToken"]["responses"][200]["content"]["application/json"];
export type CurrentUserOperationResponse =
  operations["getCurrentUser"]["responses"][200]["content"]["application/json"];

export type SearchUsersQuery =
  operations["searchUsers"]["parameters"]["query"];
export type SearchUsersOperationResponse =
  operations["searchUsers"]["responses"][200]["content"]["application/json"];

export type ListConversationsQuery = NonNullable<
  operations["listConversations"]["parameters"]["query"]
>;
export type ListConversationsOperationResponse =
  operations["listConversations"]["responses"][200]["content"]["application/json"];
export type GetConversationPath =
  operations["getConversation"]["parameters"]["path"];
export type GetConversationOperationResponse =
  operations["getConversation"]["responses"][200]["content"]["application/json"];
export type CreateDirectConversationOperationRequest =
  operations["createDirectConversation"]["requestBody"]["content"]["application/json"];
export type CreateDirectConversationOperationResponse =
  | operations["createDirectConversation"]["responses"][200]["content"]["application/json"]
  | operations["createDirectConversation"]["responses"][201]["content"]["application/json"];

export type ListMessagesQuery = NonNullable<
  operations["listMessages"]["parameters"]["query"]
>;
export type ListMessagesPath =
  operations["listMessages"]["parameters"]["path"];
export type ListMessagesOperationResponse =
  operations["listMessages"]["responses"][200]["content"]["application/json"];
export type CreateMessagePath =
  operations["createMessage"]["parameters"]["path"];
export type CreateMessageOperationRequest =
  operations["createMessage"]["requestBody"]["content"]["application/json"];
export type CreateMessageOperationResponse =
  | operations["createMessage"]["responses"][200]["content"]["application/json"]
  | operations["createMessage"]["responses"][201]["content"]["application/json"];
export type UpdateMessagePath =
  operations["updateMessage"]["parameters"]["path"];
export type UpdateMessageOperationRequest =
  operations["updateMessage"]["requestBody"]["content"]["application/json"];
export type UpdateMessageOperationResponse =
  operations["updateMessage"]["responses"][200]["content"]["application/json"];
export type DeleteMessagePath =
  operations["deleteMessage"]["parameters"]["path"];
export type DeleteMessageOperationResponse =
  operations["deleteMessage"]["responses"][200]["content"]["application/json"];
export type UpdateReadWatermarkPath =
  operations["updateReadWatermark"]["parameters"]["path"];
export type UpdateReadWatermarkOperationRequest =
  operations["updateReadWatermark"]["requestBody"]["content"]["application/json"];
export type UpdateReadWatermarkOperationResponse =
  operations["updateReadWatermark"]["responses"][200]["content"]["application/json"];
