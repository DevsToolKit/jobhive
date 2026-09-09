import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Job } from '@/types/job';
import {
  Building2,
  MapPin,
  Banknote,
  Briefcase,
  Mail,
  Globe,
  ArrowUpRight,
  Copy,
  Check,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

type JobDetailsDrawerProps = {
  job: Job | null;
  open: boolean;
  onClose: () => void;
};

interface ParsedSection {
  title?: string;
  type: 'bullets' | 'paragraphs';
  items: string[];
}

const getDomainFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const getInitials = (name: string): string => {
  if (!name || name === 'Not Mentioned') return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Parses raw, often-unformatted scraped job descriptions into clean, readable structured sections.
 */
function parseJobDescription(raw?: string): ParsedSection[] {
  if (!raw) return [];

  // Strip junk header prefixes from scrapers (e.g. "Country/Region: ... ==============")
  let cleaned = raw
    .replace(/^(?:Country\/Region:[^=]*=+|=+)\s*(?:Description:\s*)?/i, '')
    .replace(/\\([+*?^$()[\]{}|\\])/g, '$1')
    .trim();

  const sectionKeywords = [
    'Job Description:',
    'About Us:',
    'Key Responsibilities',
    'Responsibilities:',
    'Responsibilities',
    'Required Skills and Qualifications',
    'Required Skills:',
    'Required Skills',
    'Qualifications and Skills',
    'Qualifications:',
    'Qualifications',
    'Preferred Qualifications:',
    'Preferred Qualifications',
    'Minimum Qualifications:',
    'Requirements:',
    'Requirements',
    "What You'll Do:",
    "What You'll Do",
    'What You Will Do:',
    'What You Will Do',
    "What We're Looking For:",
    "What We're Looking For",
    'What We Offer:',
    'What We Offer',
    'Benefits and Perks',
    'Benefits:',
    'Benefits',
  ];

  const headerPattern = new RegExp(
    '(About\\s+[A-Za-z0-9&.,\\s]{2,40}:|' +
      sectionKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
      ')',
    'i'
  );

  const parts = cleaned.split(headerPattern);
  const sections: ParsedSection[] = [];
  let currentTitle: string | undefined = undefined;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]?.trim();
    if (!part) continue;

    if (headerPattern.test(part)) {
      currentTitle = part.replace(/:$/, '').trim();
    } else {
      const isList =
        currentTitle &&
        /responsibilit|qualification|requirement|skill|looking for|what you|benefit/i.test(
          currentTitle
        );

      let items: string[] = [];
      let type: 'bullets' | 'paragraphs' = 'paragraphs';

      // If explicit newlines or bullet points exist
      if (part.includes('\n') || /^[•\-\*·]\s+/m.test(part)) {
        items = part
          .split(/\n+/)
          .map((line) => line.replace(/^[•\-\*·]\s*/, '').trim())
          .filter(Boolean);
        type = isList || items.length > 2 ? 'bullets' : 'paragraphs';
      } else if (isList) {
        // Scraped text without newlines: split on sentence/verb starts
        const verbSplitRegex =
          /(?<=[a-z0-9,;])\s+(?=(?:Design|Develop|Build|Implement|Lead|Manage|Collaborate|Create|Drive|Ensure|Participate|Troubleshoot|Work|Deploy|Maintain|Write|Proficiency|Experience|Strong|Familiarity|Knowledge|Ability|Excellent|Deep|Solid|\d+[\+\-]\s*years|\d+\s*years)\b)/g;
        const splits = part.split(verbSplitRegex).map((s) => s.trim()).filter(Boolean);
        if (splits.length > 1) {
          items = splits;
          type = 'bullets';
        } else {
          items = [part];
        }
      } else {
        items = [part];
      }

      sections.push({ title: currentTitle, type, items });
      currentTitle = undefined;
    }
  }

  if (sections.length === 0 && cleaned) {
    sections.push({ type: 'paragraphs', items: [cleaned] });
  }

  return sections;
}

export default function JobDetailsDrawer({ job, open, onClose }: JobDetailsDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const hasValidCompany = Boolean(job.company && job.company !== 'Not Mentioned' && job.company.trim() !== '');
  const displayCompanyName = hasValidCompany ? job.company : 'Company Undisclosed';

  const domain = getDomainFromUrl(job.company_url);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : undefined;

  let tags: string[] = [];
  try {
    tags = JSON.parse(job.tags || '[]');
    if (!Array.isArray(tags)) tags = [];
  } catch {
    tags = [];
  }

  const formatSalary = () => {
    if (!job.min_amount && !job.max_amount) return null;

    const formatAmount = (amount: number): string => {
      if (amount >= 10000000) return `${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
      if (amount >= 100000) return `${(amount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} K`;
      return amount.toString();
    };

    const currency = job.currency || '';
    const interval = job.interval || 'year';

    const intervalMap: Record<string, string> = {
      year: 'yr',
      month: 'mo',
      week: 'wk',
      day: 'day',
      hour: 'hr',
    };

    const intervalLabel = interval ? `/${intervalMap[interval] ?? interval}` : '';

    if (job.min_amount && job.max_amount) {
      return `${currency} ${formatAmount(job.min_amount)} - ${formatAmount(job.max_amount)}${intervalLabel}`;
    }
    if (job.min_amount) {
      return `From ${currency} ${formatAmount(job.min_amount)}${intervalLabel}`;
    }
    return `Up to ${currency} ${formatAmount(job.max_amount!)}${intervalLabel}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Posted today';
      if (diffDays === 1) return 'Posted yesterday';
      if (diffDays < 7) return `Posted ${diffDays} days ago`;
      if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
      return `Posted ${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'Recently posted';
    }
  };

  const site = job.site ? job.site.charAt(0).toUpperCase() + job.site.slice(1).toLowerCase() : '';

  const formatLocation = () => {
    const parts = [job.location_city, job.location_state, job.location_country].filter(Boolean);
    return parts.join(', ') || 'Location not specified';
  };

  const jobTypes = job.job_type
    ? job.job_type
        .split(',')
        .map((t) => t.trim().replace('_', ' '))
        .filter(Boolean)
    : [];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(job.job_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleApply = () => {
    if (window.app?.openExternalUrl) {
      window.app.openExternalUrl(job.job_url);
    } else {
      window.open(job.job_url, '_blank');
    }
  };

  const handleCompanyClick = () => {
    if (!job.company_url) return;
    if (window.app?.openExternalUrl) {
      window.app.openExternalUrl(job.company_url);
    } else {
      window.open(job.company_url, '_blank');
    }
  };

  const salaryString = formatSalary();
  const parsedSections = useMemo(() => parseJobDescription(job.description), [job.description]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[92vw] sm:w-[680px] md:w-[780px] lg:w-[860px] max-w-[880px] p-0 gap-0 overflow-hidden flex flex-col bg-background border-l border-border/80 shadow-2xl"
      >
        {/* ================= TOP HEADER ================= */}
        <SheetHeader className="p-6 pb-5 border-b border-border/60 shrink-0 text-left space-y-4 bg-card/60">
          {/* Company & Source Line */}
          <div className="flex items-center gap-3 pr-8">
            <Avatar className="h-11 w-11 rounded-xl border border-border/60 bg-muted shrink-0 shadow-2xs">
              <AvatarImage src={faviconUrl} alt={displayCompanyName} className="object-contain p-1" />
              <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                {hasValidCompany ? getInitials(job.company!) : <Building2 className="h-4 w-4 text-muted-foreground/70" />}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${hasValidCompany ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {displayCompanyName}
                </span>

                {domain && (
                  <button
                    type="button"
                    onClick={handleCompanyClick}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-0.5"
                    title="Open company website"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {site && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold uppercase bg-muted/80 text-muted-foreground">
                    {site}
                  </Badge>
                )}
                <span>•</span>
                <span>{formatDate(job.date_posted)}</span>
              </div>
            </div>
          </div>

          {/* Job Title */}
          <SheetTitle className="text-xl font-bold tracking-tight text-foreground leading-snug">
            {job.title}
          </SheetTitle>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <Button
              size="sm"
              className="h-8.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
              onClick={handleApply}
            >
              <span>Apply on {site || 'Job Board'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 text-xs gap-1.5 cursor-pointer"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            {job.company_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8.5 px-3 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={handleCompanyClick}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Website</span>
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* ================= SCROLLABLE BODY ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Key Job Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/35 border border-border/50 text-xs">
            {/* Salary */}
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Banknote className="h-3.5 w-3.5 text-muted-foreground/70" />
                Salary
              </span>
              <p className="font-semibold text-sm text-foreground truncate">
                {salaryString ? (
                  <span className="text-emerald-600 dark:text-emerald-400">{salaryString}</span>
                ) : (
                  <span className="text-muted-foreground/80 font-normal">Undisclosed</span>
                )}
              </p>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                Location
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground truncate">{formatLocation()}</span>
                {job.is_remote && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Remote
                  </Badge>
                )}
              </div>
            </div>

            {/* Job Type */}
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                Job Type
              </span>
              <p className="font-medium text-foreground capitalize truncate">
                {jobTypes.length > 0 ? jobTypes.join(', ') : 'Full-time'}
              </p>
            </div>

            {/* Experience / Level */}
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Laptop className="h-3.5 w-3.5 text-muted-foreground/70" />
                Experience
              </span>
              <p className="font-medium text-foreground capitalize truncate">
                {job.job_level || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Skills & Tech Stack */}
          {tags.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Required Skills & Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 text-foreground border border-border/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Structured Job Description Sections */}
          {parsedSections.length > 0 ? (
            <div className="space-y-5">
              {parsedSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-2.5">
                  {section.title && (
                    <h3 className="text-sm font-semibold tracking-tight text-foreground border-b border-border/40 pb-1.5">
                      {section.title}
                    </h3>
                  )}

                  {section.type === 'bullets' ? (
                    <ul className="space-y-2 text-[13.5px] text-foreground/90 leading-relaxed">
                      {section.items.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-2 shrink-0" />
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3 text-[13.5px] text-foreground/90 leading-relaxed">
                      {section.items.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No detailed description available.</p>
          )}

          {/* Contact Details */}
          {job.emails && (
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact & Inquiries
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${job.emails}`} className="text-primary hover:underline font-medium">
                  {job.emails}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="p-3.5 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
            onClick={handleApply}
          >
            <span>Apply on {site || 'Job Board'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
