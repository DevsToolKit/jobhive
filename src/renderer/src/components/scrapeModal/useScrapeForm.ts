import { useState } from 'react';
import { FormErrors, ScrapeFormState } from './types';

export function useScrapeForm() {
  const [formData, setFormData] = useState<ScrapeFormState>({
    search_term: '',
    location: '',
    sites: [],
    results_wanted: 20,
    country_indeed: 'india',
  });

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isScraping,
    setIsScraping,
    toggleSite,
    validateForm,
  };
}
