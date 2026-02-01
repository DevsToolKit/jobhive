import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Job } from '@/types/job';
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Briefcase,
  X,
  Mail,
  Globe,
} from 'lucide-react';
import { GoArrowUpRight } from 'react-icons/go';

type JobDetailsDrawerProps = {
  job: Job | null;
  open: boolean;
  onClose: () => void;
};

export default function JobDetailsDrawer({ job, open, onClose }: JobDetailsDrawerProps) {
  if (!job) return null;

  const tags = JSON.parse(job.tags || '[]');

  const formatSalary = () => {
    if (!job.min_amount && !job.max_amount) return 'Not specified';

    const formatAmount = (amount: number): string => {
      if (amount >= 10000000) return `${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
      if (amount >= 100000) return `${(amount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} K`;
      return amount.toString();
    };

    const currency = job.currency || 'INR';
    const interval = job.interval || 'year';

    const intervalMap: Record<string, string> = {
      year: 'LPA',
      month: 'per month',
      week: 'per week',
      day: 'per day',
      hour: 'per hour',
    };

    const intervalLabel = intervalMap[interval] ?? `per ${interval}`;

    if (job.min_amount && job.max_amount) {
      return `${currency} ${formatAmount(job.min_amount)} - ${formatAmount(
        job.max_amount
      )} ${intervalLabel}`;
    }
    if (job.min_amount) {
      return `${currency} From ${formatAmount(job.min_amount)} ${intervalLabel}`;
    }
    return `${currency} Up to ${formatAmount(job.max_amount!)} ${intervalLabel}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Posted today';
      if (diffDays === 1) return 'Posted yesterday';
      if (diffDays < 7) return `Posted ${diffDays} days ago`;
      if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
      return `Posted ${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'Recently posted';
    }
  };

  const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  const site = capitalize(job.site);

  const formatLocation = () => {
    const parts = [];
    if (job.location_city) parts.push(job.location_city);
    if (job.location_state) parts.push(job.location_state);
    if (job.location_country) parts.push(job.location_country);
    return parts.join(', ') || 'Not specified';
  };

  const jobTypes = job.job_type
    ? job.job_type
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <Drawer open={open} onOpenChange={onClose}>
      {/* HEIGHT + OVERFLOW */}
      <DrawerContent className="h-[90dvh] overflow-hidden">
        {/* FLEX COLUMN WITH MIN-H-0 */}
        <div className="mx-auto w-full max-w-[1400px] h-full flex flex-col min-h-0">
          {/* ================= HEADER ================= */}
          <DrawerHeader className="relative border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-normal">
                    {site}
                  </Badge>

                  {job.is_remote && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      Remote
                    </Badge>
                  )}

                  {jobTypes.map((type, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>

                <DrawerTitle className="text-2xl font-semibold leading-tight pr-8 text-left">
                  {job.title}
                </DrawerTitle>

                <DrawerDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {formatLocation()}
                  </span>
                </DrawerDescription>
              </div>

              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* ================= SCROLLABLE CONTENT ================= */}
          {/* THIS WRAPPER IS CRITICAL */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailCard
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Compensation"
                    value={formatSalary()}
                  />
                  <DetailCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Posted"
                    value={formatDate(job.date_posted)}
                  />
                  {job.job_level && (
                    <DetailCard
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Experience Level"
                      value={job.job_level}
                    />
                  )}
                  {job.company_industry && (
                    <DetailCard
                      icon={<Building2 className="h-4 w-4" />}
                      label="Industry"
                      value={job.company_industry}
                    />
                  )}
                </div>

                {tags.length > 0 && <Separator />}

                {tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.description && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                        Job Description
                      </h3>
                      <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-line break-words">
                        {job.description}
                      </div>
                    </div>
                  </>
                )}

                {job.emails && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                        Contact
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-neutral-500" />
                        <a href={`mailto:${job.emails}`} className="text-blue-600 hover:underline">
                          {job.emails}
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ================= FOOTER ================= */}
          <DrawerFooter className="border-t shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => window.app.openExternalUrl(job.job_url)}
              >
                Apply now on {site}
                <GoArrowUpRight className="ml-2" />
              </Button>

              {job.company_url && (
                <Button asChild variant="outline" size="lg">
                  <a
                    href={job.company_url}
                    onClick={(e) => {
                      e.preventDefault();
                      window.app.openExternalUrl(job.company_url!);
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Company Page
                  </a>
                </Button>
              )}
            </div>

            <DrawerClose asChild>
              <Button variant="ghost" size="lg" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}
