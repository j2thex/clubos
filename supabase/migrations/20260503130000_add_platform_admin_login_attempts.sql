-- Per-IP failure log for /platform-admin/login. The login action consults
-- this table to throttle brute-force attempts: 5 failures in any 5-minute
-- window from a single IP locks that IP out for the remainder of the window.
-- Successful logins clear all rows for the IP.

CREATE TABLE platform_admin_login_attempts (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_admin_login_attempts_ip_time
  ON platform_admin_login_attempts (ip, attempted_at DESC);
