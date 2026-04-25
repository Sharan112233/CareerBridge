// components/LegalPage.js
// Shared layout for static content pages (About, Privacy, Disclaimer, Terms, Contact).

import Head from 'next/head';
import Layout from './Layout';
import Navbar from './Navbar';
import Footer from './Footer';
import { SITE_NAME, SITE_URL } from '../lib/constants';

export default function LegalPage({ title, description, canonicalPath, children }) {
  const url = `${SITE_URL}${canonicalPath}`;
  return (
    <Layout>
      <Head>
        <title>{`${title} | ${SITE_NAME}`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
      </Head>
      <Navbar />
      <main style={styles.main}>
        <article style={styles.article}>
          {children}
        </article>
      </main>
      <Footer />
    </Layout>
  );
}

const styles = {
  main: { maxWidth: 860, margin: '32px auto', padding: '0 20px' },
  article: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '36px 32px',
    boxShadow: 'var(--card-shadow)',
    lineHeight: 1.7,
    color: 'var(--text-muted)',
    fontSize: 15,
  },
};