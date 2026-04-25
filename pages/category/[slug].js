// pages/category/[slug].js
// SEO landing pages: /category/it-jobs, /category/bpo-jobs, etc.

import CategoryLandingPage from '../../components/CategoryLandingPage';
import { getJobsByCategory } from '../../lib/supabase';
import { CATEGORY_SLUG_MAP, SITE_NAME } from '../../lib/constants';

export default function CategorySlug({ slug, label, jobs }) {
  const heading = `Latest ${label} 2026`;
  const description = `Browse all active ${label.toLowerCase()} openings — updated daily. Apply directly on the official company career page. 100% free, no signup required.`;

  return (
    <CategoryLandingPage
      title={`${label} – Latest Openings 2026`}
      heading={heading}
      description={description}
      canonicalPath={`/category/${slug}`}
      metaDescription={`Find the latest ${label.toLowerCase()} from TCS, Infosys, Wipro, and 50+ companies. ${SITE_NAME} updates listings daily.`}
      jobs={jobs}
      breadcrumbs={[
        ['Home', '/'],
        ['Categories', null],
        [label, null],
      ]}
    />
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.keys(CATEGORY_SLUG_MAP).map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const entry = CATEGORY_SLUG_MAP[params.slug];
  if (!entry) return { notFound: true };

  try {
    const jobs = await getJobsByCategory(entry.db);
    return {
      props: { slug: params.slug, label: entry.label, jobs },
      revalidate: 120,
    };
  } catch (err) {
    return {
      props: { slug: params.slug, label: entry.label, jobs: [] },
      revalidate: 60,
    };
  }
}
