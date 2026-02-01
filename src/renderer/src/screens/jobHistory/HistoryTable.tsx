// HistoryTable.tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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

interface Props {
  sessions: Session[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryTable({ sessions, onView, onDelete }: Props) {
  return (
    <Table>
      <TableCaption>Your search history</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Search</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total Jobs</TableHead>
          <TableHead className="text-right">Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
              No results found
            </TableCell>
          </TableRow>
        )}

        {sessions.map((session) => (
          <TableRow key={session.id} className="hover:bg-muted/40">
            <TableCell className="font-medium">{session.search_term}</TableCell>
            <TableCell>{session.location}</TableCell>
            <TableCell className="capitalize">{session.status}</TableCell>
            <TableCell>{session.total_jobs}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {new Date(session.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onView(session.id)}>
                View
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete history item?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(session.id)}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
