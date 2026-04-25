// components/CookieBanner.js
//
// GDPR / ePrivacy compliant cookie consent banner.
//
// Stores user choice in cookie `cb_consent`:
//   "all"       → personalized ads + analytics (full tracking)
//   "essential" → non-personalized ads only (contextual, no tracking cookies)
//
// In both cases ads ARE shown — just with different targeting modes — so
// site revenue isn't lost when users reject. AdSense itself supports this
// via the `npa: 1` (non-personalized ads) signal.
//
// Dispatches a 'cb-consent-changed' event so AdSense loader can react
// in the same tab without a page reload.

import React from 'react';

const CONSENT_COOKIE = 'cb_consent';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Read current consent value from document.cookie.
export function getConsent() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const v = match.split('=')[1];
  return v === 'all' || v === 'essential' ? v : null;
}

function setConsent(value) {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  try {
    window.dispatchEvent(new CustomEvent('cb-consent-changed', { detail: value }));
  } catch {}
}

export default function CookieBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!getConsent()) setVisible(true);
  }, []);

  const acceptAll = () => {
    setConsent('all');
    setVisible(false);
  };

  const rejectNonEssential = () => {
    setConsent('essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.bar} role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div style={styles.inner}>
        <div style={styles.text}>
          <strong style={styles.title}>We value your privacy</strong>
          <span style={styles.body}>
            We use essential cookies to make this site work. With your consent, we&rsquo;d
            also like to use cookies for personalized ads and analytics. If you decline,
            we&rsquo;ll show non-personalized ads (based on the page you&rsquo;re viewing,
            not your history).
            {' '}
            <a href="/privacy" style={styles.link}>Read our privacy policy</a>.
          </span>
        </div>

        <div style={styles.btnGroup}>
          {/* Reject and Accept must be equally prominent under EU guidance. */}
          <button
            style={styles.btnGhost}
            onClick={rejectNonEssential}
            type="button"
          >
            Reject non-essential
          </button>
          <button
            style={styles.btnPrimary}
            onClick={acceptAll}
            type="button"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999,
    background: '#111827', color: '#F9FAFB', padding: '16px',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 20,
    alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
  },
  text: { display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 360px', minWidth: 0 },
  title: { fontSize: 14, fontWeight: 700 },
  body: { fontSize: 13, lineHeight: 1.55, color: '#E5E7EB' },
  link: { color: '#93C5FD', textDecoration: 'underline' },
  btnGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnGhost: {
    background: 'transparent', color: '#F9FAFB', border: '1.5px solid #4B5563',
    padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
  btnPrimary: {
    background: '#2563EB', color: '#fff', border: 'none',
    padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
};