import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Tv, Power, Search, Plus, X, Laptop, Wifi,
  AlertTriangle, Lock, Unlock, Activity, ShieldAlert,
  Radio, Cpu, Wrench, Zap, Check, Trash2, Printer,
  Flame, Edit3, Download, RefreshCw, Clock, CheckCircle2,
  Eye, Sparkles, Layers
} from 'lucide-react';

export interface SessionsManagementViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface IssueServiceDeskViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: string;
  department: string;
  pcId: string;
  labName: string;
  ipAddress: string;
  macAddress: string;
  startTime: string;
  durationMinutes: number;
  bandwidthMb: number;
  cpuUsage: number;
  ramUsage: number;
  status: 'RUNNING' | 'LOCKED' | 'FLAGGED';
}

export interface ServiceTicket {
  id: string;
  ticketNo?: string;
  lab: string;
  workstation: string;
  reportedBy: string;
  reporterType: 'FACULTY' | 'STUDENT';
  category: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'POWER' | 'PERIPHERAL';
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdDate: string;
  slaDeadline: string;
  resolutionTime?: string;
  attachmentUrl?: string | null;
  comments?: { id: string; author: string; text: string; time: string }[];
}

// ============================================================================
// ISOMETRIC 3D WORKSTATION TELEMETRY & INCIDENT RIG ILLUSTRATION
// ============================================================================
const IsometricTelemetryRig: React.FC<{
  status: 'RUNNING' | 'LOCKED' | 'FLAGGED';
  code: string;
  cpuLoad?: number;
}> = ({ status, code, cpuLoad = 42 }) => {
  const isFlagged = status === 'FLAGGED' || cpuLoad > 85;
  const isLocked = status === 'LOCKED';

  const primaryHex = isFlagged ? '#ef4444' : isLocked ? '#f59e0b' : '#10b981';
  const secondaryHex = isFlagged ? '#dc2626' : isLocked ? '#d97706' : '#0284c7';
  const gradId = `ops-rig-${code}-${status}`;
  return (
    <div className="w-20 h-16 shrink-0">
      <svg viewBox="0 0 140 115" className="w-full h-full drop-shadow-[0_8px_12px_rgba(15,23,42,0.45)]">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={primaryHex} stopOpacity="0.9" />
            <stop offset="55%" stopColor={secondaryHex} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Extruded 3D Isometric Desk Platform */}
        <polygon points="70,106 10,82 70,58 130,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.3" />
        <polygon points="10,82 70,106 70,113 10,89" fill="#0f172a" />
        <polygon points="130,82 70,106 70,113 130,89" fill="#020617" />

        {/* 3D Tempered-Glass CPU System Unit Tower */}
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
            className={!isLocked ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 39px', animationDuration: isFlagged ? '1.2s' : '3.5s' }}
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
            className={!isLocked ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 56px', animationDuration: isFlagged ? '1.2s' : '3.5s' }}
          />
          <line x1="121" y1="26" x2="121" y2="64" stroke={primaryHex} strokeWidth="2" strokeLinecap="round" />
          <circle cx="121" cy="23" r="1.8" fill="#ffffff" />
        </g>

        {/* 3D Angled Widescreen Monitor & Stand */}
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
            fontSize="9"
            fontWeight="900"
            fontFamily="monospace"
            transform="skewY(-12)"
          >
            {code}
          </text>
        </g>

        {/* Isometric Keyboard & Mouse */}
        <polygon points="32,82 74,68 82,73 40,87" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
        <line x1="37" y1="82" x2="73" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
      </svg>
    </div>
  );
};

const DEFAULT_SESSIONS_SEED: ActiveSessionRecord[] = [
  {
    sessionId: 'SES-4021',
    userId: '2024-00142',
    userName: 'John Sven Morales',
    userRole: 'BSIS Student',
    department: 'BSIS',
    pcId: 'PC-001',
    labName: 'ComLab 1 (ICT)',
    ipAddress: '10.101.0.101',
    macAddress: '00:1A:2B:3°C:4D:A1',
    startTime: '08:15 AM',
    durationMinutes: 84,
    bandwidthMb: 640,
    cpuUsage: 42,
    ramUsage: 58,
    status: 'RUNNING'
  },
  {
    sessionId: 'SES-4022',
    userId: '2024-00188',
    userName: 'Maria Clara Santos',
    userRole: 'BSIT Student',
    department: 'BSIT',
    pcId: 'PC-008',
    labName: 'ComLab 1 (ICT)',
    ipAddress: '10.101.0.108',
    macAddress: '00:1A:2B:3°C:4D:A8',
    startTime: '08:30 AM',
    durationMinutes: 69,
    bandwidthMb: 1290,
    cpuUsage: 88,
    ramUsage: 82,
    status: 'FLAGGED'
  },
  {
    sessionId: 'SES-4025',
    userId: '2024-00215',
    userName: 'Kevin Rey Bautista',
    userRole: 'BSCS Student',
    department: 'BSCS',
    pcId: 'PC-014',
    labName: 'ComLab 2 (Multimedia)',
    ipAddress: '10.102.0.114',
    macAddress: '00:1A:2B:3°C:4D:B4',
    startTime: '09:00 AM',
    durationMinutes: 45,
    bandwidthMb: 410,
    cpuUsage: 36,
    ramUsage: 49,
    status: 'RUNNING'
  },
  {
    sessionId: 'SES-4029',
    userId: '2024-00309',
    userName: 'Angela Mae Villanueva',
    userRole: 'BSIS Student',
    department: 'BSIS',
    pcId: 'PC-005',
    labName: 'ComLab 3 (Engineering)',
    ipAddress: '10.103.0.105',
    macAddress: '00:1A:2B:3°C:4D:C5',
    startTime: '09:10 AM',
    durationMinutes: 35,
    bandwidthMb: 185,
    cpuUsage: 18,
    ramUsage: 40,
    status: 'LOCKED'
  }
];

const DEFAULT_TICKETS_SEED: ServiceTicket[] = [
  {
    id: 'TICK-901',
    ticketNo: 'TK-901A',
    lab: 'ComLab 1 (ICT)',
    workstation: 'PC-008',
    reportedBy: 'Maria Clara Santos',
    reporterType: 'STUDENT',
    category: 'HARDWARE',
    description: 'CPU thermal throttling at 88% load and intermittent display flicker during IDE compilation.',
    priority: 'CRITICAL',
    status: 'OPEN',
    createdDate: '10 mins ago',
    slaDeadline: '30 mins target',
    comments: [
      { id: 'C-1', author: 'System Watchdog', text: 'Auto-flagged from high CPU telemetry on SES-4022.', time: '10 mins ago' }
    ]
  },
  {
    id: 'TICK-902',
    ticketNo: 'TK-902B',
    lab: 'ComLab 2 (Multimedia)',
    workstation: 'PC-019',
    reportedBy: 'Prof. Ramon Magsaysay',
    reporterType: 'FACULTY',
    category: 'NETWORK',
    description: 'Ethernet port link speed negotiating at 10Mbps instead of 1Gbps VLAN trunk.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdDate: '1 hour ago',
    slaDeadline: '2 hrs target',
    comments: [
      { id: 'C-2', author: 'Admin Technician', text: 'Replacing RJ45 keystone jack on patch panel.', time: '25 mins ago' }
    ]
  },
  {
    id: 'TICK-903',
    ticketNo: 'TK-903°C',
    lab: 'ComLab 3 (Engineering)',
    workstation: 'PC-005',
    reportedBy: 'Angela Mae Villanueva',
    reporterType: 'STUDENT',
    category: 'SOFTWARE',
    description: 'Docker Desktop WSL2 backend requires administrator privilege elevation.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdDate: 'Yesterday',
    slaDeadline: 'Resolved',
    resolutionTime: 'Resolved in 25 mins',
    comments: []
  },
  {
    id: 'TICK-904',
    ticketNo: 'TK-904D',
    lab: 'ComLab 2 (Multimedia)',
    workstation: 'PC-014',
    reportedBy: 'Kevin Rey Bautista',
    reporterType: 'STUDENT',
    category: 'PERIPHERAL',
    description: 'USB optical mouse left-click is unresponsive and keyboard spacebar is stuck during lab activity.',
    priority: 'HIGH',
    status: 'OPEN',
    createdDate: '5 mins ago',
    slaDeadline: '1 hr target',
    comments: [
      { id: 'C-4', author: 'Kevin Rey Bautista', text: 'Reported from Student Workstation Portal.', time: '5 mins ago' }
    ]
  }
];

// Helper to cleanly separate reporter name and determine if FACULTY or STUDENT
const resolveReporterIdentity = (rawName: string, rawRole?: string): { cleanName: string; role: 'FACULTY' | 'STUDENT' } => {
  const str = String(rawName || '').trim();
  const roleStr = String(rawRole || '').toUpperCase();

  if (roleStr === 'FACULTY' || roleStr === 'INSTRUCTOR') {
    const cleaned = str
      .replace(/\/?\s*student/gi, '')
      .replace(/\(faculty\)/gi, '')
      .trim();
    return { cleanName: cleaned || 'Faculty Instructor', role: 'FACULTY' };
  }

  if (roleStr === 'STUDENT') {
    const cleaned = str
      .replace(/faculty\s*instructor\s*\/?\s*/gi, '')
      .replace(/\(student\)/gi, '')
      .trim();
    return { cleanName: cleaned || 'Student Reporter', role: 'STUDENT' };
  }

  const lower = str.toLowerCase();
  if ((lower.includes('faculty') || lower.includes('prof') || lower.includes('instructor')) && !lower.includes('student')) {
    return { cleanName: str.replace(/\(faculty\)/gi, '').trim(), role: 'FACULTY' };
  }

  const cleanStudent = str
    .replace(/faculty\s*instructor\s*\/?\s*/gi, '')
    .replace(/\(student\)/gi, '')
    .trim();
  return { cleanName: cleanStudent || 'Student Reporter', role: 'STUDENT' };
};

export const SessionsManagementView: React.FC<SessionsManagementViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const notify = useCallback(
    (msg: string) => {
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // Unified View Mode Switcher
  const [opsMode, setOpsMode] = useState<'UNIFIED_ALL' | 'SESSIONS_ONLY' | 'SERVICE_DESK_ONLY'>('UNIFIED_ALL');
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());

  // Shared Search & Lab Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedLabFilter, setSharedLabFilter] = useState<string>('ALL');

  // Sessions Specific Filters & Modals
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('ALL');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isEmergencyBulkOpen, setIsEmergencyBulkOpen] = useState(false);
  const [selectedSessionForTerminate, setSelectedSessionForTerminate] = useState<ActiveSessionRecord | null>(null);
  const [inspectingSession, setInspectingSession] = useState<ActiveSessionRecord | null>(null);

  // Service Desk Specific Filters & Modals (Separate Faculty vs Student filter)
  const [reporterRoleFilter, setReporterRoleFilter] = useState<'ALL' | 'FACULTY' | 'STUDENT'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<ServiceTicket | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Dynamic State: Active Sessions
  const [sessions, setSessions] = useState<ActiveSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_active_sessions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SESSIONS_SEED;
  });

  // Dynamic State: Service Desk Tickets (Cleanly migrated so Faculty & Student are never combined)
  const [tickets, setTickets] = useState<ServiceTicket[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_service_tickets_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any) => {
            const { cleanName, role } = resolveReporterIdentity(t.reportedBy, t.reporterType);
            return { ...t, reportedBy: cleanName, reporterType: role };
          });
        }
      }
    } catch {}
    return DEFAULT_TICKETS_SEED;
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [laboratoryMap, setLaboratoryMap] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_active_sessions_v2', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Live Clock & SignalR Telemetry Simulation Engine
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.status === 'RUNNING'
            ? {
                ...s,
                durationMinutes: s.durationMinutes + 1,
                bandwidthMb: s.bandwidthMb + Math.floor(Math.random() * 6) + 2,
                cpuUsage: Math.min(99, Math.max(14, s.cpuUsage + Math.floor(Math.random() * 9) - 4)),
                ramUsage: Math.min(95, Math.max(30, s.ramUsage + Math.floor(Math.random() * 5) - 2))
              }
            : s
        )
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentUser = (): any => {
    try {
      const raw = sessionStorage.getItem('labtrack_user') || localStorage.getItem('labtrack_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Sync Both Active Sessions & Problem Reports (Keeping Faculty and Student strictly separate)
  const syncOperationsFromBackend = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [labsRes, sesRes, tickRes] = await Promise.allSettled([
        apiClient.get('/api/v1/laboratories'),
        apiClient.get('/api/v1/pc-usage/active'),
        apiClient.get('/api/v1/problem-reports')
      ]);

      if (labsRes.status === 'fulfilled') {
        const lData = labsRes.value.data?.data || labsRes.value.data;
        const lItems = Array.isArray(lData) ? lData : lData?.items || [];
        const map: Record<string, string> = {};
        lItems.forEach((lab: any) => {
          if (lab.id && lab.name) {
            map[(lab.name || '').toLowerCase()] = lab.id;
            map[(lab.name || '').toLowerCase().replace(/\s*\([^)]*\)/g, '').trim()] = lab.id;
          }
        });
        setLaboratoryMap(map);
      }

      if (sesRes.status === 'fulfilled') {
        const sData = sesRes.value.data?.data?.items || sesRes.value.data?.data || sesRes.value.data || [];
        if (Array.isArray(sData) && sData.length > 0) {
          const mappedSessions: ActiveSessionRecord[] = sData.map((s: any, idx: number) => ({
            sessionId: s.sessionId || s.id || `SES-${4020 + idx}`,
            userId: s.userId || s.studentId || `2024-00${140 + idx}`,
            userName: s.userName || s.studentName || 'Active Student',
            userRole: s.userRole || `${s.department || 'BSIS'} Student`,
            department: s.department || 'BSIS',
            pcId: s.pcId || s.workstationNumber || `PC-00${idx + 1}`,
            labName: s.labName || `ComLab ${(idx % 3) + 1} (ICT)`,
            ipAddress: s.ipAddress || `10.101.0.${101 + idx}`,
            macAddress: s.macAddress || `00:1A:2B:3°C:4D:0${idx + 1}`,
            startTime: s.startTime || '08:30 AM',
            durationMinutes: Number(s.durationMinutes) || 45,
            bandwidthMb: Number(s.bandwidthMb) || 320,
            cpuUsage: Number(s.cpuUsage) || 38,
            ramUsage: Number(s.ramUsage) || 52,
            status: ['RUNNING', 'LOCKED', 'FLAGGED'].includes(String(s.status || '').toUpperCase())
              ? (String(s.status).toUpperCase() as ActiveSessionRecord['status'])
              : 'RUNNING'
          }));
          setSessions(mappedSessions);
        }
      }

      if (tickRes.status === 'fulfilled') {
        const tData = tickRes.value.data?.data?.items || tickRes.value.data?.data || tickRes.value.data || [];
        if (Array.isArray(tData) && tData.length > 0) {
          const mapStatus = (s: string): ServiceTicket['status'] => {
            const u = (s || '').toUpperCase();
            if (u === 'IN_PROGRESS' || u === 'UNDER_REVIEW' || u === 'UNDERREVIEW') return 'IN_PROGRESS';
            if (u === 'RESOLVED' || u === 'COMPLETED' || u === 'CLOSED') return 'RESOLVED';
            return 'OPEN';
          };

          let photoCache: Record<string, string> = {};
          try {
            photoCache = JSON.parse(localStorage.getItem('labtrack_report_photos') || '{}');
          } catch {}

          const mappedTickets: ServiceTicket[] = tData.map((item: any, idx: number) => {
            const desc = item.description || item.title || 'Workstation hardware/software inspection required.';
            const resolvedPhoto =
              item.attachmentUrl ||
              item.photoData ||
              photoCache[item.id] ||
              photoCache[desc.trim().slice(0, 60)] ||
              null;
            const rawPrio = String(item.priority || item.severity || 'HIGH').toUpperCase();
            const prio: ServiceTicket['priority'] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(rawPrio)
              ? (rawPrio as ServiceTicket['priority'])
              : 'HIGH';

            const { cleanName, role } = resolveReporterIdentity(
              item.reportedByName || item.studentName || 'Student Reporter',
              item.reporterRole
            );

            return {
              id: item.id ? String(item.id) : `TICK-${901 + idx}`,
              ticketNo: 'TK-' + String(item.id || 901 + idx).slice(0, 8).toUpperCase(),
              workstation: item.workstationNumber || item.workstationId || `PC-00${idx + 1}`,
              lab: item.labName || item.laboratoryName || 'ComLab 1 (ICT)',
              description: desc,
              reportedBy: cleanName,
              reporterType: role,
              createdDate: item.reportedAt ? new Date(item.reportedAt).toLocaleString() : 'Just now',
              category: (String(item.category || 'HARDWARE').toUpperCase() as ServiceTicket['category']),
              priority: prio,
              status: mapStatus(item.status),
              slaDeadline: prio === 'CRITICAL' ? '30 mins target' : '4 hrs target',
              attachmentUrl: resolvedPhoto,
              comments: Array.isArray(item.comments) ? item.comments : []
            };
          });

          setTickets(prev => {
            const map = new Map<string, ServiceTicket>();
            mappedTickets.forEach(t => map.set(t.id, t));
            prev.forEach(t => {
              if (!map.has(t.id)) map.set(t.id, t);
            });
            return Array.from(map.values());
          });
        }
      }
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    syncOperationsFromBackend();
    const poll = setInterval(syncOperationsFromBackend, 6000);
    return () => clearInterval(poll);
  }, [syncOperationsFromBackend]);

  // Forms State
  const [sessionForm, setSessionForm] = useState({
    userName: '',
    pcId: 'PC-001',
    labName: 'ComLab 1 (ICT)',
    department: 'BSIS'
  });

  const [newTicket, setNewTicket] = useState({
    lab: 'ComLab 1 (ICT)',
    workstation: '',
    reportedBy: '',
    reporterType: 'STUDENT' as 'FACULTY' | 'STUDENT',
    category: 'HARDWARE' as ServiceTicket['category'],
    priority: 'HIGH' as ServiceTicket['priority'],
    description: ''
  });

  const formatDuration = (mins: number) => {
    const hrs = Math.floor((Number(mins) || 0) / 60);
    const m = (Number(mins) || 0) % 60;
    return `${hrs}h ${m}m`;
  };

  const formatBandwidth = (mb: number) => {
    const val = Number(mb) || 0;
    if (val >= 1024) return `${(val / 1024).toFixed(2)} GB`;
    return `${val} MB`;
  };

  // --- SESSION HANDLERS --- //
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.userName.trim()) return;

    const randomNodeNum = Math.floor(Math.random() * 80) + 101;
    const newSession: ActiveSessionRecord = {
      sessionId: `SES-${Math.floor(Math.random() * 8000) + 1000}`,
      userId: `2024-00${Math.floor(Math.random() * 800) + 100}`,
      userName: sessionForm.userName.trim(),
      userRole: `${sessionForm.department.trim()} Student`,
      department: sessionForm.department.trim(),
      pcId: sessionForm.pcId.trim().toUpperCase(),
      labName: sessionForm.labName.trim(),
      ipAddress: `10.101.0.${randomNodeNum}`,
      macAddress: `00:1A:2B:3°C:4D:${randomNodeNum.toString(16).padStart(2, '0').toUpperCase()}`,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 1,
      bandwidthMb: 18,
      cpuUsage: Math.floor(18 + Math.random() * 28),
      ramUsage: Math.floor(32 + Math.random() * 24),
      status: 'RUNNING'
    };

    setSessions(prev => [newSession, ...prev]);
    setIsNewSessionModalOpen(false);
    setSessionForm({ userName: '', pcId: 'PC-001', labName: 'ComLab 1 (ICT)', department: 'BSIS' });
    notify(`Workstation Session ${newSession.sessionId} launched on ${newSession.pcId}!`);
  };

  const handleToggleLockSession = (session: ActiveSessionRecord) => {
    const nextStatus: ActiveSessionRecord['status'] = session.status === 'LOCKED' ? 'RUNNING' : 'LOCKED';
    setSessions(prev => prev.map(s => (s.sessionId === session.sessionId ? { ...s, status: nextStatus } : s)));
    notify(`Session ${session.sessionId} (${session.pcId}) set to ${nextStatus}.`);
  };

  // SMART CROSS-ACTION: Flag a session and open pre-filled Student Service Desk Ticket modal
  const handleFlagSessionToTicket = (session: ActiveSessionRecord) => {
    setSessions(prev =>
      prev.map(s => (s.sessionId === session.sessionId ? { ...s, status: 'FLAGGED' } : s))
    );
    setNewTicket({
      lab: session.labName,
      workstation: session.pcId,
      reportedBy: session.userName,
      reporterType: 'STUDENT',
      category: session.cpuUsage > 80 ? 'HARDWARE' : 'SOFTWARE',
      priority: session.cpuUsage > 80 ? 'CRITICAL' : 'HIGH',
      description: `Telemetry Alert on ${session.pcId} (${session.ipAddress}): CPU ${session.cpuUsage}%, RAM ${session.ramUsage}%. Needs inspection.`
    });
    setIsAddTicketModalOpen(true);
    notify(`Flagged ${session.pcId} and pre-filled Student Fault Ticket.`);
  };

  const handleTerminateConfirm = () => {
    if (!selectedSessionForTerminate) return;
    setSessions(prev => prev.filter(s => s.sessionId !== selectedSessionForTerminate.sessionId));
    notify(`Session ${selectedSessionForTerminate.sessionId} on ${selectedSessionForTerminate.pcId} terminated.`);
    setSelectedSessionForTerminate(null);
  };

  const handleBulkTerminateAll = () => {
    const count = sessions.length;
    setSessions([]);
    setIsEmergencyBulkOpen(false);
    notify(`Emergency Dispatch: All ${count} active workstation sessions terminated.`);
  };

  // --- SERVICE DESK TICKET HANDLERS --- //
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.lab.trim() || !newTicket.workstation.trim() || !newTicket.reportedBy.trim() || !newTicket.description.trim()) {
      notify('Please complete all required ticket fields.');
      return;
    }

    const currentUser = getCurrentUser();
    const userId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
    const labKey = newTicket.lab.trim().toLowerCase();
    const laboratoryId =
      laboratoryMap[labKey] ||
      laboratoryMap[labKey.replace(/\s*\([^)]*\)/g, '').trim()] ||
      '00000000-0000-0000-0000-000000000000';

    const severityMap: Record<string, string> = {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low'
    };

    const wsCode = newTicket.workstation.trim().toUpperCase();
    const { cleanName } = resolveReporterIdentity(newTicket.reportedBy.trim(), newTicket.reporterType);

    let created: ServiceTicket = {
      id: `TICK-${Math.floor(905 + Math.random() * 95)}`,
      ticketNo: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      lab: newTicket.lab.trim(),
      workstation: wsCode,
      reportedBy: cleanName,
      reporterType: newTicket.reporterType,
      category: newTicket.category,
      description: newTicket.description.trim(),
      priority: newTicket.priority,
      status: 'OPEN',
      createdDate: 'Just now',
      slaDeadline: newTicket.priority === 'CRITICAL' ? '30 mins target' : '4 hrs target',
      comments: []
    };

    // Automatically mark matching active session as FLAGGED if CRITICAL/HIGH
    setSessions(prev =>
      prev.map(s => (s.pcId.toUpperCase() === wsCode ? { ...s, status: 'FLAGGED' } : s))
    );

    try {
      const payload = {
        reportedByUserId: userId,
        reporterId: userId,
        laboratoryId,
        workstationId: wsCode,
        laboratoryName: newTicket.lab.trim(),
        priority: newTicket.priority.toUpperCase(),
        assetId: null,
        title: newTicket.description.trim().slice(0, 100) || 'Issue Report',
        category: newTicket.category,
        severity: severityMap[newTicket.priority] || 'High',
        description: newTicket.description.trim(),
        stepsToReproduce: null,
        attachmentUrl: null,
        reportedAtUtc: new Date().toISOString()
      };
      const resp = await apiClient.post('/api/v1/problem-reports', payload);
      const backendRec = resp.data?.data || resp.data;
      if (backendRec && backendRec.id) {
        created = { ...created, id: String(backendRec.id) };
      }
    } catch {}

    setTickets(prev => [created, ...prev]);
    setIsAddTicketModalOpen(false);
    setNewTicket({
      lab: 'ComLab 1 (ICT)',
      workstation: '',
      reportedBy: '',
      reporterType: 'STUDENT',
      category: 'HARDWARE',
      priority: 'HIGH',
      description: ''
    });
    notify(`Dispatched ${created.reporterType === 'STUDENT' ? 'Student' : 'Faculty'} Ticket ${created.ticketNo || created.id} for ${created.workstation}.`);
  };

  const handleSaveEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    try {
      await apiClient.patch(`/api/v1/problem-reports/${editingTicket.id}/status`, {
        status: editingTicket.status
      });
    } catch {}

    const { cleanName } = resolveReporterIdentity(editingTicket.reportedBy, editingTicket.reporterType);
    const updatedTicket: ServiceTicket = {
      ...editingTicket,
      reportedBy: cleanName
    };

    setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
    if (selectedTicketDetails?.id === updatedTicket.id) {
      setSelectedTicketDetails(updatedTicket);
    }
    notify(`Updated Ticket ${updatedTicket.id} details.`);
    setEditingTicket(null);
  };

  const handleUpdateTicketStatus = async (id: string, nextStatus: ServiceTicket['status']) => {
    const statusMap: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'InProgress',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed'
    };
    const backendStatus = statusMap[String(nextStatus).toUpperCase()] || String(nextStatus);

    try {
      await apiClient.patch(`/api/v1/problem-reports/${id}/status`, {
        status: backendStatus
      });
    } catch {}

    const targetTicket = tickets.find(t => t.id === id);

    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: nextStatus,
            slaDeadline: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'Resolved' : t.slaDeadline,
            resolutionTime: nextStatus === 'RESOLVED' ? 'Resolved just now' : t.resolutionTime
          };
        }
        return t;
      })
    );

    if (nextStatus === 'RESOLVED' && targetTicket?.workstation) {
      setSessions(prev =>
        prev.map(s =>
          s.pcId.toUpperCase() === targetTicket.workstation.toUpperCase() && s.status === 'FLAGGED'
            ? { ...s, status: 'RUNNING', cpuUsage: 34 }
            : s
        )
      );
    }

    if (selectedTicketDetails && selectedTicketDetails.id === id) {
      setSelectedTicketDetails(prev =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              slaDeadline: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'Resolved' : prev.slaDeadline
            }
          : null
      );
    }

    notify(`Ticket ${id} status updated to ${nextStatus.replace('_', ' ')}.`);
  };

  const handleEscalateTicket = (id: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, priority: 'CRITICAL', slaDeadline: '15 mins URGENT' } : t))
    );
    if (selectedTicketDetails?.id === id) {
      setSelectedTicketDetails(prev =>
        prev ? { ...prev, priority: 'CRITICAL', slaDeadline: '15 mins URGENT' } : null
      );
    }
    notify(`Escalated Ticket ${id} to CRITICAL PRIORITY!`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicketDetails) return;

    const newComment = {
      id: `C-${Date.now()}`,
      author: 'Admin Operator',
      text: newCommentText.trim(),
      time: 'Just now'
    };

    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicketDetails.id ? { ...t, comments: [...(t.comments || []), newComment] } : t
      )
    );
    setSelectedTicketDetails(prev =>
      prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null
    );
    setNewCommentText('');
    notify(`Added inspection log to Ticket ${selectedTicketDetails.id}.`);
  };

  const handleConfirmDeleteTicket = async () => {
    if (!deletingTicketId) return;
    try {
      await apiClient.delete(`/api/v1/problem-reports/${deletingTicketId}`);
    } catch {}
    setTickets(prev => prev.filter(t => t.id !== deletingTicketId));
    if (selectedTicketDetails?.id === deletingTicketId) setSelectedTicketDetails(null);
    notify(`Removed Service Ticket ${deletingTicketId}.`);
    setDeletingTicketId(null);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Type', 'ID', 'Reporter Role', 'Lab Location', 'Workstation', 'User / Reporter', 'Category / Dept', 'Priority / CPU', 'Status', 'Details'],
      ...sessions.map(s => [
        'SESSION',
        s.sessionId,
        'STUDENT',
        `"${s.labName}"`,
        s.pcId,
        `"${s.userName}"`,
        s.department,
        `CPU ${s.cpuUsage}%`,
        s.status,
        `"IP: ${s.ipAddress} | Bandwidth: ${formatBandwidth(s.bandwidthMb)}"`
      ]),
      ...tickets.map(t => [
        'TICKET',
        t.id,
        t.reporterType,
        `"${t.lab}"`,
        t.workstation,
        `"${t.reportedBy}"`,
        t.category,
        t.priority,
        t.status,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_Sessions_And_ServiceDesk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported Unified Sessions & Service Desk Ledger to CSV.');
  };

  // Filtered Lists
  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(Boolean).filter(s => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (s.userName || '').toLowerCase().includes(q) ||
        (s.pcId || '').toLowerCase().includes(q) ||
        (s.labName || '').toLowerCase().includes(q) ||
        (s.sessionId || '').toLowerCase().includes(q) ||
        (s.ipAddress || '').toLowerCase().includes(q);
      const matchesStatus = sessionStatusFilter === 'ALL' || s.status === sessionStatusFilter;
      const matchesLab =
        sharedLabFilter === 'ALL' || (s.labName || '').toLowerCase().includes(sharedLabFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [sessions, searchQuery, sessionStatusFilter, sharedLabFilter]);

  const filteredTickets = useMemo(() => {
    return (tickets || []).filter(Boolean).filter(t => {
      const q = (searchQuery || '').toLowerCase();
      const matchesQuery =
        !q ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.ticketNo || '').toLowerCase().includes(q) ||
        (t.workstation || '').toLowerCase().includes(q) ||
        (t.lab || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.reportedBy || '').toLowerCase().includes(q);
      const matchesRole = reporterRoleFilter === 'ALL' || t.reporterType === reporterRoleFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
      const matchesLab =
        sharedLabFilter === 'ALL' || (t.lab || '').toLowerCase().includes(sharedLabFilter.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      return matchesQuery && matchesRole && matchesPriority && matchesStatus && matchesLab && matchesCategory;
    });
  }, [tickets, searchQuery, reporterRoleFilter, priorityFilter, ticketStatusFilter, sharedLabFilter, categoryFilter]);

  // Computed KPIs
  const activeSessionsCount = sessions.filter(s => s.status === 'RUNNING').length;
  const flaggedSessionsCount = sessions.filter(s => s.status === 'FLAGGED').length;
  const totalBandwidthUsedMb = sessions.reduce((sum, s) => sum + (Number(s.bandwidthMb) || 0), 0);

  const criticalTicketsCount = tickets.filter(
    t => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;
  const openTicketsCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const facultyTicketsCount = tickets.filter(t => t.reporterType === 'FACULTY').length;
  const studentTicketsCount = tickets.filter(t => t.reporterType === 'STUDENT').length;

  // Per-Lab Telemetry & Fault Radar Summary (ComLab 1, ComLab 2, ComLab 3)
  const labRadarCards = useMemo(() => {
    return ['ComLab 1', 'ComLab 2', 'ComLab 3'].map((labKey, idx) => {
      const labSes = sessions.filter(s => (s.labName || '').toLowerCase().includes(labKey.toLowerCase()));
      const labTicks = tickets.filter(
        t => (t.lab || '').toLowerCase().includes(labKey.toLowerCase()) && t.status !== 'RESOLVED'
      );
      const avgCpu =
        labSes.length > 0
          ? Math.round(labSes.reduce((acc, s) => acc + (Number(s.cpuUsage) || 35), 0) / labSes.length)
          : 24 + idx * 6;
      const hasCritical = labTicks.some(t => t.priority === 'CRITICAL') || labSes.some(s => s.status === 'FLAGGED');
      return {
        labKey,
        title: idx === 0 ? 'ComLab 1 (ICT)' : idx === 1 ? 'ComLab 2 (Multimedia)' : 'ComLab 3 (Engineering)',
        vlan: `VLAN 10${idx + 1}`,
        onlineCount: labSes.length,
        openFaults: labTicks.length,
        avgCpu,
        rigStatus: (hasCritical ? 'FLAGGED' : labSes.length === 0 ? 'LOCKED' : 'RUNNING') as
          | 'RUNNING'
          | 'LOCKED'
          | 'FLAGGED'
      };
    });
  }, [sessions, tickets]);

  const getPriorityBadgeClass = (priority: ServiceTicket['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-black shadow-[0_2px_0_#881337] animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_0_#78350f]';
      case 'MEDIUM':
        return 'bg-blue-600 text-white font-bold';
      case 'LOW':
        return 'bg-teal-600 text-white font-bold';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };
  
  return (
    <div className="ops-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7  font-sans select-none">
      {/* EXTRUDED 3D DEPTH & TACTILE KEYCAP STYLES */}
      <style>{`
        .ops-3d-shell {
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

      {/* SHARED DATALISTS */}
      <datalist id="pc-node-list">
        <option value="PC-001" />
        <option value="PC-002" />
        <option value="PC-005" />
        <option value="PC-008" />
        <option value="PC-012" />
        <option value="PC-014" />
        <option value="PC-019" />
        <option value="PC-025" />
      </datalist>

      <datalist id="lab-room-list">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
        <option value="Server Room" />
      </datalist>

      {/* =====================================================================
          1. OBSIDIAN COMMAND HEADER (SESSIONS HUB + SERVICE DESK OPERATIONS)
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 rounded-2xl shadow-[0_5px_0_#064e3b,0_0_25px_rgba(16,185,129,0.5)]">
              <Tv className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>SIGNALR TELEMETRY BUS • {liveClock}</span>
                </span>
                {criticalTicketsCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-500/25 text-rose-300 border border-rose-400/50 rounded-full text-[10px] font-mono font-black flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> {criticalTicketsCount} CRITICAL FAULTS
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Workstation Sessions &amp; Service Desk Operations
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Unified real-time student session telemetry, remote lock controls, and SLA fault ticket dispatch • {activeCampus}
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={syncOperationsFromBackend}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
              <span>Sync Live</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#064e3b] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Launch Session
            </button>

            <button
              type="button"
              onClick={() => setIsAddTicketModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4 stroke-[2.5]" /> File Fault Ticket
            </button>

            <button
              type="button"
              onClick={() => setIsEmergencyBulkOpen(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
              title="Emergency Bulk Terminate All Active Sessions"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Bulk Terminate</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => setOpsMode('UNIFIED_ALL')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                opsMode === 'UNIFIED_ALL'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_3px_0_#0284c7]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              Unified Operations View
            </button>
            <button
              type="button"
              onClick={() => setOpsMode('SESSIONS_ONLY')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                opsMode === 'SESSIONS_ONLY'
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_3px_0_#065f46]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              Active Sessions Stream ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setOpsMode('SERVICE_DESK_ONLY')}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                opsMode === 'SERVICE_DESK_ONLY'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_3px_0_#78350f]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              Service Desk Tickets ({tickets.length})
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
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 EXTRUDED KPI CUBES (SESSIONS + SERVICE DESK METRICS)
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b,0_16px_30px_rgba(16,185,129,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
              ACTIVE SESSIONS
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-3xl font-black text-white font-mono">{activeSessionsCount} Online</p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <span className="text-[11px] text-emerald-200 font-bold">{sessions.length} Total Occupied Stations</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Tv className="w-6 h-6 text-emerald-300" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a,0_16px_30px_rgba(37,99,235,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 block">
              LIVE BANDWIDTH
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {formatBandwidth(totalBandwidthUsedMb)}
            </p>
            <span className="text-[11px] text-blue-200 font-bold">Aggregated VLAN 101–103</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Wifi className="w-6 h-6 text-cyan-300" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-950 text-white border-2 border-rose-400/50 shadow-[0_8px_0_#881337,0_16px_30px_rgba(225,29,72,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-200 block">
              CRITICAL / FLAGGED
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {criticalTicketsCount} Crit / {flaggedSessionsCount} Flag
            </p>
            <span className="text-[11px] text-rose-200 font-bold">Urgent SLA Dispatch Queue</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-rose-200" />
          </div>
        </div>

        <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f,0_16px_30px_rgba(245,158,11,0.28)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
              SERVICE DESK SLA
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              {openTicketsCount} Open / {resolvedTicketsCount} Fixed
            </p>
            <span className="text-[11px] text-amber-100 font-bold">
              {facultyTicketsCount} Faculty • {studentTicketsCount} Student
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Wrench className="w-6 h-6 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. INTERACTIVE ISOMETRIC COMLAB 1-3 TELEMETRY & FAULT RADAR BAY
         ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {labRadarCards.map((lab) => {
          const isSelected = sharedLabFilter === lab.labKey;
          return (
            <div
              key={lab.labKey}
              onClick={() => setSharedLabFilter(isSelected ? 'ALL' : lab.labKey)}
              className={`card-3d-lift p-4 rounded-3xl border-2 cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-cyan-400 shadow-[0_8px_0_#0284c7]'
                  : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700 shadow-[0_6px_0_#0f172a] hover:border-blue-400'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <IsometricTelemetryRig status={lab.rigStatus} code={lab.labKey.replace(' ', '')} cpuLoad={lab.avgCpu} />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-sm truncate">{lab.title}</h4>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      {lab.vlan}
                    </span>
                  </div>
                  <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-700 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lab.avgCpu > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      }`}
                      style={{ width: `${lab.avgCpu}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                    <span className="text-emerald-300 font-bold">{lab.onlineCount} Sessions</span>
                    <span>•</span>
                    <span className={lab.openFaults > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                      {lab.openFaults} Open Faults
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-xl bg-white/10 text-cyan-200 shrink-0">
                {isSelected ? 'ACTIVE' : 'FILTER'}
              </span>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          4. SHARED SEARCH & LABORATORY FILTER BAR
         ===================================================================== */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-300 shadow-[0_5px_0_#cbd5e1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border-2 border-slate-300 flex-1 max-w-md focus-within:border-blue-600 focus-within:bg-white">
          <Search className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            placeholder="Search Student, Session ID, Ticket ID, PC-001, Lab, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-xs font-bold text-slate-900 placeholder-slate-400"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'ComLab 1', 'ComLab 2', 'ComLab 3'].map((lab) => (
            <button
              key={lab}
              type="button"
              onClick={() => setSharedLabFilter(lab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                sharedLabFilter === lab
                  ? 'bg-slate-900 text-cyan-300 shadow-[0_3px_0_#0284c7]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {lab === 'ALL' ? 'All Laboratories' : lab}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          5. SECTION A: ACTIVE WORKSTATION SESSIONS STREAM TABLE
         ===================================================================== */}
      {(opsMode === 'UNIFIED_ALL' || opsMode === 'SESSIONS_ONLY') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-2xl shadow-[0_3px_0_#064e3b]">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-emerald-600 uppercase">
                  LIVE TELEMETRY STREAM
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Active Workstation Sessions ({filteredSessions.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-300 text-[11px] font-black">
              {['ALL', 'RUNNING', 'LOCKED', 'FLAGGED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSessionStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    sessionStatusFilter === st
                      ? 'bg-slate-900 text-cyan-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 font-semibold">
              <thead className="bg-slate-900 text-cyan-300 font-mono font-black uppercase text-[10px] border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">Session &amp; Active Student</th>
                  <th className="p-3.5">Workstation Node</th>
                  <th className="p-3.5">Hardware Load (CPU / RAM)</th>
                  <th className="p-3.5">Active Duration</th>
                  <th className="p-3.5">Bandwidth Consumed</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((ses) => (
                    <tr key={ses.sessionId} className="hover:bg-blue-50/50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {ses.status === 'RUNNING' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
                          {ses.status === 'LOCKED' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                          {ses.status === 'FLAGGED' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
                          <span className="font-black text-slate-900">{ses.userName}</span>
                          <span className="text-[10px] font-mono text-slate-500">({ses.userRole})</span>
                        </div>
                        <div className="text-[10px] font-mono text-blue-700 font-bold block mt-0.5">
                          {ses.sessionId} • IP: {ses.ipAddress}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-black text-slate-900">
                        {ses.pcId} <span className="text-[10px] font-sans font-bold text-blue-700 block">{ses.labName}</span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black ${ses.cpuUsage > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                            CPU {ses.cpuUsage}%
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-[11px] font-bold text-slate-700">RAM {ses.ramUsage}%</span>
                        </div>
                        <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ses.cpuUsage > 80 ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${ses.cpuUsage}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-800 font-black">{formatDuration(ses.durationMinutes)}</td>

                      <td className="p-3.5 font-mono font-black text-emerald-600">{formatBandwidth(ses.bandwidthMb)}</td>

                      <td className="p-3.5">
                        {ses.status === 'RUNNING' && (
                          <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-xl font-mono font-black text-[10px] shadow-[0_2px_0_#065f46]">
                            RUNNING
                          </span>
                        )}
                        {ses.status === 'LOCKED' && (
                          <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-xl font-mono font-black text-[10px] shadow-[0_2px_0_#78350f]">
                            LOCKED
                          </span>
                        )}
                        {ses.status === 'FLAGGED' && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white rounded-xl font-mono font-black text-[10px] shadow-[0_2px_0_#881337]">
                            FLAGGED
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleLockSession(ses)}
                            className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-slate-950 border border-amber-300 font-black text-[11px] transition cursor-pointer"
                          >
                            {ses.status === 'LOCKED' ? 'Unlock' : 'Lock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFlagSessionToTicket(ses)}
                            className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-800 hover:text-white border border-orange-300 font-black text-[11px] transition cursor-pointer"
                            title="Flag Workstation & Create Service Desk Ticket"
                          >
                            Flag Fault
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingSession(ses)}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-black text-[11px] transition cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSessionForTerminate(ses)}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-black text-[11px] transition cursor-pointer"
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No active workstation sessions found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. SECTION B: SERVICE DESK INCIDENT & SLA DISPATCH MATRIX TABLE
         ===================================================================== */}
      {(opsMode === 'UNIFIED_ALL' || opsMode === 'SERVICE_DESK_ONLY') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-[0_3px_0_#78350f]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                  LIVE SERVICE DESK QUEUE
                </span>
                <h4 className="text-lg font-black text-slate-900">
                  Inspection &amp; Fault Dispatch Matrix ({filteredTickets.length})
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* SEPARATE FACULTY & STUDENT FILTER BUTTONS SIDE BY SIDE */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setReporterRoleFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    reporterRoleFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReporterRoleFilter('FACULTY')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    reporterRoleFilter === 'FACULTY'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  Faculty ({facultyTicketsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReporterRoleFilter('STUDENT')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    reporterRoleFilter === 'STUDENT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Student ({studentTicketsCount})
                </button>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="NETWORK">Network</option>
                <option value="POWER">Power</option>
                <option value="PERIPHERAL">Peripheral</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-900 font-mono font-black uppercase text-[10px] text-cyan-300 border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">Ticket ID</th>
                  <th className="p-3.5">Location &amp; Workstation</th>
                  <th className="p-3.5">Fault Details &amp; Reporter</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">SLA Target</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-3.5 font-mono font-black text-blue-700">{ticket.ticketNo || ticket.id}</td>
                      <td className="p-3.5">
                        <span className="font-mono font-black text-slate-900 block">{ticket.workstation}</span>
                        <span className="text-[10px] text-blue-700 font-bold block">{ticket.lab}</span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          {ticket.attachmentUrl && (
                            <img
                              src={ticket.attachmentUrl}
                              alt="Evidence"
                              onClick={() => setSelectedTicketDetails(ticket)}
                              className="w-10 h-10 rounded-lg object-cover border border-blue-300 shrink-0 cursor-pointer hover:scale-110 transition"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-slate-900 font-bold line-clamp-1">{ticket.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-600 font-bold">
                                By: {ticket.reportedBy}
                              </span>
                              {ticket.reporterType === 'FACULTY' ? (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono font-black text-[9px]">
                                  Faculty
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono font-black text-[9px]">
                                  Student
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">• {ticket.createdDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 rounded-md text-[10px] font-black">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase inline-block ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {ticket.slaDeadline}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border cursor-pointer outline-none ${
                            ticket.status === 'RESOLVED'
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : ticket.status === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-slate-950 border-amber-600'
                              : 'bg-rose-600 text-white border-rose-700'
                          }`}
                        >
                          <option value="OPEN" className="bg-slate-900 text-white">OPEN</option>
                          <option value="IN_PROGRESS" className="bg-slate-900 text-amber-300">IN PROGRESS</option>
                          <option value="RESOLVED" className="bg-slate-900 text-emerald-300">RESOLVED</option>
                          <option value="CLOSED" className="bg-slate-900 text-slate-300">CLOSED</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTicketDetails(ticket)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg text-[11px] transition cursor-pointer"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingTicket(ticket)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg border border-slate-300 transition cursor-pointer"
                            title="Edit Ticket Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {ticket.priority !== 'CRITICAL' && ticket.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={() => handleEscalateTicket(ticket.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg border border-rose-200 transition cursor-pointer"
                              title="Escalate Issue to Critical"
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTicketStatus(ticket.id, ticket.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')
                            }
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition cursor-pointer"
                            title="Toggle Resolved"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTicketId(ticket.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg border border-rose-200 transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      No service desk tickets found matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          ALL MODALS (SESSIONS + SERVICE DESK)
         ===================================================================== */}

      {/* MODAL 1: LAUNCH WORKSTATION SESSION */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#064e3b,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-emerald-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-600" /> Launch Workstation Session
              </h3>
              <button type="button" onClick={() => setIsNewSessionModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Student / User Name</label>
                <input
                  type="text"
                  value={sessionForm.userName}
                  onChange={(e) => setSessionForm({ ...sessionForm, userName: e.target.value })}
                  placeholder="e.g. Student Name"
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-bold outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Workstation Node</label>
                  <input
                    type="text"
                    list="pc-node-list"
                    value={sessionForm.pcId}
                    onChange={(e) => setSessionForm({ ...sessionForm, pcId: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-list"
                    value={sessionForm.labName}
                    onChange={(e) => setSessionForm({ ...sessionForm, labName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-bold outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Department / Program</label>
                <input
                  type="text"
                  value={sessionForm.department}
                  onChange={(e) => setSessionForm({ ...sessionForm, department: e.target.value })}
                  placeholder="e.g. BSIS / BSIT / BSCS"
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-bold outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-black rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-[0_4px_0_#064e3b] cursor-pointer"
                >
                  Launch Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SESSION TELEMETRY INSPECTOR */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Tv className="w-4 h-4 text-blue-600" /> Telemetry Inspector ({inspectingSession.sessionId})
              </h3>
              <button type="button" onClick={() => setInspectingSession(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl flex items-center gap-4 text-white">
              <IsometricTelemetryRig
                status={inspectingSession.status}
                code={inspectingSession.pcId}
                cpuLoad={inspectingSession.cpuUsage}
              />
              <div className="space-y-1 text-xs">
                <p className="font-black text-base text-white">{inspectingSession.userName}</p>
                <p className="font-mono text-cyan-300 font-bold">
                  {inspectingSession.pcId} • {inspectingSession.labName}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  IP: {inspectingSession.ipAddress} | MAC: {inspectingSession.macAddress}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Active Duration:</span>
                <strong className="text-emerald-600">{formatDuration(inspectingSession.durationMinutes)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Bandwidth Consumed:</span>
                <strong className="text-blue-600">{formatBandwidth(inspectingSession.bandwidthMb)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware Load:</span>
                <strong className="text-slate-900">
                  CPU {inspectingSession.cpuUsage}% | RAM {inspectingSession.ramUsage}%
                </strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = inspectingSession;
                  setInspectingSession(null);
                  handleFlagSessionToTicket(s);
                }}
                className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#78350f] cursor-pointer"
              >
                Flag &amp; File Ticket
              </button>
              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="w-1/2 bg-slate-900 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#020617] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TERMINATE SINGLE SESSION */}
      {selectedSessionForTerminate && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Power className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Terminate Active Session?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Force disconnect <strong className="text-slate-900">{selectedSessionForTerminate.userName}</strong> on workstation{' '}
                <strong className="font-mono text-slate-900">{selectedSessionForTerminate.pcId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSessionForTerminate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminateConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Terminate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EMERGENCY BULK TERMINATE */}
      {isEmergencyBulkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-rose-600 text-base">Bulk Terminate All Sessions?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Emergency Action: This will immediately disconnect all{' '}
                <strong className="text-slate-900">{sessions.length} active workstation sessions</strong>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyBulkOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkTerminateAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Execute Bulk Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: FILE NEW SERVICE DESK TICKET (SEPARATE FACULTY VS STUDENT SELECTOR) */}
      {isAddTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>File Service / Fault Ticket</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddTicketModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Reporter Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTicket({ ...newTicket, reporterType: 'FACULTY' })}
                    className={`py-2 rounded-xl font-black text-xs border transition cursor-pointer ${
                      newTicket.reporterType === 'FACULTY'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicket({ ...newTicket, reporterType: 'STUDENT' })}
                    className={`py-2 rounded-xl font-black text-xs border transition cursor-pointer ${
                      newTicket.reporterType === 'STUDENT'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Location</label>
                  <input
                    type="text"
                    list="lab-room-list"
                    placeholder="e.g. ComLab 1 (ICT)"
                    value={newTicket.lab}
                    onChange={(e) => setNewTicket({ ...newTicket, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Workstation / Asset Tag</label>
                  <input
                    type="text"
                    list="pc-node-list"
                    placeholder="e.g. PC-008"
                    value={newTicket.workstation}
                    onChange={(e) => setNewTicket({ ...newTicket, workstation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono font-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, category: e.target.value as ServiceTicket['category'] })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="NETWORK">NETWORK</option>
                    <option value="POWER">POWER</option>
                    <option value="PERIPHERAL">PERIPHERAL</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Priority Target</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value as ServiceTicket['priority'] })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 text-rose-600 font-black"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  {newTicket.reporterType === 'FACULTY' ? 'Faculty Name' : 'Student Name'}
                </label>
                <input
                  type="text"
                  placeholder={newTicket.reporterType === 'FACULTY' ? 'e.g. Prof. Ramon Magsaysay' : 'e.g. Maria Clara Santos'}
                  value={newTicket.reportedBy}
                  onChange={(e) => setNewTicket({ ...newTicket, reportedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Fault Description / Issue Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe hardware behavior, screen glitches, network drop..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddTicketModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT SERVICE TICKET */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Service Ticket ({editingTicket.ticketNo || editingTicket.id})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTicket} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Reporter Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTicket({ ...editingTicket, reporterType: 'FACULTY' })}
                    className={`py-2 rounded-xl font-black text-xs border transition cursor-pointer ${
                      editingTicket.reporterType === 'FACULTY'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTicket({ ...editingTicket, reporterType: 'STUDENT' })}
                    className={`py-2 rounded-xl font-black text-xs border transition cursor-pointer ${
                      editingTicket.reporterType === 'STUDENT'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Location</label>
                  <input
                    type="text"
                    list="lab-room-list"
                    value={editingTicket.lab}
                    onChange={(e) => setEditingTicket({ ...editingTicket, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Workstation Tag</label>
                  <input
                    type="text"
                    value={editingTicket.workstation}
                    onChange={(e) => setEditingTicket({ ...editingTicket, workstation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-mono font-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={editingTicket.category}
                    onChange={(e) => setEditingTicket({ ...editingTicket, category: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                  >
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="NETWORK">NETWORK</option>
                    <option value="POWER">POWER</option>
                    <option value="PERIPHERAL">PERIPHERAL</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    value={editingTicket.priority}
                    onChange={(e) => setEditingTicket({ ...editingTicket, priority: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingTicket.status}
                    onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  {editingTicket.reporterType === 'FACULTY' ? 'Faculty Name' : 'Student Name'}
                </label>
                <input
                  type="text"
                  value={editingTicket.reportedBy}
                  onChange={(e) => setEditingTicket({ ...editingTicket, reportedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: TICKET DETAILS & INSPECTION LOGS */}
      {selectedTicketDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600">
                  {selectedTicketDetails.ticketNo || selectedTicketDetails.id}
                </span>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Workstation Fault Detail ({selectedTicketDetails.workstation})</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketDetails(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IsometricTelemetryRig
                    status={selectedTicketDetails.status === 'RESOLVED' ? 'RUNNING' : 'FLAGGED'}
                    code={selectedTicketDetails.workstation}
                  />
                  <div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase block">
                      {selectedTicketDetails.lab}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="text-white font-black text-sm">
                        {selectedTicketDetails.reportedBy}
                      </strong>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-black ${
                          selectedTicketDetails.reporterType === 'FACULTY'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {selectedTicketDetails.reporterType === 'FACULTY' ? 'Faculty' : 'Student'}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-mono uppercase ${getPriorityBadgeClass(selectedTicketDetails.priority)}`}>
                  {selectedTicketDetails.priority}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase block">ISSUE DESCRIPTION</span>
                <p className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 font-bold mt-1">
                  {selectedTicketDetails.description}
                </p>
              </div>

              {selectedTicketDetails.attachmentUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-blue-600 font-black uppercase block">
                    Uploaded Photo Evidence
                  </span>
                  <div className="rounded-2xl overflow-hidden border-2 border-blue-200 bg-slate-950 max-h-60 flex items-center justify-center">
                    <img
                      src={selectedTicketDetails.attachmentUrl}
                      alt="Reported Issue Photo Evidence"
                      className="max-h-56 w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* COMMENTS & INSPECTION ACTIVITY STREAM */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase block">
                  Inspection Activity &amp; Admin Log
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedTicketDetails.comments && selectedTicketDetails.comments.length > 0 ? (
                    selectedTicketDetails.comments.map(c => (
                      <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <strong className="text-blue-700">{c.author}</strong>
                          <span className="text-slate-400 font-mono">{c.time}</span>
                        </div>
                        <p className="text-slate-800 text-[11px] font-semibold">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[11px]">No log entries filed yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add admin inspection notes..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-[0_3px_0_#1e3a8a]"
                  >
                    Post
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateTicketStatus(selectedTicketDetails.id, 'IN_PROGRESS')}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_3px_0_#78350f] cursor-pointer"
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTicketStatus(selectedTicketDetails.id, 'RESOLVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-[0_3px_0_#064e3b] cursor-pointer"
                >
                  Resolve Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: DELETE TICKET CONFIRMATION */}
      {deletingTicketId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Delete Service Ticket?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete ticket <strong className="font-mono text-slate-900">{deletingTicketId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTicketId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTicket}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const IssueServiceDeskView = SessionsManagementView;
export default SessionsManagementView;










