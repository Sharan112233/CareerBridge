// pages/fresher-jobs.js
// SEO landing page: /fresher-jobs

import CategoryLandingPage from '../components/CategoryLandingPage';
import { getFresherJobs } from '../lib/supabase';
import { SITE_NAME } from '../lib/constants';

export default function FresherJobs({ jobs }) {
  return (
    <CategoryLandingPage
      title="Fresher Jobs 2026 – Latest Openings for Freshers"
      heading="Fresher Jobs 2026"
      description="Openings for fresh graduates — 0 to 2 years of experience — from TCS, Infosys, Wipro, Accenture, and more. Updated daily. Apply on the official company page."
      canonicalPath="/fresher-jobs"
      metaDescription={`${SITE_NAME} lists the latest fresher job openings 2026 for B.E/B.Tech/BCA/MCA graduates from top Indian IT, BPO, and banking companies. Apply directly, 100% free.`}
      jobs={jobs}
      breadcrumbs={[
        ['Home', '/'],
        ['Fresher Jobs', null],
      ]}
    />
  );
}

export async function getStaticProps() {
  try {
    const jobs = await getFresherJobs();
    return { props: { jobs }, revalidate: 120 };
  } catch {
    return { props: { jobs: [] }, revalidate: 60 };
  }
}
