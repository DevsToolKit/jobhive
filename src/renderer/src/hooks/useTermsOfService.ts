import { useCallback, useEffect, useState } from 'react';
import {
  CURRENT_TERMS_VERSION,
  TERMS_ACCEPTED_AT_KEY,
  TERMS_STORAGE_KEY,
} from '@/config/terms';

export type TermsPromptMode = 'first_install' | 'updated' | 'review';

export function useTermsOfService() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TermsPromptMode>('first_install');
  const [hasAccepted, setHasAccepted] = useState(false);

  // Synchronous, zero-latency check on mount
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(TERMS_STORAGE_KEY);

      if (!storedVersion) {
        // First time install: no record found
        setMode('first_install');
        setHasAccepted(false);
        setIsOpen(true);
      } else if (storedVersion !== CURRENT_TERMS_VERSION) {
        // Terms updated in a new release
        setMode('updated');
        setHasAccepted(false);
        setIsOpen(true);
      } else {
        // Up to date
        setHasAccepted(true);
        setIsOpen(false);
      }
    } catch {
      // Fallback if localStorage is inaccessible
      setHasAccepted(true);
    }
  }, []);

  const acceptTerms = useCallback(() => {
    try {
      localStorage.setItem(TERMS_STORAGE_KEY, CURRENT_TERMS_VERSION);
      localStorage.setItem(TERMS_ACCEPTED_AT_KEY, new Date().toISOString());
      setHasAccepted(true);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to save terms acceptance:', err);
      setIsOpen(false);
    }
  }, []);

  const openReview = useCallback(() => {
    setMode('review');
    setIsOpen(true);
  }, []);

  const closeReview = useCallback(() => {
    // Only allowed to close if already accepted
    if (hasAccepted || localStorage.getItem(TERMS_STORAGE_KEY) === CURRENT_TERMS_VERSION) {
      setIsOpen(false);
    }
  }, [hasAccepted]);

  return {
    isOpen,
    mode,
    hasAccepted,
    acceptTerms,
    openReview,
    closeReview,
  };
}
