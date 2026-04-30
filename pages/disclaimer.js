// pages/disclaimer.js
import LegalPage from '../components/LegalPage';
import { SITE_NAME, CONTACT_EMAIL } from '../lib/constants';

export default function Disclaimer() {
  return (
    <LegalPage
      title="Disclaimer"
      description={`Disclaimer for ${SITE_NAME} — we are an independent job listing aggregator, not an employer or recruiter.`}
      canonicalPath="/disclaimer"
    >
      <h1 style={h1}>Disclaimer</h1>
      <p><strong>Last updated: April 2026</strong></p>

      <h2 style={h2}>We are not an employer or recruiter</h2>
      <p>
        {SITE_NAME} is an independent job-listing aggregator. We are not affiliated with,
        endorsed by, or a partner of any of the companies listed on this site (including
        TCS, Infosys, Wipro, Accenture, HCL, Cognizant, Capgemini, and others).
      </p>
      <p>
        All company names, logos, and trademarks are the property of their respective
        owners and are used strictly for identification purposes.
      </p>
      <p>
        We do not hire, interview, shortlist, or employ candidates. We do not conduct
        recruitment processes, collect resumes, or influence hiring decisions in any way.
      </p>
      <p>
        All &quot;Apply&quot; buttons redirect users to the official company career pages,
        where the actual recruitment process takes place.
      </p>

      <h2 style={h2}>Accuracy of information</h2>
      <p>
        We strive to keep job listings accurate, updated, and verified. However, job
        details such as salary, eligibility, and deadlines may change without notice.
      </p>
      <p>
        We recommend that users always verify information on the official company website
        before applying.
      </p>
      <p>
        {SITE_NAME} makes no warranties regarding the accuracy, completeness, or
        reliability of any job listing.
      </p>

      <h2 style={h2}>No guarantee of employment</h2>
      <p>
        Listing a job on {SITE_NAME} does not guarantee selection, shortlisting, or
        employment. Hiring decisions are made entirely by the respective companies.
      </p>
      <p>
        {SITE_NAME} does not influence or participate in any stage of the recruitment
        process.
      </p>

      <h2 style={h2}>Beware of fraud</h2>
      <p>Legitimate employers do not ask for payment during the hiring process.</p>
      <p>If anyone asks you for money or sensitive information claiming to represent a company:</p>
      <ul style={ul}>
        <li>Do not make any payments</li>
        <li>Do not share personal, banking, or OTP details</li>
        <li>Report the incident to the company and local cybercrime authorities</li>
        <li>Inform us at <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a></li>
      </ul>

      <h2 style={h2}>Third-party links</h2>
      <p>
        Our website contains links to third-party websites, including company career pages
        and advertisements.
      </p>
      <p>
        We do not control or take responsibility for the content, accuracy, or practices
        of these external websites. We encourage users to review their policies before
        interacting with them.
      </p>

      <h2 style={h2}>Advertising</h2>
      <p>
        {SITE_NAME} displays advertisements through Google AdSense and other advertising
        partners.
      </p>
      <p>
        The presence of advertisements does not imply endorsement. We do not control the
        specific ads shown to users.
      </p>



      <h2 style={h2}>Trademark Notice</h2>
      <p>
        {SITE_NAME} All company names, logos, and trademarks displayed on CareerBridge are the property of their respective owners. CareerBridge displays these marks only for the purpose of identifying job opportunities posted by these companies. Use of these marks does not imply any endorsement, sponsorship, or affiliation between CareerBridge and the trademark holders. If you are a trademark owner and wish to have your logo removed, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>

      </p>
         


      <h2 style={h2}>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} and its operators are not
        liable for any direct, indirect, incidental, or consequential damages arising from:
      </p>
      <ul style={ul}>
        <li>Use of this website</li>
        <li>Reliance on job listings</li>
        <li>Interaction with third-party websites</li>
      </ul>
      <p>Your use of this website is at your own discretion and risk.</p>

      <h2 style={h2}>Governing law</h2>
      <p>
        This disclaimer shall be governed by and interpreted in accordance with the laws
        of India.
      </p>

      <h2 style={h2}>Reporting issues</h2>
      <p>
        If you find incorrect, expired, or suspicious job listings, please contact us at:
        <br />
        📧 <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>
      </p>
      <p>We aim to review reports within 48 hours and take appropriate action.</p>
    </LegalPage>
  );
}

const h1 = { fontSize: 32, marginBottom: 16, color: 'var(--text)' };
const h2 = { fontSize: 20, marginTop: 28, marginBottom: 10, color: 'var(--text)', fontWeight: 700 };
const ul = { paddingLeft: 22, margin: '8px 0' };
const link = { color: 'var(--accent)', textDecoration: 'underline' };