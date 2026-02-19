"use client";

import { useState, useTransition } from "react";

export interface ApiCallState<T> {
  data: T | null;
  error: string | null;
  isPending: boolean;
}

export function useApiCall<T>() {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    error: null,
    isPending: false,
  });
  const [isPending, startTransition] = useTransition();

  async function execute(fn: () => Promise<T>) {
    setState({ data: null, error: null, isPending: true });
    startTransition(async () => {
      try {
        const data = await fn();
        setState({ data, error: null, isPending: false });
      } catch (e) {
        setState({
          data: null,
          error: e instanceof Error ? e.message : "Unknown error",
          isPending: false,
        });
      }
    });
  }

  return { ...state, isPending: state.isPending || isPending, execute };
}
