// config/scrapeFormConfig.ts
export const SEARCH_TERMS = [
  { label: 'Full Stack Developer', value: 'Full Stack Developer' },
  { label: 'Frontend Engineer', value: 'Frontend Engineer' },
  { label: 'Backend Developer', value: 'Backend Developer' },
  { label: 'Software Engineer', value: 'Software Engineer' },
  { label: 'React Developer', value: 'React Developer' },
  { label: 'Python Developer', value: 'Python Developer' },
  { label: 'Data Analyst', value: 'Data Analyst' },
  { label: 'Data Scientist', value: 'Data Scientist' },
  { label: 'DevOps Engineer', value: 'DevOps Engineer' },
  { label: 'Product Manager', value: 'Product Manager' },
  { label: 'UI/UX Designer', value: 'UI/UX Designer' },
  { label: 'Machine Learning Engineer', value: 'Machine Learning Engineer' },
];

export const LOCATIONS = [
  { label: 'Remote', value: 'Remote' },
  { label: 'Mumbai, IN', value: 'Mumbai, IN' },
  { label: 'Bangalore, IN', value: 'Bangalore, IN' },
  { label: 'Delhi, IN', value: 'Delhi, IN' },
  { label: 'Pune, IN', value: 'Pune, IN' },
  { label: 'Hyderabad, IN', value: 'Hyderabad, IN' },
  { label: 'Chennai, IN', value: 'Chennai, IN' },
  { label: 'Kolkata, IN', value: 'Kolkata, IN' },
  { label: 'Ahmedabad, IN', value: 'Ahmedabad, IN' },
  { label: 'Noida, IN', value: 'Noida, IN' },
  { label: 'Gurgaon, IN', value: 'Gurgaon, IN' },
  { label: 'United States', value: 'United States' },
  { label: 'London, UK', value: 'London, UK' },
];

export interface SiteConfig {
  label: string;
  value: 'linkedin' | 'indeed' | 'google';
  color: string;
  description: string;
}

export const SITES: SiteConfig[] = [
  {
    label: 'LinkedIn',
    value: 'linkedin',
    color: '#0A66C2',
    description: 'Tech & corporate roles',
  },
  {
    label: 'Indeed',
    value: 'indeed',
    color: '#2164F3',
    description: 'High volume listings',
  },
  {
    label: 'Google',
    value: 'google',
    color: '#EA4335',
    description: 'Aggregated web results',
  },
];
