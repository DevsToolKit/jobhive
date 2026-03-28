import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useScrapeForm } from './useScrapeForm';

describe('useScrapeForm', () => {
  it('merges an initial draft with defaults', () => {
    const { result } = renderHook(() =>
      useScrapeForm({
        search_term: 'Python Developer',
        sites: ['linkedin'],
      })
    );

    expect(result.current.formData.search_term).toBe('Python Developer');
    expect(result.current.formData.sites).toEqual(['linkedin']);
    expect(result.current.formData.results_wanted).toBe(20);
  });

  it('toggles sites and clears the sites error once a source is selected', () => {
    const { result } = renderHook(() => useScrapeForm());

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.sites).toBe('Select at least one site');

    act(() => {
      result.current.toggleSite('linkedin');
    });

    expect(result.current.formData.sites).toEqual(['linkedin']);
    expect(result.current.errors.sites).toBeUndefined();

    act(() => {
      result.current.toggleSite('linkedin');
    });

    expect(result.current.formData.sites).toEqual([]);
  });

  it('validates all required fields and preset naming rules', () => {
    const { result } = renderHook(() => useScrapeForm());

    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.search_term).toBe('Please select a scrape term');
    expect(result.current.errors.location).toBe('Please select a location');
    expect(result.current.errors.results_wanted).toBeUndefined();

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        search_term: 'Python Developer',
        location: 'Remote',
        sites: ['linkedin'],
        results_wanted: 5,
        save_as_preset: true,
      }));
    });

    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.results_wanted).toBe('Minimum 10 results required');
    expect(result.current.errors.preset_name).toBe('Give the preset a name');
  });

  it('applies drafts and resets back to defaults', () => {
    const { result } = renderHook(() => useScrapeForm());

    act(() => {
      result.current.applyDraft({
        search_term: 'Data Engineer',
        location: 'Pune',
        sites: ['google'],
      });
      result.current.setIsScraping(true);
    });

    expect(result.current.formData.search_term).toBe('Data Engineer');
    expect(result.current.isScraping).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.search_term).toBe('');
    expect(result.current.formData.sites).toEqual([]);
    expect(result.current.isScraping).toBe(false);
    expect(result.current.errors).toEqual({});
  });
});
