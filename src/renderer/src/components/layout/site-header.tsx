import { GoCommandPalette, GoPlus } from 'react-icons/go';
import { Github } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { getHeaderTitle } from '@/utils/getHeaderTitle';

export function SiteHeader({
  onOpenSearch,
  onRequestNewScrape,
}: {
  onOpenSearch: () => void;
  onRequestNewScrape: () => void;
}) {
  const { pathname } = useLocation();
  const title = getHeaderTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/70 bg-background/85 backdrop-blur-xl bg-card">
      <div className="flex w-full items-center gap-1 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <div>
          <h1 className="text-base font-medium">{title}</h1>
          <p className="text-xs text-muted-foreground">{APP_CONFIG.versionLabel}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenSearch}>
            <GoCommandPalette />
            Search
          </Button>
          <Button size="sm" onClick={onRequestNewScrape}>
            <GoPlus />
            New Scrape
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}
          >
            <Github className="h-4 w-4" />
            {APP_CONFIG.repository.label}
          </Button>
        </div>
      </div>
    </header>
  );
}
