import type { components, operations } from "./generated/schema";

type Schemas = components["schemas"];

export type PublicUser = Schemas["PublicUser"];
export type LoginRequest = Schemas["LoginRequest"];
export type RegisterRequest = Schemas["RegisterRequest"];
export type AuthResponse = Schemas["AuthResponse"];
export type RefreshResponse = Schemas["RefreshResponse"];
export type CurrentUserResponse = Schemas["CurrentUserResponse"];
export type AuthSession = Schemas["AuthSession"];
export type AuthSessionListResponse = Schemas["AuthSessionListResponse"];
export type ChangePasswordRequest = Schemas["ChangePasswordRequest"];

export type PublicPeerUser = Schemas["PublicPeerUser"];
export type UserSearchResponse = Schemas["UserSearchResponse"];

export type CreateDirectConversationRequest =
  Schemas["CreateDirectConversationRequest"];
export type Conversation = Schemas["Conversation"];
export type DirectConversation = Schemas["DirectConversation"];
export type GroupConversation = Schemas["GroupConversation"];
export type GroupMember = Schemas["GroupMember"];
export type ListedConversation = Schemas["ListedConversation"];
export type ListedDirectConversation = Schemas["ListedDirectConversation"];
export type ListedGroupConversation = Schemas["ListedGroupConversation"];
export type ConversationListResponse = Schemas["ConversationListResponse"];

export type CreateMessageRequest = Schemas["CreateMessageRequest"];
export type UpdateMessageRequest = Schemas["UpdateMessageRequest"];
export type Message = Schemas["Message"];
export type TextMessage = Schemas["TextMessage"];
export type MediaMessage = Schemas["MediaMessage"];
export type MessageAttachment = Schemas["MessageAttachment"];
export type ImageMessageAttachment = Schemas["ImageMessageAttachment"];
export type PdfMessageAttachment = Schemas["PdfMessageAttachment"];
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
export type UpdateCurrentUserOperationRequest =
  operations["updateCurrentUser"]["requestBody"]["content"]["application/json"];
export type UpdateCurrentUserOperationResponse =
  operations["updateCurrentUser"]["responses"][200]["content"]["application/json"];
export type CreateAvatarUploadOperationRequest =
  operations["createAvatarUpload"]["requestBody"]["content"]["application/json"];
export type CreateAvatarUploadOperationResponse =
  operations["createAvatarUpload"]["responses"][201]["content"]["application/json"];
export type CompleteAvatarUploadPath =
  operations["completeAvatarUpload"]["parameters"]["path"];
export type CompleteAvatarUploadOperationResponse =
  operations["completeAvatarUpload"]["responses"][200]["content"]["application/json"];
export type DeleteCurrentUserAvatarOperationResponse =
  operations["deleteCurrentUserAvatar"]["responses"][200]["content"]["application/json"];
export type ChangePasswordOperationRequest =
  operations["changePassword"]["requestBody"]["content"]["application/json"];
export type ListAuthSessionsOperationResponse =
  operations["listAuthSessions"]["responses"][200]["content"]["application/json"];
export type RevokeAuthSessionPath =
  operations["revokeAuthSession"]["parameters"]["path"];

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
export type CreateGroupConversationOperationRequest =
  operations["createGroupConversation"]["requestBody"]["content"]["application/json"];
export type CreateGroupConversationOperationResponse =
  operations["createGroupConversation"]["responses"][201]["content"]["application/json"];
export type UpdateGroupTitlePath =
  operations["updateGroupTitle"]["parameters"]["path"];
export type UpdateGroupTitleOperationRequest =
  operations["updateGroupTitle"]["requestBody"]["content"]["application/json"];
export type UpdateGroupTitleOperationResponse =
  operations["updateGroupTitle"]["responses"][200]["content"]["application/json"];
export type AddGroupMemberPath =
  operations["addGroupMember"]["parameters"]["path"];
export type AddGroupMemberOperationRequest =
  operations["addGroupMember"]["requestBody"]["content"]["application/json"];
export type AddGroupMemberOperationResponse =
  operations["addGroupMember"]["responses"][201]["content"]["application/json"];
export type LeaveGroupConversationPath =
  operations["leaveGroupConversation"]["parameters"]["path"];
export type RemoveGroupMemberPath =
  operations["removeGroupMember"]["parameters"]["path"];
export type UpdateGroupMemberRolePath =
  operations["updateGroupMemberRole"]["parameters"]["path"];
export type UpdateGroupMemberRoleOperationRequest =
  operations["updateGroupMemberRole"]["requestBody"]["content"]["application/json"];
export type UpdateGroupMemberRoleOperationResponse =
  operations["updateGroupMemberRole"]["responses"][200]["content"]["application/json"];
export type TransferGroupOwnershipPath =
  operations["transferGroupOwnership"]["parameters"]["path"];
export type TransferGroupOwnershipOperationRequest =
  operations["transferGroupOwnership"]["requestBody"]["content"]["application/json"];
export type TransferGroupOwnershipOperationResponse =
  operations["transferGroupOwnership"]["responses"][200]["content"]["application/json"];

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
