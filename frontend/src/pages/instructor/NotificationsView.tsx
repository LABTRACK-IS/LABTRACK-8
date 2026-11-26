import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Bell, ShieldAlert, Search, Calendar, Trash2,
  CheckCircle2, X, Sliders, Eye, Plus, Volume2, VolumeX, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, Settings,
  FileSpreadsheet, Layers, Clock, Check, Sparkles,
  Edit3, Send, Monitor, Server
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type NotificationStatus = 'Active' | 'Resolved' | 'Muted';
export type CategoryType = 'Hardware' | 'Network' | 'Software' | 'Schedule' | 'System';

export interface NotificationItem {
  id: string;
  code: string;
  lab: string;
  type: CategoryType;
  notificationTitle: string;
  details: string;
  impactedUnits: number;
  lastOccurrence: string;
  dateIso: string;
  severity: SeverityLevel;
  status: NotificationStatus;
  isRead: boolean;
}

// ============================================================================
// HELPER FORMATTERS FOR CLEAN, ORGANIZED TEXT DISPLAY
// ============================================================================
const formatLabDisplay = (rawLab: string): { primary: string; secondary: string } => {
  const clean = (rawLab || 'ComLab 1').trim();
  const match = clean.match(/^([^(]+)\(([^)]+)\)/);
  if (match) {
    return {
      primary: match[1].trim(),
      secondary: match[2].trim()
    };
  }
  if (clean.toLowerCase().includes('fastapi')) {
    return { primary: 'FastAPI AI Engine', secondary: 'Telemetry Microservice' };
  }
  if (clean.toLowerCase().includes('db core')) {
    return { primary: 'JRMSU DB Core', secondary: 'PostgreSQL Cluster' };
  }
  return { primary: clean, secondary: 'JRMSU Lab Facility' };
};

const formatOccurrenceParts = (rawOcc: string): { datePart: string; timePart: string } => {
  const raw = (rawOcc || 'Just now').trim();
  if (raw.includes('|')) {
    const [d, t] = raw.split('|').map(s => s.trim());
    return { datePart: d || 'Today', timePart: t || '--:--' };
  }
  if (raw.includes(',')) {
    const parts = raw.split(',');
    if (parts.length >= 3) {
      return {
        datePart: `${parts[0].trim()}, ${parts[1].trim()}`,
        timePart: parts.slice(2).join(',').trim()
      };
    }
  }
  return { datePart: raw, timePart: 'Recorded Log' };
};

const getImpactedUnitsMeta = (count: number, type: CategoryType) => {
  const n = Math.max(1, Number(count) || 1);
  const isSystem = type === 'System';
  const unitWord = isSystem
    ? n === 1
      ? 'Service Node'
      : 'Service Nodes'
    : n === 1
    ? 'PC Unit'
    : 'PC Units';

  const scopeLabel =
    n === 1
      ? 'Single Workstation'
      : n <= 5
      ? 'Multi-Terminal'
      : n <= 30
      ? 'Lab Section Scope'
      : 'Full Cluster Scope';

  const pillColor =
    n >= 15
      ? 'bg-rose-50 text-rose-800 border-rose-300'
      : n > 1
      ? 'bg-amber-50 text-amber-900 border-amber-300'
      : 'bg-blue-50 text-blue-800 border-blue-300';

  return {
    count: n,
    label: `${n} ${unitWord}`,
    scopeLabel,
    pillColor,
    isSystem
  };
};

// ============================================================================
// WEB AUDIO SYNTHESIZER FOR REALISTIC NOTIFICATION CHIMES
// ============================================================================
let sharedInstNotifAudioCtx: AudioContext | null = null;

const playInstAlertChime = (type: 'alert' | 'click' | 'delete', soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    if (!sharedInstNotifAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) sharedInstNotifAudioCtx = new AudioCtx();
    }
    if (!sharedInstNotifAudioCtx) return;
    if (sharedInstNotifAudioCtx.state === 'suspended') {
      sharedInstNotifAudioCtx.resume().catch(() => {});
    }

    const playTone = (
      freq: number,
      start: number,
      dur: number,
      wave: OscillatorType = 'sine',
      gainVal = 0.07
    ) => {
      if (!sharedInstNotifAudioCtx) return;
      const osc = sharedInstNotifAudioCtx.createOscillator();
      const gain = sharedInstNotifAudioCtx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(sharedInstNotifAudioCtx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    const now = sharedInstNotifAudioCtx.currentTime;
    if (type === 'alert') {
      playTone(587.33, now, 0.1, 'triangle', 0.09);
      playTone(880, now + 0.09, 0.2, 'sine', 0.11);
    } else if (type === 'delete') {
      playTone(310, now, 0.08, 'sawtooth', 0.045);
      playTone(205, now + 0.06, 0.13, 'sawtooth', 0.045);
    } else {
      playTone(740, now, 0.03, 'sine', 0.03);
    }
  } catch {}
};

// ============================================================================
// SMART AUTO-CLASSIFIER FOR NEW SYSTEM ALERTS
// ============================================================================
const classifyNotificationText = (
  title: string,
  details: string
): { type: CategoryType; severity: SeverityLevel } => {
  const combined = `${title} ${details}`.toLowerCase();

  let type: CategoryType = 'Hardware';
  if (
    combined.includes('dhcp') ||
    combined.includes('ip') ||
    combined.includes('network') ||
    combined.includes('lan') ||
    combined.includes('rj45') ||
    combined.includes('switch') ||
    combined.includes('vlan')
  ) {
    type = 'Network';
  } else if (
    combined.includes('python') ||
    combined.includes('cuda') ||
    combined.includes('kernel') ||
    combined.includes('driver') ||
    combined.includes('license') ||
    combined.includes('os')
  ) {
    type = 'Software';
  } else if (
    combined.includes('schedule') ||
    combined.includes('conflict') ||
    combined.includes('reservation') ||
    combined.includes('class')
  ) {
    type = 'Schedule';
  } else if (
    combined.includes('database') ||
    combined.includes('backup') ||
    combined.includes('fastapi') ||
    combined.includes('memory') ||
    combined.includes('server')
  ) {
    type = 'System';
  }

  let severity: SeverityLevel = 'Medium';
  if (
    combined.includes('critical') ||
    combined.includes('timeout') ||
    combined.includes('outage') ||
    combined.includes('overheat') ||
    combined.includes('down') ||
    combined.includes('failed')
  ) {
    severity = 'Critical';
  } else if (
    combined.includes('warning') ||
    combined.includes('thermal') ||
    combined.includes('flicker') ||
    combined.includes('high') ||
    combined.includes('85%')
  ) {
    severity = 'High';
  } else if (combined.includes('backup') || combined.includes('completed') || combined.includes('minor')) {
    severity = 'Low';
  }

  return { type, severity };
};

// ============================================================================
// LEVITATING 3D ISOMETRIC TELEMETRY & ALERT BROADCAST RIG
// ============================================================================
const IsometricNotificationsRig: React.FC<{
  activeCount: number;
  criticalCount: number;
}> = ({ activeCount, criticalCount }) => {
  const hasCritical = criticalCount > 0;
  const primaryHex = hasCritical ? '#f43f5e' : '#60a5fa';
  const secondaryHex = hasCritical ? '#be123°C' : '#2563eb';
  const accentHex = hasCritical ? '#fde047' : '#34d399';

  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full ntf-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="ntfBlueCoreGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={primaryHex} stopOpacity="0.96" />
            <stop offset="55%" stopColor={secondaryHex} stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke={accentHex}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="ntf-circuit-flow"
        />

        <g>
          <polygon points="96,18 116,10 131,16 111,24" fill="#334155" stroke="#93c5fd" strokeWidth="0.9" />
          <polygon points="96,18 111,24 111,75 96,69" fill="#0f172a" stroke={primaryHex} strokeWidth="1.3" />
          <polygon points="111,24 131,16 131,67 111,75" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.1" />
          <ellipse
            cx="103.5"
            cy="37"
            rx="4.5"
            ry="7"
            fill="none"
            stroke={primaryHex}
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 37px', animationDuration: hasCritical ? '1s' : '2.4s' }}
          />
          <ellipse
            cx="103.5"
            cy="55"
            rx="4.5"
            ry="7"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 55px', animationDuration: hasCritical ? '1s' : '2.4s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke={primaryHex} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#ntfBlueCoreGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke={accentHex} strokeWidth="1.8" strokeLinecap="round" />
          <text
            x="52"
            y="50"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="monospace"
            transform="skewY(-12)"
          >
            {activeCount} ALERTS
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke={primaryHex} strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={accentHex} strokeWidth="1.1" />
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC 3D MINI DESKTOP PC / SERVER NODE RIG FOR TABLE ROWS & INSPECTOR
// ============================================================================
const MiniPlatformNodeRig: React.FC<{
  severity: SeverityLevel;
  status: NotificationStatus;
  labLabel: string;
  size?: 'sm' | 'lg';
}> = ({ severity, status, labLabel, size = 'sm' }) => {
  const isResolved = status === 'Resolved';
  const isMuted = status === 'Muted';
  const isCrit = severity === 'Critical' && !isResolved;
  const isHigh = severity === 'High' && !isResolved;

  const accentHex = isResolved
    ? '#10b981'
    : isMuted
    ? '#94a3b8'
    : isCrit
    ? '#f43f5e'
    : isHigh
    ? '#f59e0b'
    : '#38bdf8';

  const topHex = isResolved
    ? '#047857'
    : isMuted
    ? '#334155'
    : isCrit
    ? '#be123°C'
    : isHigh
    ? '#b45309'
    : '#1d4ed8';

  const shortTag = labLabel.toLowerCase().includes('comlab 1')
    ? 'CL-01'
    : labLabel.toLowerCase().includes('comlab 2')
    ? 'CL-02'
    : labLabel.toLowerCase().includes('comlab 3')
    ? 'CL-03'
    : labLabel.toLowerCase().includes('fastapi')
    ? 'AI-ENG'
    : 'DB-CORE';

  const sizeClass = size === 'lg' ? 'w-28 h-20' : 'w-12 h-9';
  const uid = `ntf-node-${shortTag}-${severity}-${status}-${size}`;

  return (
    <div className={`${sizeClass} shrink-0 relative flex items-center justify-center select-none`}>
      <svg viewBox="0 0 120 84" className="w-full h-full drop-shadow-[0_3px_5px_rgba(15,23,42,0.28)]">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={topHex} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect x="6" y="68" width="108" height="10" rx="4" fill="#0f172a" stroke={accentHex} strokeWidth="1" strokeOpacity="0.6" />
        <rect x="38" y="54" width="8" height="14" rx="1.5" fill="#475569" />
        <polygon points="30,68 54,68 58,72 26,72" fill="#64748b" />
        <rect x="10" y="10" width="64" height="45" rx="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.8" />
        <rect x="13" y="13" width="58" height="38" rx="2.5" fill={`url(#${uid})`} stroke={accentHex} strokeWidth="0.9" />
        <line x1="18" y1="20" x2="40" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="26" x2="54" y2="26" stroke={accentHex} strokeWidth="1.6" strokeLinecap="round" />
        <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="9.2" fontFamily="monospace" fontWeight="900">
          {shortTag}
        </text>
        <rect x="80" y="10" width="28" height="60" rx="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
        <rect x="83" y="14" width="22" height="44" rx="2" fill="#020617" stroke={accentHex} strokeWidth="0.9" />
        <g
          className={!isMuted ? 'animate-pulse' : ''}
          style={{ transformOrigin: '94px 27px', animationDuration: isCrit ? '0.65s' : '1.8s' }}
        >
          <circle cx="94" cy="27" r="5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="27" r="1.6" fill="#ffffff" />
        </g>
        <circle cx="94" cy="45" r="5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    </div>
  );
};

const DEFAULT_NOTIFICATIONS_SEED: NotificationItem[] = [
  {
    id: 'notif-1',
    code: 'NTF-2026-9081',
    lab: 'ComLab 1 (Networking & ICT)',
    type: 'Network',
    notificationTitle: 'DHCP IP Handshake Timeout',
    details: 'Loose RJ45 Cat6 connection on station PC-003 failed VLAN 101 DHCP acquisition.',
    impactedUnits: 1,
    lastOccurrence: 'Nov 2, 2026 | 11:30 AM',
    dateIso: '2026-11-02',
    severity: 'Critical',
    status: 'Active',
    isRead: false
  },
  {
    id: 'notif-2',
    code: 'NTF-2026-9078',
    lab: 'ComLab 2 (Multimedia & Software Eng)',
    type: 'Hardware',
    notificationTitle: 'GPU Thermal Threshold Warning',
    details: 'Display flickering continuously on PC-014 under heavy 3D shader rendering load.',
    impactedUnits: 3,
    lastOccurrence: 'Nov 2, 2026 | 09:15 AM',
    dateIso: '2026-11-02',
    severity: 'High',
    status: 'Active',
    isRead: false
  },
  {
    id: 'notif-3',
    code: 'NTF-2026-9065',
    lab: 'FastAPI AI Engine',
    type: 'System',
    notificationTitle: 'Microservice High Memory Allocation',
    details: 'AI Telemetry worker memory reached 85% threshold during automated ComLab 1–3 scan.',
    impactedUnits: 18,
    lastOccurrence: 'Nov 1, 2026 | 04:20 PM',
    dateIso: '2026-11-01',
    severity: 'Medium',
    status: 'Active',
    isRead: false
  },
  {
    id: 'notif-4',
    code: 'NTF-2026-9052',
    lab: 'ComLab 3 (AI & Cybersecurity Lab)',
    type: 'Software',
    notificationTitle: 'Python Virtual Environment Kernel Error',
    details: 'CUDA v12.4 drivers failed to import in Jupyter notebook environment on PC-022.',
    impactedUnits: 1,
    lastOccurrence: 'Nov 1, 2026 | 03:45 PM',
    dateIso: '2026-11-01',
    severity: 'Low',
    status: 'Resolved',
    isRead: true
  },
  {
    id: 'notif-5',
    code: 'NTF-2026-9040',
    lab: 'ComLab 2 (Multimedia & Software Eng)',
    type: 'Schedule',
    notificationTitle: 'Lab Schedule Conflict Flagged',
    details: 'Overlapping room reservation detected between BSIS 3A & BSCS 3B in ComLab 2.',
    impactedUnits: 25,
    lastOccurrence: 'Oct 30, 2026 | 02:10 PM',
    dateIso: '2026-10-30',
    severity: 'Medium',
    status: 'Resolved',
    isRead: true
  },
  {
    id: 'notif-6',
    code: 'NTF-2026-9031',
    lab: 'JRMSU DB Core',
    type: 'System',
    notificationTitle: 'Automated Database Backup Completed',
    details: 'Daily PostgreSQL database backup archive generated with 100% SHA-256 integrity.',
    impactedUnits: 54,
    lastOccurrence: 'Oct 29, 2026 | 12:00 AM',
    dateIso: '2026-10-29',
    severity: 'Low',
    status: 'Resolved',
    isRead: true
  }
];

export const NotificationsView: React.FC = () => {
  // Tab State: Notifications vs Settings
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  // Date Range Filter States
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Persistent Master Notifications Dataset
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_notifications_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_NOTIFICATIONS_SEED;
  });

  // YouTube-Style Top Notification Bell Dropdown & Multi-Select States
  const [isBellOpen, setIsBellOpen] = useState<boolean>(false);
  const [bellTab, setBellTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const bellRef = useRef<HTMLDivElement | null>(null);

  // Search & Filter Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [labFilter, setLabFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // Modals & UI States
  const [selectedDetailsNotif, setSelectedDetailsNotif] = useState<NotificationItem | null>(null);
  const [editingNotif, setEditingNotif] = useState<NotificationItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_notif_settings_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      emailAlerts: true,
      pushNotifications: true,
      audibleChimes: true,
      criticalSmsEscalation: true,
      recipientEmail: 'ramon.magsaysay@jrmsu.edu.ph'
    };
  });

  // Create Alert Form State
  const [newAlertForm, setNewAlertForm] = useState({
    lab: 'ComLab 1 (Networking & ICT)',
    type: 'Hardware' as CategoryType,
    notificationTitle: '',
    details: '',
    impactedUnits: 1,
    severity: 'Medium' as SeverityLevel
  });

  // Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Persist Notifications & Settings
  useEffect(() => {
    try {
      localStorage.setItem('labtrack_instructor_notifications_v4', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_instructor_notif_settings_v4', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Clean up selectedIds when notifications change
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => notifications.some(n => n.id === id)));
  }, [notifications]);

  // Close YouTube Bell Tray when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Helper map from backend API to NotificationItem
  const mapApiToNotif = (item: any): NotificationItem => {
    const title = item.notificationTitle || item.title || item.subject || 'System Alert';
    const details = item.details || item.message || item.content || item.description || '';
    const auto = classifyNotificationText(title, details);
    const createdDateIso = item.createdAtUtc
      ? new Date(item.createdAtUtc).toISOString().split('T')[0]
      : item.dateIso || new Date().toISOString().split('T')[0];

    return {
      id: String(item.id || `notif-${Math.random()}`),
      code:
        item.code ||
        item.ticketNo ||
        `NTF-2026-${String(item.id || '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
      lab: item.lab || item.labName || 'ComLab 1 (Networking & ICT)',
      type: (item.type as CategoryType) || auto.type,
      notificationTitle: title,
      details,
      impactedUnits: Number(item.impactedUnits) || 1,
      lastOccurrence:
        item.lastOccurrence ||
        (item.createdAtUtc
          ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Just now'),
      dateIso: createdDateIso,
      severity: (item.severity as SeverityLevel) || auto.severity,
      status: item.isRead ? 'Resolved' : (item.status as NotificationStatus) || 'Active',
      isRead: !!item.isRead
    };
  };

  // FETCH NOTIFICATIONS FROM BACKEND API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/notifications').catch(() => null);
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : data?.items || [];

      if (items.length > 0) {
        const mapped = items.map(mapApiToNotif);
        setNotifications(prev => {
          const map = new Map<string, NotificationItem>();
          prev.forEach(p => map.set(p.code, p));
          mapped.forEach((m: NotificationItem) => {
            if (!map.has(m.code)) map.set(m.code, m);
          });
          return Array.from(map.values());
        });
      }
    } catch {}
  }, []);

  useRealtime(undefined, fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // FILTERED DATA LOGIC
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const search = (searchTerm || '').toLowerCase();
      const title = (item.notificationTitle || '').toLowerCase();
      const details = (item.details || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const lab = (item.lab || '').toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        details.includes(search) ||
        code.includes(search) ||
        lab.includes(search);

      const labF = (labFilter || '').toLowerCase().trim();
      const matchesLab = !labF || lab.includes(labF);
      const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      const itemDate = item.dateIso || '2026-11-01';
      const matchesStart = !startDate || itemDate >= startDate;
      const matchesEnd = !endDate || itemDate <= endDate;

      return matchesSearch && matchesLab && matchesSeverity && matchesStatus && matchesStart && matchesEnd;
    });
  }, [notifications, searchTerm, labFilter, severityFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, labFilter, severityFilter, statusFilter, startDate, endDate]);

  // PAGINATION CALCULATIONS
  const totalRows = filteredNotifications.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredNotifications.slice(startIndex, startIndex + rowsPerPage);

  // STAT COUNTERS
  const totalCount = notifications.length;
  const criticalCount = notifications.filter(n => n.severity === 'Critical').length;
  const activeCount = notifications.filter(n => n.status === 'Active').length;
  const resolvedCount = notifications.filter(n => n.status === 'Resolved').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const bellTrayItems = useMemo(() => {
    if (bellTab === 'UNREAD') return notifications.filter(n => !n.isRead);
    return notifications;
  }, [notifications, bellTab]);

  // ============================================================================
  // SINGLE & BULK SELECTION / ANIMATED DELETE HANDLERS
  // ============================================================================
  const animateAndDeleteIds = async (idsToRemove: string[], toastMsg: string) => {
    if (idsToRemove.length === 0) return;
    playInstAlertChime('delete', settings.audibleChimes);
    setRemovingIds(prev => Array.from(new Set([...prev, ...idsToRemove])));
    setDeleteConfirmId(null);

    for (const id of idsToRemove) {
      apiClient.delete(`/api/v1/notifications/${id}`).catch(() => {});
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !idsToRemove.includes(n.id)));
      setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
      setRemovingIds(prev => prev.filter(id => !idsToRemove.includes(id)));
      if (selectedDetailsNotif && idsToRemove.includes(selectedDetailsNotif.id)) {
        setSelectedDetailsNotif(null);
      }
      showToast(toastMsg);
    }, 250);
  };

  const handleToggleSelectOne = (id: string) => {
    playInstAlertChime('click', settings.audibleChimes);
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleToggleSelectAllList = (list: NotificationItem[]) => {
    playInstAlertChime('click', settings.audibleChimes);
    const listIds = list.map(n => n.id);
    const allSelected = listIds.length > 0 && listIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    animateAndDeleteIds(
      [...selectedIds],
      `Deleted ${selectedIds.length} selected notification${selectedIds.length > 1 ? 's' : ''}!`
    );
  };

  const handleMarkSelectedReadAndResolved = () => {
    if (selectedIds.length === 0) return;
    playInstAlertChime('click', settings.audibleChimes);
    setNotifications(prev =>
      prev.map(n =>
        selectedIds.includes(n.id) ? { ...n, isRead: true, status: 'Resolved' } : n
      )
    );
    showToast(`Marked ${selectedIds.length} selected notification(s) as Resolved & Read.`);
    setSelectedIds([]);
  };

  const handleMarkAllRead = () => {
    playInstAlertChime('click', settings.audibleChimes);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read.');
  };

  // CRUD HANDLERS
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.notificationTitle.trim() || !newAlertForm.details.trim()) {
      showToast('Please complete the alert title and details.');
      return;
    }

    const todayIso = new Date().toISOString().split('T')[0];
    if (endDate < todayIso) setEndDate(todayIso);

    const payload = {
      title: newAlertForm.notificationTitle.trim(),
      message: newAlertForm.details.trim(),
      labName: newAlertForm.lab.trim(),
      severity: newAlertForm.severity,
      type: newAlertForm.type
    };

    try {
      const res = await apiClient.post('/api/v1/notifications', payload).catch(() => null);
      const created = res?.data?.data || res?.data;
      if (created && created.id) {
        setNotifications(prev => [mapApiToNotif(created), ...prev]);
      } else {
        throw new Error('Local fallback');
      }
    } catch {
      const newNotification: NotificationItem = {
        id: `notif-${Date.now()}`,
        code: `NTF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        lab: newAlertForm.lab.trim(),
        type: newAlertForm.type,
        notificationTitle: newAlertForm.notificationTitle.trim(),
        details: newAlertForm.details.trim(),
        impactedUnits: Number(newAlertForm.impactedUnits) || 1,
        lastOccurrence: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        dateIso: todayIso,
        severity: newAlertForm.severity,
        status: 'Active',
        isRead: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    }

    playInstAlertChime('alert', settings.audibleChimes);
    setIsCreateModalOpen(false);
    setNewAlertForm({
      lab: 'ComLab 1 (Networking & ICT)',
      type: 'Hardware',
      notificationTitle: '',
      details: '',
      impactedUnits: 1,
      severity: 'Medium'
    });
    showToast('New system alert dispatched and synced!');
  };

  const handleSaveEditedNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotif) return;
    playInstAlertChime('alert', settings.audibleChimes);
    setNotifications(prev => prev.map(n => (n.id === editingNotif.id ? editingNotif : n)));
    if (selectedDetailsNotif?.id === editingNotif.id) {
      setSelectedDetailsNotif(editingNotif);
    }
    setEditingNotif(null);
    showToast(`Updated system alert ${editingNotif.code}.`);
  };

  const handleToggleResolve = (id: string) => {
    playInstAlertChime('click', settings.audibleChimes);
    setNotifications(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const nextStatus: NotificationStatus = n.status === 'Resolved' ? 'Active' : 'Resolved';
        showToast(`Alert ${n.code} marked as ${nextStatus}.`);
        return { ...n, status: nextStatus, isRead: nextStatus === 'Resolved' ? true : n.isRead };
      })
    );
  };

  const handleToggleMute = async (id: string) => {
    playInstAlertChime('click', settings.audibleChimes);
    try {
      await apiClient.patch(`/api/v1/notifications/${id}/read`).catch(() => {});
    } catch {}

    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextStatus: NotificationStatus = n.status === 'Muted' ? 'Active' : 'Muted';
          showToast(`Alert status changed to ${nextStatus}`);
          return { ...n, status: nextStatus };
        }
        return n;
      })
    );
  };

  const handleDeleteNotification = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    await animateAndDeleteIds([id], `Notification ${target?.code || ''} deleted successfully!`);
  };

  // CSV EXPORT
  const handleExportCSV = () => {
    const headers = [
      'ID,Code,Platform/Lab,Type,Title,Details,Impacted Units,Last Occurrence,Severity,Status\n'
    ];
    const rows = filteredNotifications
      .map(
        n =>
          `"${n.id}","${n.code}","${n.lab}","${n.type}","${n.notificationTitle}","${n.details}",${n.impactedUnits},"${n.lastOccurrence}","${n.severity}","${n.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JRMSU_Notifications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV export downloaded!');
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 shadow-[0_2px_0_#fda4af]';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-300 shadow-[0_2px_0_#fcd34d]';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 shadow-[0_2px_0_#93c5fd]';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-[0_2px_0_#6ee7b7]';
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]';
      case 'Resolved':
        return 'bg-emerald-600 text-white shadow-[0_2px_0_#064e3b]';
      case 'Muted':
        return 'bg-slate-400 text-white';
    }
  };

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));
  const isAllBellSelected =
    bellTrayItems.length > 0 && bellTrayItems.every(item => selectedIds.includes(item.id));
  return (
    <div className="ntf-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* ADVANCED 3D EXTRUDED SHELL, BELL SWING & SPRING POPOVER KEYFRAMES */}
      <style>{`
        .ntf-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .ntf-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .ntf-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .ntf-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -4px, 8px) rotateX(1.6deg);
        }
        .ntf-row-removing {
          opacity: 0 !important;
          transform: translateX(45px) scale(0.92) !important;
          pointer-events: none;
        }
        .ntf-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .ntf-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .ntf-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes ntfRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .ntf-rig-float {
          animation: ntfRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes ntfCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .ntf-circuit-flow {
          animation: ntfCircuitDash 1.4s linear infinite;
        }
        @keyframes ytBellSwing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(16deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(4deg); }
        }
        .yt-bell-ring {
          animation: ytBellSwing 2.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
          transform-origin: top center;
        }
        @keyframes traySpringIn {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .yt-tray-spring {
          animation: traySpringIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* REUSABLE DATALIST FOR DUAL INPUT LAB/PLATFORM */}
      <datalist id="lab-platform-suggestions">
        <option value="ComLab 1 (Networking & ICT)" />
        <option value="ComLab 2 (Multimedia & Software Eng)" />
        <option value="ComLab 3 (AI & Cybersecurity Lab)" />
        <option value="FastAPI AI Engine" />
        <option value="JRMSU DB Core" />
      </datalist>

      {/* LIVE TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-blue-400/50 flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
          <span className="text-xs font-mono font-black">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR (WITH YOUTUBE BELL TRAY)
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-30">
        <div className="flex items-center gap-4">
          <IsometricNotificationsRig activeCount={activeCount} criticalCount={criticalCount} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>REAL-TIME TELEMETRY DISPATCH</span>
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-sky-200 rounded-full font-mono font-black text-[10px] border border-blue-400/40">
                COMLAB 1–3 &amp; CORE BUS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              System Notifications &amp; Alert Center
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              JRMSU Laboratory Real-Time Alerts, Hardware Fault Broadcasts &amp; Infrastructure Telemetry
            </p>
          </div>
        </div>

        {/* RIGHT HEADER CONTROLS: YOUTUBE BELL TRAY + DATE RANGE FILTER PICKERS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* YOUTUBE-STYLE NOTIFICATION BELL WITH SELECT ALL & BULK DELETE */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => {
                playInstAlertChime('click', settings.audibleChimes);
                setIsBellOpen(!isBellOpen);
              }}
              className={`relative px-3.5 py-2 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2 ${
                isBellOpen
                  ? 'bg-sky-400 text-slate-950 border-white shadow-[0_0_20px_rgba(56,189,248,0.6)]'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-white border-blue-400/50 shadow-[0_4px_0_#020617]'
              }`}
              title="Open Notification Bell Tray (Select All & Delete)"
            >
              <div className="relative">
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'yt-bell-ring text-amber-300' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <span className="font-mono font-black text-xs">Bell Tray</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono font-black text-[10px] rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* YOUTUBE-STYLE POPOVER TRAY */}
            {isBellOpen && (
              <div className="yt-tray-spring fixed sm:absolute right-3 sm:right-0 top-20 sm:top-13 w-[94vw] sm:w-[440px] bg-slate-900 text-white rounded-3xl border-2 border-sky-400 shadow-[0_14px_0_#020617,0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-400" />
                    <span className="font-black text-sm">Notifications ({bellTrayItems.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBellTab('ALL')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black cursor-pointer ${
                        bellTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBellTab('UNREAD')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black cursor-pointer ${
                        bellTab === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBellOpen(false)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Select All & Bulk Delete Bar inside Bell Tray */}
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 font-black text-sky-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllBellSelected}
                      onChange={() => handleToggleSelectAllList(bellTrayItems)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                    <span>Select All ({bellTrayItems.length})</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {selectedIds.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={handleMarkSelectedReadAndResolved}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-mono font-black cursor-pointer"
                        >
                          Resolve ({selectedIds.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-mono font-black cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete ({selectedIds.length})
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                  {bellTrayItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-bold">
                      No notifications in tray.
                    </div>
                  ) : (
                    bellTrayItems.map(item => {
                      const isChecked = selectedIds.includes(item.id);
                      const isRemoving = removingIds.includes(item.id);
                      const imp = getImpactedUnitsMeta(item.impactedUnits, item.type);
                      return (
                        <div
                          key={item.id}
                          className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-800/80 transition ${
                            isRemoving ? 'ntf-row-removing' : ''
                          } ${isChecked ? 'bg-blue-950/70' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(item.id)}
                            className="mt-2 w-4 h-4 accent-blue-500 rounded cursor-pointer shrink-0"
                          />
                          <div
                            onClick={() => {
                              setSelectedDetailsNotif(item);
                              setIsBellOpen(false);
                            }}
                            className="flex-1 min-w-0 cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {!item.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                                )}
                                <span className="text-xs font-black text-white truncate">
                                  {item.notificationTitle}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-mono text-[9.5px] font-black whitespace-nowrap shrink-0">
                                {imp.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">{item.details}</p>
                            <span className="text-[10px] font-mono text-sky-300/80 block">
                              {formatLabDisplay(item.lab).primary} • {item.lastOccurrence}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DATE RANGE FILTER PICKERS */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-700 shadow-[0_4px_0_#020617] text-xs font-mono font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-sky-200 focus:outline-none text-[11px]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-sky-200 focus:outline-none text-[11px]"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  showToast('Showing notifications across all dates.');
                }}
                className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-sky-200 rounded-lg text-[10px] cursor-pointer"
              >
                All Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. 4 EXTRUDED 3D METRIC COUNTER CUBES (CLICK TO FILTER)
         ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSeverityFilter('All');
            setStatusFilter('All');
          }}
          className={`ntf-card-3d-lift bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            severityFilter === 'All' && statusFilter === 'All'
              ? 'border-sky-300 ring-4 ring-blue-400/25 shadow-[0_7px_0_#0f172a]'
              : 'border-blue-400/50 shadow-[0_6px_0_#0f172a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-sky-300 block uppercase tracking-wider">
              TOTAL ALERTS
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{totalCount} Logs</span>
            <span className="text-[10.5px] text-slate-300 font-bold">ComLab 1–3 &amp; Core Bus</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Layers className="w-6 h-6 text-sky-300" />
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'Critical' ? 'All' : 'Critical')}
          className={`ntf-card-3d-lift bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            severityFilter === 'Critical'
              ? 'border-white ring-4 ring-rose-400/30 shadow-[0_7px_0_#881337]'
              : 'border-rose-400/50 shadow-[0_6px_0_#881337]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-rose-200 block uppercase tracking-wider">
              CRITICAL SEVERITY
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{criticalCount} Urgent</span>
            <span className="text-[10.5px] text-rose-200 font-bold">Immediate attention</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-amber-300" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')}
          className={`ntf-card-3d-lift bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'Active'
              ? 'border-white ring-4 ring-amber-400/30 shadow-[0_7px_0_#78350f]'
              : 'border-amber-300/60 shadow-[0_6px_0_#78350f]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-amber-100 block uppercase tracking-wider">
              ACTIVE QUEUE
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{activeCount} Open</span>
            <span className="text-[10.5px] text-amber-100 font-bold">Unresolved telemetry</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Clock className="w-6 h-6 text-yellow-200" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          className={`ntf-card-3d-lift bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'Resolved'
              ? 'border-white ring-4 ring-emerald-400/30 shadow-[0_7px_0_#064e3b]'
              : 'border-emerald-400/50 shadow-[0_6px_0_#064e3b]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-200 block uppercase tracking-wider">
              RESOLVED
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{resolvedCount} Cleared</span>
            <span className="text-[10.5px] text-emerald-200 font-bold">Verified nominal</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Check className="w-6 h-6 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. 3D TAB NAVIGATION BAR
         ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-[0_4px_0_#1e3a8a]'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications Queue ({filteredNotifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-[0_4px_0_#1e3a8a]'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Alert Preferences &amp; Settings</span>
          </button>
        </div>

        {/* BULK ACTION BAR WHEN ITEMS ARE SELECTED */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <span className="text-xs font-mono font-black text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={handleMarkSelectedReadAndResolved}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-[0_3px_0_#064e3b] cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Selected
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-[0_3px_0_#881337] cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          4. TAB CONTENT 1: WELL-ORGANIZED, EASY-TO-READ 3D NOTIFICATIONS TABLE
         ===================================================================== */}
      {activeTab === 'notifications' && (
        <div className="ntf-panel-3d rounded-3xl p-5 sm:p-6 space-y-4">
          {/* SEARCH & FILTER CONTROLS BAR WITH DUAL LAB INPUT */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, details, NTF code, or ComLab 1–3..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* DUAL PLATFORM / LAB FILTER INPUT */}
              <div className="relative">
                <input
                  type="text"
                  list="lab-platform-suggestions"
                  placeholder="Select/Type Lab..."
                  value={labFilter}
                  onChange={e => setLabFilter(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 w-48"
                />
                {labFilter && (
                  <button
                    type="button"
                    onClick={() => setLabFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SEVERITY FILTER */}
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* STATUS FILTER */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Muted">Muted</option>
              </select>

              {/* ADD ALERT BUTTON */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="ntf-btn-3d px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Alert</span>
              </button>
            </div>
          </div>

          {/* MAIN ORGANIZED & READABLE 3D NOTIFICATIONS TABLE */}
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-sky-300 font-mono font-black uppercase text-[10px] tracking-wider border-b-2 border-slate-800">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={() => handleToggleSelectAllList(paginatedData)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      title="Select All on Page"
                    />
                  </th>
                  <th className="py-3.5 px-4 min-w-[205px]">Platform / Laboratory</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Alert Code, Title &amp; Diagnostic Details</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Impacted Units</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Last Occurrence</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[145px]">Severity &amp; Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-black text-slate-600">No system notifications match your filters.</p>
                      <p className="text-[11px]">Try adjusting your search query, date range, or lab filter.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(item => {
                    const isChecked = selectedIds.includes(item.id);
                    const isRemoving = removingIds.includes(item.id);
                    const labParts = formatLabDisplay(item.lab);
                    const occParts = formatOccurrenceParts(item.lastOccurrence);
                    const impactMeta = getImpactedUnitsMeta(item.impactedUnits, item.type);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDetailsNotif(item)}
                        className={`transition cursor-pointer hover:bg-blue-50/50 align-middle ${
                          isRemoving ? 'ntf-row-removing' : ''
                        } ${
                          isChecked
                            ? 'bg-blue-50/90'
                            : !item.isRead
                            ? 'bg-sky-50/35'
                            : ''
                        }`}
                      >
                        {/* 1. CHECKBOX */}
                        <td
                          className="py-4 px-3 text-center"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(item.id)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* 2. 3D MINI NODE + STRUCTURED PLATFORM / LAB */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded-xl bg-slate-900 border border-slate-700 shrink-0 shadow-xs">
                              <MiniPlatformNodeRig
                                severity={item.severity}
                                status={item.status}
                                labLabel={item.lab}
                                size="sm"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 text-xs block leading-snug whitespace-nowrap">
                                {labParts.primary}
                              </span>
                              <span className="text-[10.5px] font-semibold text-slate-500 block leading-tight mt-0.5">
                                {labParts.secondary}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. CATEGORY / OBJECT TYPE */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-xl font-mono font-black text-slate-700 border border-slate-300 text-[10.5px] inline-block">
                            {item.type}
                          </span>
                        </td>

                        {/* 4. ORGANIZED ALERT CODE, TITLE & FULL READABLE DETAILS */}
                        <td className="py-4 px-4 max-w-md">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-sky-300 font-mono text-[10px] font-black tracking-wide">
                                {item.code}
                              </span>
                              {!item.isRead && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[9px] font-black">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                  NEW
                                </span>
                              )}
                            </div>

                            <p className="font-black text-slate-900 text-xs sm:text-[13px] leading-snug">
                              {item.notificationTitle}
                            </p>

                            <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
                              {item.details}
                            </p>
                          </div>
                        </td>

                        {/* 5. ORGANIZED IMPACTED UNITS COLUMN (CRISP, NO WRAPPING) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono text-[11px] font-black whitespace-nowrap shadow-2xs ${impactMeta.pillColor}`}
                            >
                              {impactMeta.isSystem ? (
                                <Server className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{impactMeta.label}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 whitespace-nowrap">
                              {impactMeta.scopeLabel}
                            </span>
                          </div>
                        </td>

                        {/* 6. ORGANIZED LAST OCCURRENCE (DATE ON TOP, TIME BELOW) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-black text-slate-800 text-xs block leading-snug">
                            {occParts.datePart}
                          </span>
                          <span className="font-mono font-bold text-[10.5px] text-blue-600 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{occParts.timePart}</span>
                          </span>
                        </td>

                        {/* 7. SEVERITY & STATUS BADGES */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black border whitespace-nowrap ${getSeverityBadge(
                                item.severity
                              )}`}
                            >
                              {item.severity} Severity
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-mono font-black whitespace-nowrap ${getStatusBadge(
                                item.status
                              )}`}
                            >
                              ● {item.status}
                            </span>
                          </div>
                        </td>

                        {/* 8. ACTIONS ROW */}
                        <td
                          className="py-4 px-4 text-right whitespace-nowrap"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleResolve(item.id)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                item.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white border-slate-300'
                              }`}
                              title={item.status === 'Resolved' ? 'Re-open Alert' : 'Mark Resolved'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedDetailsNotif(item)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingNotif(item)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="Edit Alert"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleMute(item.id)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                item.status === 'Muted'
                                  ? 'text-amber-800 bg-amber-100 border-amber-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-slate-950 border-slate-300'
                              }`}
                              title={item.status === 'Muted' ? 'Unmute Alert' : 'Mute Alert'}
                            >
                              {item.status === 'Muted' ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Delete Alert"
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

          {/* TABLE FOOTER / PAGINATION BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-slate-100 text-xs text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-sky-300 hover:text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_3px_0_#020617]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSelectAllList(filteredNotifications)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                {selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0
                  ? 'Unselect All'
                  : `Select All (${filteredNotifications.length})`}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows per Page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-100 border-2 border-slate-300 rounded-xl px-2.5 py-1 font-mono font-black text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <span className="font-mono font-black text-slate-700">
                {totalRows > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, totalRows)} of{' '}
                {totalRows}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. TAB CONTENT 2: 3D ALERT PREFERENCES & SETTINGS PANEL
         ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="ntf-panel-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                TELEMETRY DISPATCH CHANNELS
              </span>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>System Notification Preferences</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                playInstAlertChime('alert', true);
                showToast(`Test Alert & Chime dispatched to ${settings.recipientEmail}!`);
              }}
              className="ntf-btn-3d px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Alert &amp; Chime</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {[
              {
                key: 'emailAlerts',
                badge: 'SMTP DIGEST',
                title: 'Automated Email Notification Digest',
                desc: 'Send critical hardware & network alerts to your institutional email immediately.'
              },
              {
                key: 'pushNotifications',
                badge: 'SIGNALR PUSH',
                title: 'Real-Time Browser Push Notifications',
                desc: 'Display instant popup toast alerts when workstation faults occur in ComLab 1–3.'
              },
              {
                key: 'audibleChimes',
                badge: 'AUDIO SYNTH',
                title: 'Audible Telemetry Chime Feedback',
                desc: 'Play synthesized acoustic chime alerts when critical incidents trigger.'
              },
              {
                key: 'criticalSmsEscalation',
                badge: 'SMS ESCALATION',
                title: 'Critical Outage Hotline Escalation',
                desc: 'Automatically notify Lead System Admin when Critical priority alerts occur.'
              }
            ].map(pref => {
              const isOn = Boolean((settings as any)[pref.key]);
              return (
                <div
                  key={pref.key}
                  onClick={() => {
                    const next = { ...settings, [pref.key]: !isOn };
                    setSettings(next);
                    playInstAlertChime('click', true);
                    showToast(`${pref.title}: ${!isOn ? 'ENABLED' : 'MUTED'}`);
                  }}
                  className={`ntf-card-3d-lift flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                    isOn
                      ? 'bg-white border-blue-400 shadow-[0_4px_0_#bfdbfe]'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black ${
                          isOn ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pref.badge}
                      </span>
                      <span className="font-black text-slate-900 text-xs sm:text-sm">{pref.title}</span>
                    </div>
                    <span className="text-slate-500 block text-[11px] font-medium">{pref.desc}</span>
                  </div>

                  {/* 3D Tactile Sliding Switch */}
                  <div
                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 flex items-center shrink-0 border ${
                      isOn
                        ? 'bg-emerald-500 border-emerald-600 justify-end'
                        : 'bg-slate-300 border-slate-400 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                      {isOn && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2">
              <label className="font-black text-slate-800 block">Primary Faculty / Administrator Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={settings.recipientEmail}
                  onChange={e => setSettings({ ...settings, recipientEmail: e.target.value })}
                  className="flex-1 bg-white border-2 border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => showToast(`Saved recipient email: ${settings.recipientEmail}`)}
                  className="ntf-btn-3d px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. MODALS (3D VIEW DETAILS, CREATE NEW ALERT, EDIT ALERT, DELETE)
         ===================================================================== */}

      {/* MODAL 1: VIEW DETAILS */}
      {selectedDetailsNotif && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Notification Details — {selectedDetailsNotif.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsNotif(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-400/40 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black ${getStatusBadge(
                      selectedDetailsNotif.status
                    )}`}
                  >
                    {selectedDetailsNotif.status}
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 font-bold">
                    {selectedDetailsNotif.type}
                  </span>
                </div>
                <p className="font-black text-white text-sm leading-snug">
                  {selectedDetailsNotif.notificationTitle}
                </p>
                <p className="text-xs font-mono text-slate-300">{selectedDetailsNotif.lab}</p>
              </div>
              <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700 shrink-0">
                <MiniPlatformNodeRig
                  severity={selectedDetailsNotif.severity}
                  status={selectedDetailsNotif.status}
                  labLabel={selectedDetailsNotif.lab}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">
                  Diagnostic Message
                </span>
                <p className="text-slate-800 leading-relaxed">{selectedDetailsNotif.details}</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Severity</span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-black border ${getSeverityBadge(
                      selectedDetailsNotif.severity
                    )}`}
                  >
                    {selectedDetailsNotif.severity}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Impacted Scope</span>
                  <span className="font-mono font-black text-blue-700 block mt-1">
                    {
                      getImpactedUnitsMeta(
                        selectedDetailsNotif.impactedUnits,
                        selectedDetailsNotif.type
                      ).label
                    }
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Timestamp</span>
                  <span className="font-mono font-bold text-slate-800 text-[10.5px] block mt-1">
                    {selectedDetailsNotif.lastOccurrence}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleResolve(selectedDetailsNotif.id);
                  setSelectedDetailsNotif(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-[0_3px_0_#064e3b] cursor-pointer"
              >
                {selectedDetailsNotif.status === 'Resolved' ? 'Re-open Alert' : 'Mark Resolved'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDetailsNotif(null)}
                className="px-5 py-2 bg-slate-900 text-sky-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW ALERT (AUTO-DETECTS TYPE & SEVERITY) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNotification}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create System Alert</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Platform / Laboratory (ComLab 1–3 or Core)</label>
                <input
                  type="text"
                  list="lab-platform-suggestions"
                  placeholder="Select from suggestions or type custom name..."
                  value={newAlertForm.lab}
                  onChange={e => setNewAlertForm({ ...newAlertForm, lab: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Alert Title (Auto-Detects Type &amp; Severity)</label>
                <input
                  type="text"
                  placeholder="e.g. DHCP IP Timeout on PC-008..."
                  value={newAlertForm.notificationTitle}
                  onChange={e => {
                    const val = e.target.value;
                    const auto = classifyNotificationText(val, newAlertForm.details);
                    setNewAlertForm({
                      ...newAlertForm,
                      notificationTitle: val,
                      type: auto.type,
                      severity: auto.severity
                    });
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Details &amp; Description</label>
                <textarea
                  placeholder="Describe the system event or hardware alert..."
                  value={newAlertForm.details}
                  onChange={e => {
                    const val = e.target.value;
                    const auto = classifyNotificationText(newAlertForm.notificationTitle, val);
                    setNewAlertForm({
                      ...newAlertForm,
                      details: val,
                      type: auto.type,
                      severity: auto.severity
                    });
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block mb-1">Object Type</label>
                  <select
                    value={newAlertForm.type}
                    onChange={e => setNewAlertForm({ ...newAlertForm, type: e.target.value as CategoryType })}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Network">Network</option>
                    <option value="Software">Software</option>
                    <option value="Schedule">Schedule</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Impacted PCs</label>
                  <input
                    type="number"
                    min={1}
                    value={newAlertForm.impactedUnits}
                    onChange={e =>
                      setNewAlertForm({ ...newAlertForm, impactedUnits: Number(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-mono font-black text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Severity</label>
                  <select
                    value={newAlertForm.severity}
                    onChange={e =>
                      setNewAlertForm({ ...newAlertForm, severity: e.target.value as SeverityLevel })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ntf-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT EXISTING ALERT */}
      {editingNotif && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedNotification}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Alert ({editingNotif.code})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingNotif(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Platform / Laboratory</label>
                <input
                  type="text"
                  list="lab-platform-suggestions"
                  value={editingNotif.lab}
                  onChange={e => setEditingNotif({ ...editingNotif, lab: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Alert Title</label>
                <input
                  type="text"
                  value={editingNotif.notificationTitle}
                  onChange={e =>
                    setEditingNotif({ ...editingNotif, notificationTitle: e.target.value })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Details</label>
                <textarea
                  rows={3}
                  value={editingNotif.details}
                  onChange={e => setEditingNotif({ ...editingNotif, details: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block mb-1">Impacted PCs</label>
                  <input
                    type="number"
                    min={1}
                    value={editingNotif.impactedUnits}
                    onChange={e =>
                      setEditingNotif({
                        ...editingNotif,
                        impactedUnits: Number(e.target.value) || 1
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-mono font-black text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Severity</label>
                  <select
                    value={editingNotif.severity}
                    onChange={e =>
                      setEditingNotif({ ...editingNotif, severity: e.target.value as SeverityLevel })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingNotif.status}
                    onChange={e =>
                      setEditingNotif({
                        ...editingNotif,
                        status: e.target.value as NotificationStatus
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Muted">Muted</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingNotif(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ntf-btn-3d px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete this system alert?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNotification(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;










