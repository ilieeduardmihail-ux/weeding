"use client";
import { useEffect, useState } from "react";

/**
 * Keeps text inputs responsive while the expensive filtering uses a settled
 * value. 350 ms is long enough to skip most intermediate keystrokes and short
 * enough to feel instant.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
