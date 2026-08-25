import { io, type Socket } from "socket.io-client";

import { publicEnv } from "../env";
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
} from "./socket-events";

export type ChatSocket = Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
>;

export function createChatSocket(
  baseUrl = publicEnv.apiUrl,
): ChatSocket {
  return io(`${baseUrl}/chat`, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
  });
}
