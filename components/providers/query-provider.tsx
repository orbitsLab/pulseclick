"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20 * 1000, // 20 seconds for responsive stale-while-revalidate
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: true, // Auto background re-fetch when user returns to tab
            refetchOnReconnect: true, // Auto background re-fetch on network reconnect
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
