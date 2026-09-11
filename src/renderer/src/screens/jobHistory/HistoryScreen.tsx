import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { useBackend } from '@/hooks/useBaseUrl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { deleteSession, exportSession, fetchSessions } from './api/sessions';
import { HistoryCards } from './HistoryCards';
import { HistoryEmptyState } from './HistoryEmptyState';
import { HistoryFilters } from './HistoryFilters';
import { HistoryStats } from './HistoryStats';
import { HistoryTable } from './HistoryTable';
import {
  HistorySortOption,
  HistoryViewMode,
  Session,
  SessionStatus,
} from './types';

interface HistoryScreenProps {
  onNewScrape?: () => void;
}

export default function HistoryScreen({ onNewScrape }: HistoryScreenProps) {
  const { baseUrl } = useBackend();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | SessionStatus>('all');
  const [sort, setSort] = useState<HistorySortOption>('newest');
  const [viewMode, setViewMode] = useState<HistoryViewMode>('table');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSessions = useCallback(
    async (isManualRefresh = false) => {
      if (!baseUrl) return;

      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const data = await fetchSessions(baseUrl);
        setSessions(data);
        if (isManualRefresh) {
          toast.success('History updated');
        }
      } catch {
        setError('Unable to load scrape history. Please check connection to the backend.');
        if (isManualRefresh) {
          toast.error('Failed to refresh history');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!baseUrl) return;

    try {
      await deleteSession(baseUrl, sessionId);
      setSessions((current) => current.filter((s) => s.id !== sessionId));
      toast.success('Session deleted successfully');
    } catch {
      toast.error('Unable to delete history item');
    }
  };

  const handleExportSession = async (
    sessionId: string,
    format: 'csv' | 'json',
    searchTerm: string
  ) => {
    if (!baseUrl) return;

    try {
      const cleanTerm = (searchTerm || 'scrape').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `jobhive_${cleanTerm}_${sessionId.slice(0, 8)}.${format}`;
      toast.info(`Preparing ${format.toUpperCase()} export...`);
      await exportSession(baseUrl, sessionId, format, filename);
      toast.success(`Exported ${filename}`);
    } catch {
      toast.error(`Failed to export session as ${format.toUpperCase()}`);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setSort('newest');
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: 'all' | SessionStatus) => {
    setStatus(val);
    setPage(1);
  };

  const handleSortChange = (val: HistorySortOption) => {
    setSort(val);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // Filter and Sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search query filter (search_term, location, session ID)
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((s) => {
        const term = (s.search_term || '').toLowerCase();
        const loc = (s.location || '').toLowerCase();
        const id = (s.id || '').toLowerCase();
        return term.includes(query) || loc.includes(query) || id.includes(query);
      });
    }

    // Status filter
    if (status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'jobs-desc':
          return (b.total_jobs || 0) - (a.total_jobs || 0);
        case 'jobs-asc':
          return (a.total_jobs || 0) - (b.total_jobs || 0);
        case 'query-asc':
          return (a.search_term || '').localeCompare(b.search_term || '');
        case 'query-desc':
          return (b.search_term || '').localeCompare(a.search_term || '');
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, search, status, sort]);

  // Paginate filtered results
  const totalFilteredCount = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSessions.slice(startIndex, startIndex + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  return (
    <section className="space-y-4 px-6 py-4 max-w-[1400px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Job Scrape History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Review past scraping runs, inspect extracted job opportunities, and export datasets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSessions(true)}
            disabled={loading || refreshing}
            className="h-8.5 gap-1.5 text-xs font-medium border-border/80 shadow-2xs"
            title="Refresh history"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {onNewScrape && (
            <Button
              size="sm"
              onClick={onNewScrape}
              className="h-8.5 gap-1.5 text-xs font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>New Scrape</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-3 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-8.5 w-64 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-8.5 w-28 rounded-lg" />
              <Skeleton className="h-8.5 w-32 rounded-lg" />
            </div>
          </div>

          {/* Skeleton Table */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-24 hidden sm:block" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 p-0">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSessions()}
              className="text-xs shrink-0 h-8"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loaded Content */}
      {!loading && !error && (
        <>
          {/* Top KPI Metrics */}
          {sessions.length > 0 && <HistoryStats sessions={sessions} />}

          {/* If there are no sessions at all in the database */}
          {sessions.length === 0 ? (
            <HistoryEmptyState mode="empty" onNewScrape={onNewScrape} />
          ) : (
            <div className="space-y-2.5">
              {/* Filter & Controls Toolbar */}
              <HistoryFilters
                search={search}
                status={status}
                sort={sort}
                viewMode={viewMode}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onSortChange={handleSortChange}
                onViewModeChange={setViewMode}
                onReset={handleResetFilters}
              />

              {/* Empty state when search or filter returns zero matches */}
              {filteredSessions.length === 0 ? (
                <HistoryEmptyState
                  mode="no-results"
                  searchTerm={search}
                  onResetFilters={handleResetFilters}
                />
              ) : viewMode === 'table' ? (
                /* Table View with Pagination */
                <HistoryTable
                  sessions={paginatedSessions}
                  totalItems={totalFilteredCount}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                  onView={(id) => navigate(`/results/${id}`)}
                  onDelete={handleDeleteSession}
                  onExport={handleExportSession}
                />
              ) : (
                /* Cards View with Pagination */
                <HistoryCards
                  sessions={paginatedSessions}
                  totalItems={totalFilteredCount}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                  onView={(id) => navigate(`/results/${id}`)}
                  onDelete={handleDeleteSession}
                  onExport={handleExportSession}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
