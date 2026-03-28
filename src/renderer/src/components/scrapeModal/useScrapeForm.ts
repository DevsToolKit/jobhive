import { useCallback, useState } from 'react';
import { FormErrors, ScrapeDraft, ScrapeFormState } from './types';

export const DEFAULT_SCRAPE_FORM_STATE: ScrapeFormState = {
  search_term: '',
  location: '',
  sites: [],
  results_wanted: 20,
  country_indeed: 'india',
  save_as_preset: false,
  preset_name: '',
  preset_id: undefined,
};

function mergeDraft(draft?: ScrapeDraft): ScrapeFormState {
  return {
    ...DEFAULT_SCRAPE_FORM_STATE,
    ...draft,
  };
}

export function useScrapeForm(initialDraft?: ScrapeDraft) {
  const [formData, setFormData] = useState<ScrapeFormState>(mergeDraft(initialDraft));

  const [errors, setErrors] = useState<FormErrors>({});
  const [isScraping, setIsScraping] = useState(false);

  const toggleSite = (value: string) => {
    setFormData((prev) => {
      const sites = prev.sites.includes(value)
        ? prev.sites.filter((s) => s !== value)
        : [...prev.sites, value];

      if (sites.length > 0) {
        setErrors((e) => ({ ...e, sites: undefined }));
      }

      return { ...prev, sites };
    });
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.search_term) newErrors.search_term = 'Please select a scrape term';
    if (!formData.location) newErrors.location = 'Please select a location';
    if (formData.sites.length === 0) newErrors.sites = 'Select at least one site';
    if (formData.results_wanted < 10) newErrors.results_wanted = 'Minimum 10 results required';
    if (formData.save_as_preset && !formData.preset_name.trim()) {
      newErrors.preset_name = 'Give the preset a name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyDraft = useCallback((draft?: ScrapeDraft) => {
    setFormData(mergeDraft(draft));
    setErrors({});
    setIsScraping(false);
  }, []);

  const resetForm = useCallback(() => {
    applyDraft();
  }, [applyDraft]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isScraping,
    setIsScraping,
    toggleSite,
    validateForm,
    applyDraft,
    resetForm,
  };
}
