import React from 'react';
import { Button } from '../ui/button';
import { GoArrowUpRight } from 'react-icons/go';
import CardHeader from './CardHeader';
import { Badge } from '../ui/badge';
import { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
  tags: string[];
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/* ---------------- Date Posted ---------------- */

const calculateDatePosted = (date: string): string => {
  const now = Date.now();
  const posted = new Date(date).getTime();

  const diffInSeconds = Math.floor((now - posted) / 1000);

  if (diffInSeconds < 0) return 'just now';

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hr', seconds: 3600 },
    { label: 'min', seconds: 60 },
    { label: 'sec', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/* ---------------- Salary ---------------- */

const formatAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} K`;
  }
  return amount.toString();
};

const normalizeSalary = (
  minAmount?: number,
  maxAmount?: number,
  currency?: string,
  interval?: string
): string => {
  const missingCount = [minAmount, maxAmount, currency, interval].filter(
    (v) => v === undefined || v === null
  ).length;

  if (missingCount >= 2) return 'Not Mentioned';

  const intervalMap: Record<string, string> = {
    year: 'LPA',
    month: 'per month',
    week: 'per week',
    day: 'per day',
    hour: 'per hour',
  };

  const intervalLabel = interval ? (intervalMap[interval] ?? `per ${interval}`) : '';

  if (!minAmount && maxAmount) {
    return `${currency} Up to ${formatAmount(maxAmount)} ${intervalLabel}`;
  }

  if (minAmount && !maxAmount) {
    return `${currency} From ${formatAmount(minAmount)} ${intervalLabel}`;
  }

  if (!minAmount || !maxAmount || !currency || !interval) {
    return 'Not Mentioned';
  }

  return `${currency} ${formatAmount(minAmount)} - ${formatAmount(maxAmount)} ${intervalLabel}`;
};

/* ---------------- Component ---------------- */

const JobCard = ({ job, tags }: JobCardProps) => {
  const site = capitalize(job.site);

  console.log(job);
  return (
    <div className="rounded-[20px] bg-[#f6f5f7] dark:bg-card p-1 w-full">
      <div className="p-5 bg-white dark:bg-card-secondary rounded-[16px] flex flex-col gap-3">
        <CardHeader
          companyName={job.company || 'Not Mentioned'}
          date={calculateDatePosted(job.date_posted)}
          company_url={job.company_url}
        />

        <TagsContainer tags={tags} />
        <JobDescription title={job.title} description={job.description || 'Not Mentioned'} />
      </div>

      <div className="p-5 flex flex-col gap-3">
        <h3 className="font-semibold">
          {normalizeSalary(job.min_amount, job.max_amount, job.currency, job.interval)}
        </h3>

        <Button className="w-full py-5" variant="outline">
          View details
        </Button>

        <Button className="w-full py-5" onClick={() => window.app.openExternalUrl(job.job_url)}>
          Apply now on {site} <GoArrowUpRight />
        </Button>
      </div>
    </div>
  );
};

/* ---------------- Tags ---------------- */

interface TagsContainerProps {
  tags: string[];
}

const TagsContainer = ({ tags }: TagsContainerProps) => {
  if (!tags.length) {
    return <Badge variant={'secondary'}>N/A</Badge>;
  }

  return (
    <div className="flex flex-row gap-3 flex-wrap">
      {tags.map((tag, index) => (
        <Badge key={index}>{tag}</Badge>
      ))}
    </div>
  );
};

/* ---------------- Description ---------------- */

interface JobDescriptionProps {
  title: string;
  description: string;
}

const JobDescription = ({ title, description }: JobDescriptionProps) => {
  return (
    <div>
      <h2 className="text-[24px] font-semibold line-clamp-1">{title}</h2>
      <p className="text-[16px] line-clamp-3">{description}</p>
    </div>
  );
};

export default JobCard;
