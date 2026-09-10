import React from 'react';
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HistorySortOption,
  HistoryViewMode,
  SessionStatus,
} from './types';

interface HistoryFiltersProps {
  search: string;
  status: 'all' | SessionStatus;
  sort: HistorySortOption;
  viewMode: HistoryViewMode;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: 'all' | SessionStatus) => void;
  onSortChange: (val: HistorySortOption) => void;
  onViewModeChange: (val: HistoryViewMode) => void;
  onReset: () => void;
}

export function HistoryFilters({
  search,
  status,
  sort,
  viewMode,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onViewModeChange,
  onReset,
}: HistoryFiltersProps) {
  const isFiltered = search.trim().length > 0 || status !== 'all';

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Search input with icons */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by role, location, or session ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8.5 pr-7.5 h-8.5 text-xs bg-card/60 border-border/70 focus-visible:ring-primary/20 rounded-lg"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter, Sort, Reset & View controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as 'all' | SessionStatus)}
        >
          <SelectTrigger className="h-8.5 w-[135px] text-xs bg-card/60 border-border/70 rounded-lg cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                All Statuses
              </span>
            </SelectItem>
            <SelectItem value="completed" className="text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Completed
              </span>
            </SelectItem>
            <SelectItem value="running" className="text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Running
              </span>
            </SelectItem>
            <SelectItem value="pending" className="text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pending
              </span>
            </SelectItem>
            <SelectItem value="failed" className="text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Failed
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as HistorySortOption)}
        >
          <SelectTrigger className="h-8.5 w-[140px] text-xs bg-card/60 border-border/70 rounded-lg cursor-pointer">
            <span className="flex items-center gap-1.5 truncate">
              <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </span>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
            <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
            <SelectItem value="jobs-desc" className="text-xs">Most Jobs</SelectItem>
            <SelectItem value="jobs-asc" className="text-xs">Least Jobs</SelectItem>
            <SelectItem value="query-asc" className="text-xs">Query (A-Z)</SelectItem>
            <SelectItem value="query-desc" className="text-xs">Query (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filter Button if active */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex h-7.5 w-7.5 items-center justify-center rounded-md transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Table View"
            aria-label="Table View"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`flex h-7.5 w-7.5 items-center justify-center rounded-md transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Card Grid View"
            aria-label="Card Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
