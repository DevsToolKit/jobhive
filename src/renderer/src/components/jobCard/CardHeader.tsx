import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GoKebabHorizontal } from 'react-icons/go';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getDomainFromUrl = (url?: string | null): string | null => {
  if (!url) return null;

  return url;
};

const CardHeader = ({
  companyName,
  date,
  company_url,
}: {
  companyName: string;
  date: string;
  company_url: string;
}) => {
  const domain = getDomainFromUrl(company_url);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : undefined;

  return (
    <div className="flex flex-row justify-between items-center gap-5">
      <div className="flex flex-row items-center gap-3 w-full min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={faviconUrl} alt={companyName} />
          <AvatarFallback>
            {companyName
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-card-foreground dark:text-card-foreground text-[16px] font-semibold leading-[110%] truncate cursor-pointer">
                  {companyName}
                </h1>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{companyName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-muted-foreground dark:text-muted-foreground text-[12px]">
            {date}
          </span>
        </div>
      </div>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="rotate-90">
              <GoKebabHorizontal />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
export default CardHeader;
