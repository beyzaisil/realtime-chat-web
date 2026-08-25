import type { ReactNode } from "react";

import { ChatShell } from "../../../features/conversations/components/chat-shell";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <ChatShell>{children}</ChatShell>;
}
