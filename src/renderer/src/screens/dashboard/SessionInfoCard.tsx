import React, { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info, Check, Copy } from 'lucide-react';
import { Session } from '@/types/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = {
  session: Session;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs py-1">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground font-medium text-right truncate">{value}</span>
    </div>
  );
}

export default function SessionInfoCard({ session }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = (() => {
    try {
      return new Date(session.created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return session.created_at;
    }
  })();

  return (
    <HoverCard openDelay={150} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer rounded-lg bg-card/60 border-border/60"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Session Info</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-80 p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-semibold text-foreground">Scrape Session Details</span>
          <Badge
            variant="secondary"
            className="text-[10px] uppercase font-semibold tracking-wider h-4 px-1.5"
          >
            {session.status}
          </Badge>
        </div>

        <div className="divide-y divide-border/40">
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-muted-foreground font-medium">Session ID</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                {session.id}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 text-muted-foreground hover:text-foreground p-0"
                onClick={handleCopyId}
                title="Copy Session ID"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <InfoRow label="Query" value={session.search_term} />
          <InfoRow label="Location" value={session.location || 'Anywhere'} />
          <InfoRow label="Total Results" value={`${session.total_jobs} listings`} />
          <InfoRow label="Scraped At" value={formattedDate} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
