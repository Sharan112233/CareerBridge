// components/Navbar.js
import React from 'react';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { useTheme } from '../lib/theme';

export default function Navbar({ search = '', onSearch }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { theme, toggle, mounted } = useTheme();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>Career</span>
          <span className={styles.logoAccent}>Bridge</span>
          <span className={styles.logoDot}>.com</span>
        </Link>

        {onSearch && (
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search company, role, location..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
        )}

        <div className={styles.links}>
          <Link href="/category/it-jobs" className={styles.link}>IT Jobs</Link>
          <Link href="/category/bpo-jobs" className={styles.link}>BPO Jobs</Link>
          <Link href="/fresher-jobs" className={styles.link}>Freshers</Link>
          <Link href="/blog" className={styles.link}>Blog</Link>
        </div>

        <button
          className={styles.themeBtn}
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {mounted && theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <button className={styles.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
         {[
  ['IT Jobs', '/category/it-jobs'],
  ['BPO Jobs', '/category/bpo-jobs'],
  ['Freshers', '/fresher-jobs'],
  ['Blog', '/blog'],
].map(([label, href]) => (
            <Link key={label} href={href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}