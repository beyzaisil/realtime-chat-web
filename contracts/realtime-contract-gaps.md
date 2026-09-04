# Realtime Contract Gaps

This file records realtime integration requirements that are not represented by
the HTTP-only OpenAPI snapshot. The backend remains the source of truth for
Socket.IO event delivery.

## RESOLVED — Group discovery event delivery

Observed against backend commit
`e0732b098240f4b6e9be14ea0389ec83392681e6`.

Resolved by backend commit
`bee0221ce61729a75fad9258a4888e212ea04273`
and merged into backend `main` with commit
`daef1e4`.

### Original backend behavior

- `group:created` is emitted only to `conversation:{conversationId}`.
- `member:added` is emitted only to `conversation:{conversationId}`.
- A newly invited or newly added user cannot already be subscribed to that
  conversation room because the user does not know the conversation ID yet.
- Consequently, the event never reaches that user's frontend and the group
  appears only after the conversation list is fetched again.

Relevant backend source:

- `src/realtime/groups/group-publisher.ts`
- `src/realtime/server/chat-events.ts`

### Implemented backend contract

- `group:created` must be delivered to every active member's
  `user:{userId}` room. Its existing payload remains:

  ```ts
  { conversation: GroupConversationEventDto }
  ```

- `member:added` must be delivered both to the existing
  `conversation:{conversationId}` room and to the newly added member's
  `user:{userId}` room. Its existing payload remains:

  ```ts
  { conversationId: string; member: GroupMemberEventDto }
  ```

- Delivery to multiple rooms must not produce duplicate events for a socket
  that is present in more than one target room.
- After receiving either discovery event, the client can refresh or update its
  conversation list and subscribe to `conversation:{conversationId}` for later
  lifecycle events.

### Backend acceptance checks

1. Connect an invited user without subscribing that socket to the new
   conversation room.
2. Create a group containing that user.
3. Verify the user's socket receives exactly one `group:created` event without
   polling or reconnecting.
4. Add a connected user who is not subscribed to the group.
5. Verify the new member receives exactly one `member:added` event and existing
   subscribed members also receive the event.
6. Verify the event payloads still match `GroupConversationEventDto` and
   `GroupMemberEventDto`.

### OpenAPI impact

No HTTP endpoint, request body, response body, or generated TypeScript schema
change is required. `contracts/openapi.yaml` must remain an exact snapshot of
the backend's `docs/openapi.yaml`; this Socket.IO routing guarantee belongs in
the backend `docs/socket-contract.md`. If the backend later publishes socket
contracts through an OpenAPI vendor extension, the frontend snapshot can pick
that metadata up through the normal contract sync process.

### Frontend readiness

The frontend `feat/group-conversation-realtime` implementation already handles
both events and updates the conversation caches when the events are delivered.
The browser acceptance criterion was verified after backend commit `bee0221`:
a newly created group appears without a page refresh and discovery events are
not duplicated.
