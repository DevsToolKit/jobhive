import React, { useState, useMemo } from 'react';
import JobCard from '@/components/jobCard/job-card';
import { Job } from '@/types/job';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Laptop, ArrowUpDown, RotateCcw, Briefcase, ChevronDown } from 'lucide-react';

type Props = {
  jobs: Job[];
};

type SortOption = 'newest' | 'salary_high' | 'company_asc';

const parseTags = (tagsStr: string | null | undefined): string[] => {
  if (!tagsStr) return [];
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function DashboardJobsGrid({ jobs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Compute available platforms and counts
  const siteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of jobs) {
      if (job.site) {
        const key = job.site.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  }, [jobs]);

  const remoteCount = useMemo(() => {
    return jobs.filter((j) => j.is_remote).length;
  }, [jobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Search filter (title, company, description, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((job) => {
        const matchTitle = job.title?.toLowerCase().includes(q);
        const matchCompany = job.company?.toLowerCase().includes(q);
        const matchDesc = job.description?.toLowerCase().includes(q);
        const tags = parseTags(job.tags);
        const matchTags = tags.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchCompany || matchDesc || matchTags;
      });
    }

    // Site platform filter
    if (selectedSite !== 'all') {
      result = result.filter((job) => job.site?.toLowerCase() === selectedSite.toLowerCase());
    }

    // Remote filter
    if (remoteOnly) {
      result = result.filter((job) => job.is_remote);
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'salary_high') {
        const aMax = a.max_amount ?? a.min_amount ?? 0;
        const bMax = b.max_amount ?? b.min_amount ?? 0;
        return bMax - aMax;
      }
      if (sortBy === 'company_asc') {
        const aComp = (a.company || '').toLowerCase();
        const bComp = (b.company || '').toLowerCase();
        return aComp.localeCompare(bComp);
      }
      // 'newest' default
      const aDate = new Date(a.date_posted).getTime();
      const bDate = new Date(b.date_posted).getTime();
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return bDate - aDate;
      }
      return 0;
    });
  }, [jobs, searchQuery, selectedSite, remoteOnly, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedSite !== 'all' || remoteOnly;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSite('all');
    setRemoteOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-1">
        {/* Left group: search input + pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, company, skills..."
              className="pl-8 pr-7 h-8 text-xs bg-muted/40 hover:bg-muted/60 focus-visible:bg-background border-border/60 rounded-lg shadow-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-border/60 hidden sm:block mx-0.5" />

          {/* Clubbed Platform Dropdown using DropdownMenu for guaranteed opening and identical button height */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-lg cursor-pointer bg-background border-border/70 text-foreground hover:bg-muted/50 font-normal"
              >
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {selectedSite === 'all'
                    ? `All Sources (${jobs.length})`
                    : `${selectedSite.charAt(0).toUpperCase() + selectedSite.slice(1)} (${siteCounts[selectedSite] || 0})`}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[170px]">
              <DropdownMenuRadioGroup value={selectedSite} onValueChange={setSelectedSite}>
                <DropdownMenuRadioItem value="all" className="text-xs cursor-pointer">
                  All Sources ({jobs.length})
                </DropdownMenuRadioItem>
                {Object.entries(siteCounts).map(([site, count]) => (
                  <DropdownMenuRadioItem
                    key={site}
                    value={site}
                    className="text-xs capitalize cursor-pointer"
                  >
                    {site} ({count})
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Remote Only Toggle Button */}
          {remoteCount > 0 && (
            <Button
              type="button"
              variant={remoteOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`h-8 text-xs gap-1.5 rounded-lg cursor-pointer transition-colors ${
                remoteOnly
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground border-border/70 bg-background'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Remote</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  remoteOnly ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {remoteCount}
              </span>
            </Button>
          )}
        </div>

        {/* Right group: Result count + Sort dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 text-xs text-muted-foreground ml-auto">
          <span>
            <strong className="font-semibold text-foreground">{filteredJobs.length}</strong> of {jobs.length} jobs
          </span>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs bg-background border-border/70 rounded-lg cursor-pointer">
              <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest" className="text-xs">Newest first</SelectItem>
              <SelectItem value="salary_high" className="text-xs">Highest salary</SelectItem>
              <SelectItem value="company_asc" className="text-xs">Company (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Jobs Grid or Empty State */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-8">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} tags={parseTags(job.tags)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/80 bg-card/40 my-4">
          <div className="h-12 w-12 rounded-full bg-muted/80 flex items-center justify-center mb-3 text-muted-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No matching jobs found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            {searchQuery
              ? `No job listings matched "${searchQuery}". Try searching with different keywords or clearing your active filters.`
              : 'No job listings match your current filter criteria.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
