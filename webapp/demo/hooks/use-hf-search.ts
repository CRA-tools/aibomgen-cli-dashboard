"use client";

import { useState, useEffect, useRef } from "react";

export interface HFModel {
  id: string;
  pipeline_tag?: string;
  downloads?: number;
  likes?: number;
}

interface UseHFSearchResult {
  results: HFModel[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Debounced search hook that queries the HuggingFace Hub public API.
 * Empty query returns an empty list without calling the API.
 */
export function useHFSearch(query: string, debounceMs = 300): UseHFSearchResult {
  const [results, setResults] = useState<HFModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `https://huggingface.co/api/models?search=${encodeURIComponent(trimmed)}&limit=10&sort=downloads&direction=-1`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error(`HF API error: ${res.status}`);
        const data: HFModel[] = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, isLoading, error };
}
