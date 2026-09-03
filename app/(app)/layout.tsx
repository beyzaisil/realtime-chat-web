"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { UserProfileRealtimeSync } from "../../features/users/realtime/user-profile-realtime-sync";
import { useAuth } from "../../providers/auth-provider";
import { SocketProvider } from "../../providers/socket-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return <main className="route-status">Oturum yükleniyor…</main>;
  }

  if (status === "unauthenticated") {
    return <main className="route-status">Giriş sayfasına yönlendiriliyor…</main>;
  }

  return (
    <SocketProvider>
      <UserProfileRealtimeSync />
      {children}
    </SocketProvider>
  );
}
