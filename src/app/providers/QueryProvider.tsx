// agrotrust-az/src/app/providers/QueryProvider.tsx

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * React Query provider for the whole app.
 * Keeps cache + data fetching behaviour consistent.
 *
 * For a hackathon MVP:
 * - modest stale times
 * - light retry behaviour
 * - sensible defaults
 */
type Props = {
  children: ReactNode;
};

export function QueryProvider({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
