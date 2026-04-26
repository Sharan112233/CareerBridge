// pages/jobs/[...slug].js
// Catch-all SEO landing page for both:
//   /jobs/[city]              e.g. /jobs/bangalore
//   /jobs/[category]/[city]   e.g. /jobs/it-jobs/bangalore
//
// Using ONE catch-all file avoids the Next.js rule that forbids different
// dynamic segment names at the same path level.

import CategoryLandingPage from '../../components/CategoryLandingPage';
import { getAllJobsListing } from '../../lib/supabase';
import {
  LOCATIONS,
  LOCATION_SLUGS,
  getLocation,
  jobMatchesLocation,
} from '../../lib/locations';
import { CATEGORY_SLUG_MAP, SITE_NAME } from '../../lib/constants';

// Minimum jobs needed to render a landing page.
// Below this, we 404 to avoid Google's "thin content" penalty.
const MIN_JOBS_THRESHOLD = 3;

export default function JobsLanding(props) {
  // Mode is decided in getStaticProps. We render two different shapes
  // through the same CategoryLandingPage component.
  if (props.mode === 'city') {
    const { locationSlug, locationLabel, jobs } = props;
    const heading = `${locationLabel} Jobs 2026 — Latest Openings`;
    const description = `Browse the latest job openings in ${locationLabel}. Updated daily — apply directly on the official company career page. 100% free, no signup required.`;
    return (
      <CategoryLandingPage
        title={`Jobs in ${locationLabel} 2026`}
        heading={heading}
        description={description}
        canonicalPath={`/jobs/${locationSlug}`}
        metaDescription={`Find the latest jobs in ${locationLabel} from TCS, Infosys, Wipro, Accenture, and 50+ companies. ${SITE_NAME} updates listings daily.`}
        jobs={jobs}
        breadcrumbs={[
          ['Home', '/'],
          ['Jobs by City', null],
          [locationLabel, null],
        ]}
      />
    );
  }

  // mode === 'category-city'
  const { categorySlug, categoryLabel, locationSlug, locationLabel, jobs } = props;
  const heading = `${categoryLabel} in ${locationLabel} — 2026`;
  const description = `Browse the latest ${categoryLabel.toLowerCase()} in ${locationLabel}. Updated daily, apply directly on the company's official career page. Free for job seekers — we never charge any fee.`;
  return (
    <CategoryLandingPage
      title={`${categoryLabel} in ${locationLabel} 2026`}
      heading={heading}
      description={description}
      canonicalPath={`/jobs/${categorySlug}/${locationSlug}`}
      metaDescription={`Find the latest ${categoryLabel.toLowerCase()} in ${locationLabel} from top companies. ${SITE_NAME} curates fresh openings daily.`}
      jobs={jobs}
      breadcrumbs={[
        ['Home', '/'],
        [categoryLabel, `/category/${categorySlug}`],
        [locationLabel, null],
      ]}
    />
  );
}

export async function getStaticPaths() {
  const paths = [];

  // 1-segment: /jobs/[city]
  for (const loc of LOCATIONS) {
    paths.push({ params: { slug: [loc.slug] } });
  }

  // 2-segment: /jobs/[category]/[city]
  for (const categorySlug of Object.keys(CATEGORY_SLUG_MAP)) {
    for (const loc of LOCATIONS) {
      paths.push({ params: { slug: [categorySlug, loc.slug] } });
    }
  }

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const segments = Array.isArray(params.slug) ? params.slug : [];

  // ─── Mode 1: /jobs/[city] ──────────────────────────────────────
  if (segments.length === 1) {
    const [locationSlug] = segments;
    if (!LOCATION_SLUGS.has(locationSlug)) return { notFound: true };

    const loc = getLocation(locationSlug);
    const allJobs = await getAllJobsListing();
    const jobs = allJobs.filter((j) => jobMatchesLocation(j, locationSlug));

    if (jobs.length < MIN_JOBS_THRESHOLD) return { notFound: true };

    return {
      props: {
        mode: 'city',
        locationSlug,
        locationLabel: loc.label,
        jobs,
      },
      revalidate: 300,
    };
  }

  // ─── Mode 2: /jobs/[category]/[city] ───────────────────────────
  if (segments.length === 2) {
    const [categorySlug, locationSlug] = segments;

    const cat = CATEGORY_SLUG_MAP[categorySlug];
    if (!cat) return { notFound: true };

    if (!LOCATION_SLUGS.has(locationSlug)) return { notFound: true };
    const loc = getLocation(locationSlug);

    const allJobs = await getAllJobsListing();
    const jobs = allJobs.filter(
      (j) => j.category === cat.db && jobMatchesLocation(j, locationSlug),
    );

    if (jobs.length < MIN_JOBS_THRESHOLD) return { notFound: true };

    return {
      props: {
        mode: 'category-city',
        categorySlug,
        categoryLabel: cat.label,
        locationSlug,
        locationLabel: loc.label,
        jobs,
      },
      revalidate: 300,
    };
  }

  // 0 or 3+ segments — invalid
  return { notFound: true };
}