// pages/blog/index.js — blog index
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import { getAllPostsMeta } from '../../lib/blog';
import { SITE_NAME, SITE_URL } from '../../lib/constants';

export default function BlogIndex({ posts }) {
  return (
    <Layout>
      <Head>
        <title>{`Career Blog | ${SITE_NAME}`}</title>
        <meta name="description" content={`Interview tips, resume guides, and job-hunt advice from ${SITE_NAME}.`} />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 860, margin: '32px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Career Blog</h1>
        <p style={{ color: 'var(--text-soft)', marginBottom: 24 }}>
          Interview tips, resume guides, and job-hunt advice.
        </p>

        <AdBanner slot="leaderboard" style={{ marginBottom: 24 }} />

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
            No posts yet. Check back soon!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}
                style={{ display: 'block', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>
                  {new Date(p.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{p.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.5, margin: 0 }}>{p.description}</p>
                {p.tags?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tags.map((t) => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 8px', borderRadius: 10 }}>{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </Layout>
  );
}

export async function getStaticProps() {
  return { props: { posts: getAllPostsMeta() }, revalidate: 300 };
}