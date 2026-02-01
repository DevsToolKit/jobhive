// HistoryFilters.tsx
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Session } from './types';

interface Props {
  search: string;
  status: 'all' | Session['status'];
  onSearchChange: (v: string) => void;
  onStatusChange: (v: 'all' | Session['status']) => void;
}

export function HistoryFilters({ search, status, onSearchChange, onStatusChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search by term or location"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />

      <Select value={status} onValueChange={(v) => onStatusChange(v as any)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
