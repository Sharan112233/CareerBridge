-- ============================================================
-- CareerBridge — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  company         text NOT NULL,
  slug            text UNIQUE NOT NULL,
  location        text NOT NULL DEFAULT '',
  job_type        text NOT NULL DEFAULT 'Full Time',
  experience      text NOT NULL DEFAULT '',
  salary          text NOT NULL DEFAULT '',           -- display string e.g. "₹2.5 – 3.5 LPA"
  salary_min      numeric DEFAULT NULL,                -- for JSON-LD (numeric, e.g. 250000)
  salary_max      numeric DEFAULT NULL,                -- for JSON-LD (numeric, e.g. 350000)
  salary_currency text DEFAULT 'INR',
  description     text NOT NULL DEFAULT '',
  seo_title       text DEFAULT '', 
  eligibility     text DEFAULT '',
  responsibilities text[] DEFAULT '{}',
  skills          text[] DEFAULT '{}',
  tags            text[] DEFAULT '{}',
  apply_url       text NOT NULL,
  last_date       text DEFAULT '',                     -- display string e.g. "May 30, 2026"
  valid_through   timestamptz DEFAULT NULL,            -- ISO 8601 for JSON-LD
  category        text DEFAULT 'IT',                   -- IT | BPO | BFSI | CORE
  logo_color      text DEFAULT '#2563EB',
  is_fresher      boolean DEFAULT false,
  is_wfh          boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  is_new          boolean DEFAULT true,
  views           integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Increment views RPC (server-side rate limiting is done in the API route)
CREATE OR REPLACE FUNCTION increment_views(job_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET views = views + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Auto-set is_new = false for jobs older than 3 days
CREATE OR REPLACE FUNCTION refresh_is_new()
RETURNS void AS $$
BEGIN
  UPDATE jobs SET is_new = false
  WHERE is_new = true AND created_at < now() - interval '3 days';
END;
$$ LANGUAGE plpgsql;

-- 5. Auto-deactivate expired jobs (call this daily via pg_cron or external cron)
CREATE OR REPLACE FUNCTION deactivate_expired_jobs()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE jobs
    SET is_active = false
    WHERE is_active = true
      AND valid_through IS NOT NULL
      AND valid_through < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- 6. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS jobs_slug_idx ON jobs(slug);
CREATE INDEX IF NOT EXISTS jobs_active_idx ON jobs(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs(category, is_active);
CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs(company, is_active);
CREATE INDEX IF NOT EXISTS jobs_valid_through_idx ON jobs(valid_through) WHERE is_active = true;

-- 7. Row Level Security — public read, no public write
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active jobs" ON jobs;
CREATE POLICY "Public can read active jobs"
  ON jobs FOR SELECT
  USING (is_active = true);

-- The service_role key (used server-side only) bypasses RLS for inserts/updates.

-- ============================================================
-- 8. Sample data — DELETE or replace before going live
-- ============================================================
INSERT INTO jobs (
  title, company, slug, location, job_type, experience,
  salary, salary_min, salary_max, salary_currency,
  description, eligibility, responsibilities, skills, tags,
  apply_url, last_date, valid_through, category, logo_color, is_fresher
) VALUES
(
  'Voice Process Executive',
  'Wipro',
  'wipro-voice-process-executive',
  'Bangalore, India',
  'Full Time',
  'Fresher / 0-1 Yr',
  '₹2.5 – 3.5 LPA', 250000, 350000, 'INR',
  'Wipro BPS is hiring Voice Process Executives for its domestic and international BPO division. Selected candidates will handle inbound/outbound customer calls, resolve queries, and maintain CSAT scores.',
  '12th Pass or Any Graduate with good communication skills in English/Hindi.',
  ARRAY['Handle inbound/outbound customer calls','Resolve customer queries','Maintain high CSAT scores','Update CRM records accurately'],
  ARRAY['Good spoken English/Hindi','Basic computer knowledge','Customer service orientation','Ability to work in shifts'],
  ARRAY['Voice Process','BPO','Fresher OK','Good Communication'],
  'https://careers.wipro.com',
  'June 15, 2026',
  '2026-06-15T23:59:59Z',
  'BPO',
  '#1a73e8',
  true
),
(
  'Associate Software Engineer',
  'Infosys',
  'infosys-associate-software-engineer',
  'Hyderabad / Pune / Bangalore',
  'Full Time',
  '0 – 2 Years',
  '₹3.6 – 5 LPA', 360000, 500000, 'INR',
  'Infosys is hiring fresh graduates for its Associate Software Engineer role. You will be trained in Java, Python, or .NET and deployed on client projects.',
  'B.E/B.Tech/MCA 2023-2026 passouts. 60% throughout. No active backlogs.',
  ARRAY['Write clean, scalable code','Participate in code reviews','Collaborate with cross-functional teams','Deliver tasks within sprints'],
  ARRAY['Java / Python / .NET basics','Problem solving','DBMS fundamentals','Good communication'],
  ARRAY['Java','Python','.NET','Fresher','IT'],
  'https://career.infosys.com',
  'June 20, 2026',
  '2026-06-20T23:59:59Z',
  'IT',
  '#007DC1',
  true
),
(
  'TCS NQT – National Qualifier Test',
  'TCS',
  'tcs-nqt-national-qualifier-test',
  'Pan India (Remote Test)',
  'Full Time',
  '2024 / 2025 / 2026 Passouts',
  '₹3.36 – 7 LPA', 336000, 700000, 'INR',
  'TCS NQT registration is now open! This is the largest fresher hiring drive in India. Clearing the NQT qualifies you for TCS Ninja, Digital, and Prime tracks.',
  'B.E/B.Tech/B.Sc/BCA/M.Sc/MCA — 2024, 2025, 2026 passouts. No active backlogs.',
  ARRAY['Software development & testing','Work across technology stacks','Client communication and delivery'],
  ARRAY['Aptitude & reasoning','Programming fundamentals','Verbal ability'],
  ARRAY['NQT','Mass Hiring','IT','Fresher','TCS iON'],
  'https://www.tcs.com/careers',
  'June 25, 2026',
  '2026-06-25T23:59:59Z',
  'IT',
  '#003087',
  true
);
