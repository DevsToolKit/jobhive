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

const CardHeader = ({ companyName }: { companyName: string }) => {
  return (
    <div className="flex flex-row justify-between items-center gap-5">
      <div className="flex flex-row items-center gap-3 w-full min-w-0">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
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
            Posted 2 days ago
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
