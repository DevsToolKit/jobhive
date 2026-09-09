import { LayoutDashboard, History, SlidersHorizontal, Search, Settings, Info } from 'lucide-react';
import type { NavItem } from '@/types/navigation';

export const navMain: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    action: 'navigate',
  },
  {
    title: 'Jobs Scrape History',
    url: '/history',
    icon: History,
    action: 'navigate',
  },
  {
    title: 'Presets',
    url: '/presets',
    icon: SlidersHorizontal,
    action: 'navigate',
  },
];

export const navSecondary: NavItem[] = [
  {
    title: 'Search',
    icon: Search,
    action: 'modal',
    modalId: 'search',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    action: 'navigate',
  },
  {
    title: 'About',
    url: '/about',
    icon: Info,
    action: 'navigate',
  },
];
