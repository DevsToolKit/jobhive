import { GoHome, GoHistory, GoCommandPalette, GoSearch, GoGear, GoInfo } from 'react-icons/go';
import type { NavItem } from '@/types/navigation';

export const navMain: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: GoHome,
    action: 'navigate',
  },
  {
    title: 'Jobs Scrape History',
    url: '/history',
    icon: GoHistory,
    action: 'navigate',
  },
  {
    title: 'Presets',
    url: '/presets',
    icon: GoCommandPalette,
    action: 'navigate',
  },
];

export const navSecondary: NavItem[] = [
  {
    title: 'Search',
    icon: GoSearch,
    action: 'modal',
    modalId: 'search',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: GoGear,
    action: 'navigate',
  },
  {
    title: 'About',
    url: '/about',
    icon: GoInfo,
    action: 'navigate',
  },
];
