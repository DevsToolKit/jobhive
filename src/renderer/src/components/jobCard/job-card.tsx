import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import CardHeader from './CardHeader';
import JobDetailsDrawer, { toNormalCase } from '@/screens/dashboard/Jobdetailsdrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Job } from '@/types/job';
import { ArrowUpRight, MapPin, Banknote, Laptop } from 'lucide-react';

interface JobCardProps {
  job: Job;
  tags: string[];
}

/* ---------------- Date Posted ---------------- */

const calculateDatePosted = (date?: string): string => {
  if (!date) return 'Recently';
  const posted = new Date(date).getTime();
  if (isNaN(posted)) return 'Recently';

  const diffInSeconds = Math.floor((Date.now() - posted) / 1000);
  if (diffInSeconds < 60) return 'Just now';

  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }

  return 'Just now';
};

/* ---------------- Salary ---------------- */

const formatAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} K`;
  }
  return amount.toString();
};

const normalizeSalary = (
  minAmount?: number | null,
  maxAmount?: number | null,
  currency?: string | null,
  interval?: string | null
): string | null => {
  const curr = currency || '';
  const intervalMap: Record<string, string> = {
    year: 'yr',
    month: 'mo',
    week: 'wk',
    day: 'day',
    hour: 'hr',
  };
  const intervalLabel = interval ? `/${intervalMap[interval] ?? interval}` : '';

  if (minAmount && maxAmount) {
    return `${curr} ${formatAmount(minAmount)} - ${formatAmount(maxAmount)}${intervalLabel}`;
  }
  if (minAmount && !maxAmount) {
    return `From ${curr} ${formatAmount(minAmount)}${intervalLabel}`;
  }
  if (!minAmount && maxAmount) {
    return `Up to ${curr} ${formatAmount(maxAmount)}${intervalLabel}`;
  }

  return null;
};

const formatLocation = (job: Job): string => {
  const parts = [job.location_city, job.location_state, job.location_country].filter(Boolean);
  return parts.join(', ') || 'Location not specified';
};

/* ---------------- Component ---------------- */

const JobCard = React.memo(function JobCard({ job, tags }: JobCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const salaryText = normalizeSalary(job.min_amount, job.max_amount, job.currency, job.interval);
  const locationText = formatLocation(job);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.app?.openExternalUrl) {
      window.app.openExternalUrl(job.job_url);
    } else {
      window.open(job.job_url, '_blank');
    }
  };

  return (
    <>
      <div className="group relative rounded-xl border border-border/80 bg-card p-4 hover:border-foreground/25 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 text-left">
        {/* Top: Company Header */}
        <CardHeader
          companyName={job.company || 'Not Mentioned'}
          date={calculateDatePosted(job.date_posted)}
          company_url={job.company_url}
          job_url={job.job_url}
          site={job.site}
        />

        {/* Center: Title & Info */}
        <div className="space-y-2">
          {/* Job Title */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  onClick={() => setDrawerOpen(true)}
                  className="text-[15px] font-semibold text-foreground hover:text-primary cursor-pointer line-clamp-1 transition-colors leading-snug"
                >
                  {toNormalCase(job.title)}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{toNormalCase(job.title)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Location & Remote Pill */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{locationText}</span>
            </span>

            {job.is_remote && (
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1 rounded"
              >
                <Laptop className="h-2.5 w-2.5" />
                Remote
              </Badge>
            )}

            {job.job_type && (
              <Badge
                variant="outline"
                className="h-4.5 px-1.5 text-[10px] font-medium capitalize border-border/70 rounded"
              >
                {job.job_type.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Salary Highlight */}
          <div className="pt-0.5">
            {salaryText ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Banknote className="h-3.5 w-3.5 shrink-0" />
                <span>{salaryText}</span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/70 italic">
                Salary undisclosed
              </span>
            )}
          </div>

          {/* Description snippet */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {job.description ? job.description.replace(/\s+/g, ' ').trim() : 'No job description provided.'}
          </p>

          {/* Skills / Tags */}
          <TagsContainer tags={tags} />
        </div>

        {/* Bottom: Action Bar */}
        <div className="pt-2 border-t border-border/50 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs font-medium cursor-pointer"
            onClick={() => setDrawerOpen(true)}
          >
            Details
          </Button>

          <Button
            size="sm"
            className="flex-1 h-8 text-xs font-medium gap-1 cursor-pointer"
            onClick={handleApply}
          >
            Apply
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Slide-out details drawer */}
      <JobDetailsDrawer job={job} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
});

/* ---------------- Tags Container ---------------- */

const TagsContainer = ({ tags }: { tags: string[] }) => {
  if (!tags || tags.length === 0) return null;

  const maxVisible = 3;
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
      {visibleTags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border/40"
        >
          {tag}
        </span>
      ))}

      {remainingCount > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40 cursor-help">
                +{remainingCount} more
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs flex flex-wrap gap-1 p-2">
              {tags.slice(maxVisible).map((t, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default JobCard;
