import { useState, useCallback, useEffect } from "react";

type CopyFn = (text: string) => Promise<boolean>;

/**
 * Hook for copying text to clipboard
 * Returns a function to copy text and a boolean to indicate if the text was copied
 */
export function useCopyToClipboard(): { copy: CopyFn; copied: boolean } {
  const [copied, setCopied] = useState(false);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    // Try to copy text to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopied(false);
      return false;
    }
  }, []);

  return { copy, copied };
}