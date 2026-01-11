CREATE TABLE IF NOT EXISTS job_requests (
  id TEXT PRIMARY KEY,
  owner_company_id TEXT NOT NULL,

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),

  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_city TEXT NOT NULL,
  location_state TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_requests_status_created_at
  ON job_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_requests_owner_company
  ON job_requests (owner_company_id);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_requests_updated_at ON job_requests;

CREATE TRIGGER trg_job_requests_updated_at
BEFORE UPDATE ON job_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
