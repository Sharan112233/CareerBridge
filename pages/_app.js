// pages/_app.js
import '../styles/globals.css';
import React from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { DM_Sans } from 'next/font/google';
import CookieBanner, { getConsent } from '../components/CookieBanner';
import { ThemeProvider } from '../lib/theme';
import { SITE_NAME, SITE_URL } from '../lib/constants';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-dm-sans',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    'CareerBridge curates the latest job openings from top companies and links directly to official career pages. Free for job seekers, no fees, no resume submission.',
  sameAs: [],
};

const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminPath = router.pathname.startsWith('/admin');
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const hasRealPubId = pubId && pubId !== 'ca-pub-XXXXXXXXXXXXXXXX';

  // Track consent in state so the npa flag updates if user changes choice.
  // null = not yet decided (banner showing), 'all' = personalized, 'essential' = non-personalized.
  const [consent, setConsent] = React.useState(null);

  React.useEffect(() => {
    setConsent(getConsent());
    const onChange = (e) => setConsent(e.detail);
    window.addEventListener('cb-consent-changed', onChange);
    return () => window.removeEventListener('cb-consent-changed', onChange);
  }, []);

  // Load AdSense as long as we have a real publisher ID and we're not in admin.
  // The npa flag (set in the inline script below) decides whether ads are
  // personalized or contextual.
  //
  // We deliberately wait until consent has been resolved (banner shown +
  // user clicked something) before loading the ad script, so the very first
  // pageview doesn't fire personalized ads to a user who's about to reject.
  const loadAdSense = !isAdminPath && hasRealPubId && consent !== null;

  // npa = "non-personalized ads". 1 = non-personalized, 0 = personalized.
  const npaFlag = consent === 'all' ? 0 : 1;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
        />
      </Head>

      {/* Inline script runs before hydration — prevents flash of wrong theme */}
      <Script id="theme-init" strategy="beforeInteractive">{`
        try {
          var t = localStorage.getItem('cb_theme');
          if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', t);
        } catch(e) {}
      `}</Script>

      {loadAdSense && (
        <>
          {/*
             AdSense reads window.adsbygoogle.requestNonPersonalizedAds at the
             time push() is called. Setting it here, BEFORE the AdSense script
             loads, ensures every ad slot on the page picks up the right mode.

             Source: https://support.google.com/adsense/answer/9007336
          */}
          <Script
            id="adsbygoogle-config"
            strategy="lazyOnload"
            // Run BEFORE the main adsbygoogle.js so the queue exists with
            // the npa flag set when ad slots push themselves.
            dangerouslySetInnerHTML={{
              __html: `
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.requestNonPersonalizedAds = ${npaFlag};
              `,
            }}
          />
          <Script
            id="adsbygoogle-init"
            strategy="lazyOnload"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
          />
        </>
      )}

      <ThemeProvider>
        <div className={dmSans.className} style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          <Component {...pageProps} />
          {!isAdminPath && <CookieBanner />}
        </div>
      </ThemeProvider>
    </>
  );
}