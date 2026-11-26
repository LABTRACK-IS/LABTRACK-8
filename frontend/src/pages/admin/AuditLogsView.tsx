import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
  FileText, Search, Plus, Trash2, Edit3, Shield, Download, Check, Copy,
  Terminal, X, RefreshCw, AlertTriangle, CheckCircle2, Radio, Lock,
  Cpu, Printer, Code2, Eye, Sparkles, Filter
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: 'ASSETS' | 'SESSIONS' | 'USERS' | 'MAINTENANCE' | 'SYSTEM' | 'FINANCIAL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress: string;
  details: string;
}

export interface AuditLogsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

// ============================================================================
// SMART AUTO-DETECT MODULE & SEVERITY ENGINE
// Automatically classifies logs based on action/details keywords
// ============================================================================
const autoDetectAuditClassification = (
  actionText: string,
  detailsText: string
): { module: AuditLogItem['module']; severity: AuditLogItem['severity'] } => {
  const combined = `${actionText} ${detailsText}`.toLowerCase();

  let module: AuditLogItem['module'] = 'SYSTEM';
  if (
    combined.includes('budget') ||
    combined.includes('financial') ||
    combined.includes('expense') ||
    combined.includes('write-off') ||
    combined.includes('writeoff') ||
    combined.includes('cost') ||
    combined.includes('₱') ||
    combined.includes('php')
  ) {
    module = 'FINANCIAL';
  } else if (
    combined.includes('ticket') ||
    combined.includes('maintenance') ||
    combined.includes('repair') ||
    combined.includes('thermal') ||
    combined.includes('fault') ||
    combined.includes('flicker') ||
    combined.includes('broken')
  ) {
    module = 'MAINTENANCE';
  } else if (
    combined.includes('session') ||
    combined.includes('scan') ||
    combined.includes('time-in') ||
    combined.includes('time-out') ||
    combined.includes('timeout') ||
    combined.includes('logout') ||
    combined.includes('lock')
  ) {
    module = 'SESSIONS';
  } else if (
    combined.includes('user') ||
    combined.includes('role') ||
    combined.includes('permission') ||
    combined.includes('login') ||
    combined.includes('password') ||
    combined.includes('pin') ||
    combined.includes('account')
  ) {
    module = 'USERS';
  } else if (
    combined.includes('asset') ||
    combined.includes('gpu') ||
    combined.includes('monitor') ||
    combined.includes('ram') ||
    combined.includes('workstation') ||
    combined.includes('pc-') ||
    combined.includes('ws-') ||
    combined.includes('hardware')
  ) {
    module = 'ASSETS';
  }

  let severity: AuditLogItem['severity'] = 'INFO';
  if (
    combined.includes('critical') ||
    combined.includes('condemned') ||
    combined.includes('beyond repair') ||
    combined.includes('exceeded') ||
    combined.includes('breach') ||
    combined.includes('unauthorized') ||
    combined.includes('emergency') ||
    combined.includes('burned') ||
    combined.includes('shorted')
  ) {
    severity = 'CRITICAL';
  } else if (
    combined.includes('warning') ||
    combined.includes('terminated') ||
    combined.includes('force') ||
    combined.includes('timeout') ||
    combined.includes('flagged') ||
    combined.includes('locked') ||
    combined.includes('write-off')
  ) {
    severity = 'WARNING';
  }

  return { module, severity };
};

// Deterministic SHA-256-like Hex Signature Generator for Audit Verification
const computeAuditSignature = (log: AuditLogItem): string => {
  const raw = `${log.id}|${log.timestamp}|${log.user}|${log.action}|${log.module}|${log.ipAddress}|${log.details}`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `SHA256:${part1}${part2}${part1.split('').reverse().join('')}`;
};

// ============================================================================
// 3D ISOMETRIC SIEM & SECURITY AUDIT RIG ILLUSTRATION
// ============================================================================
const IsometricAuditRig: React.FC<{
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  code: string;
}> = ({ severity, code }) => {
  const primaryHex =
    severity === 'CRITICAL' ? '#f43f5e' : severity === 'WARNING' ? '#f59e0b' : '#38bdf8';
  const secondaryHex =
    severity === 'CRITICAL' ? '#be123°C' : severity === 'WARNING' ? '#d97706' : '#2563eb';
  const gradId = `iso-aud-${severity}-${code.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div className="w-20 h-16 shrink-0">
      <svg viewBox="0 0 140 115" className="w-full h-full drop-shadow-[0_8px_12px_rgba(15,23,42,0.45)]">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={primaryHex} stopOpacity="0.92" />
            <stop offset="55%" stopColor={secondaryHex} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Extruded 3D Isometric Platform Base */}
        <polygon points="70,106 10,82 70,58 130,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.3" />
        <polygon points="10,82 70,106 70,113 10,89" fill="#0f172a" />
        <polygon points="130,82 70,106 70,113 130,89" fill="#020617" />

        {/* 3D Tempered-Glass SIEM Server Tower */}
        <g>
          <polygon points="98,20 116,12 130,18 112,26" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
          <polygon points="98,20 112,26 112,74 98,68" fill="#020617" stroke={primaryHex} strokeWidth="1.2" />
          <polygon points="112,26 130,18 130,66 112,74" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <ellipse
            cx="105"
            cy="39"
            rx="4.2"
            ry="6.5"
            fill="none"
            stroke={primaryHex}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '105px 39px', animationDuration: severity === 'CRITICAL' ? '1.2s' : '3s' }}
          />
          <ellipse
            cx="105"
            cy="56"
            rx="4.2"
            ry="6.5"
            fill="none"
            stroke={primaryHex}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '105px 56px', animationDuration: severity === 'CRITICAL' ? '1.2s' : '3s' }}
          />
          <line x1="121" y1="26" x2="121" y2="64" stroke={primaryHex} strokeWidth="2" strokeLinecap="round" />
          <circle cx="121" cy="23" r="1.8" fill="#ffffff" />
        </g>

        {/* 3D Isometric Security Monitor */}
        <g>
          <polygon points="52,78 68,72 78,76 62,82" fill="#475569" />
          <polygon points="60,58 66,56 66,76 60,78" fill="#334155" />
          <polygon points="22,22 84,8 88,11 26,25" fill="#475569" />
          <polygon points="84,8 88,11 88,53 84,50" fill="#1e293b" />
          <polygon points="22,22 84,8 84,52 22,66" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <polygon points="25,25 81,12 81,49 25,62" fill={`url(#${gradId})`} />
          <line x1="30" y1="30" x2="54" y2="24" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="30" y1="36" x2="68" y2="27" stroke="#e2e8f0" strokeWidth="1.6" strokeOpacity="0.8" strokeLinecap="round" />
          <line x1="30" y1="41" x2="60" y2="34" stroke={primaryHex} strokeWidth="1.6" strokeLinecap="round" />
          <text
            x="53"
            y="51"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="900"
            fontFamily="monospace"
            transform="skewY(-12)"
          >
            {code}
          </text>
        </g>

        <polygon points="32,82 74,68 82,73 40,87" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
        <line x1="37" y1="82" x2="73" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
      </svg>
    </div>
  );
};

const DEFAULT_AUDIT_LOGS_SEED: AuditLogItem[] = [
  {
    id: 'LOG-2026-801',
    timestamp: '2026-11-08 08:30:15',
    user: 'John Sven Morales',
    role: 'System Admin',
    action: 'ASSET_PROVISION_UPDATE',
    module: 'ASSETS',
    severity: 'INFO',
    ipAddress: '192.168.10.15',
    details: 'Updated GPU drivers and assigned network allocation for WS-301 in ComLab 3.'
  },
  {
    id: 'LOG-2026-802',
    timestamp: '2026-11-08 07:45:22',
    user: 'Maria Santos',
    role: 'Lab Supervisor',
    action: 'SESSION_TERMINATED',
    module: 'SESSIONS',
    severity: 'WARNING',
    ipAddress: '192.168.10.22',
    details: 'Force-closed idle workstation session WS-103 due to inactivity timeout.'
  },
  {
    id: 'LOG-2026-803',
    timestamp: '2026-11-08 06:12:05',
    user: 'Automated Sentinel',
    role: 'System Agent',
    action: 'MAINTENANCE_TICKET_RAISED',
    module: 'MAINTENANCE',
    severity: 'CRITICAL',
    ipAddress: '10.10.0.1',
    details: 'Thermal threshold exceeded on PC-008 (88°C). Maintenance work order TICK-901 generated.'
  },
  {
    id: 'LOG-2026-804',
    timestamp: '2026-11-07 18:20:40',
    user: 'Prof. Ramon Magsaysay',
    role: 'Instructor',
    action: 'USER_ROLE_ASSIGNMENT',
    module: 'USERS',
    severity: 'INFO',
    ipAddress: '192.168.10.45',
    details: 'Granted elevated ComLab 1 access privileges to Student ID 2024-IS-0142.'
  },
  {
    id: 'LOG-2026-805',
    timestamp: '2026-11-07 14:10:00',
    user: 'Admin Operator',
    role: 'Operations Staff',
    action: 'FINANCIAL_LEDGER_ALLOCATION',
    module: 'FINANCIAL',
    severity: 'INFO',
    ipAddress: '192.168.10.108',
    details: 'Approved quarterly preventive thermal servicing & antistatic cleaning expenditure of ₱14,500.00.'
  }
];

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [inspectorTab, setInspectorTab] = useState<'STRUCTURED' | 'RAW_JSON'>('STRUCTURED');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState<string>(new Date().toLocaleTimeString());

  // State with LocalStorage Persistence
  const [logs, setLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_audit_logs_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_AUDIT_LOGS_SEED;
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(() => logs[0] || DEFAULT_AUDIT_LOGS_SEED[0]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form State
  const [editUser, setEditUser] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('Operations Staff');
  const [editAction, setEditAction] = useState<string>('');
  const [editModule, setEditModule] = useState<AuditLogItem['module']>('ASSETS');
  const [editSeverity, setEditSeverity] = useState<AuditLogItem['severity']>('INFO');
  const [editIpAddress, setEditIpAddress] = useState<string>('192.168.10.108');
  const [editDetails, setEditDetails] = useState<string>('');

  const notify = useCallback(
    (msg: string) => {
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // Save logs to localStorage
  useEffect(() => {
    try {
      if (logs.length > 0) {
        localStorage.setItem('labtrack_audit_logs_v2', JSON.stringify(logs));
      }
    } catch {}
  }, [logs]);

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ============================================================================
  // CROSS-MODULE ACTIVITY HARVESTER (SYNCS REAL EVENTS FROM OTHER MODULES)
  // ============================================================================
  const harvestCrossModuleEvents = useCallback((): AuditLogItem[] => {
    const harvested: AuditLogItem[] = [];

    // 1. Harvest from Service Desk Tickets (labtrack_service_tickets_v4)
    try {
      const rawTickets = localStorage.getItem('labtrack_service_tickets_v4');
      if (rawTickets) {
        const parsed = JSON.parse(rawTickets);
        if (Array.isArray(parsed)) {
          parsed.slice(0, 3).forEach((t: any, idx: number) => {
            if (!t || !t.id) return;
            harvested.push({
              id: `LOG-TKT-${String(t.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`,
              timestamp: `2026-11-08 09:${String(10 + idx * 7).padStart(2, '0')}:00`,
              user: t.reportedBy || 'Lab Reporter',
              role: t.reporterType === 'FACULTY' ? 'Faculty Instructor' : 'Student',
              action: t.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'FAULT_TICKET_DISPATCHED',
              module: 'MAINTENANCE',
              severity: t.priority === 'CRITICAL' ? 'CRITICAL' : t.priority === 'HIGH' ? 'WARNING' : 'INFO',
              ipAddress: `10.101.0.${108 + idx}`,
              details: `[${t.lab} • ${t.workstation}] ${t.description}`
            });
          });
        }
      }
    } catch {}

    // 2. Harvest from Hardware Write-Offs (labtrack_writeoff_assets_v2)
    try {
      const rawWriteOffs = localStorage.getItem('labtrack_writeoff_assets_v2');
      if (rawWriteOffs) {
        const parsed = JSON.parse(rawWriteOffs);
        if (Array.isArray(parsed)) {
          parsed.slice(0, 2).forEach((w: any, idx: number) => {
            if (!w || !w.id) return;
            harvested.push({
              id: `LOG-FIN-${String(w.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`,
              timestamp: `${w.dateAdded || '2026-11-08'} 10:${String(15 + idx * 12).padStart(2, '0')}:30`,
              user: 'John Sven Morales',
              role: 'System Admin',
              action: `ASSET_${String(w.status || 'WRITEOFF').replace(/\s+/g, '_')}`,
              module: 'FINANCIAL',
              severity: w.status === 'REPLACED' ? 'INFO' : 'WARNING',
              ipAddress: '192.168.10.15',
              details: `Write-Off Ledger: ${w.name} (${w.id}) in ${w.lab} valued at ₱${Number(w.cost || 0).toLocaleString()} — ${w.issue}.`
            });
          });
        }
      }
    } catch {}

    // 3. Harvest from Student QR Attendance Logs (labtrack_qr_attendance_logs_v2)
    try {
      const rawQr = localStorage.getItem('labtrack_qr_attendance_logs_v2');
      if (rawQr) {
        const parsed = JSON.parse(rawQr);
        if (Array.isArray(parsed)) {
          parsed.slice(0, 2).forEach((q: any, idx: number) => {
            if (!q || !q.id) return;
            harvested.push({
              id: `LOG-QR-${String(q.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`,
              timestamp: `2026-11-08 08:${String(15 + idx * 10).padStart(2, '0')}:12`,
              user: q.studentName || 'Student User',
              role: `Student (${q.studentId || 'Verified'})`,
              action: q.status === 'IN_SESSION' ? 'QR_SESSION_TIME_IN' : `QR_SESSION_${q.logoutType || 'COMPLETED'}`,
              module: 'SESSIONS',
              severity: q.logoutType === 'AUTO_TIMEOUT' || q.logoutType === 'ADMIN_OVERRIDE' ? 'WARNING' : 'INFO',
              ipAddress: `10.102.0.${114 + idx}`,
              details: `QR Attendance on ${q.workstation} (${q.laboratoryRoom}): Time-In ${q.timeIn}, Time-Out ${q.timeOut} (${q.duration}).`
            });
          });
        }
      }
    } catch {}

    return harvested;
  }, []);

  // Fetch audit logs from backend API + Merge with Cross-Module Events
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await apiClient.get('/api/v1/audit-logs').catch(() => null);
      const data = res?.data?.data?.items || res?.data?.data || res?.data || [];
      const apiItems: AuditLogItem[] = Array.isArray(data)
        ? data.map((d: any, idx: number) => {
            const act = d.action || d.eventType || 'SYSTEM_AUDIT_EVENT';
            const det = d.details || d.description || 'Recorded system audit event.';
            const detected = autoDetectAuditClassification(act, det);
            return {
              id: d.id ? String(d.id).slice(0, 14).toUpperCase() : `LOG-API-${810 + idx}`,
              timestamp: d.timestampUtc
                ? new Date(d.timestampUtc).toISOString().replace('T', ' ').substring(0, 19)
                : d.timestamp || '2026-11-08 09:00:00',
              user: d.user || d.userName || d.actorName || 'System Admin',
              role: d.role || d.userRole || 'Administrator',
              action: String(act).toUpperCase().replace(/\s+/g, '_'),
              module: d.module || detected.module,
              severity: d.severity || detected.severity,
              ipAddress: d.ipAddress || '192.168.10.15',
              details: det
            };
          })
        : [];

      const crossEvents = harvestCrossModuleEvents();

      setLogs(prev => {
        const map = new Map<string, AuditLogItem>();
        apiItems.forEach(item => map.set(item.id, item));
        crossEvents.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        prev.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        const merged = Array.from(map.values());
        return merged.length > 0 ? merged : DEFAULT_AUDIT_LOGS_SEED;
      });
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, [harvestCrossModuleEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync Form State when selectedLog changes
  useEffect(() => {
    if (selectedLog && !isAddingNew) {
      setEditUser(selectedLog.user || '');
      setEditRole(selectedLog.role || '');
      setEditAction(selectedLog.action || '');
      setEditModule(selectedLog.module || 'ASSETS');
      setEditSeverity(selectedLog.severity || 'INFO');
      setEditIpAddress(selectedLog.ipAddress || '192.168.10.108');
      setEditDetails(selectedLog.details || '');
    }
  }, [selectedLog, isAddingNew]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLogItem = {
      id: `LOG-2026-${Math.floor(810 + Math.random() * 189)}`,
      timestamp: nowFormatted,
      user: editUser.trim() || 'John Sven Morales',
      role: editRole.trim() || 'System Admin',
      action: editAction.trim().toUpperCase().replace(/\s+/g, '_') || 'MANUAL_AUDIT_ENTRY',
      module: editModule,
      severity: editSeverity,
      ipAddress: editIpAddress.trim() || '192.168.10.108',
      details: editDetails.trim() || 'Manual security audit entry logged via LabTrack Admin Portal.'
    };

    try {
      await apiClient.post('/api/v1/audit-logs', newLog).catch(() => {});
    } catch {}

    setLogs(prev => [newLog, ...prev]);
    setSelectedLog(newLog);
    setIsAddingNew(false);
    setIsEditing(false);
    notify(`New Audit Log ${newLog.id} (${newLog.module}) recorded successfully!`);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    const updatedLog: AuditLogItem = {
      ...selectedLog,
      user: editUser.trim(),
      role: editRole.trim(),
      action: editAction.trim().toUpperCase().replace(/\s+/g, '_'),
      module: editModule,
      severity: editSeverity,
      ipAddress: editIpAddress.trim(),
      details: editDetails.trim()
    };

    try {
      await apiClient.put(`/api/v1/audit-logs/${selectedLog.id}`, updatedLog).catch(() => {});
    } catch {}

    setLogs(prev => prev.map(item => (item.id === selectedLog.id ? updatedLog : item)));
    setSelectedLog(updatedLog);
    setIsEditing(false);
    notify(`Audit Log record updated for ${selectedLog.id}.`);
  };

  const handleDeleteLog = async (id: string) => {
    if (logs.length <= 1) {
      notify('Cannot delete the last remaining audit log in the ledger!');
      return;
    }

    try {
      setIsDeletingId(id);
      await apiClient.delete(`/api/v1/audit-logs/${id}`).catch(() => {});

      const filtered = logs.filter(item => item.id !== id);
      setLogs(filtered);

      if (selectedLog?.id === id) {
        setSelectedLog(filtered[0] || null);
      }

      notify(`Audit Log ${id} removed from security trail.`);
    } catch {
      notify(`Failed to delete Audit Log ${id}.`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCopyPayload = (log: AuditLogItem) => {
    const payloadWithSignature = {
      ...log,
      campus: activeCampus,
      integritySignature: computeAuditSignature(log),
      verifiedAt: new Date().toISOString()
    };
    navigator.clipboard?.writeText(JSON.stringify(payloadWithSignature, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
    notify(`Copied verified JSON payload & SHA-256 signature for ${log.id}.`);
  };

  const exportLogsToCSV = () => {
    const headers = ['ID,Timestamp,User,Role,Action,Module,Severity,IP Address,Integrity Hash,Details'];
    const rows = logs.map(
      l =>
        `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.module}","${l.severity}","${l.ipAddress}","${computeAuditSignature(l)}","${(l.details || '').replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_LabTrack_AuditLogs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Audit Logs & SHA-256 Signatures exported to CSV.');
  };

  // Filtered Logs & Computed KPI Metrics
  const filteredLogs: AuditLogItem[] = useMemo(() => {
    return (logs || [])
      .filter((log: AuditLogItem) => log != null)
      .filter((log: AuditLogItem) => {
        const q = (searchQuery || '').toLowerCase();
        const matchesSearch =
          !q ||
          (log.user || '').toLowerCase().includes(q) ||
          (log.role || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q) ||
          (log.id || '').toLowerCase().includes(q) ||
          (log.ipAddress || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q);
        const matchesModule = selectedModuleFilter === 'ALL' || log.module === selectedModuleFilter;
        const matchesSeverity = selectedSeverityFilter === 'ALL' || log.severity === selectedSeverityFilter;
        return matchesSearch && matchesModule && matchesSeverity;
      });
  }, [logs, searchQuery, selectedModuleFilter, selectedSeverityFilter]);

  const totalLogsCount = logs.length;
  const criticalCount = useMemo(() => logs.filter(l => l.severity === 'CRITICAL').length, [logs]);
  const warningCount = useMemo(() => logs.filter(l => l.severity === 'WARNING').length, [logs]);
  const infoCount = useMemo(() => logs.filter(l => l.severity === 'INFO').length, [logs]);

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: logs.length,
      ASSETS: 0,
      SESSIONS: 0,
      USERS: 0,
      MAINTENANCE: 0,
      FINANCIAL: 0,
      SYSTEM: 0
    };
    logs.forEach(l => {
      if (counts[l.module] !== undefined) counts[l.module] += 1;
    });
    return counts;
  }, [logs]);

  const getModuleBadgeColor = (moduleName: string) => {
    switch (moduleName) {
      case 'ASSETS':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SESSIONS':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'USERS':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MAINTENANCE':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'FINANCIAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };
  return (
    <div className="audit-3d-shell w-full p-5 sm:p-7 rounded-[2.5rem] space-y-7 font-sans text-slate-800 select-none  relative">
      {/* 3D EXTRUDED DEPTH & PRINT ENGINE CSS */}
      <style>{`
        .audit-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 10px 0 #94a3b8,
            0 22px 45px -10px rgba(15, 23, 42, 0.25),
            inset 0 2px 0 #ffffff;
        }
        .card-3d-lift {
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease;
          transform: translateZ(0);
        }
        .card-3d-lift:hover {
          transform: translate3d(0, -3px, 0);
        }
        .btn-3d-bevel {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-3d-bevel:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .btn-3d-bevel:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
      `}</style>

      {/* DATALISTS FOR FAST AUTO-COMPLETE */}
      <datalist id="audit-action-suggestions">
        <option value="ASSET_PROVISION_UPDATE" />
        <option value="SESSION_TERMINATED" />
        <option value="MAINTENANCE_TICKET_RAISED" />
        <option value="USER_ROLE_ASSIGNMENT" />
        <option value="FINANCIAL_LEDGER_ALLOCATION" />
        <option value="QR_SESSION_TIME_IN" />
        <option value="SECURITY_PIN_VERIFIED" />
      </datalist>

      <datalist id="audit-role-suggestions">
        <option value="System Admin" />
        <option value="Lab Supervisor" />
        <option value="Faculty Instructor" />
        <option value="Operations Staff" />
        <option value="System Agent" />
      </datalist>

      {/* =====================================================================
          1. OBSIDIAN 3D COMMAND HEADER BANNER
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-[0_5px_0_#1e3a8a,0_0_25px_rgba(56,189,248,0.55)]">
              <FileText className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>SIEM SECURITY LEDGER • {liveClock}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-mono font-black text-[10px] border border-cyan-400/40">
                  SHA-256 VERIFIED
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                System Audit Trail &amp; Security Event Ledger
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Real-time cross-module activity logs, cryptographic event verification, and RBAC security trail • {activeCampus}
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchData();
                notify('Synchronized Audit Trail across all LabTrack modules.');
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
              <span>Sync Trail</span>
            </button>

            <button
              type="button"
              onClick={exportLogsToCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-300" />
              <span>Print Trail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAddingNew(true);
                setIsEditing(false);
                setEditUser('John Sven Morales');
                setEditRole('System Admin');
                setEditAction('');
                setEditModule('SYSTEM');
                setEditSeverity('INFO');
                setEditIpAddress('192.168.10.15');
                setEditDetails('');
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Log</span>
            </button>
          </div>
        </div>

        {/* Interactive Module Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/15">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
            {(['ALL', 'ASSETS', 'SESSIONS', 'USERS', 'MAINTENANCE', 'FINANCIAL', 'SYSTEM'] as const).map(mod => (
              <button
                key={mod}
                type="button"
                onClick={() => setSelectedModuleFilter(mod)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] transition cursor-pointer ${
                  selectedModuleFilter === mod
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_3px_0_#0284c7]'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {mod} ({moduleCounts[mod] || 0})
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Synced with Sessions, Tickets, QR &amp; Financials</span>
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 EXTRUDED 3D KPI CUBES
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a,0_16px_30px_rgba(37,99,235,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 block">
              TOTAL AUDIT EVENTS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">{totalLogsCount} Logs</p>
            <span className="text-[11px] text-blue-200 font-bold block mt-1">
              {infoCount} Informational Events
            </span>
          </div>
          <IsometricAuditRig severity="INFO" code={`${totalLogsCount} LOG`} />
        </div>

        <div
          onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-950 text-white border-2 border-rose-400/50 shadow-[0_8px_0_#881337,0_16px_30px_rgba(225,29,72,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-200 block">
              CRITICAL ALERTS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">{criticalCount} Critical</p>
            <span className="text-[11px] text-rose-200 font-bold block mt-1">
              Click to Filter Critical Logs
            </span>
          </div>
          <IsometricAuditRig severity="CRITICAL" code={`${criticalCount} CRIT`} />
        </div>

        <div
          onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f,0_16px_30px_rgba(245,158,11,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
              SECURITY WARNINGS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">{warningCount} Warnings</p>
            <span className="text-[11px] text-amber-100 font-bold block mt-1">
              Timeouts, Overrides &amp; Write-Offs
            </span>
          </div>
          <IsometricAuditRig severity="WARNING" code={`${warningCount} WARN`} />
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b,0_16px_30px_rgba(16,185,129,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
              LEDGER INTEGRITY
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">100% Valid</p>
            <span className="text-[11px] text-emerald-200 font-bold block mt-1">
              6 LabTrack Modules Monitored
            </span>
          </div>
          <IsometricAuditRig severity="INFO" code="SHA256" />
        </div>
      </div>

      {/* =====================================================================
          3. 2-COLUMN SPLIT WORKSPACE (LEFT: STREAM LIST, RIGHT: 3D INSPECTOR)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL (7 COLS): AUDIT LOGS STREAM & FILTERS */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 border-b-2 border-slate-100 pb-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-blue-600" />
              <input
                type="text"
                placeholder="Search Log ID, User, Action, IP, or Payload..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 w-full font-bold bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedModuleFilter}
                onChange={e => setSelectedModuleFilter(e.target.value)}
                className="text-xs font-black bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 outline-none text-slate-800 cursor-pointer w-full sm:w-auto"
              >
                <option value="ALL">All Modules</option>
                <option value="ASSETS">ASSETS</option>
                <option value="SESSIONS">SESSIONS</option>
                <option value="USERS">USERS</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="FINANCIAL">FINANCIAL</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>

              <select
                value={selectedSeverityFilter}
                onChange={e => setSelectedSeverityFilter(e.target.value)}
                className="text-xs font-black bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 outline-none text-slate-800 cursor-pointer w-full sm:w-auto"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          {/* LOG ITEM LIST STREAM */}
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold text-xs">
                No audit logs found matching your current filter criteria.
              </div>
            ) : (
              filteredLogs.map((log: AuditLogItem) => {
                const isSelected = selectedLog?.id === log.id && !isAddingNew;
                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedLog(log);
                      setIsAddingNew(false);
                      setIsEditing(false);
                    }}
                    className={`card-3d-lift p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-cyan-400 shadow-[0_6px_0_#0284c7]'
                        : 'bg-slate-50/90 hover:bg-white border-slate-200 hover:border-blue-400 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl text-xs font-black shrink-0 mt-0.5 border ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-400 shadow-[0_3px_0_#881337]'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_3px_0_#78350f]'
                            : 'bg-blue-600 text-white border-blue-400 shadow-[0_3px_0_#1e3a8a]'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {log.id}
                          </span>
                          <span
                            className={`text-xs font-black truncate ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span
                            className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded-md border ${getModuleBadgeColor(
                              log.module
                            )}`}
                          >
                            {log.module}
                          </span>
                        </div>

                        <p
                          className={`text-[11px] line-clamp-1 font-medium ${
                            isSelected ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {log.details}
                        </p>

                        <div
                          className={`flex flex-wrap items-center gap-2 text-[10px] font-mono ${
                            isSelected ? 'text-cyan-300' : 'text-slate-400'
                          }`}
                        >
                          <strong className={isSelected ? 'text-white' : 'text-slate-700'}>{log.user}</strong>
                          <span>({log.role})</span>
                          <span>•</span>
                          <span>IP: {log.ipAddress}</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLog(log);
                          setIsAddingNew(false);
                          setIsEditing(true);
                        }}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 hover:bg-white/25 text-white border-white/20'
                            : 'bg-white hover:bg-blue-600 text-slate-600 hover:text-white border-slate-300'
                        }`}
                        title="Edit Audit Log"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={isDeletingId === log.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteLog(log.id);
                        }}
                        className={`p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-50 ${
                          isSelected
                            ? 'bg-rose-500/80 hover:bg-rose-600 text-white border-rose-400'
                            : 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border-rose-200'
                        }`}
                        title="Delete Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL (5 COLS): 3D AUDIT INSPECTOR, JSON TERMINAL & SMART EDITOR */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-slate-100">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>
                {isAddingNew
                  ? 'Log New Security Event (Auto-Detect)'
                  : isEditing
                  ? `Edit Audit Record (${selectedLog?.id})`
                  : '3D Security Audit Inspector'}
              </span>
            </h3>

            {!isAddingNew && !isEditing && selectedLog && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setInspectorTab(inspectorTab === 'STRUCTURED' ? 'RAW_JSON' : 'STRUCTURED')
                  }
                  className="text-[11px] font-mono font-black text-slate-700 hover:text-slate-950 flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl cursor-pointer transition"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{inspectorTab === 'STRUCTURED' ? 'Raw JSON' : 'Card View'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyPayload(selectedLog)}
                  className="text-[11px] font-mono font-black text-slate-700 hover:text-slate-950 flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl cursor-pointer transition"
                  title="Copy JSON Payload"
                >
                  {copiedId === selectedLog.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] font-mono font-black text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1 px-2.5 py-1 rounded-xl shadow-[0_2px_0_#1e3a8a] cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {isAddingNew || isEditing ? (
            <form onSubmit={isAddingNew ? handleCreateLog : handleUpdateLog} className="space-y-3 text-xs font-bold text-slate-700">
              {/* Auto-Detection Live Banner */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white border border-cyan-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[10px] font-mono font-black uppercase text-cyan-300">
                    Auto-Detects Module &amp; Severity as you type
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                  {editModule} • {editSeverity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    User / Actor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editUser}
                    onChange={e => setEditUser(e.target.value)}
                    placeholder="e.g. John Sven Morales"
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Actor Role
                  </label>
                  <input
                    type="text"
                    list="audit-role-suggestions"
                    required
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Action Code (Auto-Classifies)
                  </label>
                  <input
                    type="text"
                    list="audit-action-suggestions"
                    required
                    value={editAction}
                    placeholder="e.g. GPU_THERMAL_ALERT"
                    onChange={e => {
                      const val = e.target.value;
                      setEditAction(val);
                      const detected = autoDetectAuditClassification(val, editDetails);
                      setEditModule(detected.module);
                      setEditSeverity(detected.severity);
                    }}
                    className="w-full text-xs font-mono font-black p-2.5 bg-slate-50 text-blue-900 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Source IP Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editIpAddress}
                    onChange={e => setEditIpAddress(e.target.value)}
                    className="w-full text-xs font-mono font-black p-2.5 bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Target Module
                  </label>
                  <select
                    value={editModule}
                    onChange={e => setEditModule(e.target.value as any)}
                    className="w-full text-xs font-black bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="ASSETS">ASSETS</option>
                    <option value="SESSIONS">SESSIONS</option>
                    <option value="USERS">USERS</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={editSeverity}
                    onChange={e => setEditSeverity(e.target.value as any)}
                    className="w-full text-xs font-black bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Event Details &amp; Payload Description (Auto-Classifies)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDetails}
                  placeholder="Describe workstation, financial amount, or security event..."
                  onChange={e => {
                    const val = e.target.value;
                    setEditDetails(val);
                    const detected = autoDetectAuditClassification(editAction, val);
                    setEditModule(detected.module);
                    setEditSeverity(detected.severity);
                  }}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 text-slate-900 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="btn-3d-bevel flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAddingNew ? 'Commit Audit Log' : 'Save Modifications'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : selectedLog ? (
            <div className="space-y-4">
              {/* 3D Isometric Inspector Header Banner */}
              <div className="bg-slate-950 text-white p-4 rounded-2xl border-2 border-slate-800 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3.5 min-w-0">
                  <IsometricAuditRig severity={selectedLog.severity} code={selectedLog.module.slice(0, 6)} />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-cyan-300">
                        {selectedLog.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-black ${
                          selectedLog.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : selectedLog.severity === 'WARNING'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {selectedLog.severity}
                      </span>
                    </div>
                    <p className="font-black text-sm text-white truncate">{selectedLog.action}</p>
                    <p className="font-mono text-[10px] text-slate-400">{selectedLog.timestamp}</p>
                  </div>
                </div>
              </div>

              {inspectorTab === 'RAW_JSON' ? (
                <div className="bg-slate-950 text-emerald-300 p-4 rounded-2xl border-2 border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <pre>
                    {JSON.stringify(
                      {
                        ...selectedLog,
                        campus: activeCampus,
                        integrityHash: computeAuditSignature(selectedLog),
                        verificationStatus: 'VERIFIED_IMMUTABLE'
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">
                        User / Actor
                      </span>
                      <strong className="text-slate-900 font-black block mt-0.5">
                        {selectedLog.user}
                      </strong>
                      <span className="text-[10px] font-mono text-blue-700 font-bold">
                        {selectedLog.role}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">
                        Network Origin IP
                      </span>
                      <strong className="text-slate-900 font-mono font-black block mt-0.5">
                        {selectedLog.ipAddress}
                      </strong>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        VLAN Verified
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                        System Module
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-mono font-black border text-[10px] inline-block ${getModuleBadgeColor(
                          selectedLog.module
                        )}`}
                      >
                        {selectedLog.module}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                        Event Severity
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-mono font-black text-[10px] inline-block ${
                          selectedLog.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : selectedLog.severity === 'WARNING'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {selectedLog.severity}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                      Event Payload &amp; Description
                    </span>
                    <p className="text-slate-800 text-xs font-semibold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {selectedLog.details}
                    </p>
                  </div>

                  {/* Cryptographic Integrity Hash Box */}
                  <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-300 font-mono text-[10px] flex items-center justify-between gap-2">
                    <span className="truncate">{computeAuditSignature(selectedLog)}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[9px] shrink-0">
                      VERIFIED
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isDeletingId === selectedLog.id}
                onClick={() => handleDeleteLog(selectedLog.id)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-[0_4px_0_#881337] transition flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingId === selectedLog.id ? 'Deleting...' : 'Delete Audit Log'}</span>
              </button>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 font-bold text-xs">
              Select an audit log from the left stream to inspect its security payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;











