// components/ShareButtons.js
import React from 'react';
import styles from '../styles/JobDetail.module.css';

export default function ShareButtons({ url, title, company, location, salary }) {
  const [copied, setCopied] = React.useState(false);

  const text = `🔥 ${title} at ${company}\n📍 ${location}\n💰 ${salary}\n\nApply: ${url}`;

  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title} at ${company}`)}`,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const open = (href) => () => window.open(href, '_blank', 'noopener,noreferrer');

  // Inline SVG link icon — renders identically across light/dark modes,
  // unlike the 🔗 emoji which varies wildly per platform and was nearly
  // invisible on dark themes.
  const LinkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );

  return (
    <div className={styles.shareBar}>
      <button
        className={styles.shareIcon}
        onClick={open(links.whatsapp)}
        title="Share on WhatsApp"
        style={{ background: '#25D366' }}
        aria-label="Share on WhatsApp"
      >
        WA
      </button>
      <button
        className={styles.shareIcon}
        onClick={open(links.linkedin)}
        title="Share on LinkedIn"
        style={{ background: '#0A66C2' }}
        aria-label="Share on LinkedIn"
      >
        in
      </button>
      <button
        className={styles.shareIcon}
        onClick={open(links.telegram)}
        title="Share on Telegram"
        style={{ background: '#0088CC' }}
        aria-label="Share on Telegram"
      >
        TG
      </button>
      <button
        className={styles.shareIcon}
        onClick={copy}
        title={copied ? 'Copied!' : 'Copy link'}
        // ⬇ Use the accent color (visible in BOTH light and dark themes)
        //   instead of the old --text-soft which was barely visible on the
        //   dark-mode sidebar card. Switches to green on success.
        style={{ background: copied ? 'var(--success)' : 'var(--accent)', color: '#fff' }}
        aria-label="Copy link"
      >
        {copied ? '✓' : <LinkIcon />}
      </button>
    </div>
  );
}