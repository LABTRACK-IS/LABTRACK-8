import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, UserPlus, Shield, CheckCircle, XCircle, Search,
  Mail, Edit3, Trash2, Key, UserCheck, Activity,
  X, Plus, AlertCircle, Sparkles, RefreshCw,
  QrCode, Clock, Calendar, LogOut, Monitor, Download, Printer, Eye
} from 'lucide-react';

export interface UserAccessManagementViewProps {
  campusName: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  campus: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface StudentQrLog {
  id: string;
  studentId: string;
  studentName: string;
  laboratoryRoom: string;
  workstation: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  startTimestampMs?: number;
  elapsedSeconds?: number;
  logoutType: 'AUTO_TIMEOUT' | 'MANUAL_SCAN' | 'ACTIVE' | 'ADMIN_OVERRIDE';
  status: 'COMPLETED' | 'IN_SESSION';
}

// ---- SMART TIMESTAMP PARSER & AUTOMATIC TIME FORMATTERS ----
const parseSmartTimestampMs = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  try {
    const raw = String(iso).trim();
    const directMs = new Date(raw).getTime();
    // Handle backend UTC strings that omit the trailing 'Z'
    if (!raw.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(raw) && raw.includes('T')) {
      const utcMs = new Date(raw + 'Z').getTime();
      const now = Date.now();
      if (!isNaN(utcMs) && Math.abs(now - utcMs) < Math.abs(now - directMs)) {
        return utcMs;
      }
    }
    return isNaN(directMs) ? 0 : directMs;
  } catch {
    return 0;
  }
};

const getNowDateString = (): string => {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getNowTimeString = (): string => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return getNowDateString();
  const ms = parseSmartTimestampMs(iso);
  if (ms > 0) {
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return String(iso);
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso || iso === '--:--') return '--:--';
  const ms = parseSmartTimestampMs(iso);
  if (ms > 0) {
    return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return String(iso);
};

const formatElapsedSeconds = (secs: number): string => {
  const safeSecs = Math.max(1, Math.floor(Number(secs) || 1));
  if (safeSecs < 60) return `${safeSecs}s`;
  const mins = Math.floor(safeSecs / 60);
  if (mins < 60) return `${mins}m ${safeSecs % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};

const formatDuration = (startIso: string | null | undefined, endIso: string | null | undefined): string => {
  const startMs = parseSmartTimestampMs(startIso);
  if (!startMs) return '1s';
  const endMs = endIso && endIso !== '--:--' ? parseSmartTimestampMs(endIso) : Date.now();
  const secs = Math.max(1, Math.floor(((endMs || Date.now()) - startMs) / 1000));
  return formatElapsedSeconds(secs);
};

const AUTO_TIMEOUT_SECONDS = 30;

// ============================================================================
// 3D ISOMETRIC ACCESS CONTROL & QR TERMINAL ILLUSTRATION
// ============================================================================
const IsometricAccessRig: React.FC<{
  variant: 'ADMIN_VAULT' | 'FACULTY_NODE' | 'QR_GATE';
  badgeText: string;
}> = ({ variant, badgeText }) => {
  const primaryHex =
    variant === 'ADMIN_VAULT' ? '#6366f1' : variant === 'FACULTY_NODE' ? '#38bdf8' : '#10b981';
  const secondaryHex =
    variant === 'ADMIN_VAULT' ? '#4338ca' : variant === 'FACULTY_NODE' ? '#0284c7' : '#059669';
  const gradId = `iso-acc-${variant}-${badgeText}`;
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

        <polygon points="70,106 10,82 70,58 130,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.3" />
        <polygon points="10,82 70,106 70,113 10,89" fill="#0f172a" />
        <polygon points="130,82 70,106 70,113 130,89" fill="#020617" />

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
            style={{ transformOrigin: '105px 39px', animationDuration: '3.6s' }}
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
            style={{ transformOrigin: '105px 56px', animationDuration: '3.6s' }}
          />
          <line x1="121" y1="26" x2="121" y2="64" stroke={primaryHex} strokeWidth="2" strokeLinecap="round" />
          <circle cx="121" cy="23" r="1.8" fill="#ffffff" />
        </g>

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
            {badgeText}
          </text>
        </g>

        <polygon points="32,82 74,68 82,73 40,87" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
        <line x1="37" y1="82" x2="73" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
      </svg>
    </div>
  );
};

const DEFAULT_USERS_SEED: UserAccount[] = [
  {
    id: 'USR-101',
    name: 'John Sven Insipido Morales',
    email: 'johnsven.morales@jrmsu.edu.ph',
    role: 'SUPER_ADMIN',
    campus: 'JRMSU Dapitan Main Campus',
    status: 'ACTIVE',
    lastActive: 'Online Now'
  },
  {
    id: 'USR-102',
    name: 'Prof. Ramon Magsaysay',
    email: 'ramon.magsaysay@jrmsu.edu.ph',
    role: 'INSTRUCTOR',
    campus: 'JRMSU Dapitan Main Campus',
    status: 'ACTIVE',
    lastActive: '12 mins ago'
  },
  {
    id: 'USR-103',
    name: 'Engr. Marco Polo Reyes',
    email: 'marco.reyes@jrmsu.edu.ph',
    role: 'LAB_MANAGER',
    campus: 'JRMSU Dapitan Main Campus',
    status: 'ACTIVE',
    lastActive: '35 mins ago'
  },
  {
    id: 'USR-104',
    name: 'Carlo Mendoza',
    email: 'carlo.mendoza@jrmsu.edu.ph',
    role: 'TECHNICIAN',
    campus: 'JRMSU Dapitan Main Campus',
    status: 'ACTIVE',
    lastActive: '1 hour ago'
  }
];

const DEFAULT_QR_LOGS_SEED: StudentQrLog[] = [
  {
    id: 'QRL-2001',
    studentId: '2024-IS-0142',
    studentName: 'Maria Clara Santos',
    laboratoryRoom: 'ComLab 1 (ICT)',
    workstation: 'PC-008',
    date: getNowDateString(),
    timeIn: getNowTimeString(),
    timeOut: '--:--',
    duration: '5s',
    startTimestampMs: Date.now() - 5000,
    elapsedSeconds: 5,
    logoutType: 'ACTIVE',
    status: 'IN_SESSION'
  },
  {
    id: 'QRL-2002',
    studentId: '2024-IT-0188',
    studentName: 'Kevin Rey Bautista',
    laboratoryRoom: 'ComLab 2 (Multimedia)',
    workstation: 'PC-014',
    date: getNowDateString(),
    timeIn: '08:00:12 AM',
    timeOut: '08:00:42 AM',
    duration: '30s',
    elapsedSeconds: 30,
    logoutType: 'AUTO_TIMEOUT',
    status: 'COMPLETED'
  },
  {
    id: 'QRL-2003',
    studentId: '2024-CS-0215',
    studentName: 'Angela Mae Villanueva',
    laboratoryRoom: 'ComLab 3 (Engineering)',
    workstation: 'PC-005',
    date: getNowDateString(),
    timeIn: '07:45:00 AM',
    timeOut: '08:30:00 AM',
    duration: '45m 0s',
    elapsedSeconds: 2700,
    logoutType: 'MANUAL_SCAN',
    status: 'COMPLETED'
  }
];

export const UserAccessManagementView: React.FC<UserAccessManagementViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const notify = useCallback(
    (msg: string) => {
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // View Mode Switcher & 30s Auto-Timeout Guard Toggle
  const [viewMode, setViewMode] = useState<'UNIFIED_ALL' | 'USERS_ONLY' | 'QR_LOGS_ONLY'>('UNIFIED_ALL');
  const [autoTimeoutEnabled, setAutoTimeoutEnabled] = useState<boolean>(true);
  const [liveClockStr, setLiveClockStr] = useState<string>(getNowTimeString());

  // Data States with LocalStorage Persistence
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_users_ledger_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_USERS_SEED;
  });

  const [qrLogs, setQrLogs] = useState<StudentQrLog[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_qr_attendance_logs_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_QR_LOGS_SEED;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    try {
      if (users.length > 0) {
        localStorage.setItem('labtrack_users_ledger_v2', JSON.stringify(users));
      }
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      if (qrLogs.length > 0) {
        localStorage.setItem('labtrack_qr_attendance_logs_v2', JSON.stringify(qrLogs));
      }
    } catch {}
  }, [qrLogs]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [qrSearchQuery, setQrSearchQuery] = useState('');
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('ALL');
  const [qrLabFilter, setQrLabFilter] = useState<string>('ALL');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [inspectingUser, setInspectingUser] = useState<UserAccount | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [isAddQrModalOpen, setIsAddQrModalOpen] = useState(false);
  const [editingQrLog, setEditingQrLog] = useState<StudentQrLog | null>(null);
  const [deletingQrLogId, setDeletingQrLogId] = useState<string | null>(null);

  // Forms
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'TECHNICIAN'
  });

  const [qrFormData, setQrFormData] = useState({
    studentId: '',
    studentName: '',
    laboratoryRoom: 'ComLab 1 (ICT)',
    workstation: 'PC-001',
    date: getNowDateString(),
    timeIn: getNowTimeString(),
    timeOut: '--:--',
    duration: 'In Session',
    logoutType: 'ACTIVE' as StudentQrLog['logoutType'],
    status: 'IN_SESSION' as StudentQrLog['status']
  });

  // Check if typed Student ID is already IN_SESSION (so scanning again automatically triggers Time Out!)
  const matchedActiveStudentLog = useMemo(() => {
    const idClean = qrFormData.studentId.trim().toLowerCase();
    if (!idClean) return null;
    return qrLogs.find(
      l => l.status === 'IN_SESSION' && l.studentId.trim().toLowerCase() === idClean
    ) || null;
  }, [qrLogs, qrFormData.studentId]);

  // ============================================================
  // FETCH USERS FROM BACKEND
  // ============================================================
  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/users').catch(() => null);
      const data = res?.data?.data?.items || res?.data?.data || res?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped: UserAccount[] = data.map((u: any) => ({
          id: u.id || u.userId,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
          email: u.email || 'no-email@jrmsu.edu.ph',
          role: (u.role || 'TECHNICIAN').toUpperCase(),
          campus: u.campusName || activeCampus,
          status: u.isActive === false ? 'INACTIVE' : 'ACTIVE',
          lastActive: u.lastLoginUtc ? new Date(parseSmartTimestampMs(u.lastLoginUtc)).toLocaleString() : 'Active Today'
        }));
        setUsers(mapped);
      }
    } catch {}
  }, [activeCampus]);

  // ============================================================
  // FETCH QR LOGS (AUTOMATIC TIME IN & TIME OUT SYNC)
  // ============================================================
  const fetchQrLogs = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        apiClient.get('/api/v1/pc-usage/active?pageNumber=1&pageSize=100').catch(() => null),
        apiClient.get('/api/v1/pc-usage/history?pageNumber=1&pageSize=100').catch(() => null)
      ]);

      const activeData = activeRes?.data?.data?.items || activeRes?.data?.data || activeRes?.data || [];
      const historyData = historyRes?.data?.data?.items || historyRes?.data?.data || historyRes?.data || [];

      const activeList = Array.isArray(activeData) ? activeData : [];
      const historyList = Array.isArray(historyData) ? historyData : [];

      if (activeList.length === 0 && historyList.length === 0) {
        setLastSync(new Date());
        return;
      }

      const now = Date.now();
      let didTimeoutAny = false;
      const apiMapped: StudentQrLog[] = [];

      // Process ACTIVE sessions (Automatic Time In from Scan)
      for (const log of activeList) {
        const startIso = log.sessionStartUtc || log.startTimeUtc || log.startedAt || log.createdAtUtc || new Date().toISOString();
        const startMs = parseSmartTimestampMs(startIso) || now;
        const elapsedSecs = Math.max(1, Math.floor((now - startMs) / 1000));
        const sessionId = String(log.sessionId || log.id || `QRL-${startMs}`);

        if (autoTimeoutEnabled && elapsedSecs >= AUTO_TIMEOUT_SECONDS && (log.sessionId || log.id)) {
          const endIsoNow = new Date().toISOString();
          try {
            await apiClient.post(`/api/v1/pc-usage/end-session/${sessionId}`);
            didTimeoutAny = true;

            apiMapped.push({
              id: sessionId,
              studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
              studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
              laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'ComLab 1 (ICT)',
              workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'PC-001',
              date: formatDate(startIso),
              timeIn: formatTime(startIso),
              timeOut: formatTime(endIsoNow),
              duration: formatDuration(startIso, endIsoNow),
              startTimestampMs: startMs,
              elapsedSeconds: elapsedSecs,
              logoutType: 'AUTO_TIMEOUT',
              status: 'COMPLETED'
            });
          } catch {
            apiMapped.push({
              id: sessionId,
              studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
              studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
              laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'ComLab 1 (ICT)',
              workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'PC-001',
              date: formatDate(startIso),
              timeIn: formatTime(startIso),
              timeOut: '--:--',
              duration: formatElapsedSeconds(elapsedSecs),
              startTimestampMs: startMs,
              elapsedSeconds: elapsedSecs,
              logoutType: 'ACTIVE',
              status: 'IN_SESSION'
            });
          }
        } else {
          apiMapped.push({
            id: sessionId,
            studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
            studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
            laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'ComLab 1 (ICT)',
            workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'PC-001',
            date: formatDate(startIso),
            timeIn: formatTime(startIso),
            timeOut: '--:--',
            duration: formatElapsedSeconds(elapsedSecs),
            startTimestampMs: startMs,
            elapsedSeconds: elapsedSecs,
            logoutType: 'ACTIVE',
            status: 'IN_SESSION'
          });
        }
      }

      // Process HISTORY (Automatic Time Out from Student Logout / Timeout)
      for (const log of historyList) {
        const startIso = log.sessionStartUtc || log.startTimeUtc || log.startedAt || log.createdAtUtc;
        const endIso = log.sessionEndUtc || log.endTimeUtc || log.endedAt || new Date().toISOString();
        const startMs = parseSmartTimestampMs(startIso);
        const endMs = parseSmartTimestampMs(endIso);
        const logStatus = (log.status || '').toUpperCase();

        let logoutType: StudentQrLog['logoutType'] = 'MANUAL_SCAN';
        if (logStatus === 'AUTO_TIMEOUT') logoutType = 'AUTO_TIMEOUT';
        else if (logStatus === 'FORCED_LOGOUT' || logStatus === 'ADMIN_OVERRIDE') logoutType = 'ADMIN_OVERRIDE';

        apiMapped.push({
          id: String(log.sessionId || log.id || `QRL-HIST-${startMs || Math.random()}`),
          studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
          studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
          laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'ComLab 1 (ICT)',
          workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'PC-001',
          date: formatDate(startIso),
          timeIn: formatTime(startIso),
          timeOut: formatTime(endIso),
          duration: formatDuration(startIso, endIso),
          startTimestampMs: startMs,
          elapsedSeconds: startMs && endMs ? Math.max(1, Math.floor((endMs - startMs) / 1000)) : AUTO_TIMEOUT_SECONDS,
          logoutType,
          status: 'COMPLETED'
        });
      }

      setQrLogs(prev => {
        const mergedMap = new Map<string, StudentQrLog>();
        apiMapped.forEach(item => mergedMap.set(item.id, item));
        // Keep local entries that aren't in API yet
        prev.forEach(localItem => {
          if (!mergedMap.has(localItem.id)) {
            mergedMap.set(localItem.id, localItem);
          }
        });
        const combined = Array.from(mergedMap.values());
        combined.sort((a, b) => {
          if (a.status === 'IN_SESSION' && b.status !== 'IN_SESSION') return -1;
          if (a.status !== 'IN_SESSION' && b.status === 'IN_SESSION') return 1;
          return (b.startTimestampMs || 0) - (a.startTimestampMs || 0);
        });
        return combined;
      });

      setLastSync(new Date());

      if (didTimeoutAny) {
        setTimeout(() => fetchQrLogs(), 1000);
      }
    } catch {}
  }, [autoTimeoutEnabled]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchQrLogs()]);
    setIsLoading(false);
  }, [fetchUsers, fetchQrLogs]);

  // Live 3-second API polling + Cross-Tab Storage Listener (Detects Student Portal Scan In / Scan Out immediately)
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchQrLogs();
    }, 3000);

    const handleCrossTabScan = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'labtrack_qr_attendance_logs_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setQrLogs(parsed);
        } catch {}
      } else if (e.key.includes('session') || e.key.includes('scan') || e.key.includes('student')) {
        fetchQrLogs();
      }
    };

    window.addEventListener('storage', handleCrossTabScan);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleCrossTabScan);
    };
  }, [fetchAll, fetchQrLogs]);

  // 1-Second Real-Time Ticker: Updates live clock, active durations, and automatic Time-Out when reaching 30s
  useEffect(() => {
    const ticker = setInterval(() => {
      const nowMs = Date.now();
      const nowTimeFormatted = getNowTimeString();
      setLiveClockStr(nowTimeFormatted);

      setQrLogs(prev =>
        prev.map(log => {
          if (log.status !== 'IN_SESSION') return log;
          const nextSecs = log.startTimestampMs
            ? Math.max(1, Math.floor((nowMs - log.startTimestampMs) / 1000))
            : (Number(log.elapsedSeconds) || 0) + 1;

          if (autoTimeoutEnabled && nextSecs >= AUTO_TIMEOUT_SECONDS) {
            return {
              ...log,
              status: 'COMPLETED',
              logoutType: 'AUTO_TIMEOUT',
              timeOut: nowTimeFormatted,
              duration: formatElapsedSeconds(AUTO_TIMEOUT_SECONDS),
              elapsedSeconds: AUTO_TIMEOUT_SECONDS
            };
          }
          return {
            ...log,
            elapsedSeconds: nextSecs,
            duration: formatElapsedSeconds(nextSecs)
          };
        })
      );
    }, 1000);
    return () => clearInterval(ticker);
  }, [autoTimeoutEnabled]);

  // ============================================================
  // USER CRUD HANDLERS
  // ============================================================
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.email || !userFormData.firstName) return;
    setIsSubmitting(true);

    const fullName = `${userFormData.firstName.trim()} ${userFormData.lastName.trim()}`.trim();
    const localNewUser: UserAccount = {
      id: `USR-${Math.floor(105 + Math.random() * 890)}`,
      name: fullName,
      email: userFormData.email.trim(),
      role: userFormData.role.trim().toUpperCase(),
      campus: activeCampus,
      status: 'ACTIVE',
      lastActive: 'Just now'
    };

    try {
      const res = await apiClient.post('/api/v1/users', {
        firstName: userFormData.firstName.trim(),
        lastName: userFormData.lastName.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role.trim(),
        password: 'LabTrack@2026!',
        isActive: true
      });
      const savedId = res.data?.data?.id || res.data?.id;
      if (savedId) localNewUser.id = String(savedId);
    } catch {}

    setUsers(prev => [localNewUser, ...prev]);
    notify(`User account for ${fullName} (${localNewUser.role}) created successfully!`);
    setIsAddUserModalOpen(false);
    setUserFormData({ firstName: '', lastName: '', email: '', role: 'TECHNICIAN' });
    setIsSubmitting(false);
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    const fullName = `${userFormData.firstName.trim()} ${userFormData.lastName.trim()}`.trim();
    const nextRole = userFormData.role.trim().toUpperCase();

    try {
      await apiClient.put(`/api/v1/users/${editingUser.id}`, {
        firstName: userFormData.firstName.trim(),
        lastName: userFormData.lastName.trim(),
        email: userFormData.email.trim(),
        role: nextRole,
        isActive: editingUser.status === 'ACTIVE'
      });
    } catch {}

    setUsers(prev =>
      prev.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              name: fullName,
              email: userFormData.email.trim(),
              role: nextRole
            }
          : u
      )
    );
    notify(`Updated user account ${fullName}.`);
    setEditingUser(null);
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/users/${id}`);
    } catch {}
    setUsers(prev => prev.filter(u => u.id !== id));
    notify('User account removed from access ledger.');
    setDeletingUserId(null);
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newActive = currentStatus !== 'ACTIVE';
    const nextStatus: UserAccount['status'] = newActive ? 'ACTIVE' : 'INACTIVE';

    setUsers(prev => prev.map(u => (u.id === id ? { ...u, status: nextStatus } : u)));
    try {
      await apiClient.patch(`/api/v1/users/${id}/status`, { isActive: newActive });
    } catch {}
    notify(`User access status changed to ${nextStatus}.`);
  };

  const handleResetUserPin = (user: UserAccount) => {
    notify(`Temporary password & 6-digit security PIN sent to ${user.email} (${user.name}).`);
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUser(user);
    const parts = user.name.split(' ');
    setUserFormData({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: user.email,
      role: user.role
    });
  };

  // ============================================================
  // AUTOMATIC STUDENT QR SCAN TIME-IN & TIME-OUT HANDLERS
  // ============================================================
  const handleAddQrLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nowMs = Date.now();
    const autoDateStr = getNowDateString();
    const autoTimeNow = getNowTimeString();
    const cleanStuId = qrFormData.studentId.trim().toUpperCase();

    // SMART CHECK: If student is already IN_SESSION, scanning again automatically records their TIME OUT!
    const existingActive = qrLogs.find(
      l => l.status === 'IN_SESSION' && l.studentId.trim().toUpperCase() === cleanStuId
    );

    if (existingActive) {
      const totalSecs = existingActive.startTimestampMs
        ? Math.max(1, Math.floor((nowMs - existingActive.startTimestampMs) / 1000))
        : Math.max(1, Number(existingActive.elapsedSeconds) || 1);

      setQrLogs(prev =>
        prev.map(l =>
          l.id === existingActive.id
            ? {
                ...l,
                status: 'COMPLETED',
                logoutType: 'MANUAL_SCAN',
                timeOut: autoTimeNow,
                duration: formatElapsedSeconds(totalSecs),
                elapsedSeconds: totalSecs
              }
            : l
        )
      );

      try {
        await apiClient.post(`/api/v1/pc-usage/end-session/${existingActive.id}`);
      } catch {}

      notify(`Automatic Time-Out recorded for ${existingActive.studentName} (${cleanStuId}) at ${autoTimeNow}!`);
      setIsAddQrModalOpen(false);
      setIsSubmitting(false);
      return;
    }

    // Otherwise, AUTOMATICALLY STAMP TIME-IN (and TIME-OUT if status was set to COMPLETED)
    const isCompletedNow = qrFormData.status === 'COMPLETED';
    const newLogEntry: StudentQrLog = {
      id: `QRL-${Math.floor(2005 + Math.random() * 7900)}`,
      studentId: cleanStuId,
      studentName: qrFormData.studentName.trim(),
      laboratoryRoom: qrFormData.laboratoryRoom.trim(),
      workstation: qrFormData.workstation.trim().toUpperCase(),
      date: autoDateStr,
      timeIn: autoTimeNow,
      timeOut: isCompletedNow ? autoTimeNow : '--:--',
      duration: '1s',
      startTimestampMs: nowMs,
      elapsedSeconds: 1,
      logoutType: isCompletedNow ? 'MANUAL_SCAN' : 'ACTIVE',
      status: qrFormData.status
    };

    try {
      const res = await apiClient.post('/api/v1/pc-usage/scan-login', {
        workstationCode: newLogEntry.workstation,
        laboratoryName: newLogEntry.laboratoryRoom,
        studentId: newLogEntry.studentId,
        studentName: newLogEntry.studentName
      });
      const savedId = res.data?.data?.id || res.data?.data?.sessionId;
      if (savedId) newLogEntry.id = String(savedId);
    } catch {}

    setQrLogs(prev => [newLogEntry, ...prev]);
    notify(`Automatic Time-In (${autoTimeNow}) recorded for ${newLogEntry.studentName} on ${newLogEntry.workstation}!`);
    setIsAddQrModalOpen(false);
    setQrFormData({
      studentId: '',
      studentName: '',
      laboratoryRoom: 'ComLab 1 (ICT)',
      workstation: 'PC-001',
      date: getNowDateString(),
      timeIn: getNowTimeString(),
      timeOut: '--:--',
      duration: 'In Session',
      logoutType: 'ACTIVE',
      status: 'IN_SESSION'
    });
    setIsSubmitting(false);
  };

  // Automatic Time-Out when student scans out or Admin clicks Time Out / Force Logout
  const handleStudentScanOutOrForceLogout = async (
    id: string,
    mode: 'MANUAL_SCAN' | 'ADMIN_OVERRIDE' = 'MANUAL_SCAN'
  ) => {
    const nowMs = Date.now();
    const autoTimeOutStr = getNowTimeString();
    const targetLog = qrLogs.find(l => l.id === id);

    setQrLogs(prev =>
      prev.map(log => {
        if (log.id !== id) return log;
        const totalSecs = log.startTimestampMs
          ? Math.max(1, Math.floor((nowMs - log.startTimestampMs) / 1000))
          : Math.max(1, Number(log.elapsedSeconds) || 1);
        return {
          ...log,
          status: 'COMPLETED',
          logoutType: mode,
          timeOut: autoTimeOutStr,
          duration: formatElapsedSeconds(totalSecs),
          elapsedSeconds: totalSecs
        };
      })
    );

    try {
      await apiClient.post(`/api/v1/pc-usage/end-session/${id}`);
    } catch {}

    notify(
      mode === 'MANUAL_SCAN'
        ? `Student QR Scan-Out recorded for ${targetLog?.studentName || 'Student'} at ${autoTimeOutStr}.`
        : `Session terminated (Time-Out: ${autoTimeOutStr}) for ${targetLog?.studentName || 'Student'}.`
    );
  };

  const handleDeleteQrLog = async (id: string) => {
    setQrLogs(prev => prev.filter(l => l.id !== id));
    setDeletingQrLogId(null);
    try {
      await apiClient.delete(`/api/v1/pc-usage/${id}`);
    } catch {}
    notify('Student QR attendance log removed.');
  };

  const handleStartEditQrLog = (log: StudentQrLog) => {
    setEditingQrLog(log);
    setQrFormData({
      studentId: log.studentId,
      studentName: log.studentName,
      laboratoryRoom: log.laboratoryRoom,
      workstation: log.workstation,
      date: log.date,
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      duration: log.duration,
      logoutType: log.logoutType,
      status: log.status
    });
  };

  const handleUpdateQrLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQrLog) return;

    const nowTime = getNowTimeString();
    const isNowCompleted = qrFormData.status === 'COMPLETED';
    const resolvedTimeOut =
      qrFormData.status === 'IN_SESSION'
        ? '--:--'
        : qrFormData.timeOut === '--:--' || !qrFormData.timeOut.trim()
        ? nowTime
        : qrFormData.timeOut;

    setQrLogs(prev =>
      prev.map(l =>
        l.id === editingQrLog.id
          ? {
              ...l,
              studentId: qrFormData.studentId.trim().toUpperCase(),
              studentName: qrFormData.studentName.trim(),
              laboratoryRoom: qrFormData.laboratoryRoom.trim(),
              workstation: qrFormData.workstation.trim().toUpperCase(),
              date: qrFormData.date || getNowDateString(),
              timeIn: qrFormData.timeIn || nowTime,
              timeOut: resolvedTimeOut,
              duration: qrFormData.duration,
              startTimestampMs:
                qrFormData.status === 'IN_SESSION' && l.status !== 'IN_SESSION'
                  ? Date.now()
                  : l.startTimestampMs,
              elapsedSeconds:
                qrFormData.status === 'IN_SESSION' && l.status !== 'IN_SESSION'
                  ? 1
                  : l.elapsedSeconds,
              logoutType: isNowCompleted
                ? qrFormData.logoutType === 'ACTIVE'
                  ? 'MANUAL_SCAN'
                  : qrFormData.logoutType
                : 'ACTIVE',
              status: qrFormData.status
            }
          : l
      )
    );

    setEditingQrLog(null);
    notify(`Updated QR Attendance Log for ${qrFormData.studentName}.`);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Record Type', 'ID / Student ID', 'Full Name', 'Email / Lab Room', 'Role / Workstation', 'Status', 'Time In / Last Active', 'Time Out / Campus'],
      ...users.map(u => ['USER_ACCOUNT', u.id, `"${u.name}"`, u.email, u.role, u.status, `"${u.lastActive}"`, `"${u.campus}"`]),
      ...qrLogs.map(q => ['QR_ATTENDANCE', q.studentId, `"${q.studentName}"`, `"${q.laboratoryRoom}"`, q.workstation, `${q.status} (${q.logoutType})`, q.timeIn, q.timeOut])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_Users_And_QR_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported Users & Student QR Attendance Ledger to CSV.');
  };

  // ============================================================
  // FILTERS & METRICS
  // ============================================================
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = (searchQuery || '').toLowerCase();
      const m1 =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);
      const m2 = roleFilter === 'ALL' || u.role === roleFilter;
      const m3 = statusFilter === 'ALL' || u.status === statusFilter;
      return m1 && m2 && m3;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const filteredQrLogs = useMemo(() => {
    return qrLogs.filter(q => {
      const s = (qrSearchQuery || '').toLowerCase();
      const m1 =
        !s ||
        (q.studentName || '').toLowerCase().includes(s) ||
        (q.studentId || '').toLowerCase().includes(s) ||
        (q.workstation || '').toLowerCase().includes(s) ||
        (q.laboratoryRoom || '').toLowerCase().includes(s);
      const m2 = qrStatusFilter === 'ALL' || q.status === qrStatusFilter || q.logoutType === qrStatusFilter;
      const m3 = qrLabFilter === 'ALL' || (q.laboratoryRoom || '').toLowerCase().includes(qrLabFilter.toLowerCase());
      return m1 && m2 && m3;
    });
  }, [qrLogs, qrSearchQuery, qrStatusFilter, qrLabFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const adminCount = users.filter(u => u.role.includes('ADMIN') || u.role === 'LAB_MANAGER').length;
  const facultyTechCount = users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'TECHNICIAN').length;
  const activeSessionsCount = qrLogs.filter(q => q.status === 'IN_SESSION').length;
  return (
    <div className="access-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7 text-slate-800  font-sans select-none relative">
      {/* 3D EXTRUDED DEPTH & TACTILE KEYCAP CSS */}
      <style>{`
        .access-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 10px 0 #94a3b8,
            0 22px 45px -10px rgba(15, 23, 42, 0.25),
            inset 0 2px 0 #ffffff;
        }
        .card-3d-lift {
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
          transform: translateZ(0);
        }
        .card-3d-lift:hover {
          transform: translate3d(0, -4px, 0);
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

      {/* DATALISTS */}
      <datalist id="user-role-list">
        <option value="SUPER_ADMIN" />
        <option value="LAB_MANAGER" />
        <option value="INSTRUCTOR" />
        <option value="TECHNICIAN" />
      </datalist>
      <datalist id="lab-room-list">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
        <option value="Server Room" />
      </datalist>
      <datalist id="workstation-list">
        <option value="PC-001" />
        <option value="PC-002" />
        <option value="PC-005" />
        <option value="PC-008" />
        <option value="PC-012" />
        <option value="PC-014" />
      </datalist>

      {/* =====================================================================
          1. OBSIDIAN 3D COMMAND HEADER BANNER
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl shadow-[0_5px_0_#1e1b4b,0_0_25px_rgba(99,102,241,0.55)]">
              <Shield className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>AUTO TIME-IN / TIME-OUT CLOCK • {liveClockStr}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAutoTimeoutEnabled(!autoTimeoutEnabled);
                    notify(
                      !autoTimeoutEnabled
                        ? '30-Second Auto-Timeout Guard enabled for active QR sessions.'
                        : '30-Second Auto-Timeout Guard paused.'
                    );
                  }}
                  className={`px-2.5 py-0.5 rounded-full font-mono font-black text-[10px] border transition cursor-pointer ${
                    autoTimeoutEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle 30-Second Auto-Timeout for Active Student QR Sessions"
                >
                  ⏱️ 30s AUTO-TIMEOUT: {autoTimeoutEnabled ? 'ON' : 'PAUSED'}
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                User Access Control &amp; Student QR Session Logs
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Automatic real-time QR Time-In &amp; Time-Out stamping, role permissions, and session duration tracking • {activeCampus}
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchAll}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
              <span>Sync Now</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserFormData({ firstName: '', lastName: '', email: '', role: 'TECHNICIAN' });
                setIsAddUserModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Register New User</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQrFormData({
                  studentId: '',
                  studentName: '',
                  laboratoryRoom: 'ComLab 1 (ICT)',
                  workstation: 'PC-001',
                  date: getNowDateString(),
                  timeIn: getNowTimeString(),
                  timeOut: '--:--',
                  duration: 'In Session',
                  logoutType: 'ACTIVE',
                  status: 'IN_SESSION'
                });
                setIsAddQrModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#064e3b] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              <span>Student QR Scan (Auto Time-In/Out)</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => setViewMode('UNIFIED_ALL')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'UNIFIED_ALL'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_3px_0_#0284c7]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              Unified Access &amp; QR View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('USERS_ONLY')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'USERS_ONLY'
                  ? 'bg-indigo-400 text-slate-950 shadow-[0_3px_0_#312e81]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              User Accounts &amp; RBAC ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('QR_LOGS_ONLY')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'QR_LOGS_ONLY'
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_3px_0_#065f46]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              Student QR Attendance Logs ({qrLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-300" />
              <span>Print Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 EXTRUDED 3D KPI CUBES
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a,0_16px_30px_rgba(37,99,235,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 block">
              TOTAL ACCOUNTS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">{totalUsers} Users</p>
            <span className="text-[11px] text-blue-200 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Registered Personnel
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Users className="w-6 h-6 text-cyan-300" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b,0_16px_30px_rgba(16,185,129,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
              ACTIVE ACCESS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {activeUsers} / {totalUsers}
            </p>
            <span className="text-[11px] text-emerald-200 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" /> System Access Enabled
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <UserCheck className="w-6 h-6 text-emerald-300" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 text-white border-2 border-indigo-400/50 shadow-[0_8px_0_#312e81,0_16px_30px_rgba(99,102,241,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-200 block">
              ROLE CLEARANCE
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {adminCount} Admin / {facultyTechCount} Staff
            </p>
            <span className="text-[11px] text-indigo-200 font-bold">Full RBAC Governance</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Shield className="w-6 h-6 text-indigo-200" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f,0_16px_30px_rgba(245,158,11,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
              ACTIVE QR SESSIONS
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {activeSessionsCount} In Session
            </p>
            <span className="text-[11px] text-amber-100 font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> {qrLogs.length} Total Recorded Scans
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Monitor className="w-6 h-6 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. SECTION A: USER ACCOUNTS & ACCESS CONTROL MATRIX
         ===================================================================== */}
      {(viewMode === 'UNIFIED_ALL' || viewMode === 'USERS_ONLY') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-cyan-400 rounded-2xl shadow-[0_3px_0_#1e3a8a]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                  ROLE-BASED ACCESS CONTROL (RBAC)
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  User Accounts &amp; Access Permissions ({filteredUsers.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-blue-600" />
                <input
                  type="text"
                  placeholder="Search name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="LAB_MANAGER">Lab Manager</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="TECHNICIAN">Technician</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-900 font-mono font-black uppercase text-[10px] text-cyan-300 border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">User &amp; Email</th>
                  <th className="p-3.5">Role Clearance</th>
                  <th className="p-3.5">Assigned Campus</th>
                  <th className="p-3.5">Access Status</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-blue-600" /> {user.email}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-mono font-black text-[10px] border shadow-[0_2px_0_rgba(0,0,0,0.12)] inline-block ${
                            user.role.includes('ADMIN')
                              ? 'bg-indigo-600 text-white border-indigo-700'
                              : user.role === 'INSTRUCTOR'
                              ? 'bg-blue-600 text-white border-blue-700'
                              : user.role === 'LAB_MANAGER'
                              ? 'bg-purple-600 text-white border-purple-700'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{user.campus}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-black text-[10px] border ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">{user.lastActive}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={`px-2.5 py-1 font-black text-[10px] rounded-xl transition border cursor-pointer ${
                              user.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetUserPin(user)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-slate-950 rounded-xl border border-amber-200 transition cursor-pointer"
                            title="Reset Password / Security PIN"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingUser(user)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                            title="Inspect Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(user)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUserId(user.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                      No user accounts found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. SECTION B: STUDENT LAB ATTENDANCE & PC SESSION LOGS (AUTO TIME-IN/OUT)
         ===================================================================== */}
      {(viewMode === 'UNIFIED_ALL' || viewMode === 'QR_LOGS_ONLY') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-2xl shadow-[0_3px_0_#064e3b]">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-indigo-600 uppercase">
                    AUTOMATIC QR TIME-IN &amp; TIME-OUT STREAM
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-mono font-black border border-emerald-300 animate-pulse">
                    LIVE 3s SYNC
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Student Lab Attendance &amp; PC Session Logs ({filteredQrLogs.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-indigo-600" />
                <input
                  type="text"
                  placeholder="Search student, ID, or PC-001..."
                  value={qrSearchQuery}
                  onChange={(e) => setQrSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <select
                value={qrLabFilter}
                onChange={(e) => setQrLabFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All ComLabs</option>
                <option value="ComLab 1">ComLab 1</option>
                <option value="ComLab 2">ComLab 2</option>
                <option value="ComLab 3">ComLab 3</option>
              </select>

              <select
                value={qrStatusFilter}
                onChange={(e) => setQrStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Logs</option>
                <option value="IN_SESSION">Active Session</option>
                <option value="COMPLETED">Completed</option>
                <option value="AUTO_TIMEOUT">Auto Timeout</option>
                <option value="ADMIN_OVERRIDE">Admin Override</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-900 font-mono font-black uppercase text-[10px] text-cyan-300 border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">Student &amp; ID</th>
                  <th className="p-3.5">Lab / Workstation</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Auto Time In</th>
                  <th className="p-3.5">Auto Time Out</th>
                  <th className="p-3.5">Live Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredQrLogs.length > 0 ? (
                  filteredQrLogs.map(log => {
                    const elapsed = Math.min(AUTO_TIMEOUT_SECONDS, Number(log.elapsedSeconds) || 1);
                    const pct = Math.min(100, Math.round((elapsed / AUTO_TIMEOUT_SECONDS) * 100));

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-blue-50/50 transition ${
                          log.status === 'IN_SESSION' ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-black text-slate-900">{log.studentName}</div>
                          <div className="text-[10px] text-indigo-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                            <QrCode className="w-3 h-3" /> {log.studentId}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{log.laboratoryRoom}</div>
                          <div className="text-[10px] text-blue-700 font-mono font-black mt-0.5">
                            <Monitor className="w-3 h-3 inline mr-1" /> {log.workstation}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          <Calendar className="w-3 h-3 inline mr-1 text-slate-400" /> {log.date}
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-black">
                            {log.timeIn}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-black ${
                              log.timeOut === '--:--'
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {log.timeOut}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div className="font-black text-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" /> {log.duration}
                          </div>
                          {log.status === 'IN_SESSION' && autoTimeoutEnabled && (
                            <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-black text-[10px] border shadow-[0_2px_0_rgba(0,0,0,0.12)] ${
                              log.status === 'IN_SESSION'
                                ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                                : log.logoutType === 'AUTO_TIMEOUT'
                                ? 'bg-amber-500 text-slate-950 border-amber-600'
                                : log.logoutType === 'ADMIN_OVERRIDE'
                                ? 'bg-purple-600 text-white border-purple-700'
                                : 'bg-blue-600 text-white border-blue-700'
                            }`}
                          >
                            {log.status === 'IN_SESSION' ? (
                              <Activity className="w-3 h-3" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {log.status === 'IN_SESSION'
                              ? 'ACTIVE'
                              : log.logoutType === 'AUTO_TIMEOUT'
                              ? 'AUTO TIMEOUT'
                              : log.logoutType === 'ADMIN_OVERRIDE'
                              ? 'FORCED LOGOUT'
                              : 'COMPLETED'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.status === 'IN_SESSION' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStudentScanOutOrForceLogout(log.id, 'MANUAL_SCAN')}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl shadow-[0_2px_0_#065f46] transition flex items-center gap-1 cursor-pointer"
                                  title="Record Automatic Student QR Time-Out Now"
                                >
                                  <QrCode className="w-3 h-3" /> Scan Out
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStudentScanOutOrForceLogout(log.id, 'ADMIN_OVERRIDE')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl shadow-[0_2px_0_#78350f] transition flex items-center gap-1 cursor-pointer"
                                  title="Force Logout Session (Auto Time-Out)"
                                >
                                  <LogOut className="w-3 h-3" /> Force Logout
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditQrLog(log)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="Edit QR Log"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingQrLogId(log.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Delete QR Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 font-bold">
                      No attendance logs found. Waiting for student QR scan...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          ALL MODALS (USERS & AUTOMATIC QR ATTENDANCE LOGS)
         ===================================================================== */}

      {/* MODAL 1: ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Register New User Account
              </h3>
              <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="name@jrmsu.edu.ph"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label className="block mb-1">System Role</label>
                <input
                  type="text"
                  list="user-role-list"
                  required
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600 font-mono font-black"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Default initial credential: <strong className="text-blue-700">LabTrack@2026!</strong>
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-3d-bevel px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Update User Account
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label className="block mb-1">Role</label>
                <input
                  type="text"
                  list="user-role-list"
                  required
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600 font-mono font-black"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-3d-bevel px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INSPECT USER PROFILE */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> User Security Clearance
              </h3>
              <button type="button" onClick={() => setInspectingUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3.5">
              <IsometricAccessRig
                variant={inspectingUser.role.includes('ADMIN') ? 'ADMIN_VAULT' : 'FACULTY_NODE'}
                badgeText={inspectingUser.role.slice(0, 6)}
              />
              <div className="min-w-0">
                <p className="font-black text-white text-sm truncate">{inspectingUser.name}</p>
                <p className="font-mono text-[11px] text-cyan-300 truncate">{inspectingUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black border border-emerald-400/40">
                  {inspectingUser.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Account ID:</span>
                <strong className="text-slate-900">{inspectingUser.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clearance:</span>
                <strong className="text-blue-700">{inspectingUser.role}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Active:</span>
                <strong className="text-emerald-700">{inspectingUser.lastActive}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectingUser(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#020617] cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE USER */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this user account?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="flex-1 py-2.5 bg-slate-100 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deletingUserId)}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: STUDENT QR SCAN (AUTOMATIC TIME-IN & AUTOMATIC TIME-OUT) */}
      {isAddQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#064e3b,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-emerald-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" /> Student QR Scan (Auto Time-In / Out)
              </h3>
              <button type="button" onClick={() => setIsAddQrModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Automatic Live Clock Banner */}
            <div
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-xs font-mono ${
                matchedActiveStudentLog
                  ? 'bg-rose-950 text-white border-rose-400'
                  : 'bg-slate-900 text-white border-emerald-400'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block text-cyan-300">
                  {matchedActiveStudentLog
                    ? '⚡ ACTIVE SESSION DETECTED — AUTO TIME-OUT MODE'
                    : '⚡ NEW SCAN DETECTED — AUTO TIME-IN MODE'}
                </span>
                <span className="text-sm font-black text-white">
                  {getNowDateString()} • {liveClockStr}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl font-black text-[10px] ${
                  matchedActiveStudentLog ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'
                }`}
              >
                {matchedActiveStudentLog ? 'AUTO TIME-OUT' : 'AUTO TIME-IN'}
              </span>
            </div>

            <form onSubmit={handleAddQrLogSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Student ID (Scan / Type)</label>
                  <input
                    type="text"
                    required
                    value={qrFormData.studentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = qrLogs.find(
                        l => l.status === 'IN_SESSION' && l.studentId.toLowerCase() === val.trim().toLowerCase()
                      );
                      setQrFormData({
                        ...qrFormData,
                        studentId: val,
                        studentName: match ? match.studentName : qrFormData.studentName,
                        laboratoryRoom: match ? match.laboratoryRoom : qrFormData.laboratoryRoom,
                        workstation: match ? match.workstation : qrFormData.workstation
                      });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-emerald-600"
                    placeholder="e.g. 2024-IS-0142"
                  />
                </div>
                <div>
                  <label className="block mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={qrFormData.studentName}
                    onChange={(e) => setQrFormData({ ...qrFormData, studentName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-emerald-600"
                    placeholder="e.g. Maria Clara Santos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-list"
                    required
                    value={qrFormData.laboratoryRoom}
                    onChange={(e) => setQrFormData({ ...qrFormData, laboratoryRoom: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Workstation</label>
                  <input
                    type="text"
                    list="workstation-list"
                    required
                    value={qrFormData.workstation}
                    onChange={(e) => setQrFormData({ ...qrFormData, workstation: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Automatic Timestamp Preview Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Auto Time In</span>
                  <strong className="text-emerald-700 text-xs">
                    {matchedActiveStudentLog ? matchedActiveStudentLog.timeIn : liveClockStr}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Auto Time Out</span>
                  <strong className={matchedActiveStudentLog ? 'text-rose-600 text-xs' : 'text-slate-400 text-xs'}>
                    {matchedActiveStudentLog ? liveClockStr : '--:-- (On Scan Out)'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQrModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 text-white rounded-xl font-black cursor-pointer disabled:opacity-50 ${
                    matchedActiveStudentLog
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_4px_0_#881337]'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_0_#064e3b]'
                  }`}
                >
                  {matchedActiveStudentLog
                    ? `Confirm Auto Time-Out (${liveClockStr})`
                    : `Confirm Auto Time-In (${liveClockStr})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: FULL EDIT QR LOG */}
      {editingQrLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Student QR Attendance Log
              </h3>
              <button type="button" onClick={() => setEditingQrLog(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateQrLogSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Student ID</label>
                  <input
                    type="text"
                    value={qrFormData.studentId}
                    onChange={(e) => setQrFormData({ ...qrFormData, studentId: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Student Name</label>
                  <input
                    type="text"
                    value={qrFormData.studentName}
                    onChange={(e) => setQrFormData({ ...qrFormData, studentName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-list"
                    value={qrFormData.laboratoryRoom}
                    onChange={(e) => setQrFormData({ ...qrFormData, laboratoryRoom: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Workstation</label>
                  <input
                    type="text"
                    list="workstation-list"
                    value={qrFormData.workstation}
                    onChange={(e) => setQrFormData({ ...qrFormData, workstation: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Time In</label>
                  <input
                    type="text"
                    value={qrFormData.timeIn}
                    onChange={(e) => setQrFormData({ ...qrFormData, timeIn: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Time Out</label>
                  <input
                    type="text"
                    value={qrFormData.timeOut}
                    onChange={(e) => setQrFormData({ ...qrFormData, timeOut: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Session Status</label>
                  <select
                    value={qrFormData.status}
                    onChange={(e) => {
                      const nextSt = e.target.value as StudentQrLog['status'];
                      setQrFormData({
                        ...qrFormData,
                        status: nextSt,
                        timeOut: nextSt === 'COMPLETED' && qrFormData.timeOut === '--:--' ? getNowTimeString() : nextSt === 'IN_SESSION' ? '--:--' : qrFormData.timeOut,
                        logoutType: nextSt === 'COMPLETED' && qrFormData.logoutType === 'ACTIVE' ? 'MANUAL_SCAN' : nextSt === 'IN_SESSION' ? 'ACTIVE' : qrFormData.logoutType
                      });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none font-bold focus:border-blue-600"
                  >
                    <option value="IN_SESSION">IN SESSION (ACTIVE)</option>
                    <option value="COMPLETED">COMPLETED (AUTO STAMP TIME-OUT)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Logout Type</label>
                  <select
                    value={qrFormData.logoutType}
                    onChange={(e) => setQrFormData({ ...qrFormData, logoutType: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none font-bold focus:border-blue-600"
                  >
                    <option value="ACTIVE">Active (In Session)</option>
                    <option value="MANUAL_SCAN">Manual Scan</option>
                    <option value="AUTO_TIMEOUT">Auto Timeout</option>
                    <option value="ADMIN_OVERRIDE">Admin Override</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQrLog(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: DELETE QR LOG */}
      {deletingQrLogId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Delete QR Attendance Log?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this student attendance log?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingQrLogId(null)}
                className="flex-1 py-2.5 bg-slate-100 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQrLog(deletingQrLogId)}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccessManagementView;











