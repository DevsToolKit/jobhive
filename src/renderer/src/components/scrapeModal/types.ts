export type ScrapeFormState = {
  search_term: string;
  location: string;
  sites: string[];
  results_wanted: number;
  country_indeed: string;
};

export type FormErrors = Partial<Record<keyof ScrapeFormState, string>>;
