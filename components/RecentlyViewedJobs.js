// components/RecentlyViewedJobs.js
// Shows up to 4 most recently viewed jobs from the user's browser history
// (localStorage — no server calls, no tracking). Purely a UX + pageviews booster.

import React from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cb_recently_viewed';
const MAX_STORED = 10;   // how many we keep in storage
const MAX_SHOWN  = 4;    // how many we render in the widget

// Call this from a job detail page to record a visit.
// Safe to call on every render — it deduplicates by slug and keeps the newest entry.
export function pushRecentlyViewed(job) {
  if (typeof window === 'undefined' || !job || !job.slug) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(prev) ? prev : [];
    // Remove any existing entry for the same slug, then prepend
    const filtered = list.filter((x) => x && x.slug !== job.slug);
    const next = [
      {
        id: job.id,
        slug: job.slug,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        logo_color: job.logo_color,
        category: job.category,
        viewedAt: job.viewedAt || Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota full / private mode — fail silently */
  }
}

// Read helper (exported in case other pages want to show it too)
export function getRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default function RecentlyViewedJobs({ excludeId, excludeSlug }) {
  const [items, setItems] = React.useState([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setItems(getRecentlyViewed());
  }, []);

  // Don't render during SSR / first paint — prevents hydration mismatch
  // because localStorage content varies per browser.
  if (!mounted) return null;

  const filtered = items
    .filter((j) => j && j.slug)
    .filter((j) => (excludeId ? j.id !== excludeId : true))
    .filter((j) => (excludeSlug ? j.slug !== excludeSlug : true))
    .slice(0, MAX_SHOWN);

  if (filtered.length === 0) return null;

  return (
    <section style={styles.section} aria-label="Recently viewed jobs">
      <div style={styles.header}>
        <h2 style={styles.title}>🕘 Recently Viewed Jobs</h2>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            setItems([]);
          }}
          style={styles.clearBtn}
        >
          Clear
        </button>
      </div>

      <div style={styles.grid}>
        {filtered.map((j) => {
          const initials = (j.company || 'CO')
            .split(' ')
            .map((w) => w[0] || '')
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CO';
          const bg = j.logo_color || '#2563EB';
          return (
            <Link key={j.slug} href={`/${j.slug}`} style={styles.item}>
              <div style={{ ...styles.logo, background: bg }}>
                <span style={styles.logoText}>{initials}</span>
              </div>
              <div style={styles.itemMeta}>
                <div style={styles.company}>{j.company}</div>
                <div style={styles.itemTitle}>{j.title}</div>
                <div style={styles.itemSub}>
                  {j.location && <span>📍 {j.location}</span>}
                  {j.salary && <span style={{ marginLeft: 10, color: 'var(--success)' }}>💰 {j.salary}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  section: {
    marginTop: 40,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 20px 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  clearBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-soft)',
    fontSize: 12,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 10,
  },
  item: {
    display: 'flex',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  itemMeta: {
    minWidth: 0,
    flex: 1,
  },
  company: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-soft)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.3,
    margin: '2px 0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemSub: {
    fontSize: 11,
    color: 'var(--text-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};