// pages/about.js
import LegalPage from '../components/LegalPage';
import { SITE_NAME, CONTACT_EMAIL } from '../lib/constants';

export default function About() {
  return (
    <LegalPage
      title="About Us"
      description={`${SITE_NAME} is an independent job-listing aggregator that helps freshers and early-career professionals in India find legitimate openings from top employers.`}
      canonicalPath="/about"
    >
      <h1 style={h1}>About {SITE_NAME}</h1>
      <p>
        <strong>{SITE_NAME}</strong> is an independent job-listing aggregator built to help
        freshers and early-career professionals in India find legitimate openings from top
        employers — quickly and without unnecessary clutter.
      </p>

      <h2 style={h2}>What we do</h2>
      <p>
        We curate active job postings from companies like TCS, Infosys, Wipro, Accenture,
        HCL, Cognizant, Capgemini, and other leading companies. Every listing on our site
        links directly to the official company career page. We do not collect resumes,
        we do not charge applicants any fees, and we do not act as a recruiter or intermediary.
      </p>

      <h2 style={h2}>Why we exist</h2>
      <p>
        Many job seekers in India spend hours navigating multiple career portals, social
        media posts, and unofficial sources — often missing deadlines or encountering
        misleading information. {SITE_NAME} simplifies this process by providing a clean,
        fast, and mobile-friendly platform with verified application links that are
        updated regularly.
      </p>

      <h2 style={h2}>Our promise</h2>
      <ul style={ul}>
        <li>All &quot;Apply&quot; buttons redirect to official company career pages</li>
        <li>We never ask for payment, personal data, or documents</li>
        <li>Inaccurate or expired listings are removed upon verification</li>
      </ul>

      <h2 style={h2}>How we support the platform</h2>
      <p>
        {SITE_NAME} is free for job seekers. To support the platform and maintain the
        service, we display limited advertisements through Google AdSense.
      </p>

      <h2 style={h2}>Disclaimer</h2>
      <p>
        {SITE_NAME} is not affiliated with any company listed on this website. All
        trademarks, logos, and company names belong to their respective owners. We only
        share publicly available job information and redirect users to official career pages.
      </p>

      <h2 style={h2}>Accuracy Notice</h2>
      <p>
        While we strive to keep information accurate and up to date, we recommend users
        verify all details on the official company website before applying.
      </p>

      <h2 style={h2}>Contact us</h2>
      <p>
        For questions, corrections, or to report a job listing, please contact us at:
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