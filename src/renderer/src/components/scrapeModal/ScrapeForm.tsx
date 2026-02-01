import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

import { LOCATIONS, SITES, SEARCH_TERMS } from '@/config/scrapeFormConfig';
import { FormErrors, ScrapeFormState } from './types';

type Props = {
  formData: ScrapeFormState;
  errors: FormErrors;
  isScraping: boolean;
  setFormData: React.Dispatch<React.SetStateAction<ScrapeFormState>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  toggleSite: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function ScrapeForm({
  formData,
  errors,
  isScraping,
  setFormData,
  setErrors,
  toggleSite,
  onSubmit,
  onClose,
}: Props) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>New Job Scrape</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Scrape Term */}
        <div className="space-y-2">
          <Label>Search Term *</Label>
          <Select
            disabled={isScraping}
            value={formData.search_term}
            onValueChange={(value) => {
              setFormData((p) => ({ ...p, search_term: value }));
              setErrors((e) => ({ ...e, search_term: undefined }));
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

        {/* Location */}
        <div className="space-y-2">
          <Label>Location *</Label>
          <Select
            disabled={isScraping}
            value={formData.location}
            onValueChange={(value) => {
              setFormData((p) => ({ ...p, location: value }));
              setErrors((e) => ({ ...e, location: undefined }));
            }}
          >
            <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
        </div>

        {/* Sites */}
        <div className="space-y-2">
          <Label>Sites *</Label>
          <div className="flex gap-4">
            {SITES.map((site) => (
              <div key={site.value} className="flex items-center gap-2">
                <Checkbox
                  disabled={isScraping}
                  checked={formData.sites.includes(site.value)}
                  onCheckedChange={() => toggleSite(site.value)}
                />
                <span className="text-sm">{site.label}</span>
              </div>
            ))}
          </div>
          {errors.sites && <p className="text-sm text-red-500">{errors.sites}</p>}
        </div>

        {/* Results */}
        <div className="space-y-2">
          <Label>Results Wanted: {formData.results_wanted}</Label>
          <Slider
            disabled={isScraping}
            min={10}
            max={60}
            step={5}
            value={[formData.results_wanted]}
            onValueChange={([value]) => {
              setFormData((p) => ({ ...p, results_wanted: value }));
              setErrors((e) => ({ ...e, results_wanted: undefined }));
            }}
          />
          {errors.results_wanted && <p className="text-sm text-red-500">{errors.results_wanted}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isScraping}>
            Cancel
          </Button>

          <Button onClick={onSubmit} disabled={isScraping}>
            {isScraping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              'Start Scrape'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
