/**
 * Terms of Service and Privacy Policy Configuration
 *
 * To trigger a re-prompt on an application update, increment CURRENT_TERMS_VERSION.
 * The system automatically checks localStorage on startup in O(1) time.
 */

export const CURRENT_TERMS_VERSION = '2026.1';
export const TERMS_LAST_UPDATED = 'September 12, 2026';

export const TERMS_STORAGE_KEY = 'jobhive_terms_version';
export const TERMS_ACCEPTED_AT_KEY = 'jobhive_terms_accepted_at';

export interface TermsSection {
  id: string;
  title: string;
  content: string[];
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms & Update Policy',
    content: [
      'By installing, launching, or using JobHive ("the Software"), you agree to be bound by these Terms of Service and Privacy Policy. If you do not agree to these terms, do not install or use the Software.',
      'We may periodically update these terms to reflect new capabilities, regulatory standards, or platform changes. When terms are updated, the Software will notify you upon launch to review and confirm the updated agreement before proceeding.',
    ],
  },
  {
    id: 'nature-of-software',
    title: '2. Local-First Architecture & Data Ownership',
    content: [
      'JobHive operates entirely as a local-first desktop application. The bundled Python extraction runtime executes locally on your device (127.0.0.1) without opening ports to the public internet.',
      'All job listing data, search configurations, personal bookmarks, and session history reside solely within your local operating system directory. You retain complete ownership and custody of all data extracted through the Software.',
      'The maintainers of JobHive operate no central servers, collect no analytical profiling, and have no technical ability or desire to access your searches or stored files.',
    ],
  },
  {
    id: 'third-party-scraping',
    title: '3. Scraping & Third-Party Platforms',
    content: [
      'JobHive provides automation scripts designed to retrieve publicly accessible job postings from third-party employment boards, including LinkedIn, Indeed, Glassdoor, and Google Jobs.',
      'You acknowledge that third-party services maintain their own terms of service, acceptable use policies, and robots.txt guidelines. You are solely responsible for ensuring that your search queries, request volume, and concurrency conform to all applicable policies and regional regulations.',
      'JobHive incorporates respectful rate-limiting and delay controls by default. Disabling or circumventing rate limits is not recommended and is undertaken at your own discretion.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Permissible & Responsible Use',
    content: [
      'JobHive is provided for personal employment search assistance, market research, and educational purposes.',
      'You agree not to use the Software to: (a) engage in unlawful data harvesting or denial-of-service against third-party servers; (b) resell or commercialize aggregated raw personal contact information; or (c) violate the computer fraud or cybersecurity laws of your jurisdiction.',
    ],
  },
  {
    id: 'disclaimer-affiliation',
    title: '5. Disclaimers of Affiliation & Trademarks',
    content: [
      'JobHive is an independent open-source tool created by independent developers. It is not affiliated with, sponsored by, or endorsed by LinkedIn Corporation, Indeed Inc., Glassdoor LLC, Google LLC, or their parent companies.',
      'All company names, logos, and product trademarks referenced within the Software remain the exclusive property of their respective trademark holders. Their inclusion does not imply any official relationship, partnership, or sponsorship.',
    ],
  },
  {
    id: 'warranties-liability',
    title: '6. Disclaimer of Warranties & Limitation of Liability',
    content: [
      'The Software is provided "AS IS" and "AS AVAILABLE", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.',
      'Job listings, salary estimations, application URLs, and employer details are sourced directly from public web pages. JobHive does not verify, guarantee, or warrant the legitimacy, safety, or accuracy of any job listing found.',
    ],
  },
  {
    id: 'privacy-policy',
    title: '7. Privacy Policy',
    content: [
      'Zero Cloud Collection: JobHive transmits no personal information, search queries, IP addresses, or device identifiers to any remote telemetry or analytics service.',
      'External Link Navigation: When you choose to click an external link (such as "Apply", "View on Company Site", or "GitHub"), your default web browser opens the respective external site, which is subject to that destination’s privacy policy.',
      'Crash Diagnostics: Standard error and operational logs are stored locally in your operating system’s application logs folder and are never transmitted automatically.',
    ],
  },
  {
    id: 'license',
    title: '8. Open Source Licensing',
    content: [
      'JobHive source code is released under the permissive MIT License. You are free to inspect, audit, modify, and build the software in accordance with the license conditions.',
    ],
  },
];
