export const APP_CONFIG = {
  name: 'JobHive',
  tagline: 'Desktop intelligence for focused job discovery.',
  description:
    'A local-first desktop workspace for scraping, reviewing, and rerunning structured job searches without browser chaos.',
  company: 'Piyush Pardeshi',
  repository: {
    label: 'GitHub',
    url: 'https://github.com/DevsToolKit/jobhive',
  },
  supportEmail: 'support@jobhive.app',
  versionLabel: 'Production Candidate',
  searchPlaceholder: 'Search pages, presets, and current jobs',
  aboutHighlights: [
    'Local-first data flow with a bundled backend runtime.',
    'Preset-based repeatable searches for consistent job discovery.',
    'Desktop-native updates and operational diagnostics built in.',
  ],
  settings: {
    updateHostingHint:
      'Free update hosting works well with GitHub Releases or a static file host that serves latest.yml and installers.',
  },
} as const;
