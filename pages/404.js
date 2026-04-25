// pages/404.js
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import { getAllJobs } from '../lib/supabase';
import { SITE_NAME } from '../lib/constants';

export default function NotFound({ popularJobs }) {
  return (
    <Layout>
      <Head>
        <title>{`Page Not Found | ${SITE_NAME}`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: 28, marginTop: 12, color: 'var(--text)' }}>Page not found</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 8, fontSize: 15 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={btn}>← Back to Home</Link>
            <Link href="/fresher-jobs" style={btnGhost}>Browse Fresher Jobs</Link>
            <Link href="/category/it-jobs" style={btnGhost}>Browse IT Jobs</Link>
          </div>
        </div>

        {popularJobs?.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              Meanwhile, check out these jobs
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {popularJobs.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </Layout>
  );
}

const btn = { background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 };
const btnGhost = { background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1.5px solid var(--accent)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 };

export async function getStaticProps() {
  try {
    const all = await getAllJobs();
    return { props: { popularJobs: all.slice(0, 6) }, revalidate: 300 };
  } catch {
    return { props: { popularJobs: [] }, revalidate: 60 };
  }
}