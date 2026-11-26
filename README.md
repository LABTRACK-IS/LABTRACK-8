# LabTrack Iteration 8 - Detailed Changes

**Comparison:** labtrack 7 -> labtrack 8
**Generated:** 2026-11-27 02:43:40

---

## Backend changes

### Modified files (7)

| File | Old size | New size | Delta |
|------|----------|----------|-------|
| backend\.vscode\settings.json | 371 B | 313 B | -58 B |
| backend\LabTrack.CSharp\src\LabTrack.Application\GlobalUsings.cs | 309 B | 281 B | -28 B |
| backend\LabTrack.CSharp\src\LabTrack.Application\LabTrack.Application.csproj | 693 B | 628 B | -65 B |
| backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Configurations\PcUsageLogConfiguration.cs | 784 B | 786 B | +2 B |
| backend\LabTrack.CSharp\tests\LabTrack.Tests\Integration\Assets\AssetIntegrationTests.cs | 4866 B | 4286 B | -580 B |
| backend\LabTrack.CSharp\tests\LabTrack.Tests\Integration\Auth\AuthIntegrationTests.cs | 5685 B | 4725 B | -960 B |
| backend\LabTrack.CSharp\tests\LabTrack.Tests\Integration\Financial\FinancialIntegrationTests.cs | 6800 B | 5301 B | -1499 B |

### New backend files (1)

| File | Lines |
|------|-------|
| backend\database\init\01_extensions.sql | 5 |

### Removed backend files (168)

- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Network\ResolveNetworkIncidentDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\ValueObjects\DateRange.cs
- backend\database\schema\004_users.sql
- backend\database\functions\authentication.sql
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Sql\PcUsage\Queries.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Usage\ScanLoginValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\AiChat\CreateAiSessionDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Users\CreateUserValidator.cs
- backend\database\schema\002_schemas.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Users\UpdateUserStatusDto.cs
- backend\database\procedures\maintenance.sql
- backend\LabTrack.CSharp\src\LabTrack.Api\Controllers\ControllerServiceBridgeExtensions.cs
- backend\database\migrations\002_production_hardening.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Qr\QrCheckoutDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\DependencyInjection\InfrastructureServiceExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Financials\CreateExpenseCommand.cs
- backend\database\migrations\001_initial.sql
- backend\database\schema\022_idempotency.sql
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\MiddlewareExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Analytics\PcUsageAnalyticsDto.cs
- backend\database\schema\001_extensions.sql
- backend\LabTrack.Python\.vscode\settings.json
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\DamageAttributionStatus.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Audit\AuditFilterDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\TicketPriority.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Assets\AssetFilterDto.cs
- backend\database\indexes\ai.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Usage\ScanLoginDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Analytics\LaboratorySummaryDto.cs
- backend\database\views\financial_summary.sql
- backend\database\migrations\005_concurrency.sql
- backend\database\schema\018_ai.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Maintenance\CreateMaintenanceValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Replacement\CreateReplacementValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authorization\Policies\InstructorPolicy.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\AiChat\SendMessageValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authentication\PasswordHasher.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\NetworkStatus.cs
- backend\database\schema\020_staging.sql
- backend\database\functions\qr.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Financials\VoidFinancialExpenseDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\EquipmentCategory.cs
- backend\database\migrations\003_auth_sessions.sql
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Email\SmtpClientFactory.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Assets\UpdateAssetAiMetricsDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Services\ServiceExecutionEngine.cs
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\HealthCheckExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Qr\QrCheckinDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Notifications\MarkNotificationReadDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\AiSenderType.cs
- backend\database\indexes\assets.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Network\CreateNetworkIncidentDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Email\EmailTemplateService.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authorization\AuthorizationExtensions.cs
- backend\database\procedures\financial.sql
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\SessionStatus.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authentication\JwtTokenGenerator.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Sql\Audit\Queries.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\AssetStatus.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Qr\QrCheckinResponse.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Tickets\CreateRepairTicketValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Reservations\ReservationStatusDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\ProblemCategory.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authentication\JwtSettings.cs
- backend\database\schema\016_notifications.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Laboratories\CreateLaboratoryValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Qr\GenerateQrCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Laboratories\CreateLaboratoryCommand.cs
- backend\database\schema\012_maintenance.sql
- backend\database\schema\023_email_queue.sql
- backend\database\views\database_contract.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Tickets\AssignRepairTicketDto.cs
- backend\database\schema\019_audit.sql
- backend\LabTrack.CSharp\src\LabTrack.Api\Filters\IdempotencyFilter.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\EmailDispatchStatus.cs
- backend\database\schema\010_problem_reports.sql
- backend\database\functions\repair_tickets.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Usage\ScanLoginCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Qr\QrResponseDto.cs
- backend\database\schema\007_qr_codes.sql
- backend\database\schema\013_replacement.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Assets\CreateAssetCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\TicketStatus.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Reports\CreateProblemReportCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Behaviors\ValidationBehavior.cs
- backend\LabTrack.Python\pyrightconfig.json
- backend\database\procedures\audit.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Assets\CreateAssetValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Reservations\CreateReservationCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Sql\Reservations\Queries.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Network\NetworkIncidentDto.cs
- backend\database\indexes\reservations.sql
- backend\database\functions\pc_usage.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Communications\CreateCommunicationDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Replacement\CreateReplacementCommand.cs
- backend\database\views\asset_details.sql
- backend\database\indexes\notifications.sql
- backend\database\functions\reservations.sql
- backend\database\indexes\reports.sql
- backend\database\views\dashboard.sql
- backend\database\schema\017_financial.sql
- backend\database\indexes\pc_usage.sql
- backend\LabTrack.CSharp\src\LabTrack.Api\Models\ModelsNamespaceMarker.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Tickets\RepairTicketStatusDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Auth\LoginCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\KestrelExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Auth\UpdateProfileDto.cs
- backend\database\schema\021_auth_sessions.sql
- backend\database\schema\006_assets.sql
- backend\database\seeds\development.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Reservations\CreateReservationValidator.cs
- backend\database\schema\009_reservations.sql
- backend\LabTrack.CSharp\src\LabTrack.Domain\ValueObjects\EmailAddress.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Auth\LoginResponseDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Communications\SendEmailDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Qr\GenerateQrValidator.cs
- backend\database\indexes\users.sql
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\AuthenticationExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Replacement\ReplacementStatusDto.cs
- backend\database\functions\problem_reports.sql
- backend\database\schema\011_repair_tickets.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Auth\SetPinDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\ReservationStatus.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Maintenance\CompleteMaintenanceDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Reports\ProblemReportStatusDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Sql\Analytics\Queries.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Users\CreateUserCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\JsonExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authentication\RefreshTokenService.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\AiChat\AiMessageDto.cs
- backend\database\procedures\notifications.sql
- backend\database\functions\analytics.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Reports\CreateProblemReportValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authorization\Policies\AdminTechnicianPolicy.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Usage\HeartbeatDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Notifications\NotificationListDto.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Analytics\DashboardMetricsDto.cs
- backend\database\indexes\tickets.sql
- backend\database\schema\015_network.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Common\ApiResult.cs
- backend\database\migrations\004_idempotency.sql
- backend\database\views\laboratory_summary.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Auth\LoginRequestValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\JrmsuCampus.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Maintenance\CreateMaintenanceCommand.cs
- backend\database\migrations\006_forensics.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\AiChat\SendMessageCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\CorsExtensions.cs
- backend\database\schema\014_communications.sql
- backend\LabTrack.CSharp\src\LabTrack.Application\Commands\Tickets\CreateRepairTicketCommand.cs
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\QrType.cs
- backend\database\schema\005_laboratories.sql
- backend\database\functions\dynamic_sql.sql
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authorization\ResourceAuthorizationService.cs
- backend\database\seeds\reference_data.sql
- backend\database\functions\timestamps.sql
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Persistence\Sql\Ai\Queries.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Validators\Financials\CreateExpenseValidator.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Behaviors\TransactionBehavior.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Dtos\Auth\LoginViaQrDto.cs
- backend\database\schema\008_pc_usage_logs.sql
- backend\LabTrack.CSharp\src\LabTrack.Domain\ValueObjects\Money.cs
- backend\database\schema\003_enums.sql
- backend\LabTrack.CSharp\src\LabTrack.Domain\Enums\ReplacementApproval.cs
- backend\LabTrack.CSharp\src\LabTrack.Api\Extensions\SignalRExtensions.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authorization\Policies\StudentPolicy.cs
- backend\LabTrack.CSharp\src\LabTrack.Application\Common\ServiceResult.cs
- backend\LabTrack.CSharp\src\LabTrack.Infrastructure\Authentication\AuthenticationExtensions.cs

## Frontend changes

### Modified files (10)

| File | Old size | New size | Delta |
|------|----------|----------|-------|
| frontend\src\components\GlobalAiChatbot.tsx | 14571 B | 34704 B | +20133 B |
| frontend\src\components\SkeletonLoader3D.tsx | 30712 B | 27357 B | -3355 B |
| frontend\src\layouts\LandingLayout.tsx | 12599 B | 16854 B | +4255 B |
| frontend\src\layouts\PortalShell.tsx | 16914 B | 17064 B | +150 B |
| frontend\src\lib\api-client.ts | 11616 B | 32652 B | +21036 B |
| frontend\src\pages\admin\CampusesLabsView.tsx | 79285 B | 79365 B | +80 B |
| frontend\src\pages\instructor\InstructorDashboardView.tsx | 6655 B | 6656 B | +1 B |
| frontend\src\pages\landing\HomePage.tsx | 36098 B | 36793 B | +695 B |
| frontend\src\pages\student\student-portal-page.tsx | 79870 B | 80166 B | +296 B |
| frontend\src\index.css | 1285 B | 1284 B | -1 B |

### New frontend files (1)

| File | Lines |
|------|-------|
| frontend\src\components\LandingLoadingScreen.tsx | 677 |

## Backend inventory (current state)

### Controllers (29)

- AiAssistant
- Analytics
- Asset
- Audit
- Auth
- ChainOfCustody
- Communication
- Financial
- IdempotencyRecords
- InstructorCommunication
- Laboratories
- Maintenance
- MaintenanceRecord
- MaintenanceRecords
- Network
- NetworkIncident
- NetworkInfo
- Notification
- PcUsage
- ProblemReport
- Qr
- QrAdmin
- QrSession
- RepairTicket
- Replacement
- ReplacementRecord
- Reservation
- Users
- Workstations

### Services (17)

- AiAssistant
- Analytics
- Asset
- Audit
- Auth
- Communication
- Financial
- Maintenance
- Network
- Notification
- PcUsage
- ProblemReport
- Qr
- RepairTicket
- Replacement
- Reservation
- User

### Entities (32)

- AiChatMessage
- AiChatSession
- Asset
- AuditLog
- AuthSession
- ChainOfCustodyEvent
- Communication
- ComponentReplacement
- DamageAttribution
- FinancialExpense
- FinancialRecord
- IdempotencyKey
- InstructorCommunication
- Laboratory
- MaintenanceRecord
- MaintenanceSchedule
- NetworkDevice
- NetworkIncident
- Notification
- PcTelemetryEvent
- PcUsageLog
- ProblemReport
- QrCode
- QrSession
- RefreshToken
- RepairTicket
- ReplacementRecord
- ReplacementRequest
- Reservation
- User
- Workstation
- WorkstationSession

## Frontend inventory (current state)

### Admin views (0)


### Instructor views (0)


---

Total: 350 C# files, 50 TS/TSX files
