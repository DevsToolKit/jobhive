import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Pause,
  Activity,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface ProgressData {
  session_id: string;
  timestamp: string;
  status: 'processing' | 'scraping' | 'saving' | 'completed' | 'error' | 'cancelled';
  total_jobs: number;
  completed_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  skipped_jobs: number;
  progress_percent: number;
  current_job?: string;
  current_url?: string;
  current_operation?: string;
  elapsed_time: number;
  estimated_remaining?: number;
  average_job_time: number;
  jobs_per_second: number;
  success_rate: number;
  recent_jobs: Array<{
    id: string;
    url: string;
    status: 'success' | 'failed';
    duration: number;
  }>;
  error_message?: string;
  warnings: string[];
  results_summary?: any;
}

const ScrapeProgress: React.FC<{
  sessionId: string;
  baseUrl: string | null;
  onCancel?: () => void;
  onComplete?: () => void;
}> = ({ sessionId, baseUrl, onCancel, onComplete }) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const completionHandledRef = useRef(false); // Prevents reconnection after completion

  useEffect(() => {
    // Don't reconnect if completion has already been handled
    if (completionHandledRef.current) {
      console.log('✅ Completion already handled, skipping reconnection');
      return;
    }

    const sseUrl = `${baseUrl}/api/scrape/progress/${sessionId}`;
    console.log('🔌 Connecting to SSE:', sseUrl);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      console.log('✅ SSE Connected');
      setIsConnected(true);
      setError(null);
    });

    eventSource.addEventListener('progress', (event) => {
      console.log('📊 Progress update:', event.data);
      const data = JSON.parse(event.data);
      setProgress(data);

      // Handle completion
      if (data.status === 'completed' && !completionHandledRef.current) {
        console.log('🎉 SCRAPING COMPLETED!', data);

        // Mark completion as handled to prevent reconnection
        completionHandledRef.current = true;
        setIsComplete(true);

        // Close the EventSource immediately
        eventSource.close();
        setIsConnected(false);

        // Wait 2 seconds to show completion state, then trigger callback
        setTimeout(() => {
          if (onComplete) {
            console.log('🔄 Calling onComplete callback');
            onComplete();
          }
        }, 2000);
      }
    });

    eventSource.addEventListener('close', (event) => {
      console.log('🔌 SSE Closed', event);
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.onerror = (err) => {
      console.error('❌ SSE Error:', err);

      // Only show error if we haven't completed successfully
      if (!completionHandledRef.current && !isComplete) {
        setError('Connection error. The scraping may have completed.');
      }

      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      console.log('🧹 Cleaning up SSE connection');
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [sessionId, baseUrl, onComplete]); // isComplete intentionally not in deps

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'cancelled':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'scraping':
      case 'saving':
      case 'processing':
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const isActiveStatus = (status: string) => {
    return ['processing', 'scraping', 'saving'].includes(status);
  };

  // Error state (only if not completed)
  if (error && !isComplete) {
    return (
      <div className="w-full p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-sm">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <span className="text-amber-600">{error}</span>
          <span className="text-neutral-500 text-xs">Session: {sessionId}</span>
          {progress && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">
                Last known status: {progress.successful_jobs} jobs saved
              </p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (!progress) {
    return (
      <div className="w-full p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-light tracking-wide">Connecting to scraper...</span>
          <span className="text-xs font-mono text-neutral-400">{sessionId}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Header */}
      <div className="space-y-6">
        {/* Title and Status Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium tracking-tight">Web Scraping Session</h3>
            <p className="text-xs text-neutral-500 font-mono">{sessionId}</p>
          </div>
          <Badge variant="outline" className={`${getStatusColor(progress.status)} font-normal`}>
            {isActiveStatus(progress.status) && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {progress.status === 'completed' && <CheckCircle2 className="mr-1.5 h-3 w-3" />}
            {progress.status === 'error' && <XCircle className="mr-1.5 h-3 w-3" />}
            {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-neutral-600 font-light">
              {progress.completed_jobs} of {progress.total_jobs} jobs
            </span>
            <span className="font-mono text-neutral-900 tabular-nums">
              {Math.round(progress.progress_percent)}%
            </span>
          </div>
          <Progress value={progress.progress_percent} className="h-1.5 bg-neutral-100" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Success"
            value={progress.successful_jobs}
            color="text-emerald-600"
          />
          <MetricCard
            icon={<XCircle className="h-3.5 w-3.5" />}
            label="Failed"
            value={progress.failed_jobs}
            color="text-red-600"
          />
          <MetricCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Elapsed"
            value={formatTime(progress.elapsed_time)}
            color="text-blue-600"
          />
          <MetricCard
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Rate"
            value={`${progress.jobs_per_second.toFixed(1)}/s`}
            color="text-purple-600"
          />
        </div>
      </div>

      {/* Current Operation */}
      {progress.current_operation && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 -mx-6">
          <div className="flex items-center gap-2 text-xs">
            <Activity className="h-3 w-3 text-neutral-400" />
            <span className="text-neutral-500 font-light">Current:</span>
            <span className="text-neutral-900 font-mono truncate">
              {progress.current_url || progress.current_operation}
            </span>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      <div className="border border-neutral-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <StatItem label="Success Rate" value={`${Math.round(progress.success_rate)}%`} />
          <StatItem label="Avg Time" value={`${progress.average_job_time.toFixed(2)}s`} />
          <StatItem
            label="Remaining"
            value={
              progress.estimated_remaining && progress.estimated_remaining > 0
                ? formatTime(progress.estimated_remaining)
                : '—'
            }
          />
        </div>
      </div>

      {/* Recent Jobs */}
      {progress.recent_jobs && progress.recent_jobs.length > 0 && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
            <h4 className="text-xs font-medium text-neutral-600 tracking-wide uppercase">
              Recent Activity
            </h4>
          </div>
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {progress.recent_jobs.map((job, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {job.status === 'success' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-xs font-mono text-neutral-600 truncate">{job.url}</span>
                  </div>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {job.duration.toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Warnings */}
      {progress.warnings && progress.warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {progress.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-amber-800">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isActiveStatus(progress.status) && onCancel && (
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-neutral-200 hover:bg-neutral-50"
          >
            <Pause className="mr-2 h-3.5 w-3.5" />
            Cancel Scraping
          </Button>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="space-y-1">
    <div className={`flex items-center gap-1.5 ${color}`}>
      {icon}
      <span className="text-[10px] font-medium tracking-wide uppercase text-neutral-500">
        {label}
      </span>
    </div>
    <div className="text-lg font-semibold tabular-nums tracking-tight">{value}</div>
  </div>
);

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-xs text-neutral-500 font-light mb-0.5">{label}</div>
    <div className="text-sm font-mono text-neutral-900 tabular-nums">{value}</div>
  </div>
);

export default ScrapeProgress;
