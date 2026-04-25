// pages/contact.js
import LegalPage from '../components/LegalPage';
import { SITE_NAME, CONTACT_EMAIL } from '../lib/constants';

export default function Contact() {
  return (
    <LegalPage
      title="Contact Us"
      description={`Get in touch with the ${SITE_NAME} team.`}
      canonicalPath="/contact"
    >
      <h1 style={h1}>Contact Us</h1>
      <p>
        We&apos;re a small team — you&apos;ll reach a real person, not a ticketing bot.
        Here&apos;s how to get in touch:
      </p>

      <h2 style={h2}>Email</h2>
      <p>General enquiries, corrections, or to report a fraudulent listing:</p>
      <p style={{ fontSize: 18, marginTop: 8 }}>
        📧 <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>
      </p>

      <h2 style={h2}>We usually reply within</h2>
      <ul style={ul}>
        <li><strong>Fraud reports</strong> — within 24 hours (we remove the listing immediately on verification)</li>
        <li><strong>Corrections / updates</strong> — 1–2 business days</li>
        <li><strong>General questions</strong> — 2–4 business days</li>
      </ul>

      <h2 style={h2}>Please don&apos;t email us about</h2>
      <ul style={ul}>
        <li>Application status for a specific job — {SITE_NAME} is not the recruiter. Contact the company directly.</li>
        <li>Interview prep or career counselling — we&apos;re a listing site, not a coaching service.</li>
        <li>Paid promotion of jobs — we don&apos;t sell listings.</li>
      </ul>

      <h2 style={h2}>Social</h2>
      <p>
        We post new listings on our{' '}
        <a href={process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '#'} target="_blank" rel="noopener noreferrer" style={link}>
          WhatsApp Channel
        </a>{' '}
        and{' '}
        <a href={process.env.NEXT_PUBLIC_TELEGRAM_URL || '#'} target="_blank" rel="noopener noreferrer" style={link}>
          Telegram
        </a>
        . DMs on social channels aren&apos;t monitored — for anything that needs a reply, please email.
      </p>
    </LegalPage>
  );
}

const h1 = { fontSize: 32, marginBottom: 16, color: 'var(--text)' };
const h2 = { fontSize: 20, marginTop: 28, marginBottom: 10, color: 'var(--text)', fontWeight: 700 };
const ul = { paddingLeft: 22, margin: '8px 0' };
const link = { color: 'var(--accent)', textDecoration: 'underline' };