// pages/blog/[slug].js — blog post detail with Article JSON-LD
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import { getAllPostSlugs, getPostBySlug, getAllPostsMeta } from '../../lib/blog';
import { SITE_NAME, SITE_URL } from '../../lib/constants';

export default function BlogPost({ post, related }) {
  // notFound from getStaticProps means Next renders pages/404.js automatically;
  // this guard is just for safety during fallback states.
  if (!post) {
    return (
      <Layout>
        <Navbar />
        <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, color: 'var(--text)' }}>Post not found</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 8 }}>
            The article you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/blog" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Blog</Link>
        </main>
        <Footer />
      </Layout>
    );
  }
  const url = `${SITE_URL}/blog/${post.slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: url,
  };

  return (
    <Layout>
      <Head>
        <title>{`${post.title} | ${SITE_NAME}`}</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px' }}>
        <nav style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 14 }}>
          <Link href="/" style={{ color: 'var(--accent)' }}>Home</Link> › <Link href="/blog" style={{ color: 'var(--accent)' }}>Blog</Link> › <span>{post.title}</span>
        </nav>

        <article style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>
            {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: 12 }}>{post.title}</h1>
          <p style={{ fontSize: 16, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 24 }}>{post.description}</p>

          <AdBanner slot="large" style={{ margin: '20px 0' }} />

          <div
            style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.75 }}
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />

          <AdBanner slot="rectangle" style={{ margin: '28px 0 0' }} />
        </article>

        {related.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Related reads</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}
                  style={{ display: 'block', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>{p.description}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      <style jsx global>{`
        .blog-content h2 { font-size: 22px; font-weight: 700; margin: 28px 0 12px; color: var(--text); }
        .blog-content h3 { font-size: 18px; font-weight: 700; margin: 20px 0 10px; color: var(--text); }
        .blog-content p { margin-bottom: 14px; }
        .blog-content ul, .blog-content ol { margin: 12px 0 16px 22px; }
        .blog-content li { margin-bottom: 6px; }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content code { background: var(--bg-muted); padding: 2px 6px; border-radius: 4px; font-size: 14px; }
        .blog-content blockquote { border-left: 3px solid var(--accent); padding-left: 14px; margin: 16px 0; color: var(--text-soft); font-style: italic; }
      `}</style>
    </Layout>
  );
}

export async function getStaticPaths() {
  return {
    paths: getAllPostSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { notFound: true };
  const all = getAllPostsMeta();
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 3);
  return { props: { post, related }, revalidate: 300 };
}