// pages/privacy.js
import LegalPage from '../components/LegalPage';
import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from '../lib/constants';

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`Privacy Policy for ${SITE_NAME} — how we handle data, cookies, and third-party ads.`}
      canonicalPath="/privacy"
    >
      <h1 style={h1}>Privacy Policy</h1>
      <p><strong>Last updated: April 2026</strong></p>
      <p>
        This Privacy Policy explains how <strong>{SITE_NAME}</strong> (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;) collects, uses, and protects information when
        you visit {SITE_URL}. By using our site, you agree to the practices described in
        this policy.
      </p>

      <h2 style={h2}>1. Information we collect</h2>
      <p>
        {SITE_NAME} does not require you to create an account, log in, or submit personal
        information to view job listings. We do not collect resumes or application data.
      </p>
      <p>Like most websites, we automatically collect limited technical data, including:</p>
      <ul style={ul}>
        <li>IP address (used only to prevent abuse and rate-limit view counts)</li>
        <li>Browser type, device type, and operating system</li>
        <li>Pages visited and time spent on each page</li>
        <li>Referrer URL (the website that directed you to us)</li>
      </ul>

      <h2 style={h2}>2. Cookies</h2>
      <p>We use cookies to improve user experience and support website functionality. These include:</p>
      <ul style={ul}>
        <li>
          <strong>Essential cookies</strong> — used to remember your preferences (such as
          cookie consent) and maintain basic site functionality
        </li>
        <li>
          <strong>Advertising cookies</strong> — used by third-party services like Google
          AdSense to display relevant advertisements
        </li>
      </ul>
      <p>
        By continuing to use our website, you consent to the use of cookies as described
        in this policy. Where required, a cookie consent banner will be displayed.
      </p>
      <p>
        You can disable cookies through your browser settings. Please note that some
        features of the website may not function properly if cookies are disabled.
      </p>

      <h2 style={h2}>3. Google AdSense &amp; third-party advertising</h2>
      <p>
        {SITE_NAME} uses Google AdSense to display advertisements. Google, as a
        third-party vendor, uses cookies (including the DoubleClick DART cookie) and
        similar technologies to serve ads based on your prior visits to this and other
        websites.
      </p>
      <p>
        Google&apos;s use of advertising cookies enables it and its partners to show
        personalised ads based on your browsing behavior.
      </p>
      <p>You can opt out of personalised advertising by visiting:</p>
      <ul style={ul}>
        <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={link}>https://www.google.com/settings/ads</a></li>
        <li><a href="https://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" style={link}>https://www.youronlinechoices.com</a></li>
        <li><a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" style={link}>https://optout.networkadvertising.org</a></li>
      </ul>
      <p>
        Google may use data collected to personalise ads in accordance with its own
        Privacy Policy.
      </p>
      <p>
        Other third-party ad networks may also display ads on our website. We do not
        control their data collection practices and recommend reviewing their respective
        privacy policies.
      </p>

      <h2 style={h2}>4. How we use your information</h2>
      <p>We use the collected data to:</p>
      <ul style={ul}>
        <li>Operate, maintain, and improve the website</li>
        <li>Prevent fraud, spam, and misuse</li>
        <li>Analyze traffic and usage trends</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>We do not sell, trade, or rent your personal data to third parties.</p>

      <h2 style={h2}>5. External links</h2>
      <p>
        Our website contains links to third-party websites, including official company
        career pages. When you click on an &quot;Apply&quot; button, you will be
        redirected to an external website.
      </p>
      <p>
        We are not responsible for the content, privacy practices, or policies of
        third-party websites. We encourage users to review the privacy policies of any
        external sites they visit.
      </p>

      <h2 style={h2}>6. Data security</h2>
      <p>
        We take reasonable measures to protect information collected through our website
        from unauthorized access, misuse, or disclosure. However, no method of
        transmission over the Internet is 100% secure.
      </p>

      <h2 style={h2}>7. Data retention</h2>
      <p>
        We retain automatically collected data only for as long as necessary to operate
        and improve the website, or as required by applicable laws.
      </p>

      <h2 style={h2}>8. Children&apos;s information</h2>
      <p>
        {SITE_NAME} is not intended for children under the age of 13. We do not knowingly
        collect personal information from children.
      </p>

      <h2 style={h2}>9. Your rights (GDPR / DPDP Act)</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul style={ul}>
        <li>Access the personal data we hold about you</li>
        <li>Request correction or deletion of your data</li>
        <li>Object to or restrict processing</li>
      </ul>
      <p>
        To exercise these rights, please contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>.
      </p>

      <h2 style={h2}>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        reflected by updating the &quot;Last updated&quot; date at the top of this page.
      </p>
      <p>
        Your continued use of the website after any changes constitutes acceptance of the
        updated policy.
      </p>

      <h2 style={h2}>11. Contact</h2>
      <p>
        If you have any questions about this Privacy Policy, you can contact us at:
        <br />
        📧 <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}

const h1 = { fontSize: 32, marginBottom: 16, color: 'var(--text)' };
const h2 = { fontSize: 20, marginTop: 28, marginBottom: 10, color: 'var(--text)', fontWeight: 700 };
const ul = { paddingLeft: 22, margin: '8px 0' };
const link = { color: 'var(--accent)', textDecoration: 'underline' };