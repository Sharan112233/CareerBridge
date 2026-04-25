// pages/company/[name].js
// SEO landing pages per company: /company/tcs, /company/infosys, etc.

import CategoryLandingPage from '../../components/CategoryLandingPage';
import { getAllCompanies, getJobsByCompany } from '../../lib/supabase';
import { SITE_NAME } from '../../lib/constants';

function toSlug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function fromSlug(slug, companies) {
  const match = companies.find((c) => toSlug(c) === slug);
  return match || null;
}

export default function CompanyPage({ company, jobs }) {
  const heading = `${company} Jobs — Latest Openings 2026`;
  const description = `See all active ${company} job openings in one place. Every apply link goes to the official ${company} career page — no middleman, no sign-up, no fees.`;

  return (
    <CategoryLandingPage
      title={`${company} Jobs – Latest Openings`}
      heading={heading}
      description={description}
      canonicalPath={`/company/${toSlug(company)}`}
      metaDescription={`Latest ${company} job openings curated by ${SITE_NAME}. Apply on the official ${company} careers website — updated daily.`}
      jobs={jobs}
      breadcrumbs={[
        ['Home', '/'],
        ['Companies', null],
        [company, null],
      ]}
    />
  );
}

export async function getStaticPaths() {
  try {
    const companies = await getAllCompanies();
    return {
      paths: companies.map((c) => ({ params: { name: toSlug(c) } })),
      fallback: 'blocking',
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  try {
    const companies = await getAllCompanies();
    const company = fromSlug(params.name, companies);
    if (!company) return { notFound: true, revalidate: 60 };
    const jobs = await getJobsByCompany(company);
    return {
      props: { company, jobs },
      revalidate: 120,
    };
  } catch {
    return { notFound: true, revalidate: 60 };
  }
}
