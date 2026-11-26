import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Clock, Monitor, Search, RefreshCw, MapPin,
  AlertCircle, Activity, LogOut, Calendar,
  TrendingUp, Timer, X, Trash2, Eye, ShieldAlert,
  Download, Filter, CheckCircle2, Sparkles, QrCode, Edit3, Grid, List, Zap
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export interface StudentSession {
  id: string;
  studentName: string;
  studentId: string;
  workstationCode: string;
  laboratoryName: string;
  campusName: string;
  sessionStartUtc: string;
  sessionEndUtc: string | null;
  timeInFormatted?: string;
  timeOutFormatted?: string;
  elapsedSeconds?: number;
  durationMinutes: number;
  status: 'ACTIVE' | 'COMPLETED' | 'AUTO_TIMEOUT' | 'FORCED_LOGOUT';
}

export interface StudentSessionsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

const AUTO_TIMEOUT_SECONDS = 30;

// ============================================================================
// SMART TIME & DURATION FORMATTERS (AUTOMATIC REAL-TIME PRECISION)
// ============================================================================
const getNowTimeFormatted = (): string =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

const formatIsoTime = (iso: string | null | undefined, fallbackStr?: string): string => {
  if (fallbackStr && fallbackStr !== '--:--' && fallbackStr !== ' - ') return fallbackStr;
  if (!iso || iso === '--:--') return '--:--';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return String(iso);
  }
};

const formatIsoDate = (iso: string | null | undefined): string => {
  if (!iso) return 'Today';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(iso);
  }
};

const formatLiveDuration = (elapsedSeconds?: number, durationMinutes?: number): string => {
  if (typeof elapsedSeconds === 'number' && elapsedSeconds > 0) {
    if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  const m = Number(durationMinutes) || 0;
  if (m <= 0) return '1s';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

// ============================================================================
// REALISTIC 3D MINI DESKTOP PC RIG (FOR TABLE ROWS, CARDS & INSPECTOR MODAL)
// ============================================================================
const MiniDesktopPcRig: React.FC<{
  status: StudentSession['status'];
  pcCode: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, pcCode, size = 'sm' }) => {
  const isActive = status === 'ACTIVE';
  const isTimeout = status === 'AUTO_TIMEOUT';
  const isForced = status === 'FORCED_LOGOUT';

  const accentHex = isActive
    ? '#10b981'
    : isTimeout
    ? '#f59e0b'
    : isForced
    ? '#f43f5e'
    : '#38bdf8';

  const scrTop = isActive
    ? '#059669'
    : isTimeout
    ? '#b45309'
    : isForced
    ? '#be123°C'
    : '#1d4ed8';

  const sizeClass =
    size === 'lg' ? 'w-28 h-20' : size === 'md' ? 'w-20 h-14' : 'w-12 h-9';

  const uid = `mini-pc-${pcCode.replace(/[^a-zA-Z0-9]/g, '')}-${status}-${size}`;

  return (
    <div className={`${sizeClass} shrink-0 relative flex items-center justify-center select-none`}>
      <svg viewBox="0 0 120 84" className="w-full h-full drop-shadow-[0_4px_6px_rgba(15,23,42,0.3)]">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={scrTop} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Desk Mat Base */}
        <rect x="6" y="68" width="108" height="10" rx="4" fill="#0f172a" stroke={accentHex} strokeWidth="1" strokeOpacity="0.6" />

        {/* Monitor Stand & Frame */}
        <rect x="38" y="54" width="8" height="14" rx="1.5" fill="#475569" />
        <polygon points="30,68 54,68 58,72 26,72" fill="#64748b" />
        <rect x="10" y="10" width="64" height="45" rx="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.8" />
        <rect x="13" y="13" width="58" height="38" rx="2.5" fill={`url(#${uid})`} stroke={accentHex} strokeWidth="0.9" />

        {/* Screen Code Lines */}
        <line x1="18" y1="20" x2="40" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="26" x2="54" y2="26" stroke={accentHex} strokeWidth="1.6" strokeLinecap="round" />
        <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="900">
          {pcCode}
        </text>

        {/* Tempered Glass System Unit Tower */}
        <rect x="80" y="10" width="28" height="60" rx="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
        <rect x="83" y="14" width="22" height="44" rx="2" fill="#020617" stroke={accentHex} strokeWidth="0.9" />

        {/* Spinning Cooling Fan */}
        <g
          className={isActive ? 'animate-pulse' : ''}
          style={{ transformOrigin: '94px 27px', animationDuration: '0.9s' }}
        >
          <circle cx="94" cy="27" r="5.5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="27" r="1.8" fill="#ffffff" />
        </g>

        {/* Bottom Fan */}
        <g
          className={isActive ? 'animate-pulse' : ''}
          style={{ transformOrigin: '94px 45px', animationDuration: '0.9s' }}
        >
          <circle cx="94" cy="45" r="5.5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="45" r="1.8" fill={accentHex} />
        </g>

        {/* Keyboard & Mouse */}
        <polygon points="16,70 62,70 65,75 13,75" fill="#1e293b" stroke={accentHex} strokeWidth="0.8" />
        <ellipse cx="72" cy="72.5" rx="3.5" ry="2.2" fill="#1e293b" stroke={accentHex} strokeWidth="0.8" />
      </svg>
    </div>
  );
};

// ============================================================================
// LEVITATING 3D ISOMETRIC QR TERMINAL & WORKSTATION SESSION RIG
// ============================================================================
const IsometricSessionRig: React.FC<{ activeCount: number; isPolling: boolean }> = ({
  activeCount,
  isPolling
}) => {
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full ses-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="sesBlueCoreGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.96" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className={isPolling ? 'ses-circuit-flow' : ''}
        />

        <g>
          <polygon points="96,18 116,10 131,16 111,24" fill="#334155" stroke="#93c5fd" strokeWidth="0.9" />
          <polygon points="96,18 111,24 111,75 96,69" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.3" />
          <polygon points="111,24 131,16 131,67 111,75" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.1" />
          <ellipse
            cx="103.5"
            cy="37"
            rx="4.5"
            ry="7"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className={isPolling ? 'animate-pulse' : ''}
            style={{ transformOrigin: '103.5px 37px', animationDuration: '2.4s' }}
          />
          <ellipse
            cx="103.5"
            cy="55"
            rx="4.5"
            ry="7"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className={isPolling ? 'animate-pulse' : ''}
            style={{ transformOrigin: '103.5px 55px', animationDuration: '2.4s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className={isPolling ? 'animate-ping' : ''} />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#sesBlueCoreGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="24" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
          <text
            x="52"
            y="50"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="900"
            fontFamily="monospace"
            transform="skewY(-12)"
          >
            {activeCount} ACTIVE
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke="#34d399" strokeWidth="1.1" />
      </svg>
    </div>
  );
};

const DEFAULT_STUDENT_SESSIONS_SEED: StudentSession[] = [
  {
    id: 'QRL-2001',
    studentName: 'Maria Clara Santos',
    studentId: '2024-IS-0142',
    workstationCode: 'PC-008',
    laboratoryName: 'ComLab 1 (Networking & ICT)',
    campusName: 'JRMSU Dapitan Main Campus',
    sessionStartUtc: new Date(Date.now() - 8000).toISOString(),
    sessionEndUtc: null,
    timeInFormatted: getNowTimeFormatted(),
    timeOutFormatted: '--:--',
    elapsedSeconds: 8,
    durationMinutes: 1,
    status: 'ACTIVE'
  },
  {
    id: 'QRL-2002',
    studentName: 'Kevin Rey Bautista',
    studentId: '2024-IT-0188',
    workstationCode: 'PC-014',
    laboratoryName: 'ComLab 2 (Multimedia & Graphics)',
    campusName: 'JRMSU Dapitan Main Campus',
    sessionStartUtc: new Date(Date.now() - 1800 * 1000).toISOString(),
    sessionEndUtc: new Date(Date.now() - 1770 * 1000).toISOString(),
    timeInFormatted: '08:00:12 AM',
    timeOutFormatted: '08:00:42 AM',
    elapsedSeconds: 30,
    durationMinutes: 1,
    status: 'AUTO_TIMEOUT'
  },
  {
    id: 'QRL-2003',
    studentName: 'Angela Mae Villanueva',
    studentId: '2024-CS-0215',
    workstationCode: 'PC-005',
    laboratoryName: 'ComLab 3 (AI & Software Eng)',
    campusName: 'JRMSU Dapitan Main Campus',
    sessionStartUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
    sessionEndUtc: new Date(Date.now() - 900 * 1000).toISOString(),
    timeInFormatted: '07:45:00 AM',
    timeOutFormatted: '08:30:00 AM',
    elapsedSeconds: 2700,
    durationMinutes: 45,
    status: 'COMPLETED'
  },
  {
    id: 'QRL-2004',
    studentName: 'John Sven Morales',
    studentId: '2024-IS-0101',
    workstationCode: 'PC-002',
    laboratoryName: 'ComLab 1 (Networking & ICT)',
    campusName: 'JRMSU Dapitan Main Campus',
    sessionStartUtc: new Date(Date.now() - 5400 * 1000).toISOString(),
    sessionEndUtc: new Date(Date.now() - 1800 * 1000).toISOString(),
    timeInFormatted: '07:15:10 AM',
    timeOutFormatted: '08:15:10 AM',
    elapsedSeconds: 3600,
    durationMinutes: 60,
    status: 'COMPLETED'
  }
];

const QUICK_SCAN_STUDENTS = [
  { id: '2024-IS-0142', name: 'Maria Clara Santos', pc: 'PC-008', lab: 'ComLab 1 (Networking & ICT)' },
  { id: '2024-IS-0101', name: 'John Sven Morales', pc: 'PC-001', lab: 'ComLab 1 (Networking & ICT)' },
  { id: '2024-IT-0204', name: 'Bea Alonzo', pc: 'PC-011', lab: 'ComLab 2 (Multimedia & Graphics)' },
  { id: '2024-CS-0309', name: 'Piolo Pascual', pc: 'PC-021', lab: 'ComLab 3 (AI & Software Eng)' }
];

export const StudentSessionsView: React.FC<StudentSessionsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';

  // Persistent Sessions State (Shared with Admin QR Attendance Ledger)
  const [sessions, setSessions] = useState<StudentSession[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_student_sessions_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_STUDENT_SESSIONS_SEED;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'TIMEOUT'>('ALL');
  const [selectedLab, setSelectedLab] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoTimeoutEnabled, setAutoTimeoutEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [liveClockStr, setLiveClockStr] = useState<string>(getNowTimeFormatted());
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Interactive Modals State
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [editingSession, setEditingSession] = useState<StudentSession | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);

  // QR Scan / Auto Time-In & Time-Out Form State
  const [scanForm, setScanForm] = useState({
    studentId: '',
    studentName: '',
    workstationCode: 'PC-001',
    laboratoryName: 'ComLab 1 (Networking & ICT)'
  });

  const triggerToast = useCallback(
    (msg: string) => {
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 3500);
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // Detect if typed Student ID is already ACTIVE (so scanning again triggers Automatic Time-Out!)
  const matchedActiveSessionForScan = useMemo(() => {
    const idClean = scanForm.studentId.trim().toLowerCase();
    if (!idClean) return null;
    return (
      sessions.find(
        s => s.status === 'ACTIVE' && s.studentId.trim().toLowerCase() === idClean
      ) || null
    );
  }, [sessions, scanForm.studentId]);

  // Persist to localStorage & sync with Admin QR Attendance (`labtrack_qr_attendance_logs_v2`)
  useEffect(() => {
    try {
      if (sessions.length > 0) {
        localStorage.setItem('labtrack_student_sessions_v3', JSON.stringify(sessions));

        const adminQrMirror = sessions.map(s => ({
          id: s.id,
          studentId: s.studentId,
          studentName: s.studentName,
          laboratoryRoom: s.laboratoryName,
          workstation: s.workstationCode,
          date: formatIsoDate(s.sessionStartUtc),
          timeIn: s.timeInFormatted || formatIsoTime(s.sessionStartUtc),
          timeOut:
            s.status === 'ACTIVE'
              ? '--:--'
              : s.timeOutFormatted || formatIsoTime(s.sessionEndUtc),
          duration: formatLiveDuration(s.elapsedSeconds, s.durationMinutes),
          elapsedSeconds: s.elapsedSeconds || s.durationMinutes * 60,
          logoutType:
            s.status === 'ACTIVE'
              ? 'ACTIVE'
              : s.status === 'AUTO_TIMEOUT'
              ? 'AUTO_TIMEOUT'
              : s.status === 'FORCED_LOGOUT'
              ? 'ADMIN_OVERRIDE'
              : 'MANUAL_SCAN',
          status: s.status === 'ACTIVE' ? 'IN_SESSION' : 'COMPLETED'
        }));
        localStorage.setItem('labtrack_qr_attendance_logs_v2', JSON.stringify(adminQrMirror));
      }
    } catch {}
  }, [sessions]);

  // Fetch & Merge Sessions from Backend API + Admin QR Ledger
  const fetchSessions = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true);
      setError(null);

      let activeItems: any[] = [];
      try {
        const activeResp = await apiClient.get('/api/v1/pc-usage/active', {
          params: { pageNumber: 1, pageSize: 50 }
        });
        activeItems =
          activeResp.data?.data?.items ||
          activeResp.data?.data?.records ||
          activeResp.data?.items ||
          activeResp.data?.records ||
          (Array.isArray(activeResp.data?.data) ? activeResp.data.data : []) ||
          (Array.isArray(activeResp.data) ? activeResp.data : []);
      } catch {
        activeItems = [];
      }

      let historyItems: any[] = [];
      try {
        const historyResp = await apiClient.get('/api/v1/pc-usage/history', {
          params: { pageNumber: 1, pageSize: 50 }
        });
        const hData = historyResp.data?.data || historyResp.data;
        historyItems = hData?.items || hData?.records || hData || [];
      } catch {
        historyItems = [];
      }

      const combined = [...activeItems, ...historyItems];

      if (combined.length > 0) {
        const normalized: StudentSession[] = combined.map((s: any) => {
          const startIso = s.sessionStartUtc || s.startTimeUtc || s.startedAt || new Date().toISOString();
          const endIso = s.sessionEndUtc || s.endTimeUtc || s.endedAt || null;
          const rawSt = String(s.status || (endIso ? 'COMPLETED' : 'ACTIVE')).toUpperCase();
          const elapsedSecs = endIso
            ? Math.max(1, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000))
            : Math.max(1, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));

          return {
            id: String(s.id || s.sessionId || `QRL-${Math.random()}`),
            studentName: s.studentName || s.userName || s.fullName || 'Unknown Student',
            studentId: s.studentId || s.studentNumber || s.userId?.substring(0, 8) || 'N/A',
            workstationCode:
              s.workstationCode || s.workstationName || s.pcNumber || s.workstationId?.substring(0, 8) || 'PC-001',
            laboratoryName: s.laboratoryName || s.labName || s.labRoom || 'ComLab 1 (Networking & ICT)',
            campusName: s.campusName || s.campus || activeCampus,
            sessionStartUtc: startIso,
            sessionEndUtc: endIso,
            timeInFormatted: formatIsoTime(startIso),
            timeOutFormatted: endIso ? formatIsoTime(endIso) : '--:--',
            elapsedSeconds: elapsedSecs,
            durationMinutes: Number(s.durationMinutes) || Math.max(1, Math.round(elapsedSecs / 60)),
            status: (rawSt === 'IN_SESSION' ? 'ACTIVE' : rawSt) as StudentSession['status']
          };
        });

        setSessions(prev => {
          const map = new Map<string, StudentSession>();
          normalized.forEach(item => map.set(item.id, item));
          prev.forEach(local => {
            if (!map.has(local.id)) map.set(local.id, local);
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => {
            if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
            if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
            return new Date(b.sessionStartUtc).getTime() - new Date(a.sessionStartUtc).getTime();
          });
          return merged;
        });
      }

      setLastRefresh(new Date());
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setError('Session token expired — displaying synchronized local ledger.');
      }
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [activeCampus]);

  useEffect(() => {
    fetchSessions(true);
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchSessions(false), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  // ============================================================================
  // 1-SECOND REAL-TIME AUTOMATIC TIME-IN / TIME-OUT & DURATION ENGINE
  // ============================================================================
  useEffect(() => {
    const ticker = setInterval(() => {
      const nowTimeStr = getNowTimeFormatted();
      const nowIso = new Date().toISOString();
      setLiveClockStr(nowTimeStr);

      setSessions(prev =>
        prev.map(s => {
          if (s.status !== 'ACTIVE') return s;
          const nextSecs = (Number(s.elapsedSeconds) || 1) + 1;

          if (autoTimeoutEnabled && nextSecs >= AUTO_TIMEOUT_SECONDS) {
            return {
              ...s,
              status: 'AUTO_TIMEOUT',
              sessionEndUtc: nowIso,
              timeOutFormatted: nowTimeStr,
              elapsedSeconds: AUTO_TIMEOUT_SECONDS,
              durationMinutes: 1
            };
          }

          return {
            ...s,
            elapsedSeconds: nextSecs,
            durationMinutes: Math.max(1, Math.ceil(nextSecs / 60))
          };
        })
      );
    }, 1000);

    return () => clearInterval(ticker);
  }, [autoTimeoutEnabled]);

  // Keep selectedSession modal live-synced with the 1-second ticker
  useEffect(() => {
    if (!selectedSession) return;
    const latest = sessions.find(s => s.id === selectedSession.id);
    if (latest) setSelectedSession(latest);
  }, [sessions, selectedSession]);

  // ============================================================================
  // AUTOMATIC STUDENT QR SCAN TIME-IN & TIME-OUT HANDLERS
  // ============================================================================
  const handleStudentQrScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStuId = scanForm.studentId.trim().toUpperCase();
    if (!cleanStuId) return;

    const nowIso = new Date().toISOString();
    const nowTimeStr = getNowTimeFormatted();

    // SMART CHECK: If student is already ACTIVE, scanning again automatically records their TIME OUT!
    const existingActive = sessions.find(
      s => s.status === 'ACTIVE' && s.studentId.trim().toUpperCase() === cleanStuId
    );

    if (existingActive) {
      const totalSecs = Math.max(1, Number(existingActive.elapsedSeconds) || 1);
      setSessions(prev =>
        prev.map(s =>
          s.id === existingActive.id
            ? {
                ...s,
                status: 'COMPLETED',
                sessionEndUtc: nowIso,
                timeOutFormatted: nowTimeStr,
                elapsedSeconds: totalSecs,
                durationMinutes: Math.max(1, Math.ceil(totalSecs / 60))
              }
            : s
        )
      );

      try {
        await apiClient.post(`/api/v1/pc-usage/end-session-release/${existingActive.id}`, {}).catch(() => {});
      } catch {}

      setIsScanModalOpen(false);
      triggerToast(
        `Automatic Time-Out (${nowTimeStr}) recorded for ${existingActive.studentName} on ${existingActive.workstationCode}!`
      );
      return;
    }

    // Otherwise: AUTOMATICALLY STAMP TIME-IN NOW!
    const newSession: StudentSession = {
      id: `QRL-${Math.floor(2100 + Math.random() * 7800)}`,
      studentId: cleanStuId,
      studentName: scanForm.studentName.trim() || 'Verified Student',
      workstationCode: scanForm.workstationCode.trim().toUpperCase() || 'PC-001',
      laboratoryName: scanForm.laboratoryName.trim() || 'ComLab 1 (Networking & ICT)',
      campusName: activeCampus,
      sessionStartUtc: nowIso,
      sessionEndUtc: null,
      timeInFormatted: nowTimeStr,
      timeOutFormatted: '--:--',
      elapsedSeconds: 1,
      durationMinutes: 1,
      status: 'ACTIVE'
    };

    try {
      const res = await apiClient
        .post('/api/v1/pc-usage/scan-login', {
          workstationCode: newSession.workstationCode,
          laboratoryName: newSession.laboratoryName,
          studentId: newSession.studentId,
          studentName: newSession.studentName
        })
        .catch(() => null);
      const savedId = res?.data?.data?.id || res?.data?.data?.sessionId;
      if (savedId) newSession.id = String(savedId);
    } catch {}

    setSessions(prev => [newSession, ...prev]);
    setIsScanModalOpen(false);
    setScanForm({
      studentId: '',
      studentName: '',
      workstationCode: 'PC-001',
      laboratoryName: 'ComLab 1 (Networking & ICT)'
    });
    triggerToast(
      `Automatic Time-In (${nowTimeStr}) recorded for ${newSession.studentName} on ${newSession.workstationCode}!`
    );
  };

  // Automatic Time-Out when clicking Scan Out or Confirming Force Logout
  const handleEndOrForceLogoutSession = async (
    id: string,
    endStatus: 'COMPLETED' | 'FORCED_LOGOUT' = 'FORCED_LOGOUT'
  ) => {
    const nowIso = new Date().toISOString();
    const nowTimeStr = getNowTimeFormatted();
    const target = sessions.find(s => s.id === id);

    try {
      await apiClient.post(`/api/v1/pc-usage/end-session-release/${id}`, {}).catch(() => {});
    } catch {}

    setSessions(prev =>
      prev.map(s => {
        if (s.id === id) {
          const secs = Math.max(1, Number(s.elapsedSeconds) || 15);
          return {
            ...s,
            sessionEndUtc: nowIso,
            timeOutFormatted: nowTimeStr,
            elapsedSeconds: secs,
            durationMinutes: Math.max(1, Math.ceil(secs / 60)),
            status: endStatus
          };
        }
        return s;
      })
    );

    setTerminatingSessionId(null);
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }

    triggerToast(
      endStatus === 'COMPLETED'
        ? `Automatic Time-Out (${nowTimeStr}) recorded for ${target?.studentName || id}.`
        : `Session forcibly terminated (Time-Out: ${nowTimeStr}) for ${target?.studentName || id}.`
    );
  };

  // Smooth Animated Delete Functionality
  const handleDeleteSession = async (id: string) => {
    const target = sessions.find(s => s.id === id);
    setDeletingSessionId(null);
    setRemovingId(id);

    try {
      await apiClient.post(`/api/v1/pc-usage/end-session-release/${id}`, {}).catch(() => {});
    } catch {}

    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      setRemovingId(null);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
      triggerToast(`Removed session record for ${target?.studentName || id}.`);
    }, 280);
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const nowTimeStr = getNowTimeFormatted();
    const isNowActive = editingSession.status === 'ACTIVE';

    const updated: StudentSession = {
      ...editingSession,
      sessionEndUtc: isNowActive ? null : editingSession.sessionEndUtc || new Date().toISOString(),
      timeOutFormatted: isNowActive
        ? '--:--'
        : editingSession.timeOutFormatted === '--:--' || !editingSession.timeOutFormatted
        ? nowTimeStr
        : editingSession.timeOutFormatted
    };

    setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setEditingSession(null);
    triggerToast(`Updated session record for ${updated.studentName}.`);
  };

  const availableLabs = useMemo(() => {
    const labs = new Set<string>([
      'ComLab 1 (Networking & ICT)',
      'ComLab 2 (Multimedia & Graphics)',
      'ComLab 3 (AI & Software Eng)',
      'ComLab 4 (Cybersecurity & IoT)'
    ]);
    sessions.forEach(s => {
      if (s.laboratoryName && s.laboratoryName !== ' - ') {
        labs.add(s.laboratoryName);
      }
    });
    return Array.from(labs);
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
      if (statusFilter === 'COMPLETED' && s.status !== 'COMPLETED') return false;
      if (statusFilter === 'TIMEOUT' && s.status !== 'AUTO_TIMEOUT' && s.status !== 'FORCED_LOGOUT')
        return false;

      if (
        selectedLab !== 'ALL' &&
        !s.laboratoryName.toLowerCase().includes(selectedLab.split('(')[0].trim().toLowerCase())
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = (searchQuery || '').toLowerCase();
        return (
          (s.studentName || '').toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q) ||
          (s.workstationCode || '').toLowerCase().includes(q) ||
          (s.laboratoryName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, statusFilter, selectedLab, searchQuery]);

  const stats = useMemo(() => {
    const active = sessions.filter(s => s.status === 'ACTIVE').length;
    const total = sessions.length;
    const avgDuration =
      total > 0
        ? Math.max(1, Math.round(sessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 1), 0) / total))
        : 0;
    const today = sessions.filter(s => formatIsoDate(s.sessionStartUtc) === 'Today').length;
    return { active, total, avgDuration, today };
  }, [sessions]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500 text-white border-emerald-600 shadow-[0_2px_0_#065f46]';
      case 'AUTO_TIMEOUT':
        return 'bg-amber-500 text-slate-950 border-amber-600 shadow-[0_2px_0_#78350f]';
      case 'FORCED_LOGOUT':
        return 'bg-rose-600 text-white border-rose-700 shadow-[0_2px_0_#881337]';
      default:
        return 'bg-blue-600 text-white border-blue-700 shadow-[0_2px_0_#1e3a8a]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'ACTIVE NOW';
      case 'AUTO_TIMEOUT':
        return 'AUTO TIMEOUT';
      case 'FORCED_LOGOUT':
        return 'FORCED LOGOUT';
      default:
        return 'COMPLETED';
    }
  };

  const exportCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Workstation',
      'Laboratory',
      'Campus',
      'Date',
      'Auto Time In',
      'Auto Time Out',
      'Live Duration',
      'Status'
    ];
    const rows = filtered.map(s => [
      `"${s.studentId}"`,
      `"${s.studentName}"`,
      `"${s.workstationCode}"`,
      `"${s.laboratoryName}"`,
      `"${s.campusName}"`,
      `"${formatIsoDate(s.sessionStartUtc)}"`,
      `"${s.timeInFormatted || formatIsoTime(s.sessionStartUtc)}"`,
      `"${s.status === 'ACTIVE' ? '--:--' : s.timeOutFormatted || formatIsoTime(s.sessionEndUtc)}"`,
      `"${formatLiveDuration(s.elapsedSeconds, s.durationMinutes)}"`,
      `"${s.status}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRMSU_LabTrack_Sessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported Student Workstation Sessions to CSV.');
  };
  return (
    <div className="ses-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-6 font-sans text-slate-800 select-none  relative">
      {/* ADVANCED 3D EXTRUDED SHELL, PERSPECTIVE TILT & LASER SCANNER STYLES */}
      <style>{`
        .ses-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .ses-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .ses-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .ses-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -4px, 10px) rotateX(1.8deg);
        }
        .ses-row-3d {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, opacity 0.25s ease;
        }
        .ses-row-3d:hover {
          transform: translateX(4px);
        }
        .ses-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .ses-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .ses-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes sesRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .ses-rig-float {
          animation: sesRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes sesCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .ses-circuit-flow {
          animation: sesCircuitDash 1.4s linear infinite;
        }
        @keyframes sesHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .ses-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: sesHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes qrLaserSweep3D {
          0%, 100% { top: 8%; opacity: 0.4; }
          50% { top: 88%; opacity: 1; }
        }
        .qr-laser-beam {
          animation: qrLaserSweep3D 2.2s ease-in-out infinite;
        }
      `}</style>

      <datalist id="ses-workstation-list">
        <option value="PC-001" />
        <option value="PC-002" />
        <option value="PC-004" />
        <option value="PC-005" />
        <option value="PC-008" />
        <option value="PC-011" />
        <option value="PC-014" />
        <option value="PC-021" />
      </datalist>

      {/* LIVE TOAST BANNER */}
      {liveToast && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all animate-in slide-in-from-top duration-300 border-2 border-blue-400/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            <span className="text-xs font-black tracking-wide font-mono">{liveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            className="text-[10px] bg-white/20 hover:bg-white/30 font-mono px-2.5 py-0.5 rounded-full font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* =====================================================================
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR
         ===================================================================== */}
      <div className="ses-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricSessionRig activeCount={stats.active} isPolling={autoRefresh} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AUTO TIME-IN / TIME-OUT CLOCK • {liveClockStr}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !autoTimeoutEnabled;
                  setAutoTimeoutEnabled(next);
                  triggerToast(
                    next
                      ? '30-Second Auto-Timeout Guard enabled for active student sessions.'
                      : '30-Second Auto-Timeout Guard paused.'
                  );
                }}
                className={`px-2.5 py-0.5 rounded-full font-mono font-black text-[10px] border transition cursor-pointer ${
                  autoTimeoutEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                ⏱️ 30s AUTO-TIMEOUT: {autoTimeoutEnabled ? 'ON' : 'PAUSED'}
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Real-Time Student Sessions &amp; QR Attendance
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Automatic workstation Time-In &amp; Time-Out stamping, 3D desktop terminal tracking, and live duration telemetry • {activeCampus}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-mono font-black transition-all cursor-pointer border ${
              autoRefresh
                ? 'bg-blue-500/20 text-sky-200 border-blue-400/50 shadow-[0_4px_0_#020617]'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-sky-300' : ''}`} />
            <span>{autoRefresh ? 'LIVE SYNC ON' : 'PAUSED'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchSessions(true);
              triggerToast('Synchronized student sessions with Admin QR Ledger.');
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black transition cursor-pointer active:translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black transition cursor-pointer active:translate-y-0.5"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="ses-btn-3d flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Student QR Scan (Auto In/Out)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. 4 EXTRUDED 3D KPI SUMMARY CUBES (CLICK TO FILTER)
         ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={`ses-card-3d-lift bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white rounded-3xl p-5 border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'ACTIVE'
              ? 'border-white ring-4 ring-emerald-400/30 shadow-[0_8px_0_#064e3b]'
              : 'border-emerald-400/50 shadow-[0_6px_0_#064e3b]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-200 uppercase tracking-wider block">
              ACTIVE SESSIONS
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">{stats.active} Online</div>
            <p className="text-[11px] font-bold text-emerald-200 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" /> Live Workstation Stream
            </p>
          </div>
          <div className="p-2 bg-slate-950/40 border border-white/20 rounded-2xl">
            <MiniDesktopPcRig status="ACTIVE" pcCode={`${stats.active} ON`} size="sm" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('ALL')}
          className={`ses-card-3d-lift bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white rounded-3xl p-5 border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'ALL'
              ? 'border-sky-300 ring-4 ring-blue-400/25 shadow-[0_8px_0_#0f172a]'
              : 'border-blue-400/50 shadow-[0_6px_0_#0f172a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-sky-300 uppercase tracking-wider block">
              SESSIONS TODAY
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">{stats.today} Scans</div>
            <p className="text-[11px] font-bold text-slate-300 mt-1">Auto-stamped check-ins today</p>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Calendar className="w-6 h-6 text-sky-300" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`ses-card-3d-lift bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white rounded-3xl p-5 border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'COMPLETED'
              ? 'border-white ring-4 ring-indigo-400/30 shadow-[0_8px_0_#1e3a8a]'
              : 'border-indigo-400/50 shadow-[0_6px_0_#1e3a8a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-indigo-200 uppercase tracking-wider block">
              TOTAL SYSTEM LOGS
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">{stats.total} Logs</div>
            <p className="text-[11px] font-bold text-indigo-200 mt-1">Active + Historical records</p>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-indigo-200" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'TIMEOUT' ? 'ALL' : 'TIMEOUT')}
          className={`ses-card-3d-lift bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white rounded-3xl p-5 border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'TIMEOUT'
              ? 'border-white ring-4 ring-amber-400/30 shadow-[0_8px_0_#78350f]'
              : 'border-amber-300/60 shadow-[0_6px_0_#78350f]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-amber-100 uppercase tracking-wider block">
              AVG SESSION TIME
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
              {formatLiveDuration(undefined, stats.avgDuration)}
            </div>
            <p className="text-[11px] font-bold text-amber-100 mt-1">Mean workstation duration</p>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Timer className="w-6 h-6 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. FILTER, SEARCH & 3D VIEW SWITCHER BAR
         ===================================================================== */}
      <div className="ses-panel-3d p-4 rounded-3xl flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student name, ID, PC-008, or laboratory..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableLabs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 border-2 border-slate-300 px-3 py-2 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={selectedLab}
                onChange={e => setSelectedLab(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Laboratories</option>
                {availableLabs.map(lab => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter Chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'TIMEOUT', label: 'Timeouts' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 3D Table vs 3D Cards View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 text-xs font-black text-slate-600">
            <button
              type="button"
              onClick={() => setLayoutMode('TABLE')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'TABLE'
                  ? 'bg-slate-900 text-sky-300 shadow-[0_2px_0_#0f172a]'
                  : 'hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('CARDS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'CARDS'
                  ? 'bg-slate-900 text-sky-300 shadow-[0_2px_0_#0f172a]'
                  : 'hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>3D PC Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. MAIN CONTENT: 3D LEDGER TABLE OR 3D WORKSTATION SESSION CARDS
         ===================================================================== */}
      {layoutMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => {
            const isActive = s.status === 'ACTIVE';
            const isRemoving = removingId === s.id;
            const elapsed = Math.min(AUTO_TIMEOUT_SECONDS, Number(s.elapsedSeconds) || 5);
            const pct = Math.min(100, Math.round((elapsed / AUTO_TIMEOUT_SECONDS) * 100));

            return (
              <div
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`ses-card-3d-lift p-5 rounded-3xl border-2 cursor-pointer flex flex-col justify-between space-y-4 ${
                  isRemoving ? 'opacity-0 scale-90 pointer-events-none' : ''
                } ${
                  isActive
                    ? 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white border-emerald-400 shadow-[0_8px_0_#064e3b]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 shadow-[0_6px_0_#cbd5e1]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700 shrink-0">
                      <MiniDesktopPcRig status={s.status} pcCode={s.workstationCode} size="md" />
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[9px] font-black border ${getStatusStyle(
                          s.status
                        )}`}
                      >
                        {getStatusLabel(s.status)}
                      </span>
                      <h4 className={`font-black text-sm truncate mt-1 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {s.studentName}
                      </h4>
                      <p className={`text-[10.5px] font-mono font-bold ${isActive ? 'text-sky-300' : 'text-blue-600'}`}>
                        {s.studentId} • {s.workstationCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3D Time-In & Time-Out Keycap Boxes */}
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                  <div
                    className={`p-2.5 rounded-2xl border ${
                      isActive
                        ? 'bg-slate-950/70 border-emerald-500/40 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="text-[9px] uppercase block opacity-75">Auto Time In</span>
                    <strong className="font-black text-[11px]">
                      {s.timeInFormatted || formatIsoTime(s.sessionStartUtc)}
                    </strong>
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl border ${
                      isActive
                        ? 'bg-slate-950/70 border-slate-700 text-slate-400'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    <span className="text-[9px] uppercase block opacity-75">Auto Time Out</span>
                    <strong className="font-black text-[11px]">
                      {isActive ? '--:-- (Active)' : s.timeOutFormatted || formatIsoTime(s.sessionEndUtc)}
                    </strong>
                  </div>
                </div>

                {/* Live Duration & Actions Footer */}
                <div className="pt-2 border-t border-current/10 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs">
                    <span className="text-[10px] opacity-70 block">{s.laboratoryName.split('(')[0].trim()}</span>
                    <strong className="font-black flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {formatLiveDuration(s.elapsedSeconds, s.durationMinutes)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => handleEndOrForceLogoutSession(s.id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-[10px] rounded-xl shadow-[0_3px_0_#065f46] cursor-pointer"
                      >
                        Scan Out
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingSession(s)}
                      className="p-1.5 bg-slate-200/20 hover:bg-blue-600 text-current hover:text-white rounded-xl border border-current/20 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSessionId(s.id)}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-400/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ses-panel-3d rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-sky-300 font-mono font-black uppercase text-[10px] border-b-2 border-slate-800">
                <tr>
                  <th className="p-4">Student Information</th>
                  <th className="p-4">3D PC &amp; Laboratory</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Auto Time In</th>
                  <th className="p-4">Auto Time Out</th>
                  <th className="p-4">Live Duration</th>
                  <th className="p-4">Session Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-semibold">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-bold">
                      No student sessions match your filter criteria. Click &quot;Student QR Scan&quot; to record a new session.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => {
                    const isActive = s.status === 'ACTIVE';
                    const isRemoving = removingId === s.id;
                    const elapsed = Math.min(AUTO_TIMEOUT_SECONDS, Number(s.elapsedSeconds) || 5);
                    const pct = Math.min(100, Math.round((elapsed / AUTO_TIMEOUT_SECONDS) * 100));

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className={`ses-row-3d cursor-pointer hover:bg-blue-50/50 ${
                          isActive ? 'bg-emerald-50/40' : ''
                        } ${isRemoving ? 'opacity-0 -translate-x-12 pointer-events-none' : ''}`}
                      >
                        {/* Student Details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-[0_3px_0_rgba(15,23,42,0.25)] ${
                                isActive
                                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                                  : 'bg-slate-900 text-sky-300'
                              }`}
                            >
                              {s.studentName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{s.studentName}</p>
                              <p className="text-[10px] text-blue-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                                <QrCode className="w-3 h-3" /> {s.studentId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3D Mini Desktop PC + Lab */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-xl bg-slate-900 border border-slate-700 shadow-xs">
                              <MiniDesktopPcRig status={s.status} pcCode={s.workstationCode} size="sm" />
                            </div>
                            <div>
                              <div className="font-mono font-black text-slate-900 text-xs">
                                {s.workstationCode}
                              </div>
                              <div className="text-[10.5px] font-bold text-slate-500 truncate max-w-[170px]">
                                {s.laboratoryName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 font-mono text-slate-600">
                          {formatIsoDate(s.sessionStartUtc)}
                        </td>

                        {/* Auto Time In (3D Keycap Badge) */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 shadow-[0_2px_0_#6ee7b7] font-mono text-[10px] font-black inline-block">
                            {s.timeInFormatted || formatIsoTime(s.sessionStartUtc)}
                          </span>
                        </td>

                        {/* Auto Time Out (3D Keycap Badge) */}
                        <td className="p-4">
                          {isActive ? (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 border-2 border-slate-200 font-mono text-[10px] font-black inline-block">
                              --:-- (In Session)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border-2 border-rose-200 shadow-[0_2px_0_#fecdd3] font-mono text-[10px] font-black inline-block">
                              {s.timeOutFormatted || formatIsoTime(s.sessionEndUtc)}
                            </span>
                          )}
                        </td>

                        {/* Live Duration & 30s Countdown Bar */}
                        <td className="p-4 font-mono">
                          <div className="font-black text-slate-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{formatLiveDuration(s.elapsedSeconds, s.durationMinutes)}</span>
                          </div>
                          {isActive && autoTimeoutEnabled && (
                            <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-[10px] font-black border ${getStatusStyle(
                              s.status
                            )} ${isActive ? 'animate-pulse' : ''}`}
                          >
                            {getStatusLabel(s.status)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEndOrForceLogoutSession(s.id, 'COMPLETED')}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-[10px] rounded-xl shadow-[0_2px_0_#065f46] cursor-pointer flex items-center gap-1"
                                  title="Record Automatic Student QR Time-Out Now"
                                >
                                  <QrCode className="w-3 h-3" /> Scan Out
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTerminatingSessionId(s.id)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-[10px] rounded-xl shadow-[0_2px_0_#78350f] cursor-pointer flex items-center gap-1"
                                  title="Force End Session (Auto Time-Out)"
                                >
                                  <LogOut className="w-3 h-3" /> Force End
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedSession(s)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="Inspect Session"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingSession(s)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="Edit Session"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingSessionId(s.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Delete Session Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
            <span>
              Displaying <strong className="text-slate-900">{filtered.length}</strong> of{' '}
              <strong className="text-slate-900">{sessions.length}</strong> total workstation sessions
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Activity className="w-3.5 h-3.5" />
              Last synced: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. MODALS (3D LASER QR SCAN IN/OUT, INSPECT, EDIT, FORCE END, DELETE)
         ===================================================================== */}

      {/* MODAL 1: STUDENT QR SCAN (WITH ANIMATED 3D LASER VIEWFINDER & 1-CLICK PRESETS) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" /> Student QR Scan (Auto Time-In / Out)
              </h3>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Animated 3D Laser QR Scanner Viewfinder Banner */}
            <div
              className={`relative overflow-hidden p-4 rounded-2xl border-2 flex items-center justify-between text-xs font-mono ${
                matchedActiveSessionForScan
                  ? 'bg-rose-950 text-white border-rose-400'
                  : 'bg-slate-900 text-white border-blue-400'
              }`}
            >
              <div
                className={`qr-laser-beam absolute left-0 right-0 h-0.5 pointer-events-none ${
                  matchedActiveSessionForScan
                    ? 'bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_10px_#f43f5e]'
                    : 'bg-gradient-to-r from-transparent via-sky-300 to-transparent shadow-[0_0_10px_#38bdf8]'
                }`}
              />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider block text-sky-300">
                  {matchedActiveSessionForScan
                    ? '⚡ ACTIVE SESSION DETECTED — AUTO TIME-OUT MODE'
                    : '⚡ READY TO SCAN — AUTO TIME-IN MODE'}
                </span>
                <span className="text-sm font-black text-white">Today • {liveClockStr}</span>
              </div>
              <span
                className={`relative z-10 px-2.5 py-1 rounded-xl font-black text-[10px] ${
                  matchedActiveSessionForScan ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'
                }`}
              >
                {matchedActiveSessionForScan ? 'AUTO TIME-OUT' : 'AUTO TIME-IN'}
              </span>
            </div>

            {/* 1-Click Quick Student QR Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase block">
                Quick-Tap Student QR Badge Presets:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_SCAN_STUDENTS.map(stu => {
                  const isCurrentlyActive = sessions.some(
                    s => s.status === 'ACTIVE' && s.studentId.toLowerCase() === stu.id.toLowerCase()
                  );
                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() =>
                        setScanForm({
                          studentId: stu.id,
                          studentName: stu.name,
                          workstationCode: stu.pc,
                          laboratoryName: stu.lab
                        })
                      }
                      className={`p-2 rounded-xl border text-left font-mono text-[10px] transition cursor-pointer flex items-center justify-between ${
                        scanForm.studentId === stu.id
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="truncate font-bold">{stu.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[8.5px] font-black shrink-0 ml-1 ${
                          isCurrentlyActive ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCurrentlyActive ? 'OUT' : 'IN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleStudentQrScanSubmit} className="space-y-3 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Student ID (Scan / Type)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-IS-0142"
                    value={scanForm.studentId}
                    onChange={e => {
                      const val = e.target.value;
                      const match = sessions.find(
                        s => s.status === 'ACTIVE' && s.studentId.toLowerCase() === val.trim().toLowerCase()
                      );
                      setScanForm({
                        ...scanForm,
                        studentId: val,
                        studentName: match ? match.studentName : scanForm.studentName,
                        workstationCode: match ? match.workstationCode : scanForm.workstationCode,
                        laboratoryName: match ? match.laboratoryName : scanForm.laboratoryName
                      });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={scanForm.studentName}
                    onChange={e => setScanForm({ ...scanForm, studentName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <select
                    value={scanForm.laboratoryName}
                    onChange={e => setScanForm({ ...scanForm, laboratoryName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none font-bold focus:border-blue-600"
                  >
                    {availableLabs.map(lab => (
                      <option key={lab} value={lab}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Workstation Code</label>
                  <input
                    type="text"
                    list="ses-workstation-list"
                    required
                    value={scanForm.workstationCode}
                    onChange={e => setScanForm({ ...scanForm, workstationCode: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Automatic Timestamp Preview */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Auto Time In</span>
                  <strong className="text-emerald-700 text-xs">
                    {matchedActiveSessionForScan
                      ? matchedActiveSessionForScan.timeInFormatted ||
                        formatIsoTime(matchedActiveSessionForScan.sessionStartUtc)
                      : liveClockStr}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Auto Time Out</span>
                  <strong
                    className={
                      matchedActiveSessionForScan ? 'text-rose-600 text-xs' : 'text-slate-400 text-xs'
                    }
                  >
                    {matchedActiveSessionForScan ? liveClockStr : '--:-- (On Scan Out)'}
                  </strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl font-black cursor-pointer ${
                    matchedActiveSessionForScan
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_4px_0_#881337]'
                      : 'ses-btn-3d bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {matchedActiveSessionForScan
                    ? `Confirm Auto Time-Out (${liveClockStr})`
                    : `Confirm Auto Time-In (${liveClockStr})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SESSION DETAIL (WITH 3D DESKTOP RIG PREVIEW) */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 "
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] border-2 border-blue-400"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Session Details ({selectedSession.id})</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border border-blue-400/40">
              <div className="min-w-0 space-y-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md font-mono text-[9px] font-black ${getStatusStyle(
                    selectedSession.status
                  )}`}
                >
                  {getStatusLabel(selectedSession.status)}
                </span>
                <p className="font-black text-white text-sm truncate">{selectedSession.studentName}</p>
                <p className="text-xs text-sky-300 font-mono">ID: {selectedSession.studentId}</p>
              </div>
              <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700 shrink-0">
                <MiniDesktopPcRig
                  status={selectedSession.status}
                  pcCode={selectedSession.workstationCode}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              {[
                { label: 'Workstation', value: selectedSession.workstationCode, icon: Monitor },
                { label: 'Laboratory', value: selectedSession.laboratoryName, icon: MapPin },
                {
                  label: 'Auto Time In',
                  value: selectedSession.timeInFormatted || formatIsoTime(selectedSession.sessionStartUtc),
                  icon: Clock
                },
                {
                  label: 'Auto Time Out',
                  value:
                    selectedSession.status === 'ACTIVE'
                      ? 'Active Now (--:--)'
                      : selectedSession.timeOutFormatted || formatIsoTime(selectedSession.sessionEndUtc),
                  icon: LogOut
                },
                {
                  label: 'Live Duration',
                  value: formatLiveDuration(selectedSession.elapsedSeconds, selectedSession.durationMinutes),
                  icon: Timer
                }
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <span className="text-slate-500 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-blue-600" /> {label}
                  </span>
                  <span className="font-mono font-black text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              {selectedSession.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleEndOrForceLogoutSession(selectedSession.id, 'COMPLETED')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-[0_3px_0_#064e3b] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan Out Now
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-2xl hover:bg-slate-200 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT SESSION RECORD */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveEditSession}
            className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Student Session ({editingSession.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Student ID</label>
                  <input
                    type="text"
                    value={editingSession.studentId}
                    onChange={e => setEditingSession({ ...editingSession, studentId: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Student Name</label>
                  <input
                    type="text"
                    value={editingSession.studentName}
                    onChange={e => setEditingSession({ ...editingSession, studentName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Workstation</label>
                  <input
                    type="text"
                    list="ses-workstation-list"
                    value={editingSession.workstationCode}
                    onChange={e => setEditingSession({ ...editingSession, workstationCode: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingSession.status}
                    onChange={e =>
                      setEditingSession({
                        ...editingSession,
                        status: e.target.value as StudentSession['status']
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-black text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED (AUTO TIME-OUT)</option>
                    <option value="AUTO_TIMEOUT">AUTO_TIMEOUT</option>
                    <option value="FORCED_LOGOUT">FORCED_LOGOUT</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ses-btn-3d px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: FORCE TERMINATE CONFIRMATION */}
      {terminatingSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 ">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#78350f,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 border-2 border-amber-400">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-base text-slate-900">Force Logout Student?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to forcibly terminate active session{' '}
              <strong className="text-slate-900">{terminatingSessionId}</strong>? This will automatically stamp Time-Out at{' '}
              <strong className="font-mono text-amber-700">{liveClockStr}</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTerminatingSessionId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleEndOrForceLogoutSession(terminatingSessionId, 'FORCED_LOGOUT')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_0_#78350f] transition cursor-pointer"
              >
                Confirm Force Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {deletingSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 ">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 border-2 border-rose-400">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-base text-slate-900">Delete Session Log?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete session record{' '}
              <strong className="text-slate-900">{deletingSessionId}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSessionId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(deletingSessionId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-[0_4px_0_#881337] transition cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSessionsView;











