import React from 'react';
import { Briefcase, CheckCircle2, Clock3, Database } from 'lucide-react';
import { Session } from './types';

interface HistoryStatsProps {
  sessions: Session[];
}

export function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export function HistoryStats({ sessions }: HistoryStatsProps) {
  const totalSessions = sessions.length;
  const totalJobs = sessions.reduce((acc, s) => acc + (s.total_jobs || 0), 0);

  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const failedSessions = sessions.filter((s) => s.status === 'failed').length;
  const successRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Find most recent session
  const sortedByDate = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestSession = sortedByDate[0];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
      {/* Total Scrapes */}
      <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 backdrop-blur-xs transition-colors hover:border-border/90 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">Total Scrapes</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {totalSessions}
            </span>
            <span className="text-[11px] text-muted-foreground">runs</span>
          </div>
        </div>
      </div>

      {/* Total Jobs Scraped */}
      <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 backdrop-blur-xs transition-colors hover:border-border/90 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <Briefcase className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">Jobs Found</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {totalJobs.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">total</span>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 backdrop-blur-xs transition-colors hover:border-border/90 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">Success Rate</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {totalSessions > 0 ? `${successRate}%` : '—'}
            </span>
            {totalSessions > 0 && (
              <span className="text-[11px] text-muted-foreground truncate">
                {failedSessions > 0 ? `${failedSessions} failed` : 'all passed'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Latest Scrape */}
      <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 backdrop-blur-xs transition-colors hover:border-border/90 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Clock3 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">Last Scrape</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground truncate">
              {latestSession ? formatRelativeTime(latestSession.created_at) : 'None'}
            </span>
            {latestSession && (
              <span className="text-[11px] text-muted-foreground truncate capitalize">
                · {latestSession.search_term}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
