import { useEffect, useMemo, useRef, useState } from 'react';

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

import { toast } from 'sonner';
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
  // Ensure any draft or custom value is always present in the options list
  const roleOptions = useMemo(() => {
    if (
      formData.search_term &&
      !SEARCH_TERMS.some((t) => t.value.toLowerCase() === formData.search_term.toLowerCase())
    ) {
      return [{ label: formData.search_term, value: formData.search_term }, ...SEARCH_TERMS];
    }
    return SEARCH_TERMS;
  }, [formData.search_term]);

  const locationOptions = useMemo(() => {
    if (
      formData.location &&
      !LOCATIONS.some((l) => l.value.toLowerCase() === formData.location.toLowerCase())
    ) {
      return [{ label: formData.location, value: formData.location }, ...LOCATIONS];
    }
    return LOCATIONS;
  }, [formData.location]);

  const selectedRole = roleOptions.find(
    (t) => t.value.toLowerCase() === (formData.search_term || '').toLowerCase()
  )?.value;

  const selectedLocation = locationOptions.find(
    (l) => l.value.toLowerCase() === (formData.location || '').toLowerCase()
  )?.value;

  return (
    <>
      <DialogHeader className="space-y-1.5 pb-2">
        <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
          Launch a focused scrape
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
          Configure the search once, run it now, and optionally save it as a reusable preset.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-1">
        {/* Search Term & Location Dropdowns in 2 Columns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search Term */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Search Term *</Label>
            <Select
              disabled={isScraping}
              value={selectedRole || undefined}
              onValueChange={(value) => {
                setFormData((current) => ({ ...current, search_term: value }));
                setErrors((current) => ({ ...current, search_term: undefined }));
              }}
            >
              <SelectTrigger
                className={`w-full h-11 text-sm bg-background ${
                  errors.search_term ? 'border-destructive' : 'border-border/80'
                }`}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {roleOptions.map((term) => (
                  <SelectItem key={term.value} value={term.value} className="text-sm py-2">
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.search_term && <p className="text-xs text-destructive">{errors.search_term}</p>}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Location *</Label>
            <Select
              disabled={isScraping}
              value={selectedLocation || undefined}
              onValueChange={(value) => {
                setFormData((current) => ({ ...current, location: value }));
                setErrors((current) => ({ ...current, location: undefined }));
              }}
            >
              <SelectTrigger
                className={`w-full h-11 text-sm bg-background ${
                  errors.location ? 'border-destructive' : 'border-border/80'
                }`}
              >
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {locationOptions.map((location) => (
                  <SelectItem key={location.value} value={location.value} className="text-sm py-2">
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
          </div>
        </div>

        {/* Sites Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Sites *</Label>
          <div className="grid grid-cols-3 gap-3">
            {SITES.map((site) => {
              const isSelected = formData.sites.includes(site.value);

              return (
                <button
                  key={site.value}
                  type="button"
                  disabled={isScraping}
                  onClick={() => toggleSite(site.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs ring-1 ring-primary/20'
                      : 'border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  <span className="text-sm font-medium">{site.label}</span>
                </button>
              );
            })}
          </div>
          {errors.sites && <p className="text-xs text-destructive">{errors.sites}</p>}
        </div>

        {/* Results Wanted */}
        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">Results Wanted</Label>
              <p className="text-xs text-muted-foreground">
                Keep the scrape focused or widen it depending on the run.
              </p>
            </div>
            <span className="rounded-lg border border-border/70 bg-background px-3 py-1 text-sm font-bold tabular-nums text-foreground">
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
            className="py-1"
          />
          {errors.results_wanted && <p className="text-xs text-destructive">{errors.results_wanted}</p>}
        </div>

        {/* Save as preset */}
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="save-preset"
              disabled={isScraping}
              checked={formData.save_as_preset}
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setFormData((current) => ({
                  ...current,
                  save_as_preset: nextValue,
                  preset_name: nextValue
                    ? (current.preset_name || (current.search_term ? `${current.search_term} (${current.location || 'Any'})` : ''))
                    : '',
                }));
                setErrors((current) => ({ ...current, preset_name: undefined }));
              }}
              className="mt-0.5"
            />
            <div className="space-y-0.5 flex-1">
              <label htmlFor="save-preset" className="text-sm font-medium text-foreground cursor-pointer block">
                Save as preset
              </label>
              <p className="text-xs text-muted-foreground">
                Reuse this setup later from Presets and Search.
              </p>
            </div>
          </div>

          {formData.save_as_preset && (
            <div className="pt-2 border-t border-border/50 space-y-1.5 animate-in fade-in-50 duration-200">
              <Label className="text-xs font-medium text-foreground/80">Preset name</Label>
              <Input
                disabled={isScraping}
                value={formData.preset_name}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, preset_name: event.target.value }));
                  setErrors((current) => ({ ...current, preset_name: undefined }));
                }}
                placeholder="e.g. Remote product roles"
                className={`h-10 text-sm bg-background ${errors.preset_name ? 'border-destructive' : ''}`}
                autoFocus
              />
              {errors.preset_name && <p className="text-xs text-destructive">{errors.preset_name}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isScraping} className="h-10 px-5 text-sm cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isScraping}
            className="h-10 min-w-36 text-sm font-medium cursor-pointer shadow-sm transition-all"
          >
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

  // Track initialization to avoid wiping user selections
  const initializedForOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedForOpenRef.current = false;
      return;
    }

    if (initializedForOpenRef.current) return;
    initializedForOpenRef.current = true;

    if (draft) {
      applyDraft(draft);
      onDraftConsumed?.();
      return;
    }

    if (!baseUrl) return;

    fetchAppSettings(baseUrl)
      .then((settings) => {
        setFormData((prev) => ({
          ...prev,
          location: prev.location || settings.default_location || '',
          results_wanted: prev.results_wanted || settings.default_results_wanted || 20,
          country_indeed: prev.country_indeed || settings.default_country_indeed || 'india',
          sites: prev.sites.length > 0 ? prev.sites : (settings.default_sites && settings.default_sites.length > 0 ? settings.default_sites : ['linkedin', 'indeed']),
        }));
      })
      .catch(() => {});
  }, [open, draft, baseUrl, applyDraft, onDraftConsumed, setFormData]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }

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
        toast.error('Failed to start scraping session.');
        return;
      }

      const data = await response.json();
      setSessionId(data.session_id);
      toast.info(`Scraping started for "${formData.search_term}"`);
    } catch (error) {
      console.error('Scrape error:', error);
      setIsScraping(false);
      toast.error('Unable to connect to scrape backend.');
    }
  };

  const handleCancel = async () => {
    if (!sessionId) return;
    setIsScraping(false);

    try {
      await fetch(`${baseUrl}/api/scrape/cancel/${sessionId}`, {
        method: 'POST',
      });
      toast.warning('Scrape session cancelled');
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel scrape session');
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setIsScraping(false);
  };

  const handleComplete = async () => {
    setSessionId(null);
    setIsScraping(false);
    resetForm();
    await refreshDashboard();
    onClose();
  };

  const handleDialogClose = () => {
    setSessionId(null);
    setIsScraping(false);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-hidden flex flex-col border-border/70 bg-card p-6 shadow-2xl sm:rounded-3xl">
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
            initialQuery={{
              search_term: formData.search_term,
              location: formData.location,
              target_jobs: formData.results_wanted,
              sites: formData.sites,
            }}
            onCancel={handleCancel}
            onComplete={handleComplete}
            onReset={handleReset}
            onClose={handleDialogClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
