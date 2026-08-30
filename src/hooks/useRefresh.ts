// src/hooks/useRefresh.ts
// Shared pull-to-refresh logic: invalidates the given query-key prefixes and
// tracks the spinner until every active refetch settles.
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export function useRefresh(...queryKeys: string[][]) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    } finally {
      setRefreshing(false);
    }
    // Call sites pass static key literals; re-running on identity churn of a
    // rest parameter would only recreate a stable callback.
     
  }, [queryClient]);

  return { refreshing, onRefresh };
}
