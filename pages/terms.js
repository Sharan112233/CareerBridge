// pages/terms.js
import LegalPage from '../components/LegalPage';
import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from '../lib/constants';

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      description={`Terms of Use for ${SITE_NAME}.`}
      canonicalPath="/terms"
    >
      <h1 style={h1}>Terms of Use</h1>
      <p><strong>Last updated: April 2026</strong></p>
      <p>
        By accessing {SITE_URL} (&quot;<strong>{SITE_NAME}</strong>&quot;, &quot;we&quot;,
        &quot;our&quot;), you agree to be bound by these Terms of Use. If you do not
        agree, please do not use the website.
      </p>

      <h2 style={h2}>1. Nature of the service</h2>
      <p>
        {SITE_NAME} is an independent job-listing aggregator. We publish information about
        job openings at third-party companies and provide links to their official career
        pages.
      </p>
      <p>
        We are not an employer, recruiter, or staffing agency. For more details, please
        refer to our <a href="/disclaimer" style={link}>Disclaimer</a>.
      </p>

      <h2 style={h2}>2. Eligibility</h2>
      <p>
        You must be at least 13 years old to use this website. By using {SITE_NAME}, you
        confirm that you meet this requirement.
      </p>

      <h2 style={h2}>3. No account required</h2>
      <p>
        {SITE_NAME} is free to browse and does not require user registration. Users are
        responsible for their interactions with any third-party websites accessed through
        our platform.
      </p>

      <h2 style={h2}>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul style={ul}>
        <li>Scrape, copy, or reproduce content without permission</li>
        <li>Attempt to reverse-engineer, disrupt, or overload our systems</li>
        <li>Use automated tools to inflate traffic or ad impressions</li>
        <li>Attempt unauthorized access to our infrastructure</li>
        <li>Distribute spam, malware, or harmful content</li>
        <li>Impersonate {SITE_NAME} or misrepresent affiliation</li>
        <li>Use the website for any unlawful purpose</li>
      </ul>

      <h2 style={h2}>5. Intellectual property</h2>
      <p>
        All original content, including website design, layout, and text, is owned by
        {' '}{SITE_NAME}.
      </p>
      <p>
        Company names, trademarks, and logos belong to their respective owners and are
        used for identification purposes only.
      </p>

      <h2 style={h2}>6. Disclaimers &amp; limitation of liability</h2>
      <p>The website is provided &quot;as is&quot; without warranties of any kind.</p>
      <p>We do not guarantee:</p>
      <ul style={ul}>
        <li>Accuracy or completeness of job listings</li>
        <li>Availability or uninterrupted operation of the website</li>
        <li>Any specific outcome from job applications</li>
      </ul>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} shall not be liable for any
        direct, indirect, or consequential damages resulting from use of the website.
      </p>

      <h2 style={h2}>7. Advertising</h2>
      <p>
        We display advertisements through Google AdSense and other advertising networks
        to keep the platform free. For more details, please refer to our{' '}
        <a href="/privacy" style={link}>Privacy Policy</a>.
      </p>

      <h2 style={h2}>8. Termination</h2>
      <p>
        We reserve the right to restrict or terminate access to the website at any time,
        without notice, for violations of these Terms.
      </p>

      <h2 style={h2}>9. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The &quot;Last updated&quot; date
        reflects the most recent version. Continued use of the website indicates
        acceptance of any changes.
      </p>

      <h2 style={h2}>10. Governing law</h2>
      <p>
        These Terms shall be governed by the laws of India. Any disputes shall be subject
        to the jurisdiction of the courts at the operator&apos;s registered location.
      </p>

      <h2 style={h2}>11. Contact</h2>
      <p>
        For questions regarding these Terms, please contact:
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