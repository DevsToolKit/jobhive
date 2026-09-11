import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TERMS_LAST_UPDATED,
  TERMS_SECTIONS,
} from '@/config/terms';
import type { TermsPromptMode } from '@/hooks/useTermsOfService';

interface TermsDialogProps {
  open: boolean;
  mode: TermsPromptMode;
  onAccept: () => void;
  onClose?: () => void;
}

export function TermsDialog({
  open,
  mode,
  onAccept,
  onClose,
}: TermsDialogProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreedCheckbox, setHasAgreedCheckbox] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isReview = mode === 'review';

  // Check if content already fits on screen without scrolling
  useEffect(() => {
    if (open) {
      setHasAgreedCheckbox(false);
      // Let the DOM render then calculate
      const timer = setTimeout(() => {
        const el = scrollRef.current;
        if (el && el.scrollHeight <= el.clientHeight + 10) {
          setHasScrolledToBottom(true);
        } else if (!isReview) {
          setHasScrolledToBottom(false);
        } else {
          setHasScrolledToBottom(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isReview]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Allow a 40px buffer for subpixel calculations and zoom
    if (scrollTop + clientHeight >= scrollHeight - 40) {
      setHasScrolledToBottom(true);
    }
  };

  const handleDecline = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
  };

  const handleAcceptClick = () => {
    if (hasAgreedCheckbox) {
      onAccept();
    }
  };

  const canAccept = hasScrolledToBottom && hasAgreedCheckbox;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isReview && onClose) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={isReview}
        className="w-[92vw] sm:max-w-4xl h-[85vh] max-h-[860px] flex flex-col p-0 gap-0 overflow-hidden border-border/70 bg-card shadow-2xl rounded-2xl"
        onEscapeKeyDown={(e) => {
          if (!isReview) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!isReview) e.preventDefault();
        }}
      >
        {/* Fixed Header */}
        <DialogHeader className="px-8 py-5 border-b border-border/50 text-left space-y-1.5 shrink-0 bg-card z-10">
          <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Terms of Service & Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Last updated: {TERMS_LAST_UPDATED}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Terms Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto px-8 py-6 focus:outline-none"
        >
          <div className="space-y-8 pr-2">
            {TERMS_SECTIONS.map((sec) => (
              <div key={sec.id} className="space-y-3">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {sec.title}
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {sec.content.map((paragraph, i) => (
                    <p key={i}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-8 py-4 sm:py-5 border-t border-border/50 bg-muted/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0 z-10 min-h-[72px]">
          {!isReview ? (
            !hasScrolledToBottom ? (
              <div className="w-full flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Please scroll to the bottom of the terms to continue
                </span>
                <Button
                  variant="outline"
                  size="default"
                  disabled
                  className="h-9 px-4 text-sm font-medium gap-2 cursor-not-allowed opacity-60 shrink-0"
                >
                  <span>Scroll to bottom</span>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {/* Agreement Checkbox */}
                <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={hasAgreedCheckbox}
                    onCheckedChange={(checked) => setHasAgreedCheckbox(Boolean(checked))}
                    id="agree-checkbox"
                    className="h-4.5 w-4.5 rounded-md cursor-pointer"
                  />
                  <span className="font-medium">
                    I have read and agree to the Terms of Service and Privacy Policy
                  </span>
                </label>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={handleDecline}
                    className="h-9 px-4 text-sm font-medium text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Decline & Exit
                  </Button>

                  <Button
                    size="default"
                    onClick={handleAcceptClick}
                    disabled={!hasAgreedCheckbox}
                    className="h-9 px-5 text-sm font-medium cursor-pointer shadow-xs"
                  >
                    Agree & Continue
                  </Button>
                </div>
              </>
            )
          ) : (
            <div className="w-full flex items-center justify-end">
              <Button
                variant="outline"
                size="default"
                onClick={onClose}
                className="h-9 px-5 text-sm font-medium cursor-pointer"
              >
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
