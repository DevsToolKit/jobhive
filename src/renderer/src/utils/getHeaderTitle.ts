// src/utils/getHeaderTitle.ts
import { navMain, navSecondary } from '@/config/navigation';
import type { NavItem } from '@/types/navigation';

const allNavItems: NavItem[] = [...navMain, ...navSecondary];

export function getHeaderTitle(pathname: string): string {
  if (pathname.startsWith('/results/')) return 'Results';

  // 1. exact match first
  const exact = allNavItems.find((item) => item.url === pathname);
  if (exact?.title) return exact.title;

  // 2. nested routes (e.g. /results/123)
  const nested = allNavItems.find((item) => item.url && pathname.startsWith(item.url + '/'));

  return nested?.title ?? 'Workspace';
}
