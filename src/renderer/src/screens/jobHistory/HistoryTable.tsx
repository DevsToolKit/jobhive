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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { HistoryPagination } from './HistoryPagination';
import { formatRelativeTime } from './HistoryStats';

interface HistoryTableProps {
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

export function StatusBadge({ status }: { status: Session['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Running
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/50 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          {status}
        </span>
      );
  }
}

export function formatSessionDate(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatSessionTime(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function HistoryTable({
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
}: HistoryTableProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[32%]">
                Search Query
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[20%]">
                Location
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Jobs Found
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date & Time
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {sessions.map((session) => {
              const dateStr = formatSessionDate(session.created_at);
              const timeStr = formatSessionTime(session.created_at);
              const relativeTime = formatRelativeTime(session.created_at);

              return (
                <TableRow
                  key={session.id}
                  className="transition-colors hover:bg-muted/40 group"
                >
                  {/* Search Query */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span
                          onClick={() => onView(session.id)}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors cursor-pointer capitalize line-clamp-1 block"
                        >
                          {session.search_term}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          {session.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="py-3.5 px-4">
                    {session.location ? (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/90 capitalize">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span>Anywhere / Remote</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4">
                    <StatusBadge status={session.status} />
                  </TableCell>

                  {/* Total Jobs */}
                  <TableCell className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border/50">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {session.total_jobs} {session.total_jobs === 1 ? 'job' : 'jobs'}
                    </span>
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{dateStr}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {timeStr} · {relativeTime}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Results Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(session.id)}
                        className="h-8 px-2.5 text-xs font-medium text-foreground hover:text-primary hover:bg-primary/10 gap-1.5"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>

                      {/* Export Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Export results"
                            aria-label="Export results"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem
                            onClick={() => onExport(session.id, 'csv', session.search_term)}
                            className="gap-2 cursor-pointer"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onExport(session.id, 'json', session.search_term)}
                            className="gap-2 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            Export as JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Delete Action with Alert Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                              and all {session.total_jobs} stored job listings. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <HistoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
