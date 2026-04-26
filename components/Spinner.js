// components/Spinner.js
//
// Small, lightweight loading spinner. Pure CSS, no SVG library, no GIFs.
// Works on mobile, respects prefers-reduced-motion, themed via CSS vars.
//
// Three preset sizes: small (16px), medium (24px), large (40px).
// Optional `label` shows below the spinner — useful for "Loading..." UX.
// Optional `inline` renders a horizontal layout (icon + text on same line).
//
// Usage examples:
//   <Spinner />                              ← medium centered
//   <Spinner size="small" inline label="Saving..." />
//   <Spinner size="large" label="Loading page 2…" />

import React from 'react';
import styles from '../styles/Spinner.module.css';

const SIZE_PX = { small: 16, medium: 24, large: 40 };

export default function Spinner({
  size = 'medium',
  label,
  inline = false,
  className = '',
  style,
}) {
  const px = SIZE_PX[size] || SIZE_PX.medium;

  return (
    <div
      className={`${styles.wrap} ${inline ? styles.inline : styles.stack} ${className}`}
      role="status"
      aria-live="polite"
      style={style}
    >
      <span
        className={styles.spinner}
        style={{
          width: px,
          height: px,
          // Border thickness scales with size, with a sensible minimum
          borderWidth: Math.max(2, Math.round(px / 10)),
        }}
        aria-hidden="true"
      />
      {label && <span className={styles.label}>{label}</span>}
      {!label && <span className={styles.srOnly}>Loading</span>}
    </div>
  );
}