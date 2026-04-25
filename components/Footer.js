// components/Footer.js
import Link from 'next/link';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>Career</span>
            <span className={styles.logoAccent}>Bridge</span>
            <span className={styles.logoDot}>.com</span>
          </Link>
          <p className={styles.tagline}>
            Latest job openings from top companies — updated daily. We redirect you directly to official company career pages.
          </p>
          <div className={styles.social}>
            {[
              { name:'WhatsApp', bg:'#25D366', href: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '#', letter:'W' },
              { name:'Telegram', bg:'#0088CC', href: process.env.NEXT_PUBLIC_TELEGRAM_URL || '#', letter:'T' },
              { name:'Instagram', bg:'#E1306C', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#', letter:'I' },
            ].map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                 style={{ background: s.bg }}
                 className={styles.socialBtn}
                 title={s.name}>
                {s.letter}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Job Categories</div>
          {[
  ['IT / Software',        '/category/it-jobs'],
  ['BPO / Voice Process',  '/category/bpo-jobs'],
  ['Banking & Finance',    '/category/bfsi-jobs'],
  ['Fresher Jobs',         '/fresher-jobs'],
].map(([label, href]) => (
            <Link key={label} href={href} className={styles.colLink}>{label}</Link>
          ))}
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Top Companies</div>
          {[
            ['TCS Jobs',       '/company/tcs'],
            ['Infosys Jobs',   '/company/infosys'],
            ['Wipro Jobs',     '/company/wipro'],
            ['Accenture Jobs', '/company/accenture'],
            ['HCL Jobs',       '/company/hcl'],
            ['Cognizant Jobs', '/company/cognizant'],
          ].map(([label, href]) => (
            <Link key={label} href={href} className={styles.colLink}>{label}</Link>
          ))}
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Quick Links</div>
          {[
            { label:'About Us',       href:'/about' },
            { label:'Privacy Policy', href:'/privacy' },
            { label:'Disclaimer',     href:'/disclaimer' },
            { label:'Terms of Use',   href:'/terms' },
            { label:'Contact Us',     href:'/contact' },
            { label:'Sitemap',        href:'/sitemap.xml' },
          ].map((l) => (
            <Link key={l.label} href={l.href} className={styles.colLink}>{l.label}</Link>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {new Date().getFullYear()} CareerBridge.com — All rights reserved.</span>
          <span className={styles.disclaimer}>
            We do not collect applications. All apply links redirect to official company websites.
          </span>
        </div>
      </div>
    </footer>
  );
}
