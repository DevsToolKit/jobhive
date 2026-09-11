import React, { createContext, useContext } from 'react';
import { useTermsOfService } from '@/hooks/useTermsOfService';
import { TermsDialog } from '@/components/termsModal/TermsDialog';

interface TermsContextType {
  hasAccepted: boolean;
  openTerms: () => void;
}

const TermsContext = createContext<TermsContextType>({
  hasAccepted: false,
  openTerms: () => {},
});

export function TermsProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, mode, hasAccepted, acceptTerms, openReview, closeReview } = useTermsOfService();

  return (
    <TermsContext.Provider value={{ hasAccepted, openTerms: openReview }}>
      {children}
      <TermsDialog
        open={isOpen}
        mode={mode}
        onAccept={acceptTerms}
        onClose={closeReview}
      />
    </TermsContext.Provider>
  );
}

export function useTerms() {
  return useContext(TermsContext);
}
