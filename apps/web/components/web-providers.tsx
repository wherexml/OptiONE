"use client";

import { CoreProvider } from "@multica/core/platform";
import { WebNavigationProvider } from "@/platform/navigation";
import {
  setLoggedInCookie,
  clearLoggedInCookie,
} from "@/features/auth/auth-cookie";

export function WebProviders({ children }: { children: React.ReactNode }) {
  // If NEXT_PUBLIC_API_URL is not set, use empty string for relative paths (dev with proxy)
  // or fallback to localhost:8080 for direct backend connection
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "");

  return (
    <CoreProvider
      apiBaseUrl={apiBaseUrl}
      wsUrl={process.env.NEXT_PUBLIC_WS_URL}
      onLogin={setLoggedInCookie}
      onLogout={clearLoggedInCookie}
    >
      <WebNavigationProvider>{children}</WebNavigationProvider>
    </CoreProvider>
  );
}
