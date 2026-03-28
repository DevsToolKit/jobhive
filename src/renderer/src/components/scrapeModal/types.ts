export type ScrapeFormState = {
  search_term: string;
  location: string;
  sites: string[];
  results_wanted: number;
  country_indeed: string;
  save_as_preset: boolean;
  preset_name: string;
  preset_id?: string;
};

export type FormErrors = Partial<Record<keyof ScrapeFormState, string>>;

export type ScrapeDraft = Partial<ScrapeFormState>;
