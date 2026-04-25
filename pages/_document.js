// pages/_document.js — custom document for root-level tags
// Gives us:
//   - <html lang="en">  (fixes the Lighthouse a11y flag)
//   - preconnect hints for AdSense domains (shaves ~100–200ms off ad requests)
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to ad-serving domains so the handshake is already done
            by the time the ad script fires. Safe even when AdSense is disabled. */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}