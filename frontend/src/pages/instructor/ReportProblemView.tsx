import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Wrench, Trash2,
  Search, Upload, Paperclip, ShieldAlert, X, Save, Eye,
  Laptop, Tag, AlertCircle, FileText,
  Activity, Layers, CheckCircle, Sparkles, RefreshCw, Download, Edit3, Play, Monitor
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Cancelled';

export interface IssueTicket {
  id: string;
  ticketNo: string;
  lab: string;
  workstation: string;
  category: string;
  priority: PriorityLevel;
  title: string;
  description: string;
  status: TicketStatus;
  reportedBy: string;
  createdAt: string;
  attachmentUrl?: string;
  timeline?: { status: string; date: string; updatedBy: string }[];
}

// ============================================================================
// SMART AUTO-DETECT ISSUE CATEGORY & PRIORITY ENGINE
// ============================================================================
const autoDetectIssueClassification = (
  titleText: string,
  descText: string
): { category: string; priority: PriorityLevel } => {
  const combined = `${titleText} ${descText}`.toLowerCase();

  let category = 'Hardware Issue';
  if (
    combined.includes('network') ||
    combined.includes('lan') ||
    combined.includes('internet') ||
    combined.includes('dhcp') ||
    combined.includes('ip') ||
    combined.includes('rj45') ||
    combined.includes('wifi')
  ) {
    category = 'Network / Connectivity';
  } else if (
    combined.includes('python') ||
    combined.includes('windows') ||
    combined.includes('os') ||
    combined.includes('software') ||
    combined.includes('bsod') ||
    combined.includes('driver') ||
    combined.includes('cuda') ||
    combined.includes('ide')
  ) {
    category = 'Software / OS';
  } else if (
    combined.includes('mouse') ||
    combined.includes('keyboard') ||
    combined.includes('cable') ||
    combined.includes('hdmi') ||
    combined.includes('usb') ||
    combined.includes('headset')
  ) {
    category = 'Peripheral / Cable';
  } else if (
    combined.includes('aircon') ||
    combined.includes('power') ||
    combined.includes('avr') ||
    combined.includes('ups') ||
    combined.includes('outlet') ||
    combined.includes('breaker')
  ) {
    category = 'Facility / Power';
  }

  let priority: PriorityLevel = 'Medium';
  if (
    combined.includes('urgent') ||
    combined.includes('smoke') ||
    combined.includes('burned') ||
    combined.includes('no power') ||
    combined.includes('overheat') ||
    combined.includes('all pc') ||
    combined.includes('no lan') ||
    combined.includes('dead')
  ) {
    priority = 'Urgent';
  } else if (
    combined.includes('flicker') ||
    combined.includes('black screen') ||
    combined.includes('bsod') ||
    combined.includes('crash') ||
    combined.includes('disconnect') ||
    combined.includes('gpu')
  ) {
    priority = 'High';
  } else if (combined.includes('slow') || combined.includes('minor') || combined.includes('keycap')) {
    priority = 'Low';
  }

  return { category, priority };
};

// ============================================================================
// LEVITATING 3D ISOMETRIC DIAGNOSTIC & HARDWARE REPAIR RIG ILLUSTRATION
// ============================================================================
const IsometricDiagnosticRig: React.FC<{ openCount: number }> = ({ openCount }) => {
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full diag-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="diagBlueCoreGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.96" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Extruded Base */}
        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        {/* Animated Isometric Data Trace */}
        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="diag-circuit-flow"
        />

        {/* 3D Tempered-Glass Diagnostic Tower */}
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
            stroke="#fbbf24"
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 37px', animationDuration: '2.2s' }}
          />
          <ellipse
            cx="103.5"
            cy="55"
            rx="4.5"
            ry="7"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 55px', animationDuration: '2.2s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        {/* 3D Isometric Diagnostic Monitor */}
        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#diagBlueCoreGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
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
            {openCount} FAULTS
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.1" />
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC 3D MINI DESKTOP PC DIAGNOSTIC RIG (FOR TICKET CARDS & MODAL)
// ============================================================================
const MiniFaultPcRig: React.FC<{
  status: TicketStatus;
  priority: PriorityLevel;
  wsCode: string;
  size?: 'sm' | 'lg';
}> = ({ status, priority, wsCode, size = 'sm' }) => {
  const isResolved = status === 'Resolved';
  const isInProgress = status === 'In Progress';
  const isUrgent = priority === 'Urgent' && !isResolved;

  const accentHex = isResolved
    ? '#10b981'
    : isUrgent
    ? '#f43f5e'
    : isInProgress
    ? '#38bdf8'
    : '#f59e0b';

  const scrTop = isResolved
    ? '#047857'
    : isUrgent
    ? '#be123°C'
    : isInProgress
    ? '#1d4ed8'
    : '#b45309';

  const sizeClass = size === 'lg' ? 'w-28 h-20' : 'w-14 h-11';
  const uid = `fault-pc-${wsCode.replace(/[^a-zA-Z0-9]/g, '')}-${status}-${size}`;

  return (
    <div className={`${sizeClass} shrink-0 relative flex items-center justify-center select-none`}>
      <svg viewBox="0 0 120 84" className="w-full h-full drop-shadow-[0_4px_6px_rgba(15,23,42,0.3)]">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={scrTop} />
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
        <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="900">
          {wsCode}
        </text>

        <rect x="80" y="10" width="28" height="60" rx="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
        <rect x="83" y="14" width="22" height="44" rx="2" fill="#020617" stroke={accentHex} strokeWidth="0.9" />

        <g
          className="animate-pulse"
          style={{ transformOrigin: '94px 27px', animationDuration: isUrgent ? '0.6s' : '1.6s' }}
        >
          <circle cx="94" cy="27" r="5.5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="27" r="1.8" fill="#ffffff" />
        </g>

        <g
          className="animate-pulse"
          style={{ transformOrigin: '94px 45px', animationDuration: isUrgent ? '0.6s' : '1.6s' }}
        >
          <circle cx="94" cy="45" r="5.5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="45" r="1.8" fill={accentHex} />
        </g>

        <polygon points="16,70 62,70 65,75 13,75" fill="#1e293b" stroke={accentHex} strokeWidth="0.8" />
        <ellipse cx="72" cy="72.5" rx="3.5" ry="2.2" fill="#1e293b" stroke={accentHex} strokeWidth="0.8" />
      </svg>
    </div>
  );
};

const QUICK_ISSUE_TEMPLATES = [
  {
    label: 'Monitor Flicker',
    lab: 'ComLab 2 (Multimedia & Graphics)',
    ws: 'PC-014',
    category: 'Hardware Issue',
    priority: 'High' as PriorityLevel,
    title: 'Monitor Display Flickering Continuously',
    desc: 'The 27" IPS LED monitor repeatedly goes black every 5 seconds while running 3D graphics software.'
  },
  {
    label: 'No LAN / DHCP',
    lab: 'ComLab 1 (Networking & ICT)',
    ws: 'PC-003',
    category: 'Network / Connectivity',
    priority: 'Urgent' as PriorityLevel,
    title: 'No LAN Network Signal / DHCP Timeout',
    desc: 'RJ45 Cat6 port is loose. Workstation cannot acquire an IPv4 address from the VLAN 101 DHCP server.'
  },
  {
    label: 'CPU Overheating',
    lab: 'ComLab 3 (AI & Software Eng)',
    ws: 'PC-026',
    category: 'Hardware Issue',
    priority: 'Urgent' as PriorityLevel,
    title: 'CPU Thermal Threshold Exceeded (86°C)',
    desc: 'Workstation cooling fan RPM dropping under load; requires thermal paste servicing and fan check.'
  },
  {
    label: 'CUDA / VENV Error',
    lab: 'ComLab 3 (AI & Software Eng)',
    ws: 'PC-022',
    category: 'Software / OS',
    priority: 'Low' as PriorityLevel,
    title: 'Python VENV & CUDA Kernel Mismatch',
    desc: 'Jupyter Notebook failing to import installed PyTorch CUDA v12.4 runtime libraries.'
  }
];

const DEFAULT_TICKETS_SEED: IssueTicket[] = [
  {
    id: 't-101',
    ticketNo: 'TK-2026-0891',
    lab: 'ComLab 2 (Multimedia & Graphics)',
    workstation: 'PC-014',
    category: 'Hardware Issue',
    priority: 'High',
    title: 'Monitor Display Flickering Continuously',
    description: 'The LED monitor repeatedly goes black every 5 seconds while running graphics apps.',
    status: 'In Progress',
    reportedBy: 'Engr. Clara Reyes',
    createdAt: '2026-11-08 09:15 AM',
    attachmentUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=400&auto=format&fit=crop',
    timeline: [
      { status: 'Reported via Instructor Desk', date: '2026-11-08 09:15 AM', updatedBy: 'Engr. Clara Reyes' },
      { status: 'Assigned to Lab Technician', date: '2026-11-08 09:40 AM', updatedBy: 'Admin Service Desk' }
    ]
  },
  {
    id: 't-102',
    ticketNo: 'TK-2026-0892',
    lab: 'ComLab 2 (Multimedia & Graphics)',
    workstation: 'PC-019',
    category: 'Network / Connectivity',
    priority: 'Urgent',
    title: 'No LAN Network Signal / 10Mbps Link',
    description: 'RJ45 port is loose. Station cannot acquire gigabit link from VLAN switch.',
    status: 'Pending',
    reportedBy: 'Prof. Ramon Magsaysay',
    createdAt: '2026-11-08 10:30 AM',
    timeline: [
      { status: 'Reported via Instructor Desk', date: '2026-11-08 10:30 AM', updatedBy: 'Prof. Ramon Magsaysay' }
    ]
  },
  {
    id: 't-103',
    ticketNo: 'TK-2026-0888',
    lab: 'ComLab 3 (AI & Software Eng)',
    workstation: 'PC-022',
    category: 'Software / OS',
    priority: 'Low',
    title: 'Python VENV Kernel Corruption',
    description: 'Jupyter notebook failing to import installed CUDA modules.',
    status: 'Resolved',
    reportedBy: 'Student Assistant',
    createdAt: '2026-11-07 03:45 PM',
    timeline: [
      { status: 'Reported', date: '2026-11-07 03:45 PM', updatedBy: 'Student Assistant' },
      { status: 'Resolved & Workstation Released', date: '2026-11-07 05:10 PM', updatedBy: 'Tech Support' }
    ]
  }
];

export const ReportProblemView: React.FC = () => {
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);

  // New Issue Form State
  const initialForm = {
    lab: 'ComLab 1 (Networking & ICT)',
    workstation: 'PC-008',
    category: 'Hardware Issue',
    priority: 'Medium' as PriorityLevel,
    title: '',
    description: '',
    attachmentUrl: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persistent Tickets Database State (Shared with Admin Service Desk)
  const [tickets, setTickets] = useState<IssueTicket[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_tickets_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TICKETS_SEED;
  });

  // UI Control & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTicketView, setSelectedTicketView] = useState<IssueTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<IssueTicket | null>(null);

  // Custom Centered Delete Confirmation Modal State
  const [ticketToDelete, setTicketToDelete] = useState<IssueTicket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ============================================================================
  // TWO-WAY SYNC WITH ADMIN SERVICE DESK & LAB AVAILABILITY MATRIX
  // ============================================================================
  useEffect(() => {
    try {
      if (tickets.length > 0) {
        localStorage.setItem('labtrack_instructor_tickets_v3', JSON.stringify(tickets));

        // Mirror to Admin Service Desk (`labtrack_service_tickets_v4`) so Admin sees all instructor tickets!
        const adminTicketsMirror = tickets.map(t => ({
          id: t.id,
          ticketNo: t.ticketNo,
          lab: t.lab,
          workstation: t.workstation.toUpperCase().replace(/^WS-0?(\d+)$/i, (_, d) => `PC-${String(d).padStart(3, '0')}`),
          reportedBy: t.reportedBy,
          reporterType: 'FACULTY',
          category: t.category.toUpperCase().split(' ')[0],
          priority: t.priority === 'Urgent' ? 'CRITICAL' : t.priority.toUpperCase(),
          status:
            t.status === 'Resolved'
              ? 'RESOLVED'
              : t.status === 'In Progress'
              ? 'IN_PROGRESS'
              : 'OPEN',
          description: `${t.title} — ${t.description}`,
          createdAt: t.createdAt
        }));
        localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify(adminTicketsMirror));
      }
    } catch {}
  }, [tickets]);

  // Helper function to normalize status from Backend API
  const normalizeStatus = (s: string): TicketStatus => {
    if (!s) return 'Pending';
    const upper = s.toUpperCase().replace('_', ' ');
    if (upper.includes('RESOLV') || upper.includes('CLOSED')) return 'Resolved';
    if (upper.includes('PROGRESS') || upper.includes('IN_PROGRESS')) return 'In Progress';
    if (upper.includes('CANCEL')) return 'Cancelled';
    return 'Pending';
  };

  const mapApiToTicket = (item: any): IssueTicket => ({
    id: item.id || `t-${Math.random()}`,
    ticketNo:
      item.ticketNo ||
      item.code ||
      `TK-2026-${String(item.id || '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
    lab: item.labName || item.laboratoryName || item.lab || 'ComLab 1 (Networking & ICT)',
    workstation: item.workstationCode || item.workstationId || item.workstation || 'PC-008',
    category: item.category || item.title || 'Hardware Issue',
    priority: (item.priority as PriorityLevel) || 'Medium',
    title: item.title || item.category || 'Problem Report',
    description: item.description || '',
    status: normalizeStatus(item.status),
    reportedBy: item.reporterName || item.reportedBy || 'Faculty Instructor',
    createdAt: item.createdAtUtc
      ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      : item.createdAt || 'Just now',
    attachmentUrl:
      item.attachmentUrl ||
      (item.hasPhoto
        ? 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=400&auto=format&fit=crop'
        : undefined),
    timeline: item.timeline || [
      {
        status: 'Reported',
        date: item.createdAtUtc
          ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          : 'Just now',
        updatedBy: item.reporterName || 'Faculty Instructor'
      }
    ]
  });

  // FETCH TICKETS FROM BACKEND API
  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiClient
        .get('/api/v1/problem-reports/mine')
        .catch(() => apiClient.get('/api/v1/problem-reports'))
        .catch(() => null);
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) {
        const apiMapped = items.map(mapApiToTicket);
        setTickets(prev => {
          const map = new Map<string, IssueTicket>();
          apiMapped.forEach((t: IssueTicket) => map.set(t.id, t));
          prev.forEach(local => {
            if (!map.has(local.id)) map.set(local.id, local);
          });
          return Array.from(map.values());
        });
      }
    } catch {}
  }, []);

  useRealtime(fetchTickets);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Image Upload Handler
  const handleMainAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
          showToast('Photo evidence attached to report!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CREATE Ticket (Backend API + Sync with Admin & Workstation Matrix)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lab.trim() || !formData.title.trim() || !formData.description.trim()) {
      showToast('Please complete the laboratory name, title, and issue description.');
      return;
    }

    setIsSubmitting(true);
    const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        labName: formData.lab.trim(),
        workstationId: formData.workstation.trim().toUpperCase(),
        priority: formData.priority,
        attachmentUrl: formData.attachmentUrl,
        campus: 'JRMSU Main Campus'
      };

      const res = await apiClient.post('/api/v1/problem-reports', payload).catch(() => null);
      const createdData = res?.data?.data || res?.data;

      const newTicket: IssueTicket = mapApiToTicket(
        createdData || {
          ...payload,
          id: `t-${Date.now()}`,
          ticketNo: `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'Pending',
          reportedBy: 'Prof. Ramon Magsaysay',
          createdAt: nowFormatted,
          timeline: [
            {
              status: 'Ticket Dispatched to Admin Service Desk',
              date: nowFormatted,
              updatedBy: 'Prof. Ramon Magsaysay'
            }
          ]
        }
      );

      setTickets(prev => [newTicket, ...prev]);
      showToast(`Dispatched ${newTicket.ticketNo} (${newTicket.workstation}) to Admin Service Desk!`);
      setFormData(initialForm);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE Ticket Status (Pending -> In Progress -> Resolved)
  const handleUpdateTicketStatus = (ticketId: string, nextStatus: TicketStatus) => {
    const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const nextTimeline = [
          ...(t.timeline || []),
          {
            status: `Status changed to ${nextStatus}`,
            date: nowStr,
            updatedBy: 'Instructor / Tech Desk'
          }
        ];
        const updated = { ...t, status: nextStatus, timeline: nextTimeline };
        if (selectedTicketView?.id === ticketId) {
          setSelectedTicketView(updated);
        }
        return updated;
      })
    );
    showToast(`Updated ticket status to ${nextStatus} (Synced with Admin & Lab Availability).`);
  };

  const handleSaveEditedTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    setTickets(prev => prev.map(t => (t.id === editingTicket.id ? editingTicket : t)));
    if (selectedTicketView?.id === editingTicket.id) {
      setSelectedTicketView(editingTicket);
    }
    setEditingTicket(null);
    showToast(`Saved changes for ticket ${editingTicket.ticketNo}.`);
  };

  // DELETE Ticket
  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const id = ticketToDelete.id;
    const ticketNo = ticketToDelete.ticketNo;
    setDeletingId(id);
    setTicketToDelete(null);

    try {
      await apiClient.delete(`/api/v1/problem-reports/${id}`).catch(() => {});
    } catch {}

    setTimeout(() => {
      setTickets(prev => prev.filter(t => t.id !== id));
      if (selectedTicketView?.id === id) setSelectedTicketView(null);
      setDeletingId(null);
      showToast(`Ticket ${ticketNo} removed from tracker.`);
    }, 340);
  };

  // EXPORT CSV
  const handleExportCsv = () => {
    const headers = ['Ticket No,Laboratory,Workstation,Category,Priority,Status,Title,Reported By,Created At'];
    const rows = filteredTickets.map(
      t =>
        `"${t.ticketNo}","${t.lab}","${t.workstation}","${t.category}","${t.priority}","${t.status}","${t.title.replace(/"/g, '""')}","${t.reportedBy}","${t.createdAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_Problem_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Problem Reports Ledger to CSV.');
  };

  // FILTERED TICKETS
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const search = (searchTerm || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const ws = (t.workstation || '').toLowerCase();
      const tkNo = (t.ticketNo || '').toLowerCase();
      const labName = (t.lab || '').toLowerCase();

      const matchesSearch =
        !search || title.includes(search) || ws.includes(search) || tkNo.includes(search) || labName.includes(search);
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // METRIC COUNTERS
  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300 shadow-[0_2px_0_#fda4af]';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-300 shadow-[0_2px_0_#fcd34d]';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 shadow-[0_2px_0_#93c5fd]';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-[0_2px_0_#6ee7b7]';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500 text-slate-950 shadow-[0_2px_0_#78350f]';
      case 'In Progress':
        return 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]';
      case 'Resolved':
        return 'bg-emerald-600 text-white shadow-[0_2px_0_#064e3b]';
      case 'Cancelled':
        return 'bg-slate-400 text-white';
    }
  };
  return (
    <div className="prob-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* ADVANCED 4D / 3D EXTRUDED SHELL & PERSPECTIVE TILT STYLES */}
      <style>{`
        .prob-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .prob-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .prob-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .prob-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -4px, 10px) rotateX(1.6deg);
        }
        .prob-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .prob-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .prob-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes diagRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .diag-rig-float {
          animation: diagRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes diagCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .diag-circuit-flow {
          animation: diagCircuitDash 1.4s linear infinite;
        }
        @keyframes diagHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .diag-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: diagHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={mainFileInputRef}
        onChange={handleMainAttachmentUpload}
        accept="image/*"
        className="hidden"
      />

      {/* DATALIST SUGGESTIONS FOR DUAL LAB & WORKSTATION INPUT */}
      <datalist id="lab-room-suggestions">
        <option value="ComLab 1 (Networking & ICT)" />
        <option value="ComLab 2 (Multimedia & Graphics)" />
        <option value="ComLab 3 (AI & Software Eng)" />
        <option value="ComLab 4 (Cybersecurity & IoT)" />
        <option value="Server Room Node" />
      </datalist>

      <datalist id="ws-code-suggestions">
        <option value="PC-001" />
        <option value="PC-003" />
        <option value="PC-008" />
        <option value="PC-014" />
        <option value="PC-019" />
        <option value="PC-022" />
        <option value="PC-026" />
        <option value="WS-08" />
        <option value="WS-14" />
      </datalist>

      {/* LIVE TOAST BANNER */}
      {toastMessage && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all animate-in slide-in-from-top duration-300 border-2 border-blue-400/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            <span className="text-xs font-black tracking-wide font-mono">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[10px] bg-white/20 hover:bg-white/30 font-mono px-2.5 py-0.5 rounded-full font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* =====================================================================
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR
         ===================================================================== */}
      <div className="diag-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricDiagnosticRig openCount={pendingCount + inProgressCount} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SYNCED WITH ADMIN SERVICE DESK</span>
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-sky-200 rounded-full font-mono font-black text-[10px] border border-blue-400/40">
                AUTO FAULT CLASSIFIER
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Report a Problem &amp; 3D Issue Tracker
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Real-time workstation fault dispatch, photo evidence vault, and live repair timeline synced with Admin
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => {
              fetchTickets();
              showToast('Synchronized fault tickets with Admin Service Desk.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Desk</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. 4 EXTRUDED 3D KPI COUNTER CUBES (CLICK TO FILTER)
         ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('All')}
          className={`prob-card-3d-lift bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'All'
              ? 'border-sky-300 ring-4 ring-blue-400/25 shadow-[0_7px_0_#0f172a]'
              : 'border-blue-400/50 shadow-[0_6px_0_#0f172a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-sky-300 block uppercase tracking-wider">
              TOTAL REPORTS
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{totalCount} Tickets</span>
            <span className="text-[11px] text-slate-300 font-bold">All logged lab incidents</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Layers className="w-6 h-6 text-sky-300" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
          className={`prob-card-3d-lift bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'Pending'
              ? 'border-white ring-4 ring-amber-400/30 shadow-[0_7px_0_#78350f]'
              : 'border-amber-300/60 shadow-[0_6px_0_#78350f]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-amber-100 block uppercase tracking-wider">
              PENDING QUEUE
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{pendingCount} Waiting</span>
            <span className="text-[11px] text-amber-100 font-bold">Awaiting technician dispatch</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Clock className="w-6 h-6 text-yellow-200" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
          className={`prob-card-3d-lift bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'In Progress'
              ? 'border-white ring-4 ring-blue-400/30 shadow-[0_7px_0_#1e3a8a]'
              : 'border-indigo-400/50 shadow-[0_6px_0_#1e3a8a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-indigo-200 block uppercase tracking-wider">
              IN PROGRESS
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{inProgressCount} Active</span>
            <span className="text-[11px] text-indigo-200 font-bold">Active repair on workstation</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Activity className="w-6 h-6 text-sky-300 animate-pulse" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          className={`prob-card-3d-lift bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            statusFilter === 'Resolved'
              ? 'border-white ring-4 ring-emerald-400/30 shadow-[0_7px_0_#064e3b]'
              : 'border-emerald-400/50 shadow-[0_6px_0_#064e3b]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-200 block uppercase tracking-wider">
              RESOLVED
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono mt-0.5 block">{resolvedCount} Fixed</span>
            <span className="text-[11px] text-emerald-200 font-bold">PCs restored to Available</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <CheckCircle className="w-6 h-6 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN TWO-COLUMN 3D WORKSPACE GRID
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 COLS): 3D SUBMIT PROBLEM CONSOLE */}
        <div className="lg:col-span-5 prob-panel-3d p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3.5">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                INSTANT ADMIN SERVICE DESK DISPATCH
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Submit Problem Report</span>
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-black">
              AUTO-SYNC
            </span>
          </div>

          {/* 1-Click Quick Fault Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase block">
              1-Click Quick Fault Templates:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ISSUE_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      lab: tpl.lab,
                      workstation: tpl.ws,
                      category: tpl.category,
                      priority: tpl.priority,
                      title: tpl.title,
                      description: tpl.desc
                    })
                  }
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-left transition cursor-pointer flex items-center justify-between text-[10.5px] font-bold text-slate-700"
                >
                  <span className="truncate">{tpl.label}</span>
                  <span className="font-mono text-[9px] text-blue-600 font-black ml-1 shrink-0">{tpl.ws}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-bold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* DUAL LAB INPUT FIELD */}
              <div className="sm:col-span-2">
                <label className="block mb-1 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-600" /> Laboratory Room
                </label>
                <input
                  type="text"
                  list="lab-room-suggestions"
                  placeholder="Select or type custom lab..."
                  value={formData.lab}
                  onChange={e => setFormData({ ...formData, lab: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  required
                />
              </div>

              {/* WORKSTATION FIELD */}
              <div>
                <label className="block mb-1 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" /> PC / Unit
                </label>
                <input
                  type="text"
                  list="ws-code-suggestions"
                  placeholder="e.g. PC-008"
                  value={formData.workstation}
                  onChange={e => setFormData({ ...formData, workstation: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-mono font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* TITLE FIELD (AUTO-DETECTS CATEGORY & PRIORITY) */}
            <div>
              <label className="block mb-1">Issue Title (Auto-Detects Category &amp; Priority)</label>
              <input
                type="text"
                placeholder="Brief summary of the problem..."
                value={formData.title}
                onChange={e => {
                  const val = e.target.value;
                  const detected = autoDetectIssueClassification(val, formData.description);
                  setFormData({
                    ...formData,
                    title: val,
                    category: detected.category,
                    priority: detected.priority
                  });
                }}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                required
              />
            </div>

            {/* CATEGORY FIELD */}
            <div>
              <label className="block mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Auto-Detected Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 font-black text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer transition"
              >
                <option value="Hardware Issue">Hardware Issue</option>
                <option value="Software / OS">Software / OS</option>
                <option value="Network / Connectivity">Network / Connectivity</option>
                <option value="Peripheral / Cable">Peripheral / Cable</option>
                <option value="Facility / Power">Facility / Power</option>
              </select>
            </div>

            {/* 3D TACTILE PRIORITY PILLS */}
            <div>
              <label className="block mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Urgent'] as PriorityLevel[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-2 rounded-xl text-[11px] font-mono font-black transition cursor-pointer border-2 ${
                      formData.priority === p
                        ? p === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-[0_3px_0_#881337] -translate-y-0.5'
                          : p === 'High'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-[0_3px_0_#78350f] -translate-y-0.5'
                          : p === 'Medium'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-[0_3px_0_#1e3a8a] -translate-y-0.5'
                          : 'bg-emerald-600 text-white border-emerald-700 shadow-[0_3px_0_#064e3b] -translate-y-0.5'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION FIELD */}
            <div>
              <label className="block mb-1">Detailed Diagnostic Description</label>
              <textarea
                placeholder="Provide detailed information regarding the workstation problem..."
                value={formData.description}
                onChange={e => {
                  const val = e.target.value;
                  const detected = autoDetectIssueClassification(formData.title, val);
                  setFormData({
                    ...formData,
                    description: val,
                    category: detected.category,
                    priority: detected.priority
                  });
                }}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition h-20 resize-none"
                required
              />
            </div>

            {/* ATTACHMENT EVIDENCE DROPZONE */}
            <div>
              <label className="block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Photo / Screenshot Evidence
              </label>

              {formData.attachmentUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-blue-300 group">
                  <img src={formData.attachmentUrl} alt="Preview" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, attachmentUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full transition shadow-md hover:scale-105 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  className="w-full py-3 bg-slate-50 hover:bg-blue-50/50 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="font-black">Attach Photo / Screenshot</span>
                </button>
              )}
            </div>

            {/* FORM ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => setFormData(initialForm)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="prob-btn-3d px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (7 COLS): 3D TICKETS LIST DASHBOARD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="prob-panel-3d p-6 rounded-3xl space-y-4">
            {/* SEARCH & FILTER CONTROLS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b-2 border-slate-100 pb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, lab, PC-014, or ticket #..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* 3D TICKETS LIST CARDS */}
            <div className="space-y-3.5 max-h-[590px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-black text-slate-600">No problem tickets found</p>
                  <p className="text-[11px]">Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const isBeingDeleted = deletingId === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketView(ticket)}
                      className={`prob-card-3d-lift p-4 bg-white hover:bg-blue-50/30 rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-[0_5px_0_#e2e8f0] space-y-3 cursor-pointer ${
                        isBeingDeleted ? 'opacity-0 -translate-x-12 scale-95 pointer-events-none' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-sky-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700">
                            {ticket.ticketNo}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black border ${getPriorityBadge(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black ${getStatusBadge(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" /> {ticket.createdAt}
                        </span>
                      </div>

                      {/* Middle Row: 3D Mini Desktop PC Rig + Issue Title & Description */}
                      <div className="flex items-center gap-3.5">
                        <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shrink-0">
                          <MiniFaultPcRig
                            status={ticket.status}
                            priority={ticket.priority}
                            wsCode={ticket.workstation}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                            {ticket.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Bar: Location Badges & Quick Actions */}
                      <div
                        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 font-black">
                            {ticket.lab.split('(')[0].trim()}
                          </span>
                          <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-xl border border-blue-200 font-mono font-black">
                            {ticket.workstation}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                            {ticket.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {ticket.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ticket.id, 'In Progress')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-[10px] rounded-xl shadow-[0_2px_0_#1e3a8a] cursor-pointer flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Start Repair
                            </button>
                          )}

                          {ticket.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ticket.id, 'Resolved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-[10px] rounded-xl shadow-[0_2px_0_#064e3b] cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Resolve
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedTicketView(ticket)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingTicket(ticket)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                            title="Edit Ticket"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setTicketToDelete(ticket)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. MODALS (DELETE CONFIRMATION, EDIT TICKET, 3D INSPECT & TIMELINE)
         ===================================================================== */}

      {/* DELETE CONFIRMATION 3D MODAL */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Confirm Ticket Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete ticket{' '}
                <span className="font-black text-slate-900">{ticketToDelete.ticketNo}</span> (
                {ticketToDelete.title})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-[0_4px_0_#881337]"
              >
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TICKET 3D MODAL */}
      {editingTicket && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 ">
          <form
            onSubmit={handleSaveEditedTicket}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Ticket ({editingTicket.ticketNo})
              </h3>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Issue Title</label>
                <input
                  type="text"
                  value={editingTicket.title}
                  onChange={e => setEditingTicket({ ...editingTicket, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-black text-slate-900 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    value={editingTicket.lab}
                    onChange={e => setEditingTicket({ ...editingTicket, lab: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Workstation</label>
                  <input
                    type="text"
                    list="ws-code-suggestions"
                    value={editingTicket.workstation}
                    onChange={e => setEditingTicket({ ...editingTicket, workstation: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    value={editingTicket.priority}
                    onChange={e => setEditingTicket({ ...editingTicket, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-black text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingTicket.status}
                    onChange={e => setEditingTicket({ ...editingTicket, status: e.target.value as TicketStatus })}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-black text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingTicket.description}
                  onChange={e => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prob-btn-3d px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: 3D TICKET PREVIEW & INTERACTIVE TIMELINE */}
      {selectedTicketView && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Ticket Details — {selectedTicketView.ticketNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketView(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D Workstation Diagnostic Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-400/40 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black ${getStatusBadge(
                      selectedTicketView.status
                    )}`}
                  >
                    {selectedTicketView.status}
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 font-bold">
                    {selectedTicketView.category}
                  </span>
                </div>
                <p className="font-black text-white text-sm truncate">{selectedTicketView.title}</p>
                <p className="text-xs font-mono text-slate-300">
                  {selectedTicketView.lab} • <strong className="text-sky-300">{selectedTicketView.workstation}</strong>
                </p>
              </div>
              <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700 shrink-0">
                <MiniFaultPcRig
                  status={selectedTicketView.status}
                  priority={selectedTicketView.priority}
                  wsCode={selectedTicketView.workstation}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">
                  Diagnostic Description
                </span>
                <p className="text-slate-800 leading-relaxed font-semibold">
                  {selectedTicketView.description}
                </p>
              </div>

              {selectedTicketView.attachmentUrl && (
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">
                    Attached Photo Evidence
                  </span>
                  <img
                    src={selectedTicketView.attachmentUrl}
                    alt="Evidence"
                    className="w-full h-36 object-cover rounded-2xl border-2 border-slate-200"
                  />
                </div>
              )}

              {/* INTERACTIVE STATUS PROGRESSION STEPPER */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                <span className="text-[10px] font-mono font-black text-blue-800 uppercase block">
                  Update Repair Stage (Syncs with Admin &amp; Workstation Matrix):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'In Progress', 'Resolved'] as TicketStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateTicketStatus(selectedTicketView.id, st)}
                      className={`py-2 rounded-xl font-mono text-[10.5px] font-black transition cursor-pointer ${
                        selectedTicketView.status === st
                          ? 'bg-blue-600 text-white shadow-[0_3px_0_#1e3a8a]'
                          : 'bg-white hover:bg-blue-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMELINE HISTORY */}
              {selectedTicketView.timeline && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase block mb-1.5">
                    Activity Timeline
                  </span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {selectedTicketView.timeline.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px]"
                      >
                        <span className="font-black text-slate-800">{item.status}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {item.date} • {item.updatedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicketView(null)}
                className="px-5 py-2 bg-slate-900 text-sky-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportProblemView;










