// src/test/testUtils.tsx: shared helpers for screen smoke tests.
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { render, RenderAPI } from "@testing-library/react-native";
import React from "react";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: () => {} }),
    mutationCache: new MutationCache({ onError: () => {} }),
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: Number.POSITIVE_INFINITY,
      },
      mutations: { retry: false },
    },
  });
}

export type RenderScreenResult = RenderAPI & { queryClient: QueryClient };

export function renderScreen(ui: React.ReactElement): RenderScreenResult {
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return { ...utils, queryClient };
}
