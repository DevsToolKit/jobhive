import { Session } from '@/types/session';
import SessionInfoCard from './SessionInfoCard';

type Props = {
  session: Session;
  onNewScrape?: () => void;
};

export default function DashboardHeader({ session }: Props) {
  const formattedDate = (() => {
    try {
      const d = new Date(session.created_at);
      const isToday = new Date().toDateString() === d.toDateString();
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return isToday ? `today at ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
    } catch {
      return session.created_at;
    }
  })();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/50">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Today’s Scrape
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {session.total_jobs} {session.total_jobs === 1 ? 'job' : 'jobs'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span className="font-medium text-foreground capitalize">{session.search_term}</span>
          {session.location && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="capitalize">{session.location}</span>
            </>
          )}
          <span className="text-muted-foreground/40">·</span>
          <span>Scraped {formattedDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <SessionInfoCard session={session} />
      </div>
    </div>
  );
}
