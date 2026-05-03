// pages/blog/index.js — blog index
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import { getAllPostsMeta } from '../../lib/blog';
import { SITE_NAME, SITE_URL } from '../../lib/constants';
import styles from '../../styles/Blog.module.css';

export default function BlogIndex({ posts }) {
  return (
    <Layout>
      <Head>
        <title>{`Career Blog | ${SITE_NAME}`}</title>
        <meta name="description" content={`Interview tips, resume guides, and job-hunt advice from ${SITE_NAME}.`} />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
      </Head>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Career Blog</h1>
          <p className={styles.subtitle}>
            Interview tips, resume guides, and job-hunt advice.
          </p>
        </div>

        <AdBanner slot="leaderboard" style={{ marginBottom: 32 }} />

        {posts.length === 0 ? (
          <div className={styles.empty}>
            No posts yet. Check back soon!
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <time className={styles.date}>
                    {new Date(p.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  {p.tags?.length > 0 && (
                    <div className={styles.tags}>
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} className={styles.tag}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <h2 className={styles.cardTitle}>{p.title}</h2>
                <p className={styles.cardDesc}>{p.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.readMore}>
                    Read article
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
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