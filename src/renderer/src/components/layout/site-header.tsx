import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { getHeaderTitle } from '@/utils/getHeaderTitle';

export function SiteHeader() {
  const { pathname } = useLocation();
  const title = getHeaderTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-medium">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="https://github.com/shadcn-ui/ui" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
