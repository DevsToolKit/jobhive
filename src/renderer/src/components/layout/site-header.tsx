import { GoCommandPalette, GoPlus } from 'react-icons/go';
import { Github } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { getHeaderTitle } from '@/utils/getHeaderTitle';
import { usePlatform } from '@/hooks/usePlatform';

export function SiteHeader({
  onOpenSearch,
  onRequestNewScrape,
}: {
  onOpenSearch: () => void;
  onRequestNewScrape: () => void;
}) {
  const { pathname } = useLocation();
  const title = getHeaderTitle(pathname);
  const { isWindows, modifierKey } = usePlatform();

  return (
    <header
      className={`sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/70 bg-card/85 backdrop-blur-xl app-drag ${
        isWindows ? 'pr-36' : ''
      }`}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:px-6">
        <div className="flex items-center gap-1 app-no-drag">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 app-no-drag">
          <Button variant="outline" size="sm" onClick={onOpenSearch} className="gap-2">
            <GoCommandPalette />
            <span>Search</span>
            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/70 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {modifierKey}K
            </kbd>
          </Button>
          <Button size="sm" onClick={onRequestNewScrape}>
            <GoPlus />
            <span>New Scrape</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.app?.openExternalUrl?.(APP_CONFIG.repository.url)}
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">{APP_CONFIG.repository.label}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
