"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiQuery<T>(endpoint: string): UseApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<T>(endpoint)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Request failed"))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
