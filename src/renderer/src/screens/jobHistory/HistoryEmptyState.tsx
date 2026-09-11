import React from 'react';
import { History, Plus, RotateCcw, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HistoryEmptyStateProps {
  mode: 'empty' | 'no-results';
  searchTerm?: string;
  onResetFilters?: () => void;
  onNewScrape?: () => void;
}

export function HistoryEmptyState({
  mode,
  searchTerm,
  onResetFilters,
  onNewScrape,
}: HistoryEmptyStateProps) {
  if (mode === 'no-results') {
    return (
      <Card className="border-dashed border-border/80 bg-card/50 py-16 text-center">
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
            <SearchX className="h-7 w-7 stroke-[1.75]" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              No matching scrape sessions
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {searchTerm ? (
                <>
                  No sessions found matching &ldquo;<span className="font-medium text-foreground">{searchTerm}</span>&rdquo; with the current filters.
                </>
              ) : (
                'No sessions match the selected filters.'
              )}
            </p>
          </div>
          {onResetFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="gap-2 mt-2 border-border/80 shadow-xs cursor-pointer font-medium text-sm h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-border/80 bg-card/50 py-16 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
          <History className="h-7 w-7 stroke-[1.75]" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            No Scrape History Yet
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your completed and archived job searches will be stored here. Run your first scrape to extract, analyze, and track job opportunities.
          </p>
        </div>
        {onNewScrape && (
          <Button
            onClick={onNewScrape}
            className="gap-2 mt-2 shadow-xs font-medium text-sm h-9 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Start Your First Scrape
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
