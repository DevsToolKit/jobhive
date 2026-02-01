import { GoPlusCircle } from 'react-icons/go';
import { Button } from '@/components/ui/button';
import { Session } from '@/types/session';
import SessionInfoCard from './SessionInfoCard';
import { ModalId } from '@/App';

type Props = {
  session: Session;
  onNewScrape: () => void;
};

export default function DashboardHeader({ session, onNewScrape }: Props) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-4xl font-bold">Today’s Scrape</h1>
        <span className="text-[14px] text-muted-foreground">{session.id}</span>

        <div className="flex items-center gap-3 mt-5">
          <p className="text-[20px] capitalize">
            {session.search_term} ({session.location})
          </p>

          <SessionInfoCard session={session} />
        </div>
      </div>

      <Button onClick={onNewScrape}>
        <GoPlusCircle /> New Scrape
      </Button>
    </div>
  );
}
