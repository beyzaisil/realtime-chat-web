/**
 * Bu dosya OpenAPI sözleşmesinden otomatik üretilmiştir.
 * Elle düzenlemeyin; npm run contract:generate komutunu kullanın.
 */

export interface paths {
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * E-posta ve parola ile oturum açma
         * @description IP başına 15 dakikada 10 istekle sınırlıdır. Paylaşımlı NAT/CGNAT istemcileri aynı kotayı tüketir.
         */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mevcut access token'a ait oturumu iptal etme */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Mevcut kullanıcıyı alma */
        get: operations["getCurrentUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Mevcut parolayı değiştirme
         * @description Mevcut parolayı doğrular, yeni parolayı register ile aynı kurala göre
         *     kaydeder ve mevcut session dışındaki tüm session'ları iptal eder.
         *     Doğrulanmış kullanıcı başına 15 dakikada 10 istekle sınırlıdır.
         */
        patch: operations["changePassword"];
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refresh token'ı döndürerek yeni access token alma
         * @description IP başına 5 dakikada 30 istekle sınırlıdır.
         */
        post: operations["refreshAccessToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Kullanıcı kaydı ve oturum oluşturma
         * @description IP başına 60 dakikada 5 istekle sınırlıdır.
         */
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Aktif session'ları listeleme */
        get: operations["listAuthSessions"];
        put?: never;
        post?: never;
        /** Mevcut session dışındaki tüm session'ları iptal etme */
        delete: operations["revokeOtherAuthSessions"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Belirli bir session'ı iptal etme
         * @description Session yalnızca doğrulanmış kullanıcıya aitse iptal edilir. Hedef mevcut
         *     session ise refresh cookie de temizlenir. Başkasına ait veya zaten iptal
         *     edilmiş bir kimlik bilgi sızdırmamak için yine 204 döner.
         */
        delete: operations["revokeAuthSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Aktif DIRECT ve GROUP konuşmalarını listeleme */
        get: operations["listConversations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Aktif üyesi olunan DIRECT veya GROUP konuşmasını alma */
        get: operations["getConversation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update a GROUP title */
        patch: operations["updateGroupTitle"];
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add or reactivate a GROUP member */
        post: operations["addGroupMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/members/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
                /** @example 22222222-2222-4222-8222-222222222222 */
                userId: components["parameters"]["UserId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove a GROUP member */
        delete: operations["removeGroupMember"];
        options?: never;
        head?: never;
        /** Change a member between MEMBER and ADMIN */
        patch: operations["updateGroupMemberRole"];
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/members/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Leave a GROUP */
        delete: operations["leaveGroupConversation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Mesaj geçmişini listeleme */
        get: operations["listMessages"];
        put?: never;
        /**
         * Metin mesajı oluşturma veya idempotent retry sonucunu döndürme
         * @description Doğrulanmış kullanıcı başına dakikada 60 istekle sınırlıdır.
         */
        post: operations["createMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/messages/{messageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Gönderenin mesajını soft-delete etmesi
         * @description Kayıt DB'den silinmez. İlk başarılı silmede `deletedAt` yazılır ve commit
         *     sonrasında `message:deleted` yayınlanır. Aynı gönderenin tekrarlanan silme
         *     isteği aynı tombstone'u döndürür; timestamp değişmez ve ikinci event
         *     yayınlanmaz.
         */
        delete: operations["deleteMessage"];
        options?: never;
        head?: never;
        /**
         * Gönderenin metin mesajını düzenlemesi
         * @description Yalnızca mesajı gönderen aktif conversation üyesi düzenleyebilir. Trim
         *     edilmiş içerik mevcut body ile aynıysa işlem idempotent no-op olur;
         *     `editedAt` değişmez ve `message:updated` yayınlanmaz. Silinmiş mesaj
         *     düzenlenemez.
         */
        patch: operations["updateMessage"];
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/owner": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Transfer GROUP ownership to an active member */
        put: operations["transferGroupOwnership"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Kullanıcının okundu watermark'ını ileri taşıma */
        put: operations["updateReadWatermark"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/direct": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Doğrudan konuşmayı oluşturma veya var olanı döndürme */
        post: operations["createDirectConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/group": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a group conversation */
        post: operations["createGroupConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/healthz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Süreç canlılık kontrolü */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/readyz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** PostgreSQL hazır olma kontrolü */
        get: operations["getReadiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Aktif kullanıcıları kullanıcı adı veya görünen ad ile arama
         * @description Doğrulanmış kullanıcı başına dakikada 60 istekle sınırlıdır.
         */
        get: operations["searchUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Mevcut kullanıcının profilini güncelleme
         * @description `username` ve/veya `displayName` gönderilmelidir.
         */
        patch: operations["updateCurrentUser"];
        trace?: never;
    };
    "/api/v1/users/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Mevcut avatar referansını kaldırma
         * @description Kullanıcının `avatarUrl` ve güncel media ilişkisini hemen temizler.
         *     Object storage nesnesi istek içinde silinmez; periyodik temizlik tarafından kaldırılır.
         */
        delete: operations["deleteCurrentUserAvatar"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me/avatar/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Avatar için doğrudan object-storage yükleme adresi oluşturma
         * @description İstemci dosyayı API gövdesine göndermez. Bu uçtan alınan imzalı URL'ye
         *     dönen `Content-Type` başlığıyla `PUT` yapar, ardından complete ucunu çağırır.
         *     Upload intent ve complete aynı kullanıcı bazlı `20/15 dakika` kotasını tüketir.
         *     JPEG, PNG ve WebP kabul edilir; HEIC/HEIF, SVG, GIF ve video kabul edilmez.
         */
        post: operations["createAvatarUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me/avatar/uploads/{uploadId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Yüklenen avatarı doğrulama, dönüştürme ve profile bağlama
         * @description Private `incoming/` nesnesini okur; gerçek MIME, byte boyutu ve görseli
         *     doğrular. En fazla 5 MiB ve 4096×4096 kaynak kabul edilir. Sonuç metadata'sı
         *     temizlenmiş sabit 512×512 WebP olarak public `public/` prefix'ine yazılır.
         *     Aynı tamamlanmış güncel upload için retry idempotenttir.
         */
        post: operations["completeAvatarUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AuthResponse: {
            accessToken: string;
            user: components["schemas"]["PublicUser"];
        };
        AuthSession: {
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            expiresAt: string;
            /** Format: uuid */
            id: string;
            isCurrent: boolean;
            /** Format: date-time */
            lastUsedAt: string;
            /** @description Session oluşturulurken gelen User-Agent; eski session'larda null olabilir. */
            userAgent: string | null;
        };
        AuthSessionListResponse: {
            items: components["schemas"]["AuthSession"][];
        };
        AvatarUploadIntent: {
            upload: {
                /** Format: date-time */
                expiresAt: string;
                /** @description PUT sırasında aynen gönderilmelidir; Content-Type imzaya dahildir. */
                headers: {
                    [key: string]: string;
                };
                /** @constant */
                method: "PUT";
                /**
                 * Format: uri
                 * @description Private incoming nesnesine ait, on dakika geçerli imzalı URL.
                 */
                url: string;
            };
            /** Format: uuid */
            uploadId: string;
        };
        ChangePasswordRequest: {
            /** Format: password */
            currentPassword: string;
            /** Format: password */
            newPassword: string;
        };
        Conversation: components["schemas"]["DirectConversation"] | components["schemas"]["GroupConversation"];
        ConversationListResponse: {
            items: components["schemas"]["ListedConversation"][];
            nextCursor: string | null;
        };
        CreateAvatarUploadRequest: {
            /** @description Kaynak nesnenin byte boyutu; complete aşamasında kesin doğrulanır. */
            contentLength: number;
            /**
             * @description İmzaya bağlanacak kaynak MIME türü.
             * @enum {string}
             */
            contentType: "image/jpeg" | "image/png" | "image/webp";
        };
        CreateDirectConversationRequest: {
            /** Format: uuid */
            userId: string;
        };
        CreateGroupConversationRequest: {
            title: string;
            /** @description Creator is not included; creator plus these users must total at least 3. */
            userIds: string[];
        };
        CreateMessageRequest: {
            /** Format: uuid */
            clientMessageId: string;
            content: {
                /** @description Kaydedilmeden önce trim edilir. */
                text: string;
                /** @constant */
                type: "text";
            };
        };
        CurrentUserResponse: {
            user: components["schemas"]["PublicUser"];
        };
        DirectConversation: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            otherUser: components["schemas"]["PublicPeerUser"];
            title: string | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DIRECT";
        };
        ErrorResponse: {
            error: {
                code: string;
                details?: {
                    issues?: components["schemas"]["ValidationIssue"][];
                } & {
                    [key: string]: unknown;
                };
                message: string;
                requestId: string;
            };
        };
        GroupConversation: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            members: components["schemas"]["GroupMember"][];
            title: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "GROUP";
        };
        GroupMember: {
            /** Format: date-time */
            joinedAt: string;
            /** @enum {string} */
            role: "MEMBER" | "ADMIN" | "OWNER";
            user: components["schemas"]["PublicPeerUser"];
            /** Format: uuid */
            userId: string;
        };
        HealthResponse: {
            /** @constant */
            status: "ok";
        };
        LastMessage: {
            /** @description Soft-delete edilmiş son mesajda null; DB içeriği istemciye açılmaz. */
            body: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            deletedAt: string | null;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            senderId: string;
        };
        ListedConversation: components["schemas"]["ListedDirectConversation"] | components["schemas"]["ListedGroupConversation"];
        ListedDirectConversation: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            lastMessage: components["schemas"]["LastMessage"] | null;
            /** Format: date-time */
            lastMessageAt: string | null;
            otherUser: components["schemas"]["PublicPeerUser"];
            title: string | null;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DIRECT";
            unreadCount: number;
        };
        ListedGroupConversation: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            lastMessage: components["schemas"]["LastMessage"] | null;
            /** Format: date-time */
            lastMessageAt: string | null;
            members: components["schemas"]["GroupMember"][];
            title: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "GROUP";
            unreadCount: number;
        };
        LoginRequest: {
            /**
             * Format: email
             * @description Trim edilir ve küçük harfe çevrilir.
             */
            email: string;
            /** Format: password */
            password: string;
        };
        Message: {
            /** @description Soft-delete edilmiş mesajda null; saklanan DB içeriği API'de açılmaz. */
            body: string | null;
            /** Format: uuid */
            clientMessageId: string;
            /** Format: uuid */
            conversationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            deletedAt: string | null;
            /** Format: date-time */
            editedAt: string | null;
            /** Format: uuid */
            id: string;
            /** @constant */
            kind: "TEXT";
            /** Format: uuid */
            senderId: string;
        };
        MessageHistoryResponse: {
            items: components["schemas"]["Message"][];
            nextCursor: string | null;
        };
        PublicPeerUser: {
            avatarUrl: string | null;
            displayName: string;
            /** Format: uuid */
            id: string;
            username: string;
        };
        PublicUser: {
            avatarUrl: string | null;
            /** Format: date-time */
            createdAt: string;
            displayName: string;
            /** Format: email */
            email: string;
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            status: "ACTIVE" | "DISABLED";
            username: string;
        };
        ReadinessResponse: {
            /** @enum {string} */
            status: "ready" | "not_ready";
        };
        ReadWatermarkResponse: {
            /** Format: uuid */
            conversationId: string;
            /** Format: date-time */
            readAt: string;
            /** @enum {string} */
            status: "created" | "advanced" | "unchanged";
            /** Format: uuid */
            throughMessageId: string;
        };
        RefreshResponse: {
            accessToken: string;
        };
        RegisterRequest: {
            /** @description Trim edilir. */
            displayName: string;
            /**
             * Format: email
             * @description Trim edilir ve küçük harfe çevrilir.
             */
            email: string;
            /** Format: password */
            password: string;
            /** @description Trim edilir. */
            username: string;
        };
        UpdateCurrentUserRequest: {
            /** @description Trim edilir. */
            displayName?: string;
            /** @description Trim edilir ve tekil olmalıdır. */
            username?: string;
        };
        UpdateGroupMemberRoleRequest: {
            /** @enum {string} */
            role: "MEMBER" | "ADMIN";
        };
        UpdateGroupTitleRequest: {
            title: string;
        };
        UpdateMessageRequest: {
            content: {
                /** @description Karşılaştırılmadan ve kaydedilmeden önce trim edilir. */
                text: string;
                /** @constant */
                type: "text";
            };
        };
        UpdateReadRequest: {
            /** Format: uuid */
            throughMessageId: string;
        };
        UserIdRequest: {
            /** Format: uuid */
            userId: string;
        };
        UserSearchResponse: {
            items: components["schemas"]["PublicPeerUser"][];
            nextCursor: string | null;
        };
        ValidationIssue: {
            message: string;
            path: string;
        };
    };
    responses: {
        /** @description Object storage geçici olarak kullanılamıyor */
        AvatarStorageUnavailable: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "AVATAR_STORAGE_UNAVAILABLE",
                 *         "message": "Avatar storage is temporarily unavailable",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Bearer header yok/bozuk veya access token/DB oturumu geçersiz */
        BearerUnauthorized: {
            headers: {
                /** @description Bearer challenge */
                "WWW-Authenticate"?: "Bearer realm=\"chat-api\"";
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Membership, capacity, OWNER-target, or last-OWNER conflict */
        ConversationConflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Konuşma bulunamadı veya kullanıcı aktif üye değil; iki durum aynı cevapla gizlenir */
        ConversationNotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "CONVERSATION_NOT_FOUND",
                 *         "message": "Conversation not found",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Production `Origin` başlığı `FRONTEND_ORIGIN` ile eşleşmedi */
        CsrfError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "CSRF_VALIDATION_FAILED",
                 *         "message": "The request origin is not allowed",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Active member role does not permit the operation */
        InsufficientRole: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "INSUFFICIENT_ROLE",
                 *         "message": "Your role does not permit this action",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Beklenmeyen sunucu hatası; iç hata ayrıntısı istemciye açılmaz */
        InternalError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "INTERNAL_SERVER_ERROR",
                 *         "message": "An unexpected error occurred",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /**
         * @description Conversation bulunamadı/aktif üyelik yok veya mesaj bulunamadı,
         *     gönderene ait değil ya da düzenleme sırasında zaten silinmiş. Varlık ve
         *     yetki ayrıntıları 404 altında gizlenir.
         */
        MessageMutationNotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description JSON gövdesi 1 MiB sınırını aştı */
        PayloadTooLarge: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "PAYLOAD_TOO_LARGE",
                 *         "message": "Request body is too large",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description İlgili endpoint'in bağımsız kotası aşıldı */
        RateLimited: {
            headers: {
                /** @description express-rate-limit tarafından draft-8 biçiminde üretilen mevcut kota durumu. */
                RateLimit?: string;
                /** @description express-rate-limit tarafından draft-8 biçiminde üretilen kota politikası. */
                "RateLimit-Policy"?: string;
                "Retry-After": components["headers"]["RetryAfter"];
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": {
                 *         "code": "RATE_LIMIT_EXCEEDED",
                 *         "message": "Too many requests",
                 *         "requestId": "77777777-7777-4777-8777-777777777777"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Zod/request doğrulaması veya bozuk JSON */
        ValidationError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @example 33333333-3333-4333-8333-333333333333 */
        ConversationId: string;
        /** @example 44444444-4444-4444-8444-444444444444 */
        MessageId: string;
        /**
         * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
         *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
         *     Development/test ortamında middleware bu kontrolü atlar.
         *     Kaynak: `src/modules/auth/auth.routes.ts`,
         *     `src/modules/auth/auth.middleware.ts`.
         * @example https://chat.example.com
         */
        ProductionOrigin: string;
        /** @example 22222222-2222-4222-8222-222222222222 */
        UserId: string;
    };
    requestBodies: never;
    headers: {
        /** @description Hassas auth cevabının cache'lenmesini engeller. */
        NoStore: "no-store";
        /**
         * @description `chat_refresh_token=<opaque>; Path=/api/v1/auth; HttpOnly; SameSite=Lax`.
         *     `Max-Age` ve `Expires` session süresinden hesaplanır; production'da
         *     `Secure` eklenir. Kaynak: `src/modules/auth/refresh-cookie.ts`.
         */
        RefreshCookie: string;
        /**
         * @description Rate-limit penceresinin sıfırlanmasına kalan tam saniye.
         * @example 60
         */
        RetryAfter: number;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "email": "alice@example.com",
                 *       "password": "correct-password"
                 *     }
                 */
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Oturum açıldı; refresh cookie set edildi */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    "Set-Cookie": components["headers"]["RefreshCookie"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "user": {
                     *         "id": "11111111-1111-4111-8111-111111111111",
                     *         "email": "alice@example.com",
                     *         "username": "alice",
                     *         "displayName": "Alice",
                     *         "avatarUrl": null,
                     *         "status": "ACTIVE",
                     *         "createdAt": "2030-01-01T00:00:00.000Z"
                     *       },
                     *       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"
                     *     }
                     */
                    "application/json": components["schemas"]["AuthResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            /** @description E-posta/parola eşleşmedi veya kullanıcı aktif değil */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "INVALID_CREDENTIALS",
                     *         "message": "The email or password is incorrect",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            413: components["responses"]["PayloadTooLarge"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
                 *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
                 *     Development/test ortamında middleware bu kontrolü atlar.
                 *     Kaynak: `src/modules/auth/auth.routes.ts`,
                 *     `src/modules/auth/auth.middleware.ts`.
                 * @example https://chat.example.com
                 */
                Origin?: components["parameters"]["ProductionOrigin"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Oturum iptal edildi; refresh cookie temizlendi; gövde yok */
            204: {
                headers: {
                    /**
                     * @description `chat_refresh_token` cookie'sini
                     *     `Expires=Thu, 01 Jan 1970 00:00:00 GMT` ile temizler.
                     */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["CsrfError"];
            500: components["responses"]["InternalError"];
        };
    };
    getCurrentUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Aktif kullanıcı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "user": {
                     *         "id": "11111111-1111-4111-8111-111111111111",
                     *         "email": "alice@example.com",
                     *         "username": "alice",
                     *         "displayName": "Alice",
                     *         "avatarUrl": null,
                     *         "status": "ACTIVE",
                     *         "createdAt": "2030-01-01T00:00:00.000Z"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CurrentUserResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            500: components["responses"]["InternalError"];
        };
    };
    changePassword: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
                 *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
                 *     Development/test ortamında middleware bu kontrolü atlar.
                 *     Kaynak: `src/modules/auth/auth.routes.ts`,
                 *     `src/modules/auth/auth.middleware.ts`.
                 * @example https://chat.example.com
                 */
                Origin?: components["parameters"]["ProductionOrigin"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordRequest"];
            };
        };
        responses: {
            /** @description Parola değiştirildi ve diğer session'lar iptal edildi; gövde yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["ValidationError"];
            /** @description Bearer token geçersiz veya mevcut parola yanlış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            403: components["responses"]["CsrfError"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    refreshAccessToken: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
                 *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
                 *     Development/test ortamında middleware bu kontrolü atlar.
                 *     Kaynak: `src/modules/auth/auth.routes.ts`,
                 *     `src/modules/auth/auth.middleware.ts`.
                 * @example https://chat.example.com
                 */
                Origin?: components["parameters"]["ProductionOrigin"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Refresh token döndürüldü; yeni cookie ve access token üretildi */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    "Set-Cookie": components["headers"]["RefreshCookie"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "accessToken": "example-rotated-access-token"
                     *     }
                     */
                    "application/json": components["schemas"]["RefreshResponse"];
                };
            };
            /** @description Cookie yok, token geçersiz, iptal edilmiş, süresi dolmuş veya yarışta daha önce döndürülmüş */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "INVALID_REFRESH_TOKEN",
                     *         "message": "The refresh token is invalid",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            403: components["responses"]["CsrfError"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "email": "alice@example.com",
                 *       "username": "alice",
                 *       "displayName": "Alice",
                 *       "password": "correct-password"
                 *     }
                 */
                "application/json": components["schemas"]["RegisterRequest"];
            };
        };
        responses: {
            /** @description Kullanıcı ve oturum oluşturuldu; refresh cookie set edildi */
            201: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    "Set-Cookie": components["headers"]["RefreshCookie"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "user": {
                     *         "id": "11111111-1111-4111-8111-111111111111",
                     *         "email": "alice@example.com",
                     *         "username": "alice",
                     *         "displayName": "Alice",
                     *         "avatarUrl": null,
                     *         "status": "ACTIVE",
                     *         "createdAt": "2030-01-01T00:00:00.000Z"
                     *       },
                     *       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"
                     *     }
                     */
                    "application/json": components["schemas"]["AuthResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            /** @description E-posta, kullanıcı adı veya kullanıcı tekilliği çakıştı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            413: components["responses"]["PayloadTooLarge"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    listAuthSessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Süresi dolmamış ve iptal edilmemiş session'lar */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSessionListResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            500: components["responses"]["InternalError"];
        };
    };
    revokeOtherAuthSessions: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
                 *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
                 *     Development/test ortamında middleware bu kontrolü atlar.
                 *     Kaynak: `src/modules/auth/auth.routes.ts`,
                 *     `src/modules/auth/auth.middleware.ts`.
                 * @example https://chat.example.com
                 */
                Origin?: components["parameters"]["ProductionOrigin"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Diğer session'lar iptal edildi; gövde yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["CsrfError"];
            500: components["responses"]["InternalError"];
        };
    };
    revokeAuthSession: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Production ortamında zorunludur ve `FRONTEND_ORIGIN` ile bire bir
                 *     karşılaştırılır; eşleşmezse `403 CSRF_VALIDATION_FAILED` döner.
                 *     Development/test ortamında middleware bu kontrolü atlar.
                 *     Kaynak: `src/modules/auth/auth.routes.ts`,
                 *     `src/modules/auth/auth.middleware.ts`.
                 * @example https://chat.example.com
                 */
                Origin?: components["parameters"]["ProductionOrigin"];
            };
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İşlem tamamlandı; gövde yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["CsrfError"];
            500: components["responses"]["InternalError"];
        };
    };
    listConversations: {
        parameters: {
            query?: {
                /**
                 * @description Önceki cevabın `nextCursor` değeri; opak base64url string olarak kullanılmalıdır.
                 * @example eyJ2IjoxLCJsYXN0TWVzc2FnZUF0IjoiMjAzMC0wMS0wMVQwMDowMDowMC4wMDBaIiwiY3JlYXRlZEF0IjoiMjAyOS0xMi0zMVQwMDowMDowMC4wMDBaIiwiaWQiOiIzMzMzMzMzMy0zMzMzLTQzMzMtODMzMy0zMzMzMzMzMzMzMzMifQ
                 */
                cursor?: string;
                /** @example 20 */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Son mesaja göre azalan sırada konuşma sayfası */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "items": [
                     *         {
                     *           "id": "33333333-3333-4333-8333-333333333333",
                     *           "type": "DIRECT",
                     *           "title": null,
                     *           "createdAt": "2029-12-31T00:00:00.000Z",
                     *           "otherUser": {
                     *             "id": "22222222-2222-4222-8222-222222222222",
                     *             "username": "bob",
                     *             "displayName": "Bob",
                     *             "avatarUrl": null
                     *           },
                     *           "lastMessageAt": "2030-01-01T00:00:00.000Z",
                     *           "lastMessage": {
                     *             "id": "44444444-4444-4444-8444-444444444444",
                     *             "body": "Merhaba",
                     *             "senderId": "22222222-2222-4222-8222-222222222222",
                     *             "createdAt": "2030-01-01T00:00:00.000Z",
                     *             "deletedAt": null
                     *           },
                     *           "unreadCount": 1
                     *         }
                     *       ],
                     *       "nextCursor": null
                     *     }
                     */
                    "application/json": components["schemas"]["ConversationListResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            500: components["responses"]["InternalError"];
        };
    };
    getConversation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Konuşma detayı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "33333333-3333-4333-8333-333333333333",
                     *       "type": "DIRECT",
                     *       "title": null,
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "otherUser": {
                     *         "id": "22222222-2222-4222-8222-222222222222",
                     *         "username": "bob",
                     *         "displayName": "Bob",
                     *         "avatarUrl": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Conversation"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["ConversationNotFound"];
            500: components["responses"]["InternalError"];
        };
    };
    updateGroupTitle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateGroupTitleRequest"];
            };
        };
        responses: {
            /** @description Updated group */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupConversation"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["InsufficientRole"];
            404: components["responses"]["ConversationNotFound"];
            500: components["responses"]["InternalError"];
        };
    };
    addGroupMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserIdRequest"];
            };
        };
        responses: {
            /** @description Active MEMBER */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupMember"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["InsufficientRole"];
            404: components["responses"]["ConversationNotFound"];
            409: components["responses"]["ConversationConflict"];
        };
    };
    removeGroupMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
                /** @example 22222222-2222-4222-8222-222222222222 */
                userId: components["parameters"]["UserId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Membership deactivated and all target sockets removed from the room */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Target is the caller; use /members/me */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["InsufficientRole"];
            404: components["responses"]["ConversationNotFound"];
            409: components["responses"]["ConversationConflict"];
        };
    };
    updateGroupMemberRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
                /** @example 22222222-2222-4222-8222-222222222222 */
                userId: components["parameters"]["UserId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateGroupMemberRoleRequest"];
            };
        };
        responses: {
            /** @description Updated member */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupMember"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["InsufficientRole"];
            404: components["responses"]["ConversationNotFound"];
            409: components["responses"]["ConversationConflict"];
        };
    };
    leaveGroupConversation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Membership deactivated with leftAt */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["ConversationNotFound"];
            409: components["responses"]["ConversationConflict"];
        };
    };
    listMessages: {
        parameters: {
            query?: {
                /**
                 * @description Önceki cevabın `nextCursor` değeri; bu cursor'dan daha eski mesajları ister.
                 * @example eyJ2IjoxLCJjcmVhdGVkQXQiOiIyMDMwLTAxLTAxVDAwOjAwOjAwLjAwMFoiLCJpZCI6IjQ0NDQ0NDQ0LTQ0NDQtNDQ0NC04NDQ0LTQ0NDQ0NDQ0NDQ0NCJ9
                 */
                before?: string;
                /** @example 50 */
                limit?: number;
            };
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sayfa içindeki mesajlar kronolojik (eskiden yeniye) sırada döner */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "items": [
                     *         {
                     *           "id": "44444444-4444-4444-8444-444444444444",
                     *           "conversationId": "33333333-3333-4333-8333-333333333333",
                     *           "senderId": "11111111-1111-4111-8111-111111111111",
                     *           "clientMessageId": "55555555-5555-4555-8555-555555555555",
                     *           "kind": "TEXT",
                     *           "body": "Merhaba",
                     *           "createdAt": "2030-01-01T00:00:00.000Z",
                     *           "editedAt": null,
                     *           "deletedAt": null
                     *         }
                     *       ],
                     *       "nextCursor": null
                     *     }
                     */
                    "application/json": components["schemas"]["MessageHistoryResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["ConversationNotFound"];
            500: components["responses"]["InternalError"];
        };
    };
    createMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "clientMessageId": "55555555-5555-4555-8555-555555555555",
                 *       "content": {
                 *         "type": "text",
                 *         "text": "Merhaba"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CreateMessageRequest"];
            };
        };
        responses: {
            /** @description Aynı gönderici ve `clientMessageId` ile mesaj zaten vardı; var olan mesaj döndü ve yeni event yayınlanmadı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "44444444-4444-4444-8444-444444444444",
                     *       "conversationId": "33333333-3333-4333-8333-333333333333",
                     *       "senderId": "11111111-1111-4111-8111-111111111111",
                     *       "clientMessageId": "55555555-5555-4555-8555-555555555555",
                     *       "kind": "TEXT",
                     *       "body": "Merhaba",
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "editedAt": null,
                     *       "deletedAt": null
                     *     }
                     */
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Yeni mesaj oluşturuldu ve commit sonrasında `message:created` yayınlandı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "44444444-4444-4444-8444-444444444444",
                     *       "conversationId": "33333333-3333-4333-8333-333333333333",
                     *       "senderId": "11111111-1111-4111-8111-111111111111",
                     *       "clientMessageId": "55555555-5555-4555-8555-555555555555",
                     *       "kind": "TEXT",
                     *       "body": "Merhaba",
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "editedAt": null,
                     *       "deletedAt": null
                     *     }
                     */
                    "application/json": components["schemas"]["Message"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["ConversationNotFound"];
            413: components["responses"]["PayloadTooLarge"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    deleteMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
                /** @example 44444444-4444-4444-8444-444444444444 */
                messageId: components["parameters"]["MessageId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçeriği maskelenmiş mesaj tombstone'u */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "44444444-4444-4444-8444-444444444444",
                     *       "conversationId": "33333333-3333-4333-8333-333333333333",
                     *       "senderId": "11111111-1111-4111-8111-111111111111",
                     *       "clientMessageId": "55555555-5555-4555-8555-555555555555",
                     *       "kind": "TEXT",
                     *       "body": null,
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "editedAt": "2030-01-01T00:03:00.000Z",
                     *       "deletedAt": "2030-01-01T00:05:00.000Z"
                     *     }
                     */
                    "application/json": components["schemas"]["Message"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["MessageMutationNotFound"];
            500: components["responses"]["InternalError"];
        };
    };
    updateMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
                /** @example 44444444-4444-4444-8444-444444444444 */
                messageId: components["parameters"]["MessageId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "content": {
                 *         "type": "text",
                 *         "text": "Düzenlenmiş mesaj"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["UpdateMessageRequest"];
            };
        };
        responses: {
            /** @description Güncel mesaj; değişiklik yapıldıysa commit sonrasında `message:updated` yayınlanır */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "44444444-4444-4444-8444-444444444444",
                     *       "conversationId": "33333333-3333-4333-8333-333333333333",
                     *       "senderId": "11111111-1111-4111-8111-111111111111",
                     *       "clientMessageId": "55555555-5555-4555-8555-555555555555",
                     *       "kind": "TEXT",
                     *       "body": "Düzenlenmiş mesaj",
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "editedAt": "2030-01-01T00:03:00.000Z",
                     *       "deletedAt": null
                     *     }
                     */
                    "application/json": components["schemas"]["Message"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["MessageMutationNotFound"];
            413: components["responses"]["PayloadTooLarge"];
            500: components["responses"]["InternalError"];
        };
    };
    transferGroupOwnership: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserIdRequest"];
            };
        };
        responses: {
            /** @description Previous OWNER is ADMIN and target is OWNER */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupConversation"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            403: components["responses"]["InsufficientRole"];
            404: components["responses"]["ConversationNotFound"];
            409: components["responses"]["ConversationConflict"];
        };
    };
    updateReadWatermark: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example 33333333-3333-4333-8333-333333333333 */
                conversationId: components["parameters"]["ConversationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "throughMessageId": "44444444-4444-4444-8444-444444444444"
                 *     }
                 */
                "application/json": components["schemas"]["UpdateReadRequest"];
            };
        };
        responses: {
            /** @description Watermark oluşturuldu, ileri taşındı veya daha eski/eşit hedefte değişmedi */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "conversationId": "33333333-3333-4333-8333-333333333333",
                     *       "throughMessageId": "44444444-4444-4444-8444-444444444444",
                     *       "readAt": "2030-01-01T00:00:00.000Z",
                     *       "status": "advanced"
                     *     }
                     */
                    "application/json": components["schemas"]["ReadWatermarkResponse"];
                };
            };
            /** @description UUID/body doğrulaması başarısız veya mesaj bu konuşmaya ait değil */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            404: components["responses"]["ConversationNotFound"];
            413: components["responses"]["PayloadTooLarge"];
            500: components["responses"]["InternalError"];
        };
    };
    createDirectConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "userId": "22222222-2222-4222-8222-222222222222"
                 *     }
                 */
                "application/json": components["schemas"]["CreateDirectConversationRequest"];
            };
        };
        responses: {
            /** @description Aynı iki kullanıcı için konuşma zaten vardı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "33333333-3333-4333-8333-333333333333",
                     *       "type": "DIRECT",
                     *       "title": null,
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "otherUser": {
                     *         "id": "22222222-2222-4222-8222-222222222222",
                     *         "username": "bob",
                     *         "displayName": "Bob",
                     *         "avatarUrl": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DirectConversation"];
                };
            };
            /** @description Yeni doğrudan konuşma oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "33333333-3333-4333-8333-333333333333",
                     *       "type": "DIRECT",
                     *       "title": null,
                     *       "createdAt": "2030-01-01T00:00:00.000Z",
                     *       "otherUser": {
                     *         "id": "22222222-2222-4222-8222-222222222222",
                     *         "username": "bob",
                     *         "displayName": "Bob",
                     *         "avatarUrl": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["DirectConversation"];
                };
            };
            /** @description Body doğrulanamadı veya kullanıcı kendisiyle konuşma başlatmaya çalıştı */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            /** @description Hedef kullanıcı yok, aktif değil veya soft-delete edilmiş */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "USER_NOT_FOUND",
                     *         "message": "User not found",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            413: components["responses"]["PayloadTooLarge"];
            500: components["responses"]["InternalError"];
        };
    };
    createGroupConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "title": "Product team",
                 *       "userIds": [
                 *         "22222222-2222-4222-8222-222222222222",
                 *         "33333333-3333-4333-8333-333333333333"
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["CreateGroupConversationRequest"];
            };
        };
        responses: {
            /** @description Group created; caller is OWNER and requested users are MEMBER */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GroupConversation"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            /** @description At least one requested user is unavailable */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            500: components["responses"]["InternalError"];
        };
    };
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description HTTP süreci canlı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": "ok"
                     *     }
                     */
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    getReadiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description PostgreSQL `SELECT 1` sorgusuna cevap verdi */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": "ready"
                     *     }
                     */
                    "application/json": components["schemas"]["ReadinessResponse"];
                };
            };
            /** @description PostgreSQL erişilebilir değil */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": "not_ready"
                     *     }
                     */
                    "application/json": components["schemas"]["ReadinessResponse"];
                };
            };
        };
    };
    searchUsers: {
        parameters: {
            query: {
                /**
                 * @description Önceki cevabın `nextCursor` değeri; opak base64url string olarak kullanılmalıdır.
                 * @example eyJ2IjoxLCJ1c2VybmFtZSI6ImJvYiIsImlkIjoiMjIyMjIyMjItMjIyMi00MjIyLTgyMjItMjIyMjIyMjIyMjIyIn0
                 */
                cursor?: string;
                /** @example 20 */
                limit?: number;
                /**
                 * @description Trim edilir; kullanıcı adı ve görünen adda büyük/küçük harf duyarsız aranır. E-posta aranmaz.
                 * @example bo
                 */
                query: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Eşleşen kullanıcı sayfası; mevcut kullanıcı hariç tutulur */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "items": [
                     *         {
                     *           "id": "22222222-2222-4222-8222-222222222222",
                     *           "username": "bob",
                     *           "displayName": "Bob",
                     *           "avatarUrl": null
                     *         }
                     *       ],
                     *       "nextCursor": null
                     *     }
                     */
                    "application/json": components["schemas"]["UserSearchResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
        };
    };
    updateCurrentUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCurrentUserRequest"];
            };
        };
        responses: {
            /** @description Güncellenmiş kullanıcı profili */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentUserResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            /** @description Kullanıcı adı zaten kullanımda */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "USERNAME_ALREADY_IN_USE",
                     *         "message": "The username is already in use",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            500: components["responses"]["InternalError"];
        };
    };
    deleteCurrentUserAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Avatarı kaldırılmış güncel kullanıcı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentUserResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            500: components["responses"]["InternalError"];
        };
    };
    createAvatarUpload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "contentType": "image/jpeg",
                 *       "contentLength": 245760
                 *     }
                 */
                "application/json": components["schemas"]["CreateAvatarUploadRequest"];
            };
        };
        responses: {
            /** @description On dakika geçerli, Content-Type'a bağlı imzalı PUT adresi */
            201: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvatarUploadIntent"];
                };
            };
            /** @description Gövde doğrulama hatası veya desteklenmeyen format */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            401: components["responses"]["BearerUnauthorized"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
            503: components["responses"]["AvatarStorageUnavailable"];
        };
    };
    completeAvatarUpload: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uploadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Avatar profile bağlandı; güncel kullanıcı döndü */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentUserResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["BearerUnauthorized"];
            /** @description Upload bulunamadı veya bu kullanıcıya ait değil */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "AVATAR_UPLOAD_NOT_FOUND",
                     *         "message": "The avatar upload was not found",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Upload süresi doldu, henüz object storage'a ulaşmadı veya tamamlanamaz durumda */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Nesne bildirilen dosyayla eşleşmedi veya güvenli biçimde çözümlenemedi */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": {
                     *         "code": "INVALID_AVATAR_FILE",
                     *         "message": "The uploaded file is not a valid supported avatar image",
                     *         "requestId": "77777777-7777-4777-8777-777777777777"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["RateLimited"];
            500: components["responses"]["InternalError"];
            503: components["responses"]["AvatarStorageUnavailable"];
        };
    };
}
