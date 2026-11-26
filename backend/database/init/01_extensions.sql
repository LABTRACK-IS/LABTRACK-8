-- LabTrack PostgreSQL Initialization (Fresh Container Only)
-- Application tables in the `public` schema are managed by EF Core migrations
-- in `LabTrack.CSharp/src/LabTrack.Infrastructure/Migrations`.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
