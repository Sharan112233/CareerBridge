// components/AdBanner.js
//
// Lazy-loads ads — only pushes to AdSense when:
//   - User has made a consent choice (any choice)
//   - Banner is within 200px of viewport
//   - Browser is idle
//
// Both "all" and "essential" consent states show ads:
//   - "all"       → personalized ads (full revenue)
//   - "essential" → non-personalized / contextual ads (~60-80% revenue)
// The npa (non-personalized ads) flag is set at the AdSense script level
// in pages/_app.js, so we don't need to differentiate per-slot here.

import React from 'react';
import { getConsent } from './CookieBanner';

export default function AdBanner({ slot = 'leaderboard', style: extraStyle = {} }) {
  const containerRef = React.useRef(null);
  const pushed = React.useRef(false);
  const [visible, setVisible] = React.useState(false);
  const [consent, setConsent] = React.useState(null);

  const slots = {
    leaderboard: { height: 90,  adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD, format: 'horizontal' },
    mobile:      { height: 60,  adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE,      format: 'auto' },
    rectangle:   { height: 250, adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE,   format: 'rectangle' },
    large:       { height: 100, adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LARGE,       format: 'auto' },
  };
  const cfg = slots[slot] || slots.leaderboard;
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  const hasRealAd =
    publisherId &&
    publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX' &&
    cfg.adSlot &&
    cfg.adSlot !== 'XXXXXXXXXX';

  // Track consent — re-evaluate when it changes
  React.useEffect(() => {
    setConsent(getConsent());
    const onChange = (e) => setConsent(e.detail);
    window.addEventListener('cb-consent-changed', onChange);
    return () => window.removeEventListener('cb-consent-changed', onChange);
  }, []);

  // Wait for ANY consent decision before loading. We don't differentiate
  // between "all" and "essential" here — both show ads, just with different
  // npa flag values (handled in _app.js).
  const consentReady = consent !== null;

  React.useEffect(() => {
    if (!hasRealAd || !consentReady || !containerRef.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
          ric(() => setVisible(true));
          io.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, [hasRealAd, consentReady]);

  React.useEffect(() => {
    if (!visible || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_e) {}
  }, [visible]);

  // No publisher ID configured at all → render nothing.
  if (!hasRealAd) return null;

  // Reserve the height up front so the ad slot doesn't cause layout shift
  // (CLS stays at 0). Empty placeholder while waiting for consent.
  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: cfg.height,
        overflow: 'hidden',
        contain: 'layout',
        ...extraStyle,
      }}
    >
      {visible && consentReady && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: cfg.height }}
          data-ad-client={publisherId}
          data-ad-slot={cfg.adSlot}
          data-ad-format={cfg.format}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}