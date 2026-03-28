export type ThemePreference = 'light' | 'dark' | 'system';

export type AppSettings = {
  theme: ThemePreference;
  default_location: string;
  default_results_wanted: number;
  default_country_indeed: string;
  default_sites: string[];
};

export type AppSettingsUpdate = Partial<AppSettings>;
