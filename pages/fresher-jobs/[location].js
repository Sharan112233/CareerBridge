// pages/fresher-jobs/[location].js
// SEO landing pages targeting "fresher jobs in {city}" search queries.
// These have very high search volume in India.
//
// URL: /fresher-jobs/bangalore, /fresher-jobs/mumbai, ...

import CategoryLandingPage from '../../components/CategoryLandingPage';
import { getAllJobsListing } from '../../lib/supabase';
import { LOCATIONS, LOCATION_SLUGS, getLocation, jobMatchesLocation } from '../../lib/locations';
import { SITE_NAME } from '../../lib/constants';

const MIN_JOBS_THRESHOLD = 3;

export default function FresherJobsLocation({ slug, label, jobs }) {
  const heading = `Fresher Jobs in ${label} 2026`;
  const description = `Latest fresher / entry-level openings in ${label} for B.E / B.Tech / B.Sc / BCA / BBA / B.Com graduates. Updated daily — apply directly on the official company career page.`;

  return (
    <CategoryLandingPage
      title={`Fresher Jobs in ${label} 2026`}
      heading={heading}
      description={description}
      canonicalPath={`/fresher-jobs/${slug}`}
      metaDescription={`Find the latest fresher jobs in ${label}. Entry-level openings for graduates from top companies — ${SITE_NAME} updates listings daily.`}
      jobs={jobs}
      breadcrumbs={[
        ['Home', '/'],
        ['Fresher Jobs', '/fresher-jobs'],
        [label, null],
      ]}
    />
  );
}

export async function getStaticPaths() {
  return {
    paths: LOCATIONS.map((l) => ({ params: { location: l.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const slug = params.location;
  if (!LOCATION_SLUGS.has(slug)) return { notFound: true };
  const loc = getLocation(slug);

  const allJobs = await getAllJobsListing();
  const jobs = allJobs.filter(
    (j) => j.is_fresher === true && jobMatchesLocation(j, slug),
  );

  if (jobs.length < MIN_JOBS_THRESHOLD) return { notFound: true };

  return {
    props: { slug, label: loc.label, jobs },
    revalidate: 300,
  };
}