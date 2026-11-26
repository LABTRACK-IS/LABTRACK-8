# LabTrack Database Architecture

- **Engine:** PostgreSQL 16+ with `pgvector` extension
- **Database Name:** `labtrack_db`
- **Schema:** `public`
- **Source of Truth:** Entity Framework Core migrations in `LabTrack.CSharp/src/LabTrack.Infrastructure/Migrations`

## Mapped Tables (`public` schema)

- `public.AiChatMessages`
- `public.AiChatSessions`
- `public.Assets`
- `public.AuditLogs`
- `public.AuthSessions`
- `public.Communications`
- `public.DamageAttributions`
- `public.FinancialExpenses`
- `public.IdempotencyKey`
- `public.Laboratories`
- `public.MaintenanceRecords`
- `public.MaintenanceSchedules`
- `public.NetworkIncidents`
- `public.Notifications`
- `public.PcUsageLogs`
- `public.ProblemReports`
- `public.QrCodes`
- `public.QrSession`
- `public.RepairTickets`
- `public.ReplacementRequests`
- `public.Reservations`
- `public.Users`
- `public.Workstation`

## Operations

- **Apply Migrations:** `.\scripts\database\migrate.ps1`
- **Create Backup (read-only dump):** `.\scripts\database\backup.ps1`
- **Docker Bootstrap:** `database/init/01_extensions.sql` enables `uuid-ossp` and `vector` automatically on a fresh PostgreSQL container.
