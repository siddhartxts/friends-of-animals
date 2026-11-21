-- pg-nonprod roles, the preview template `foa_seed` and `foa_staging`. Run by
-- bootstrap.sh as `postgres`, after common.sql. Idempotent.
--
-- Previews and staging have roles of their own. Vercel has no build-only
-- environment variables, so every preview function holds the credentials its
-- build migrates with; the preview roles must not be able to touch staging.
--
--   nonprod_migrator  previews: CREATEDB; owns foa_seed and every preview
--                     database it creates (`CREATE DATABASE foa_pr_<n>_<fp>
--                     TEMPLATE foa_seed`, connected to database `postgres`).
--   nonprod_app       previews' runtime role: DML only.
--   staging_migrator  staging: owns foa_staging; no CREATEDB.
--   staging_app       staging's runtime role: DML only.
--
-- The preview roles have no CONNECT on foa_staging and pg_hba.conf rejects
-- them there; pg_hba.conf lets the staging roles into foa_staging only.
--
-- No production data ever lands here.

-- Passwords below: keep them out of pg_stat_statements and the server log
-- (see common.sql).
SET pg_stat_statements.track_utility = off;
SET pg_stat_statements.track = none;
SET client_min_messages = warning;
SET log_statement = 'none';
SET log_min_error_statement = 'panic';
SET log_min_duration_statement = -1;

-- Roles -------------------------------------------------------------------------
SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nonprod_migrator') AS missing \gset
\if :missing
  CREATE ROLE nonprod_migrator;
\endif
SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nonprod_app') AS missing \gset
\if :missing
  CREATE ROLE nonprod_app;
\endif
SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'staging_migrator') AS missing \gset
\if :missing
  CREATE ROLE staging_migrator;
\endif
SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'staging_app') AS missing \gset
\if :missing
  CREATE ROLE staging_app;
\endif

ALTER ROLE nonprod_migrator WITH LOGIN NOSUPERUSER CREATEDB NOCREATEROLE INHERIT
  NOREPLICATION NOBYPASSRLS;
ALTER ROLE nonprod_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT
  NOREPLICATION NOBYPASSRLS;
ALTER ROLE staging_migrator WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT
  NOREPLICATION NOBYPASSRLS;
ALTER ROLE staging_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT
  NOREPLICATION NOBYPASSRLS;

-- Timeouts per role, as on pg-prod (see prod.sql).
ALTER ROLE nonprod_app SET statement_timeout = '15s';
ALTER ROLE nonprod_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE staging_app SET statement_timeout = '15s';
ALTER ROLE staging_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE nonprod_migrator SET statement_timeout = 0;
ALTER ROLE nonprod_migrator SET lock_timeout = '30s';
ALTER ROLE staging_migrator SET statement_timeout = 0;
ALTER ROLE staging_migrator SET lock_timeout = '30s';

SELECT :'set_passwords' = '1'
    OR (SELECT rolpassword IS NULL FROM pg_authid WHERE rolname = 'nonprod_migrator') AS set_pw \gset
\if :set_pw
  \set pw `cat /run/secrets/migrator_password`
  ALTER ROLE nonprod_migrator WITH PASSWORD :'pw';
  \unset pw
\endif
SELECT :'set_passwords' = '1'
    OR (SELECT rolpassword IS NULL FROM pg_authid WHERE rolname = 'nonprod_app') AS set_pw \gset
\if :set_pw
  \set pw `cat /run/secrets/app_password`
  ALTER ROLE nonprod_app WITH PASSWORD :'pw';
  \unset pw
\endif
SELECT :'set_passwords' = '1'
    OR (SELECT rolpassword IS NULL FROM pg_authid WHERE rolname = 'staging_migrator') AS set_pw \gset
\if :set_pw
  \set pw `cat /run/secrets/staging_migrator_password`
  ALTER ROLE staging_migrator WITH PASSWORD :'pw';
  \unset pw
\endif
SELECT :'set_passwords' = '1'
    OR (SELECT rolpassword IS NULL FROM pg_authid WHERE rolname = 'staging_app') AS set_pw \gset
\if :set_pw
  \set pw `cat /run/secrets/staging_app_password`
  ALTER ROLE staging_app WITH PASSWORD :'pw';
  \unset pw
\endif

-- Preview builds connect to `postgres` to create their database.
GRANT CONNECT ON DATABASE postgres TO nonprod_migrator;

-- foa_seed: the template every preview is cloned from -------------------------------
-- It holds the preview roles' default privileges and nothing else (no tables,
-- no lookup function: auth_query uses `postgres`). Nothing may connect to it,
-- or CREATE DATABASE ... TEMPLATE foa_seed fails.
SELECT NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'foa_seed') AS missing \gset
\if :missing
  CREATE DATABASE foa_seed OWNER nonprod_migrator;
\endif
ALTER DATABASE foa_seed OWNER TO nonprod_migrator;
-- Open it just long enough to (re)apply the privileges.
ALTER DATABASE foa_seed IS_TEMPLATE false ALLOW_CONNECTIONS true;
\connect foa_seed
\set migrator nonprod_migrator
\set app nonprod_app
\ir nonprod-privileges.sql
\connect postgres
SET client_min_messages = warning;
ALTER DATABASE foa_seed IS_TEMPLATE true ALLOW_CONNECTIONS false;

-- foa_staging ------------------------------------------------------------------------
-- Owned by staging_migrator. Made from template1, not foa_seed, which carries
-- the preview roles' default privileges.
SELECT NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'foa_staging') AS missing \gset
\if :missing
  CREATE DATABASE foa_staging OWNER staging_migrator;
\endif
ALTER DATABASE foa_staging OWNER TO staging_migrator;
-- Only the staging roles connect (the owner without a grant); no TEMP for
-- staging_app.
REVOKE ALL ON DATABASE foa_staging FROM PUBLIC, nonprod_migrator, nonprod_app;
GRANT CONNECT ON DATABASE foa_staging TO staging_app;
-- Re-applied so changes reach a staging database that predates them.
\connect foa_staging
\set migrator staging_migrator
\set app staging_app
\ir nonprod-privileges.sql
