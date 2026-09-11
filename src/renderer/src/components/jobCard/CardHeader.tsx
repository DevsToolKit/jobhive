import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Globe,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

interface CardHeaderProps {
  companyName: string;
  date: string;
  company_url?: string | null;
  job_url: string;
  site: string;
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

export default function CardHeader({
  companyName,
  date,
  company_url,
  job_url,
  site,
}: CardHeaderProps) {
  const [copied, setCopied] = useState(false);

  const hasValidCompany = Boolean(companyName && companyName !== 'Not Mentioned' && companyName.trim() !== '');
  const displayCompanyName = hasValidCompany ? companyName : 'Company Undisclosed';

  const domain = getDomainFromUrl(company_url);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : undefined;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(job_url);
      setCopied(true);
      toast.success('Job link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.app?.openExternalUrl) {
      window.app.openExternalUrl(job_url);
    } else {
      window.open(job_url, '_blank');
    }
  };

  const handleOpenCompany = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!company_url) return;
    if (window.app?.openExternalUrl) {
      window.app.openExternalUrl(company_url);
    } else {
      window.open(company_url, '_blank');
    }
  };

  const formattedSite = site ? site.charAt(0).toUpperCase() + site.slice(1).toLowerCase() : '';

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      {/* Company Avatar & Identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 rounded-lg border border-border/60 bg-muted shrink-0">
          <AvatarImage src={faviconUrl} alt={displayCompanyName} className="object-contain p-0.5" />
          <AvatarFallback className="rounded-lg text-[11px] font-semibold bg-muted text-muted-foreground">
            {hasValidCompany ? (
              getInitials(companyName)
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground/70" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0 flex-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`text-sm font-semibold truncate cursor-pointer hover:underline underline-offset-2 ${
                  hasValidCompany ? 'text-foreground' : 'text-muted-foreground/80 italic font-normal'
                }`}>
                  {displayCompanyName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{displayCompanyName}</p>
                {domain && <p className="text-xs text-muted-foreground">{domain}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {formattedSite && (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] font-medium rounded capitalize bg-muted/80 text-muted-foreground"
              >
                {formattedSite}
              </Badge>
            )}
            <span className="text-muted-foreground/40">•</span>
            <span className="truncate">{date}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Utilities */}
      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Copy Link button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopyLink}
                aria-label="Copy job link"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{copied ? 'Link copied!' : 'Copy job link'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="More options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleOpenJob} className="cursor-pointer gap-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Open in browser</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2 text-xs">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy link</span>
            </DropdownMenuItem>

            {company_url && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleOpenCompany}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Company website</span>
                </DropdownMenuItem>
              </>
            )}

            {hasValidCompany && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(companyName)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy company name</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
