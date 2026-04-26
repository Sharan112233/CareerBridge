// pages/admin/index.js — Password-protected Admin Panel
// All auth and DB mutations go through /api/admin/* routes.
// No secrets are bundled into the client JS.

import React from 'react';
import Head from 'next/head';
import styles from '../../styles/Admin.module.css';
import { useTheme } from '../../lib/theme';

const EMPTY_JOB = {
  title: '', company: '', slug: '', location: '', job_type: 'Full Time',
  experience: '', salary: '', salary_min: '', salary_max: '', salary_currency: 'INR',
  description: '', seo_title: '', eligibility: '',
  responsibilities: '', skills: '', tags: '', apply_url: '',
  last_date: '', valid_through: '', category: 'IT',
  is_fresher: false,
  logo_color: '#2563EB',
};

// ──────────────────────────────────────────────────────────────
// Toast system — small floating notifications, auto-dismiss
// Each toast: { id, type: 'success'|'error'|'info', text }
// ──────────────────────────────────────────────────────────────
const TOAST_MS = 3500;

export default function AdminPage() {
  const { theme, toggle, mounted } = useTheme();
  const [authed, setAuthed] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [pw, setPw] = React.useState('');
  const [jobs, setJobs] = React.useState([]);
  const [form, setForm] = React.useState(EMPTY_JOB);
  const [editing, setEditing] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [loginMsg, setLoginMsg] = React.useState(''); // only for the login screen
  const [tab, setTab] = React.useState('list');
  const [csv, setCsv] = React.useState('');

  // Search — two pieces of state:
  //  - adminSearchInput: what the user is typing (controlled input)
  //  - adminSearchQuery: the committed query that actually filters the table
  // The input does NOT filter live — user hits Enter or clicks Search.
  const [adminSearchInput, setAdminSearchInput] = React.useState('');
  const [adminSearchQuery, setAdminSearchQuery] = React.useState('');

  // Confirmation modal state
  const [confirmState, setConfirmState] = React.useState(null);

  // Toast stack — newest first
  const [toasts, setToasts] = React.useState([]);

  const pushToast = React.useCallback((type, text) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    // auto-remove after TOAST_MS
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, TOAST_MS);
  }, []);

  const dismissToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  React.useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.isAdmin)))
      .finally(() => setChecking(false));
  }, []);

  const load = async () => {
    const r = await fetch('/api/admin/jobs');
    if (r.status === 401) { setAuthed(false); return; }
    const d = await r.json();
    setJobs(d.jobs || []);
  };

  React.useEffect(() => { if (authed) load(); }, [authed]);

  const login = async () => {
    setLoginMsg('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const d = await r.json();
    if (r.ok) { setAuthed(true); setPw(''); }
    else { setLoginMsg(`❌ ${d.error || 'Login failed'}`); }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
  };

  const autoSlug = (title, company) =>
    `${company}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleChange = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if ((k === 'title' || k === 'company') && !editing) {
        next.slug = autoSlug(next.title, next.company);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.title || !form.company || !form.apply_url) {
      pushToast('error', 'Title, Company and Apply URL are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        responsibilities: form.responsibilities.split('\n').map((x) => x.trim()).filter(Boolean),
        skills: form.skills.split('\n').map((x) => x.trim()).filter(Boolean),
        valid_through: form.valid_through || null,
      };
      const body = editing ? { ...payload, id: editing } : payload;
      const r = await fetch('/api/admin/jobs', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      pushToast('success', editing ? 'Job updated successfully!' : 'Job posted successfully!');
      setForm(EMPTY_JOB);
      setEditing(null);
      setTab('list');
      load();
    } catch (e) {
      pushToast('error', e.message);
    }
    setSaving(false);
  };

  const handleEdit = (job) => {
    setForm({
      ...EMPTY_JOB,
      ...job,
      tags: job.tags?.join(', ') || '',
      responsibilities: job.responsibilities?.join('\n') || '',
      skills: job.skills?.join('\n') || '',
      valid_through: job.valid_through ? new Date(job.valid_through).toISOString().slice(0, 10) : '',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
    });
    setEditing(job.id);
    setTab('add');
  };

  // Delete flow:
  //   1. Click Delete → themed ConfirmModal opens
  //   2. User confirms → API hard-deletes the job from the database
  //   3. Toast shows the outcome, table refreshes
  //
  // ⚠️ Hard delete — there is no undo. The row is permanently removed.
  const handleDelete = (job) => {
    setConfirmState({
      title: 'Delete this job?',
      message: (
        <>
          <strong>{job.title}</strong> at <strong>{job.company}</strong> will be
          permanently deleted from the database and removed from the public site.
          This cannot be undone.
        </>
      ),
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const r = await fetch('/api/admin/jobs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: job.id }),
          });
          if (r.ok) {
            pushToast('success', `"${job.title}" deleted permanently.`);
            load();
          } else {
            const d = await r.json().catch(() => ({}));
            pushToast('error', d.error || 'Delete failed.');
          }
        } catch (e) {
          pushToast('error', e.message || 'Network error.');
        }
      },
    });
  };

  const handleBulkImport = async () => {
    if (!csv.trim()) { pushToast('error', 'Paste CSV content first.'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      const rowErr = (d.rowErrors || []).length;
      pushToast(
        'success',
        `Inserted ${d.inserted} jobs.${rowErr ? ` ${rowErr} rows skipped.` : ''}`,
      );
      setCsv('');
      setTab('list');
      load();
    } catch (e) {
      pushToast('error', e.message);
    }
    setSaving(false);
  };

  // Search handlers
  const runSearch = () => setAdminSearchQuery(adminSearchInput.trim());
  const clearSearch = () => {
    setAdminSearchInput('');
    setAdminSearchQuery('');
  };
  const onSearchKey = (e) => {
    if (e.key === 'Enter') runSearch();
    else if (e.key === 'Escape') clearSearch();
  };

  // Client-side filter — title / company / location (case-insensitive)
  const visibleJobs = React.useMemo(() => {
    const q = adminSearchQuery.toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      return (
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q)
      );
    });
  }, [jobs, adminSearchQuery]);

  // Reusable theme toggle
  const ThemeToggle = () => (
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
  );

  if (checking) return <div className={styles.loginWrap}><div className={styles.loginCard}>Loading...</div></div>;

  if (!authed) return (
    <div className={styles.loginWrap}>
      <Head><title>Admin – CareerBridge</title><meta name="robots" content="noindex" /></Head>
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>CareerBridge Admin</div>
        <input
          className={styles.input}
          type="password"
          placeholder="Enter admin password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
        />
        <button className={styles.btn} onClick={login}>Login →</button>
        {loginMsg && <div className={styles.msg}>{loginMsg}</div>}
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <Head><title>Admin – CareerBridge</title><meta name="robots" content="noindex" /></Head>

      <div className={styles.header}>
        <div className={styles.headerLogo}>CareerBridge Admin</div>
        <div className={styles.headerTabs}>
          <button className={`${styles.tab} ${tab==='list'?styles.tabActive:''}`} onClick={() => setTab('list')}>
            All Jobs ({jobs.length})
          </button>
          <button className={`${styles.tab} ${tab==='add'?styles.tabActive:''}`} onClick={() => { setTab('add'); setForm(EMPTY_JOB); setEditing(null); }}>
            + Add New Job
          </button>
          <button className={`${styles.tab} ${tab==='bulk'?styles.tabActive:''}`} onClick={() => setTab('bulk')}>
            Bulk CSV Import
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <a href="/" target="_blank" className={styles.viewSite}>View Site ↗</a>
          <button className={styles.viewSite} onClick={logout} style={{ border: '1px solid var(--border)', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {tab === 'list' && (
        <div className={styles.listWrap}>
          {/* Search: input + explicit Search button — no live filtering */}
          <div className={styles.adminSearchRow}>
            <div className={styles.adminSearchWrap}>
              <svg className={styles.adminSearchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                className={styles.adminSearchInput}
                placeholder="Search by title, company, or location..."
                value={adminSearchInput}
                onChange={(e) => setAdminSearchInput(e.target.value)}
                onKeyDown={onSearchKey}
                aria-label="Search jobs"
              />
              {adminSearchInput && (
                <button
                  className={styles.adminSearchClear}
                  onClick={clearSearch}
                  aria-label="Clear search"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
            <button
              className={styles.searchBtn}
              onClick={runSearch}
              type="button"
              disabled={!adminSearchInput.trim() && !adminSearchQuery}
            >
              Search
            </button>
            {adminSearchQuery && (
              <span className={styles.adminSearchCount}>
                Showing {visibleJobs.length} of {jobs.length} for &ldquo;{adminSearchQuery}&rdquo;
              </span>
            )}
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th><th>Company</th><th>Salary</th><th>Location</th><th>Slug</th><th>Views</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((j) => (
                <tr key={j.id}>
                  <td><strong>{j.title}</strong></td>
                  <td>{j.company}</td>
                  <td>{j.salary}</td>
                  <td>{j.location}</td>
                  <td><code className={styles.slug}>/{j.slug}</code></td>
                  <td>{j.views || 0}</td>
                  <td className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(j)}>Edit</button>
                    <button className={styles.delBtn} onClick={() => handleDelete(j)}>Delete</button>
                    <a className={styles.viewBtn} href={`/${j.slug}`} target="_blank">View ↗</a>
                  </td>
                </tr>
              ))}
              {visibleJobs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>
                    {jobs.length === 0
                      ? 'No jobs yet. Add your first job!'
                      : `No jobs match "${adminSearchQuery}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'add' && (
        <div className={styles.formWrap}>
          <h2 className={styles.formTitle}>{editing ? '✏️ Edit Job' : '➕ Add New Job'}</h2>
          <div className={styles.formGrid}>
            <Field label="Job Title *" value={form.title} onChange={(v) => handleChange('title', v)} placeholder="e.g. Voice Process Executive" />
            <Field label="Company Name *" value={form.company} onChange={(v) => handleChange('company', v)} placeholder="e.g. Wipro" />
            <Field label="URL Slug (auto-generated)" value={form.slug} onChange={(v) => handleChange('slug', v)} placeholder="wipro-voice-process-executive" mono />
            <Field label="Apply URL * (official company career link)" value={form.apply_url} onChange={(v) => handleChange('apply_url', v)} placeholder="https://careers.wipro.com/job/12345" full />
            <TextArea label="SEO Title (big headline on job page — leave empty to auto-generate)" value={form.seo_title} onChange={(v) => handleChange('seo_title', v)} placeholder="Wipro Hiring SW Test Development Engineer | Bangalore | Freshers Eligible | Apply Now" rows={2} />
            <Field label="Location" value={form.location} onChange={(v) => handleChange('location', v)} placeholder="Bangalore, India" />
            <Field label="Experience" value={form.experience} onChange={(v) => handleChange('experience', v)} placeholder="Fresher / 0-2 Years" />
            <Field label="Salary (display text)" value={form.salary} onChange={(v) => handleChange('salary', v)} placeholder="₹2.5 – 3.5 LPA" />
            <Field label="Salary Currency" value={form.salary_currency} onChange={(v) => handleChange('salary_currency', v)} placeholder="INR" />
            <Field label="Salary Min (number, yearly)" value={form.salary_min} onChange={(v) => handleChange('salary_min', v)} placeholder="250000" />
            <Field label="Salary Max (number, yearly)" value={form.salary_max} onChange={(v) => handleChange('salary_max', v)} placeholder="350000" />
            <Field label="Last Date (display)" value={form.last_date} onChange={(v) => handleChange('last_date', v)} placeholder="June 30, 2026" />
            <div className={styles.field}>
              <label className={styles.label}>Valid Through (date picker — for Google Jobs)</label>
              <input className={styles.input} type="date" value={form.valid_through?.slice(0,10) || ''} onChange={(e) => handleChange('valid_through', e.target.value)} />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Job Type</label>
              <select className={styles.select} value={form.job_type} onChange={(e) => handleChange('job_type', e.target.value)}>
                {['Full Time','Part Time','Contract','Internship'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                {['IT','BPO','BFSI','CORE'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.is_fresher} onChange={(e) => handleChange('is_fresher', e.target.checked)} /> Fresher Eligible
              </label>
            </div>
            <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => handleChange('tags', v)} placeholder="Java, Fresher, BPO, Voice Process" full />
            <Field label="Logo Color (hex)" value={form.logo_color} onChange={(v) => handleChange('logo_color', v)} placeholder="#2563EB" />
            <TextArea label="Job Description *" value={form.description} onChange={(v) => handleChange('description', v)} placeholder="Describe the role, company, opportunity..." rows={5} />
            <TextArea label="Eligibility Criteria" value={form.eligibility} onChange={(v) => handleChange('eligibility', v)} placeholder="B.E/B.Tech 2023-2026 passouts, 60% throughout..." rows={3} />
            <TextArea label="Responsibilities (one per line)" value={form.responsibilities} onChange={(v) => handleChange('responsibilities', v)} placeholder="Handle customer queries&#10;Meet daily targets&#10;Maintain records" rows={4} />
            <TextArea label="Required Skills (one per line)" value={form.skills} onChange={(v) => handleChange('skills', v)} placeholder="Good English communication&#10;Basic computer skills&#10;Team player" rows={4} />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setTab('list'); setEditing(null); setForm(EMPTY_JOB); }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Job' : 'Publish Job →'}
            </button>
          </div>
        </div>
      )}

      {tab === 'bulk' && (
        <div className={styles.formWrap}>
          <h2 className={styles.formTitle}>📥 Bulk CSV Import</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13, marginBottom: 12 }}>
            Paste CSV with a header row. Required columns: <code>title, company, apply_url</code>.
            Optional: <code>slug, location, job_type, experience, salary, salary_min, salary_max, salary_currency,
            description, eligibility, responsibilities, skills, tags, last_date, valid_through, category, logo_color,
            is_fresher</code>.
            Use <code>|</code> (pipe) to separate items inside <code>responsibilities</code> and <code>skills</code>.
            Duplicate slugs will be updated, not duplicated.
          </p>
          <textarea
            className={styles.textarea}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={20}
            placeholder={'title,company,apply_url,location,salary,category,is_fresher\nAssociate Engineer,TCS,https://tcs.com/careers,Bangalore,₹3.6 LPA,IT,true'}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setCsv('')}>Clear</button>
            <button className={styles.saveBtn} onClick={handleBulkImport} disabled={saving}>
              {saving ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal — replaces window.confirm() */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          danger={confirmState.danger}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      )}

      {/* Toast stack — floating, bottom-right, auto-dismissing */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, full }) {
  return (
    <div className={full ? styles.fieldFull : styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={`${styles.input} ${mono ? styles.mono : ''}`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows }) {
  return (
    <div className={styles.fieldFull}>
      <label className={styles.label}>{label}</label>
      <textarea className={styles.textarea} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    </div>
  );
}

// Themed confirmation modal — replaces window.confirm()
function ConfirmModal({ title, message, confirmText, cancelText, danger, onConfirm, onCancel }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.modalCard}>
        <div
          className={styles.modalIcon}
          style={{
            background: danger ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-soft)',
            color: danger ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          {danger ? '⚠️' : 'ℹ️'}
        </div>
        <h3 id="confirm-title" className={styles.modalTitle}>{title}</h3>
        <div className={styles.modalBody}>{message}</div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText || 'Cancel'}
          </button>
          <button
            className={styles.saveBtn}
            style={danger ? { background: 'var(--danger)' } : undefined}
            onClick={onConfirm}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Floating toast stack (bottom-right on desktop, bottom-center on mobile)
function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className={styles.toastStack} aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toastItem} ${
            t.type === 'success' ? styles.toastSuccess :
            t.type === 'error'   ? styles.toastError   :
                                   styles.toastInfo
          }`}
          role={t.type === 'error' ? 'alert' : 'status'}
        >
          <span className={styles.toastIcon}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className={styles.toastText}>{t.text}</span>
          <button
            className={styles.toastClose}
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}