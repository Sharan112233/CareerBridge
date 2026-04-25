// components/ShareButtons.js
import React from 'react';
import styles from '../styles/JobDetail.module.css';

export default function ShareButtons({ url, title, company, location, salary }) {
  const [copied, setCopied] = React.useState(false);

  const text = `🔥 ${title} at ${company}\n📍 ${location}\n💰 ${salary}\n\nApply: ${url}`;

  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} at ${company} — ${salary}`)}&url=${encodeURIComponent(url)}`,
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

  return (
    <div className={styles.shareBar}>
      <button className={styles.shareIcon} onClick={open(links.whatsapp)} title="Share on WhatsApp" style={{ background: '#25D366' }} aria-label="Share on WhatsApp">WA</button>
      <button className={styles.shareIcon} onClick={open(links.linkedin)} title="Share on LinkedIn" style={{ background: '#0A66C2' }} aria-label="Share on LinkedIn">in</button>
      <button className={styles.shareIcon} onClick={open(links.twitter)} title="Share on X" style={{ background: '#000' }} aria-label="Share on X">𝕏</button>
      <button className={styles.shareIcon} onClick={open(links.telegram)} title="Share on Telegram" style={{ background: '#0088CC' }} aria-label="Share on Telegram">TG</button>
      <button className={styles.shareIcon} onClick={copy} title="Copy link" style={{ background: copied ? 'var(--success)' : 'var(--text-soft)' }} aria-label="Copy link">
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  );
}