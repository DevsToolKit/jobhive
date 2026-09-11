import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  MapPin,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Session } from './types';
import {
  StatusBadge,
  formatSessionDate,
  formatSessionTime,
} from './HistoryTable';
import { formatRelativeTime } from './HistoryStats';

import { HistoryPagination } from './HistoryPagination';

interface HistoryCardsProps {
  sessions: Session[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: 'csv' | 'json', searchTerm: string) => void;
}

export function HistoryCards({
  sessions,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onView,
  onDelete,
  onExport,
}: HistoryCardsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => {
        const dateStr = formatSessionDate(session.created_at);
        const timeStr = formatSessionTime(session.created_at);
        const relativeTime = formatRelativeTime(session.created_at);

        return (
          <Card
            key={session.id}
            className="group flex flex-col justify-between border-border/70 bg-card transition-all duration-200 hover:border-border hover:shadow-xs rounded-xl overflow-hidden py-0 gap-0"
          >
            {/* Card Content */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Header: Icon, Title & Date, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      onClick={() => onView(session.id)}
                      className="font-semibold text-[15px] text-foreground hover:text-primary transition-colors cursor-pointer capitalize line-clamp-1 leading-snug"
                      title={session.search_term}
                    >
                      {session.search_term}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{relativeTime}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{dateStr}</span>
                      {timeStr && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{timeStr}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <StatusBadge status={session.status} />
              </div>

              {/* Stats / Details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col justify-center px-3 py-2 rounded-lg bg-muted/40 border border-border/40 min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground">Location</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-foreground min-w-0">
                    {session.location ? (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="truncate capitalize">{session.location}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">Remote / Any</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center px-3 py-2 rounded-lg bg-muted/40 border border-border/40 min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground">Jobs Found</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-foreground min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span>
                      {session.total_jobs} {session.total_jobs === 1 ? 'job' : 'jobs'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(session.id)}
                className="flex-1 h-8.5 text-xs font-medium gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer shadow-2xs"
              >
                <span>View Results</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <div className="flex items-center gap-1">
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Export jobs"
                      aria-label="Export jobs"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 text-xs">
                    <DropdownMenuItem
                      onClick={() => onExport(session.id, 'csv', session.search_term)}
                      className="gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onExport(session.id, 'json', session.search_term)}
                      className="gap-2 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      Export JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8.5 w-8.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete session"
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete scrape session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the scrape session for{' '}
                        <strong className="text-foreground">
                          &ldquo;{session.search_term}&rdquo;
                        </strong>{' '}
                        and all {session.total_jobs} stored job listings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(session.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        );
      })}
    </div>

    <div className="rounded-xl border border-border/60 bg-card/80 px-2 mt-4 shadow-2xs">
      <HistoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  </div>
);
}
