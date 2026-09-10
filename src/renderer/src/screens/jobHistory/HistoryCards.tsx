import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  MapPin,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
            className="group flex flex-col justify-between border-border/70 bg-card/90 backdrop-blur-xs transition-all duration-200 hover:border-border hover:shadow-md"
          >
            {/* Card Header */}
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      onClick={() => onView(session.id)}
                      className="font-semibold text-base text-foreground hover:text-primary transition-colors cursor-pointer capitalize line-clamp-1"
                      title={session.search_term}
                    >
                      {session.search_term}
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground block">
                      ID: {session.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <StatusBadge status={session.status} />
              </div>
            </CardHeader>

            {/* Card Body */}
            <CardContent className="p-5 pt-2 pb-4 space-y-3">
              {/* Location & Jobs stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Location
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium capitalize truncate">
                    {session.location ? (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>Remote / Any</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Jobs Found
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {session.total_jobs} {session.total_jobs === 1 ? 'job' : 'jobs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{dateStr} · {timeStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{relativeTime}</span>
                </div>
              </div>
            </CardContent>

            {/* Card Footer */}
            <CardFooter className="p-4 pt-3 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(session.id)}
                className="flex-1 text-xs font-medium gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
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
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
            </CardFooter>
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
