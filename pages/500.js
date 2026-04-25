// pages/500.js
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SITE_NAME } from '../lib/constants';

export default function ServerError() {
  return (
    <Layout>
      <Head>
        <title>{`Something went wrong | ${SITE_NAME}`}</title>
        
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>500</div>
        <h1 style={{ fontSize: 28, marginTop: 12, color: 'var(--text)' }}>Something went wrong on our end</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
          We&apos;re working to fix it. Please try again in a few seconds, or head back to the homepage.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            ← Back to Home
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1.5px solid var(--accent)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}