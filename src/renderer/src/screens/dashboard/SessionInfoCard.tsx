import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { GoInfo } from 'react-icons/go';
import { Session } from '@/types/session';

type Props = {
  session: Session;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function SessionInfoCard({ session }: Props) {
  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger>
        <GoInfo />
      </HoverCardTrigger>
      <HoverCardContent className="w-[500px]">
        <div className="space-y-2 text-sm">
          <InfoRow label="Scrape ID" value={session.id} />
          <InfoRow label="Search Term" value={session.search_term} />
          <InfoRow label="Location" value={session.location} />
          <InfoRow label="Status" value={session.status} />
          <InfoRow label="Total Jobs" value={session.total_jobs} />
          <InfoRow label="Created At" value={new Date(session.created_at).toLocaleString()} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
