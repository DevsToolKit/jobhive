import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  Loader2,
  Pause,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export interface RecentJob {
  id: string;
  url?: string;
  title?: string;
  company?: string;
  location?: string;
  site?: string;
  status: 'success' | 'failed';
  duration?: number;
}

export interface ProgressData {
  session_id: string;
  timestamp: string;
  status: 'processing' | 'scraping' | 'saving' | 'completed' | 'error' | 'cancelled';
  search_term?: string;
  location?: string;
  target_jobs?: number;
  total_jobs: number;
  completed_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  skipped_jobs?: number;
  progress_percent: number;
  current_job?: string;
  current_site?: string;
  site_statuses?: Record<string, { status: string; found: number }>;
  current_url?: string;
  current_operation?: string;
  elapsed_time: number;
  estimated_remaining?: number;
  average_job_time: number;
  jobs_per_second: number;
  success_rate: number;
  recent_jobs: RecentJob[];
  error_message?: string;
  warnings: string[];
  results_summary?: Record<string, unknown>;
}

interface ScrapeProgressProps {
  sessionId: string;
  baseUrl: string | null;
  initialQuery?: {
    search_term?: string;
    location?: string;
    target_jobs?: number;
    sites?: string[];
  };
  onCancel?: () => void;
  onComplete?: () => void;
  onReset?: () => void;
  onClose?: () => void;
}

const getPlatformBadge = (siteName?: string) => {
  const normalized = (siteName || '').toLowerCase();
  if (normalized.includes('linkedin')) {
    return {
      label: 'LinkedIn',
      className: 'bg-[#0A66C2]/15 text-[#0A66C2] border-[#0A66C2]/30',
    };
  }
  if (normalized.includes('indeed')) {
    return {
      label: 'Indeed',
      className: 'bg-[#2164F3]/15 text-[#2164F3] border-[#2164F3]/30',
    };
  }
  if (normalized.includes('google')) {
    return {
      label: 'Google',
      className: 'bg-[#EA4335]/15 text-[#EA4335] border-[#EA4335]/30',
    };
  }
  return {
    label: siteName || 'Platform',
    className: 'bg-primary/10 text-primary border-primary/20',
  };
};

export const ScrapeProgress: React.FC<ScrapeProgressProps> = ({
  sessionId,
  baseUrl,
  initialQuery,
  onCancel,
  onComplete,
  onReset,
  onClose,
}) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const completionHandledRef = useRef(false);

  // Live timer tick during scraping
  useEffect(() => {
    if (isComplete || isCancelled || error) return;

    const timer = setInterval(() => {
      setLiveElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete, isCancelled, error]);

  // Automatic transition countdown when completed
  useEffect(() => {
    if (!isComplete) return;

    setAutoCloseCountdown(3);

    const timer = setInterval(() => {
      setAutoCloseCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete, onComplete]);

  useEffect(() => {
    if (completionHandledRef.current) return;

    const sseUrl = `${baseUrl}/api/scrape/progress/${sessionId}`;
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    eventSource.addEventListener('progress', (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);

        // Retain recent_jobs and site_statuses so partial updates never wipe them out
        setProgress((prev) => ({
          ...(prev || {}),
          ...data,
          recent_jobs:
            data.recent_jobs && data.recent_jobs.length > 0
              ? data.recent_jobs
              : prev?.recent_jobs || [],
          site_statuses:
            data.site_statuses && Object.keys(data.site_statuses).length > 0
              ? data.site_statuses
              : prev?.site_statuses || {},
        } as ProgressData));

        if (data.elapsed_time > 0) {
          setLiveElapsed(Math.round(data.elapsed_time));
        }

        if (data.status === 'cancelled') {
          setIsCancelled(true);
          eventSource.close();
          setIsConnected(false);
          toast.info('Scraping session cancelled');
          return;
        }

        if (data.status === 'completed' && !completionHandledRef.current) {
          completionHandledRef.current = true;
          setIsComplete(true);
          eventSource.close();
          setIsConnected(false);
          toast.success(`Scrape completed! Found ${data.total_jobs || 0} jobs.`);
        }
      } catch (err) {
        console.error('Error parsing progress SSE:', err);
      }
    });

    eventSource.addEventListener('close', () => {
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.onerror = () => {
      if (!completionHandledRef.current && !isComplete) {
        setError('Connection interrupted. Scraping may still be finalizing.');
      }
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [sessionId, baseUrl, isComplete]);

  const handleUserCancel = () => {
    setIsCancelled(true);
    if (onCancel) onCancel();
  };

  const handlePauseAutoClose = () => {
    setAutoCloseCountdown(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const searchTerm = progress?.search_term || initialQuery?.search_term || 'Job Search';
  const location = progress?.location || initialQuery?.location || 'Anywhere';
  const targetJobs = progress?.target_jobs || initialQuery?.target_jobs || progress?.total_jobs || 20;
  const successfulJobs = progress?.successful_jobs || 0;
  const progressPercent =
    progress?.progress_percent ??
    (targetJobs > 0 ? Math.min(100, Math.round((successfulJobs / targetJobs) * 100)) : 0);
  const recentJobs = progress?.recent_jobs || [];
  const siteStatuses = progress?.site_statuses || {};
  const allSites =
    initialQuery?.sites && initialQuery.sites.length > 0
      ? initialQuery.sites
      : Object.keys(siteStatuses).length > 0
        ? Object.keys(siteStatuses)
        : ['linkedin', 'indeed'];

  return (
    <div className="w-full max-w-full overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-border/60 min-w-0 pr-8">
        <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <h3 className="text-xl font-bold tracking-tight text-foreground truncate max-w-full">
              {searchTerm}
            </h3>
            <div className="shrink-0">
              {isComplete ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-medium gap-1.5 shadow-none">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Done
                </Badge>
              ) : isCancelled ? (
                <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs px-2.5 py-0.5 font-medium gap-1.5 shadow-none">
                  <Pause className="h-3.5 w-3.5" /> Stopped
                </Badge>
              ) : error ? (
                <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-xs px-2.5 py-0.5 font-medium gap-1.5 shadow-none">
                  <AlertTriangle className="h-3.5 w-3.5" /> Error
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 text-xs px-2.5 py-0.5 font-medium gap-1.5 animate-pulse shadow-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scraping
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {location} • Target: {targetJobs} jobs
          </p>
        </div>
      </div>

      {/* Platform Badges */}
      <div className="flex flex-wrap gap-2 w-full min-w-0 overflow-hidden">
        {allSites.map((site) => {
          const statusInfo = siteStatuses[site];
          const platformBadge = getPlatformBadge(site);
          const isCurrent = progress?.current_site === site;
          const foundCount = statusInfo?.found ?? 0;
          const siteStatus = statusInfo?.status || (isCurrent ? 'scraping' : 'queued');

          return (
            <div
              key={site}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all truncate ${
                isCancelled
                  ? foundCount > 0
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                    : 'border-border/70 bg-muted/20 text-muted-foreground'
                  : siteStatus === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                    : isCurrent || siteStatus === 'scraping'
                      ? 'border-primary/40 bg-primary/10 text-foreground ring-1 ring-primary/20'
                      : 'border-border/70 bg-muted/20 text-muted-foreground'
              }`}
            >
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${platformBadge.className}`}>
                {platformBadge.label}
              </span>
              {foundCount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{foundCount} found</span>
              )}
              {foundCount === 0 && isCancelled && (isCurrent || siteStatus === 'scraping') && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">stopped</span>
              )}
              {foundCount === 0 && isCancelled && siteStatus === 'queued' && (
                <span className="text-muted-foreground/60">cancelled</span>
              )}
              {!isCancelled && (isCurrent || siteStatus === 'scraping') && (
                <span className="text-primary flex items-center gap-1 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" /> searching
                </span>
              )}
              {!isCancelled && siteStatus === 'queued' && <span className="text-muted-foreground/70">queued</span>}
              {siteStatus === 'no_results' && <span className="text-muted-foreground/60">0 results</span>}
            </div>
          );
        })}
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between text-sm font-medium min-w-0">
          <span className="text-foreground truncate">
            {successfulJobs} of {targetJobs} jobs collected
          </span>
          <span className="text-muted-foreground tabular-nums text-xs font-medium flex-shrink-0 ml-2">
            {Math.round(progressPercent)}% • {formatTime(liveElapsed)}
          </span>
        </div>

        <Progress value={progressPercent} className="h-2 bg-muted rounded-full" />

        <p className="text-xs text-muted-foreground truncate pt-0.5 min-w-0">
          {isCancelled
            ? successfulJobs > 0
              ? `Scraping stopped by user. ${successfulJobs} jobs saved before cancellation.`
              : 'Scraping was cancelled. No listings were saved.'
            : isComplete
              ? autoCloseCountdown !== null && autoCloseCountdown > 0
                ? `All ${successfulJobs} jobs saved. Transitioning to table in ${autoCloseCountdown}s...`
                : `All ${successfulJobs} jobs saved to workspace.`
              : progress?.current_operation || 'Connecting to platforms...'}
        </p>
      </div>

      {/* Recent Activity List */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden min-w-0">
        <div className="px-4 py-2 border-b border-border/60 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
          <span>Recent activity</span>
          <span className="font-normal normal-case">{recentJobs.length} listings</span>
        </div>

        {recentJobs.length > 0 ? (
          <ScrollArea className="h-40 w-full overflow-hidden [&>[data-slot=scroll-area-viewport]>div]:!block">
            <div className="p-2 pr-4 space-y-1.5 w-full min-w-0">
              {recentJobs.map((job, idx) => {
                const badge = getPlatformBadge(job.site);
                return (
                  <div
                    key={job.id || idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-muted/40 transition text-sm w-full min-w-0"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="font-medium text-foreground truncate text-sm">{job.title || 'Untitled Role'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.company || 'Unknown Company'}
                        {job.location && <span> • {job.location}</span>}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : isCancelled ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-1.5">
            <span className="font-medium text-foreground">Scraping cancelled</span>
            <span className="text-xs text-muted-foreground">No listings were collected before cancellation.</span>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Searching platforms for listings...</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 min-w-0">
        <div className="text-xs text-muted-foreground truncate flex items-center gap-2 min-w-0">
          {isCancelled ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">Scrape cancelled</span>
          ) : (
            <span>Session: {sessionId.slice(0, 8)}...</span>
          )}
          {isComplete && autoCloseCountdown !== null && (
            <button
              type="button"
              onClick={handlePauseAutoClose}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              (Stay on dialog)
            </button>
          )}
        </div>

        <div className="flex-shrink-0 ml-2">
          {isCancelled ? (
            <div className="flex items-center gap-2">
              {successfulJobs > 0 ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose || onComplete}
                    className="text-sm h-9 px-4 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={onComplete}
                    className="gap-2 text-sm h-9 px-4 font-medium cursor-pointer shadow-sm"
                  >
                    <span>View {successfulJobs} Jobs in Table</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="text-sm h-9 px-4 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    Back to Search
                  </Button>
                  <Button
                    size="sm"
                    onClick={onClose}
                    className="text-sm h-9 px-4 font-medium cursor-pointer shadow-sm"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          ) : !isComplete ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUserCancel}
              className="text-sm h-9 px-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel Scraping
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="gap-2 text-sm h-9 px-4 font-medium cursor-pointer shadow-sm"
            >
              <span>View Jobs in Table</span>
              {autoCloseCountdown !== null && autoCloseCountdown > 0 && (
                <span className="tabular-nums">({autoCloseCountdown}s)</span>
              )}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrapeProgress;
