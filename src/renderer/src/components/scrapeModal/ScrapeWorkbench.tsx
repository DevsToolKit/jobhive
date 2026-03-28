import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { fetchAppSettings } from '@/api/settings';
import { useBackend } from '@/hooks/useBaseUrl';
import { LOCATIONS, SEARCH_TERMS, SITES } from '@/config/scrapeFormConfig';
import { useDashboard } from '@/screens/dashboard/DashboardContext';

import ScrapeProgress from './ScrapeProgress';
import { useScrapeForm } from './useScrapeForm';
import type { ScrapeDraft, ScrapeFormState } from './types';

function ScrapeEditor({
  formData,
  errors,
  isScraping,
  setFormData,
  setErrors,
  toggleSite,
  onSubmit,
  onClose,
}: {
  formData: ScrapeFormState;
  errors: Partial<Record<keyof ScrapeFormState, string>>;
  isScraping: boolean;
  setFormData: React.Dispatch<React.SetStateAction<ScrapeFormState>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof ScrapeFormState, string>>>>;
  toggleSite: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle className="text-2xl">Launch a focused scrape</DialogTitle>
        <DialogDescription>
          Configure the search once, run it now, and optionally save it as a reusable preset.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Search Term *</Label>
            <Select
              disabled={isScraping}
              value={formData.search_term}
              onValueChange={(value) => {
                setFormData((current) => ({ ...current, search_term: value }));
                setErrors((current) => ({ ...current, search_term: undefined }));
              }}
            >
              <SelectTrigger className={errors.search_term ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.search_term && <p className="text-sm text-red-500">{errors.search_term}</p>}
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Select
              disabled={isScraping}
              value={formData.location}
              onValueChange={(value) => {
                setFormData((current) => ({ ...current, location: value }));
                setErrors((current) => ({ ...current, location: undefined }));
              }}
            >
              <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sites *</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SITES.map((site) => {
              const active = formData.sites.includes(site.value);

              return (
                <button
                  key={site.value}
                  type="button"
                  disabled={isScraping}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? 'border-primary bg-primary/8 text-foreground shadow-sm'
                      : 'border-border/70 bg-muted/20 text-muted-foreground'
                  }`}
                  onClick={() => toggleSite(site.value)}
                >
                  <Checkbox checked={active} />
                  <span className="text-sm font-medium">{site.label}</span>
                </button>
              );
            })}
          </div>
          {errors.sites && <p className="text-sm text-red-500">{errors.sites}</p>}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Results Wanted</Label>
              <p className="text-xs text-muted-foreground">
                Keep the scrape focused or widen it depending on the run.
              </p>
            </div>
            <span className="rounded-full border border-border/70 px-3 py-1 text-sm font-medium">
              {formData.results_wanted}
            </span>
          </div>

          <Slider
            disabled={isScraping}
            min={10}
            max={60}
            step={5}
            value={[formData.results_wanted]}
            onValueChange={([value]) => {
              setFormData((current) => ({ ...current, results_wanted: value }));
              setErrors((current) => ({ ...current, results_wanted: undefined }));
            }}
          />
          {errors.results_wanted && <p className="text-sm text-red-500">{errors.results_wanted}</p>}
        </div>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              disabled={isScraping}
              checked={formData.save_as_preset}
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setFormData((current) => ({
                  ...current,
                  save_as_preset: nextValue,
                  preset_name: nextValue ? current.preset_name : '',
                }));
                setErrors((current) => ({ ...current, preset_name: undefined }));
              }}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Save as preset</p>
              <p className="text-xs text-muted-foreground">
                Reuse this setup later from Presets and Search.
              </p>
            </div>
          </div>

          {formData.save_as_preset && (
            <div className="space-y-2">
              <Label>Preset name</Label>
              <Input
                disabled={isScraping}
                value={formData.preset_name}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, preset_name: event.target.value }));
                  setErrors((current) => ({ ...current, preset_name: undefined }));
                }}
                placeholder="Remote product roles"
              />
              {errors.preset_name && <p className="text-sm text-red-500">{errors.preset_name}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isScraping}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isScraping} className="min-w-36">
            {isScraping ? 'Scraping...' : 'Start Scrape'}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function ScrapeWorkbench({
  open,
  onClose,
  draft,
  onDraftConsumed,
}: {
  open: boolean;
  onClose: () => void;
  draft?: ScrapeDraft | null;
  onDraftConsumed?: () => void;
}) {
  const {
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
  } = useScrapeForm(draft ?? undefined);

  const { baseUrl } = useBackend();
  const { refreshDashboard } = useDashboard();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (draft) {
      applyDraft(draft);
      onDraftConsumed?.();
      return;
    }

    if (!baseUrl) {
      applyDraft();
      return;
    }

    fetchAppSettings(baseUrl)
      .then((settings) => {
        applyDraft({
          location: settings.default_location,
          results_wanted: settings.default_results_wanted,
          country_indeed: settings.default_country_indeed,
          sites: settings.default_sites,
        });
      })
      .catch(() => {
        applyDraft();
      });
  }, [applyDraft, baseUrl, draft, onDraftConsumed, open]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsScraping(true);

    try {
      const response = await fetch(`${baseUrl}/api/scrape/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setIsScraping(false);
        return;
      }

      const data = await response.json();
      setSessionId(data.session_id);
    } catch (error) {
      console.error('Scrape error:', error);
      setIsScraping(false);
    }
  };

  const handleCancel = async () => {
    if (!sessionId) return;

    try {
      await fetch(`${baseUrl}/api/scrape/cancel/${sessionId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const handleComplete = async () => {
    setSessionId(null);
    setIsScraping(false);
    resetForm();
    await refreshDashboard();
    onClose();
  };

  const handleDialogClose = () => {
    if (isScraping) return;

    setSessionId(null);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl border-border/70 bg-card/95 backdrop-blur-sm">
        {!sessionId ? (
          <ScrapeEditor
            formData={formData}
            errors={errors}
            isScraping={isScraping}
            setFormData={setFormData}
            setErrors={setErrors}
            toggleSite={toggleSite}
            onSubmit={handleSubmit}
            onClose={handleDialogClose}
          />
        ) : (
          <ScrapeProgress
            sessionId={sessionId}
            baseUrl={baseUrl}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
