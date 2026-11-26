import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, Plus, Search, Filter,
  Trash2, Edit3, X, ChevronRight, Monitor, Wrench, Layers,
  ShieldAlert, RefreshCw, UserCheck, Download,
  Activity, Check, Star, Save, Building, Sparkles, Eye, Grid, List
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';

export type RequestCategory = string;
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RequestStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Approved' | 'Completed' | 'Rejected';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
}

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface RequestItem {
  id: string;
  dbId?: string;
  ticketId: string;
  title: string;
  category: RequestCategory;
  labRoom: string;
  pcNode?: string;
  requestedBy: string;
  dateSubmitted: string;
  priority: RequestPriority;
  status: RequestStatus;
  currentStep: 1 | 2 | 3 | 4;
  details: string;
  assignedTechnician?: string;
  rating?: number;
  userFeedback?: string;
  tasks: TaskItem[];
  history: ActivityLog[];
}

const STEP_CONFIG: Array<{ step: 1 | 2 | 3 | 4; label: string; status: RequestStatus }> = [
  { step: 1, label: 'Request Submitted', status: 'Submitted' },
  { step: 2, label: 'In Review', status: 'Under Review' },
  { step: 3, label: 'Processing / Action', status: 'In Progress' },
  { step: 4, label: 'Completed', status: 'Completed' }
];

// ============================================================================
// SMART AUTO-CLASSIFIER & TECHNICAL SUB-TASK GENERATOR
// ============================================================================
const classifyAndGenerateTasks = (
  title: string,
  details: string,
  pcNode: string
): { category: string; priority: RequestPriority; tasks: TaskItem[] } => {
  const combined = `${title} ${details}`.toLowerCase();
  const target = pcNode.trim() || 'Workstation';

  if (
    combined.includes('license') ||
    combined.includes('matlab') ||
    combined.includes('cisco') ||
    combined.includes('software') ||
    combined.includes('python') ||
    combined.includes('cuda') ||
    combined.includes('windows')
  ) {
    return {
      category: 'Software License',
      priority: combined.includes('urgent') || combined.includes('exam') ? 'High' : 'Medium',
      tasks: [
        { id: `t-${Date.now()}-1`, label: `Verify software package & license seat count for ${target}`, completed: false },
        { id: `t-${Date.now()}-2`, label: 'Deploy activation keys via campus domain controller', completed: false },
        { id: `t-${Date.now()}-3`, label: 'Validate runtime execution and user permissions', completed: false }
      ]
    };
  }

  if (
    combined.includes('network') ||
    combined.includes('lan') ||
    combined.includes('dhcp') ||
    combined.includes('ip') ||
    combined.includes('vlan') ||
    combined.includes('rj45')
  ) {
    return {
      category: 'Network & Connectivity',
      priority: 'Urgent',
      tasks: [
        { id: `t-${Date.now()}-1`, label: `Test Cat6 RJ45 patch port signal on ${target}`, completed: false },
        { id: `t-${Date.now()}-2`, label: 'Verify VLAN subnet & DHCP lease assignment', completed: false },
        { id: `t-${Date.now()}-3`, label: 'Run packet loss & gigabit throughput verification', completed: false }
      ]
    };
  }

  if (
    combined.includes('overheat') ||
    combined.includes('thermal') ||
    combined.includes('fan') ||
    combined.includes('clean') ||
    combined.includes('flicker') ||
    combined.includes('repair')
  ) {
    return {
      category: 'Maintenance & Repair',
      priority: combined.includes('overheat') || combined.includes('smoke') ? 'Urgent' : 'High',
      tasks: [
        { id: `t-${Date.now()}-1`, label: `Run hardware thermal & voltage diagnostics on ${target}`, completed: false },
        { id: `t-${Date.now()}-2`, label: 'Service cooling fan assembly and apply Arctic MX-4 thermal paste', completed: false },
        { id: `t-${Date.now()}-3`, label: 'Perform 15-minute load stress test (<65°C target)', completed: false }
      ]
    };
  }

  return {
    category: 'Equipment & Hardware',
    priority:
      combined.includes('urgent')
        ? 'Urgent'
        : combined.includes('upgrade') || combined.includes('gpu')
        ? 'High'
        : 'Medium',
    tasks: [
      { id: `t-${Date.now()}-1`, label: `Inspect hardware slot compatibility on ${target}`, completed: false },
      { id: `t-${Date.now()}-2`, label: 'Install requested hardware module & update firmware', completed: false },
      { id: `t-${Date.now()}-3`, label: 'Run post-installation benchmark & stability check', completed: false }
    ]
  };
};

// ============================================================================
// LEVITATING 3D ISOMETRIC REQUEST PIPELINE & SERVER RIG ILLUSTRATION
// ============================================================================
const IsometricRequestsRig: React.FC<{ activeCount: number; isSyncing: boolean }> = ({
  activeCount,
  isSyncing
}) => {
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full req-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="reqBlueCoreGrad3D" x1="0" y1="0" x2="1" y2="1">
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
          className="req-circuit-flow"
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
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 37px', animationDuration: isSyncing ? '0.7s' : '2.4s' }}
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
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 55px', animationDuration: isSyncing ? '0.7s' : '2.4s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#reqBlueCoreGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
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
            {activeCount} TICKETS
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke="#34d399" strokeWidth="1.1" />
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC 3D MINI DESKTOP PC RIG (FOR REQUEST CARDS & INSPECTOR MODAL)
// ============================================================================
const MiniRequestPcRig: React.FC<{
  status: RequestStatus;
  priority: RequestPriority;
  pcNode?: string;
  size?: 'sm' | 'lg';
}> = ({ status, priority, pcNode = 'PC-001', size = 'sm' }) => {
  const isCompleted = status === 'Completed' || status === 'Approved';
  const isInProgress = status === 'In Progress';
  const isUrgent = priority === 'Urgent' && !isCompleted;

  const accentHex = isCompleted
    ? '#10b981'
    : isUrgent
    ? '#f43f5e'
    : isInProgress
    ? '#38bdf8'
    : '#f59e0b';

  const scrTop = isCompleted
    ? '#047857'
    : isUrgent
    ? '#be123°C'
    : isInProgress
    ? '#1d4ed8'
    : '#b45309';

  const shortCode = pcNode.toLowerCase().includes('all')
    ? 'FLEET'
    : pcNode.slice(0, 7).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-28 h-20' : 'w-14 h-11';
  const uid = `req-pc-${shortCode.replace(/[^a-zA-Z0-9]/g, '')}-${status}-${size}`;

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
        <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="900">
          {shortCode}
        </text>

        <rect x="80" y="10" width="28" height="60" rx="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
        <rect x="83" y="14" width="22" height="44" rx="2" fill="#020617" stroke={accentHex} strokeWidth="0.9" />

        <g
          className="animate-pulse"
          style={{ transformOrigin: '94px 27px', animationDuration: isUrgent ? '0.65s' : '1.7s' }}
        >
          <circle cx="94" cy="27" r="5.5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="27" r="1.8" fill="#ffffff" />
        </g>

        <g
          className="animate-pulse"
          style={{ transformOrigin: '94px 45px', animationDuration: isUrgent ? '0.65s' : '1.7s' }}
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

const QUICK_REQUEST_TEMPLATES = [
  {
    label: 'RAM & GPU Upgrade',
    title: '32GB DDR5 RAM & CUDA Driver Upgrade',
    cat: 'Equipment & Hardware',
    lab: 'ComLab 3 (AI & Software Eng)',
    pc: 'PC-021',
    priority: 'High' as RequestPriority,
    details: 'Requesting 32GB DDR5 memory expansion and NVIDIA CUDA 12.4 toolkit installation for deep learning coursework.'
  },
  {
    label: 'Software License Key',
    title: 'Cisco Packet Tracer & MATLAB License Activation',
    cat: 'Software License',
    lab: 'ComLab 1 (Networking & ICT)',
    pc: 'All Workstations',
    priority: 'Medium' as RequestPriority,
    details: 'Annual academic license key deployment across all networking laboratory workstations.'
  },
  {
    label: 'Thermal & Fan Service',
    title: 'CPU Overheating & Cooling Fan Maintenance',
    cat: 'Maintenance & Repair',
    lab: 'ComLab 2 (Multimedia & Graphics)',
    pc: 'PC-014',
    priority: 'Urgent' as RequestPriority,
    details: 'Workstation thermal sensor reaching 78°C during 3D rendering; requires thermal paste application and fan check.'
  },
  {
    label: 'VLAN Switch Port Fix',
    title: 'RJ45 Patch Panel & VLAN 101 DHCP Sync',
    cat: 'Network & Connectivity',
    lab: 'ComLab 1 (Networking & ICT)',
    pc: 'PC-003',
    priority: 'Urgent' as RequestPriority,
    details: 'Station negotiating at 10Mbps half-duplex; requesting RJ45 keystone replacement and switch port reset.'
  }
];

export const MyRequestsView: React.FC = () => {
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'CARDS_3D' | 'TABLE_3D'>('CARDS_3D');
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamic Database Labs & Workstations for Suggestions
  const [dbLabRooms, setDbLabRooms] = useState<string[]>([
    'ComLab 1 (Networking & ICT)',
    'ComLab 2 (Multimedia & Graphics)',
    'ComLab 3 (AI & Software Eng)'
  ]);
  const [dbPcNodes, setDbPcNodes] = useState<string[]>([
    'PC-001',
    'PC-003',
    'PC-008',
    'PC-014',
    'PC-019',
    'PC-021'
  ]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [inspectRequest, setInspectRequest] = useState<RequestItem | null>(null);
  const [editRequestModal, setEditRequestModal] = useState<RequestItem | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<RequestItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState<string>('');

  // Form Input States for Adding New Ticket
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Equipment & Hardware');
  const [newLabRoom, setNewLabRoom] = useState<string>('ComLab 1 (Networking & ICT)');
  const [newPcNode, setNewPcNode] = useState<string>('PC-008');
  const [newPriority, setNewPriority] = useState<RequestPriority>('Medium');
  const [newDetails, setNewDetails] = useState<string>('');

  const triggerToast = useCallback((msg: string) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(null), 3400);
  }, []);

  // Helper map for backend API & shared storage items
  const mapApiToRequestItem = useCallback((item: any, idx = 0): RequestItem => {
    const rawStatus = String(item.status || 'Submitted').toUpperCase();
    let status: RequestStatus = 'Submitted';
    let currentStep: 1 | 2 | 3 | 4 = item.currentStep || 1;

    if (
      rawStatus.includes('RESOLV') ||
      rawStatus.includes('COMPLET') ||
      rawStatus.includes('APPROV') ||
      rawStatus === 'CLOSED'
    ) {
      status = 'Completed';
      currentStep = 4;
    } else if (rawStatus.includes('PROGRESS')) {
      status = 'In Progress';
      currentStep = 3;
    } else if (rawStatus.includes('REVIEW') || rawStatus === 'PENDING' || rawStatus === 'OPEN') {
      status = 'Under Review';
      currentStep = 2;
    }

    const title = item.title || item.category || 'Laboratory Service Request';
    const details = item.details || item.description || '';
    const pcNode =
      item.pcNode || item.workstation || item.workstationId || item.workstationCode || 'PC-008';
    const labRoom =
      item.labRoom || item.lab || item.labName || item.laboratoryName || 'ComLab 1 (Networking & ICT)';

    const auto = classifyAndGenerateTasks(title, details, pcNode);
    const priorityRaw = String(item.priority || auto.priority);
    const priority: RequestPriority =
      priorityRaw.toUpperCase() === 'CRITICAL' || priorityRaw.toUpperCase() === 'URGENT'
        ? 'Urgent'
        : priorityRaw.toUpperCase() === 'HIGH'
        ? 'High'
        : priorityRaw.toUpperCase() === 'LOW'
        ? 'Low'
        : 'Medium';

    const tasks =
      Array.isArray(item.tasks) && item.tasks.length > 0
        ? item.tasks
        : auto.tasks.map((t, i) => ({
            ...t,
            id: `t-${idx}-${i}`,
            completed: currentStep === 4 ? true : currentStep === 3 ? i < 2 : currentStep === 2 ? i < 1 : false
          }));

    return {
      id: String(item.id || `req-${Date.now()}-${idx}`),
      dbId: item.dbId || (typeof item.id === 'string' && !item.id.startsWith('req-') ? item.id : undefined),
      ticketId:
        item.ticketId ||
        item.ticketNo ||
        item.code ||
        `REQ-2026-${String(item.id || '').slice(-3) || Math.floor(100 + Math.random() * 900)}`,
      title,
      category: item.category || auto.category,
      labRoom,
      pcNode,
      requestedBy: item.requestedBy || item.reportedBy || item.reporterName || 'Engr. Clara Reyes',
      dateSubmitted: item.dateSubmitted
        ? item.dateSubmitted
        : item.createdAtUtc
        ? new Date(item.createdAtUtc).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      priority,
      status,
      currentStep,
      details,
      assignedTechnician: item.assignedTechnician || 'Tech. Carlo Mendoza',
      rating: item.rating,
      userFeedback: item.userFeedback,
      tasks,
      history:
        Array.isArray(item.history) && item.history.length > 0
          ? item.history
          : [
              {
                id: `h-${idx}-1`,
                timestamp:
                  item.createdAt ||
                  new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                action: `Ticket synchronized with Admin Service Desk (${status})`,
                performedBy: item.requestedBy || item.reportedBy || 'Engr. Clara Reyes'
              }
            ]
    };
  }, []);

  // Initial Seed / Cached State
  const [requests, setRequests] = useState<RequestItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_my_requests_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'req-1',
        ticketId: 'REQ-2026-089',
        title: 'RAM & GPU Performance Upgrade Request',
        category: 'Equipment & Hardware',
        labRoom: 'ComLab 3 (AI & Software Eng)',
        pcNode: 'PC-021',
        requestedBy: 'Engr. Clara Reyes',
        dateSubmitted: '2026-11-01',
        priority: 'High',
        status: 'In Progress',
        currentStep: 3,
        details:
          'Requesting 32GB DDR5 RAM upgrade and RTX 4080 CUDA driver re-installation for deep learning lab sessions.',
        assignedTechnician: 'Tech. Carlo Mendoza',
        tasks: [
          { id: 't1', label: 'Inspect motherboard DDR5 RAM slots on PC-021', completed: true },
          { id: 't2', label: 'Install 2x16GB DDR5 6000MHz memory modules', completed: true },
          { id: 't3', label: 'Run CUDA benchmark and thermal stress test', completed: false }
        ],
        history: [
          {
            id: 'h1',
            timestamp: '2026-11-01 08:30 AM',
            action: 'Ticket submitted into system queue',
            performedBy: 'Engr. Clara Reyes'
          },
          {
            id: 'h2',
            timestamp: '2026-11-01 10:15 AM',
            action: 'Request acknowledged & assigned to Tech. Carlo Mendoza',
            performedBy: 'Admin Service Desk'
          }
        ]
      },
      {
        id: 'req-2',
        ticketId: 'REQ-2026-074',
        title: 'Cisco Packet Tracer & MATLAB License Key Activation',
        category: 'Software License',
        labRoom: 'ComLab 1 (Networking & ICT)',
        pcNode: 'All Workstations',
        requestedBy: 'Engr. Clara Reyes',
        dateSubmitted: '2026-10-28',
        priority: 'Medium',
        status: 'Completed',
        currentStep: 4,
        details:
          'Annual software license activation key deployment for networking student lab sessions.',
        assignedTechnician: 'Admin Server Node',
        rating: 5,
        tasks: [
          { id: 't1', label: 'Generate annual academic license key bundle', completed: true },
          { id: 't2', label: 'Deploy keys via active directory domain controller', completed: true },
          { id: 't3', label: 'Verify workstation host compliance across ComLab 1', completed: true }
        ],
        history: [
          {
            id: 'h1',
            timestamp: '2026-10-28 09:00 AM',
            action: 'License activation ticket generated',
            performedBy: 'Engr. Clara Reyes'
          },
          {
            id: 'h2',
            timestamp: '2026-10-29 04:30 PM',
            action: 'Remote deployment completed across all nodes',
            performedBy: 'Admin Server Node'
          }
        ]
      },
      {
        id: 'req-3',
        ticketId: 'REQ-2026-092',
        title: 'CPU Overheating & Fan Cleaning Maintenance',
        category: 'Maintenance & Repair',
        labRoom: 'ComLab 2 (Multimedia & Graphics)',
        pcNode: 'PC-014',
        requestedBy: 'Prof. Maria Clara Santos',
        dateSubmitted: '2026-11-02',
        priority: 'Urgent',
        status: 'Under Review',
        currentStep: 2,
        details:
          'Workstation thermal paste replacement and cooling fan inspection. Thermal sensor reading reaching 78°C.',
        assignedTechnician: 'Engr. Marco Polo Reyes',
        tasks: [
          { id: 't1', label: 'Check chassis fan RPM speed & airflow', completed: true },
          { id: 't2', label: 'Apply Arctic MX-4 thermal paste on CPU die', completed: false },
          { id: 't3', label: 'Verify idle temperature below 42°C', completed: false }
        ],
        history: [
          {
            id: 'h1',
            timestamp: '2026-11-02 07:45 AM',
            action: 'Overheat warning automated alert triggered ticket',
            performedBy: 'LabTrack Telemetry'
          }
        ]
      }
    ];
  });

  // Two-Way Sync with Shared Storage & Admin Service Desk (`labtrack_service_tickets_v4`)
  const persistUnifiedRequests = useCallback((updatedList: RequestItem[]) => {
    setRequests(updatedList);
    try {
      localStorage.setItem('labtrack_my_requests_v3', JSON.stringify(updatedList));

      const adminTicketsMirror = updatedList.map(r => ({
        id: r.id,
        ticketNo: r.ticketId,
        lab: r.labRoom,
        workstation: r.pcNode || 'PC-008',
        reportedBy: r.requestedBy,
        reporterType: 'FACULTY',
        category: r.category.toUpperCase().split(' ')[0],
        priority: r.priority === 'Urgent' ? 'CRITICAL' : r.priority.toUpperCase(),
        status:
          r.status === 'Completed' || r.status === 'Approved'
            ? 'RESOLVED'
            : r.status === 'In Progress'
            ? 'IN_PROGRESS'
            : 'OPEN',
        description: `${r.title} — ${r.details}`,
        createdAt: r.dateSubmitted
      }));
      localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify(adminTicketsMirror));
    } catch {}
  }, []);

  // FETCH & MERGE DATA FROM DATABASE APIs + SHARED TICKETS
  const fetchMyRequests = useCallback(async () => {
    try {
      setIsLoading(true);

      const [labsRes, wsRes, reportsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/laboratories'),
        apiClient.get('/api/v1/workstations'),
        apiClient
          .get('/api/v1/problem-reports/mine')
          .catch(() => apiClient.get('/api/v1/requests/mine'))
      ]);

      if (labsRes.status === 'fulfilled') {
        const rawLabs =
          labsRes.value.data?.data?.items ||
          labsRes.value.data?.data ||
          labsRes.value.data ||
          [];
        if (Array.isArray(rawLabs) && rawLabs.length > 0) {
          const names = rawLabs
            .map((l: any) => String(l.labName || l.name || '').trim())
            .filter(Boolean);
          if (names.length > 0) setDbLabRooms(Array.from(new Set(names)));
        }
      }

      const pcSet = new Set<string>();
      if (wsRes.status === 'fulfilled') {
        const rawWs =
          wsRes.value.data?.data?.items || wsRes.value.data?.data || wsRes.value.data || [];
        if (Array.isArray(rawWs)) {
          rawWs.forEach((w: any) => {
            const code = String(
              w.code || w.workstationNumber || w.pcNumber || w.id || ''
            )
              .trim()
              .toUpperCase();
            if (code) pcSet.add(code);
          });
        }
      }
      try {
        const sharedWs = JSON.parse(localStorage.getItem('labtrack_workstations_v4') || 'null');
        if (Array.isArray(sharedWs)) {
          sharedWs.forEach((w: any) => {
            const code = String(w.pcNumber || w.id || '').trim().toUpperCase();
            if (code) pcSet.add(code);
          });
        }
      } catch {}
      if (pcSet.size > 0) setDbPcNodes(Array.from(pcSet));

      let apiItems: any[] = [];
      if (reportsRes.status === 'fulfilled') {
        const d = reportsRes.value.data?.data || reportsRes.value.data || [];
        apiItems = Array.isArray(d) ? d : d?.items || [];
      }

      let localFiledTickets: any[] = [];
      try {
        const savedFiled = JSON.parse(
          localStorage.getItem('labtrack_instructor_tickets_v3') || 'null'
        );
        if (Array.isArray(savedFiled)) localFiledTickets = savedFiled;
      } catch {}

      const combinedRaw = [...apiItems, ...localFiledTickets];
      if (combinedRaw.length > 0) {
        const mappedIncoming = combinedRaw.map((it, idx) => mapApiToRequestItem(it, idx));
        setRequests(prev => {
          const mergedMap = new Map<string, RequestItem>();
          prev.forEach(item => mergedMap.set(item.ticketId, item));
          mappedIncoming.forEach(inc => {
            if (!mergedMap.has(inc.ticketId)) {
              mergedMap.set(inc.ticketId, inc);
            }
          });
          const mergedArray = Array.from(mergedMap.values());
          localStorage.setItem('labtrack_my_requests_v3', JSON.stringify(mergedArray));
          return mergedArray;
        });
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [mapApiToRequestItem]);

  useRealtime(fetchMyRequests);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Keep inspectRequest synced with state changes
  useEffect(() => {
    if (!inspectRequest) return;
    const latest = requests.find(r => r.id === inspectRequest.id);
    if (latest) setInspectRequest(latest);
  }, [requests, inspectRequest]);

  // Filtering Calculation
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const cat = (req.category || '').toLowerCase();
      const selCat = (selectedCategory || '').toLowerCase().trim();
      const matchesCategory = !selCat || cat.includes(selCat);

      const matchesLab =
        selectedLabFilter === 'All' ||
        (req.labRoom || '')
          .toLowerCase()
          .includes(selectedLabFilter.split('(')[0].trim().toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        req.status === selectedStatus ||
        (selectedStatus === 'Under Review' &&
          (req.status === 'Under Review' || req.status === 'Submitted')) ||
        (selectedStatus === 'Completed' &&
          (req.status === 'Completed' || req.status === 'Approved'));

      const matchesPriority = selectedPriority === 'All' || req.priority === selectedPriority;

      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (req.title || '').toLowerCase().includes(q) ||
        (req.ticketId || '').toLowerCase().includes(q) ||
        (req.labRoom || '').toLowerCase().includes(q) ||
        (req.pcNode || '').toLowerCase().includes(q) ||
        (req.details || '').toLowerCase().includes(q);

      return matchesCategory && matchesLab && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [requests, selectedCategory, selectedLabFilter, selectedStatus, selectedPriority, searchQuery]);

  // Metric Summaries
  const metrics = useMemo(() => {
    return {
      total: requests.length,
      underReview: requests.filter(
        r => r.status === 'Under Review' || r.status === 'Submitted'
      ).length,
      inProgress: requests.filter(r => r.status === 'In Progress').length,
      completed: requests.filter(
        r => r.status === 'Completed' || r.status === 'Approved'
      ).length
    };
  }, [requests]);

  // ============================================================================
  // INTERACTIVE PIPELINE STEPPER, SUB-TASKS & CRUD HANDLERS
  // ============================================================================
  const handleAdvanceStep = async (
    req: RequestItem,
    targetStep: 1 | 2 | 3 | 4,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const stepMeta = STEP_CONFIG.find(s => s.step === targetStep)!;
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    const updatedTasks =
      targetStep === 4
        ? req.tasks.map(t => ({ ...t, completed: true }))
        : req.tasks;

    const newLog: ActivityLog = {
      id: `h-${Date.now()}`,
      timestamp: nowStr,
      action: `Pipeline advanced to Step ${targetStep}: ${stepMeta.label}`,
      performedBy: 'Instructor / Service Desk'
    };

    const updatedList = requests.map(r =>
      r.id === req.id
        ? {
            ...r,
            currentStep: targetStep,
            status: stepMeta.status,
            tasks: updatedTasks,
            history: [newLog, ...r.history]
          }
        : r
    );

    persistUnifiedRequests(updatedList);

    if (req.dbId) {
      apiClient
        .put(`/api/v1/problem-reports/${req.dbId}`, {
          title: req.title,
          category: req.category,
          labName: req.labRoom,
          workstationId: req.pcNode,
          priority: req.priority,
          status: stepMeta.status,
          description: req.details
        })
        .catch(() => {});
    }

    triggerToast(`Updated ${req.ticketId} to Step ${targetStep} (${stepMeta.status}).`);
  };

  const handleToggleTask = (reqId: string, taskId: string) => {
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const updatedList = requests.map(r => {
      if (r.id !== reqId) return r;
      const nextTasks = r.tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const doneCount = nextTasks.filter(t => t.completed).length;

      let nextStep: 1 | 2 | 3 | 4 = r.currentStep;
      let nextStatus: RequestStatus = r.status;
      if (nextTasks.length > 0 && doneCount === nextTasks.length) {
        nextStep = 4;
        nextStatus = 'Completed';
      } else if (doneCount > 0) {
        nextStep = 3;
        nextStatus = 'In Progress';
      } else {
        nextStep = 2;
        nextStatus = 'Under Review';
      }

      const toggledItem = nextTasks.find(t => t.id === taskId);
      const logEntry: ActivityLog = {
        id: `h-${Date.now()}`,
        timestamp: nowStr,
        action: `${toggledItem?.completed ? 'Completed' : 'Re-opened'} task: "${toggledItem?.label}"`,
        performedBy: 'Instructor / Tech Support'
      };

      return {
        ...r,
        tasks: nextTasks,
        currentStep: nextStep,
        status: nextStatus,
        history: [logEntry, ...r.history]
      };
    });

    persistUnifiedRequests(updatedList);
  };

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRequest || !newTaskLabel.trim()) return;
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      label: newTaskLabel.trim(),
      completed: false
    };
    const updatedList = requests.map(r =>
      r.id === inspectRequest.id ? { ...r, tasks: [...r.tasks, newTask] } : r
    );
    persistUnifiedRequests(updatedList);
    setNewTaskLabel('');
    triggerToast('Added new technical checklist item to ticket.');
  };

  const handleSetRating = (reqId: string, stars: number) => {
    const updatedList = requests.map(r => (r.id === reqId ? { ...r, rating: stars } : r));
    persistUnifiedRequests(updatedList);
    triggerToast(`Saved ${stars}-star service rating!`);
  };

  // CRUD: CREATE
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetails.trim() || !newCategory.trim() || !newLabRoom.trim())
      return;

    const payload = {
      title: newTitle.trim(),
      category: newCategory.trim(),
      labName: newLabRoom.trim(),
      workstationId: newPcNode.trim().toUpperCase(),
      priority: newPriority,
      description: newDetails.trim(),
      campus: 'JRMSU Main Campus'
    };

    const auto = classifyAndGenerateTasks(newTitle.trim(), newDetails.trim(), newPcNode.trim());

    let createdItem: RequestItem;
    try {
      const res = await apiClient
        .post('/api/v1/problem-reports', payload)
        .catch(() => apiClient.post('/api/v1/requests', payload));
      const created = res?.data?.data || res?.data;
      if (created && (created.id || created.ticketId)) {
        createdItem = mapApiToRequestItem(created);
      } else {
        throw new Error('Fallback local create');
      }
    } catch {
      createdItem = {
        id: `req-${Date.now()}`,
        ticketId: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: newTitle.trim(),
        category: newCategory.trim(),
        labRoom: newLabRoom.trim(),
        pcNode: newPcNode.trim().toUpperCase() || 'PC-008',
        requestedBy: 'Engr. Clara Reyes',
        dateSubmitted: new Date().toISOString().split('T')[0],
        priority: newPriority,
        status: 'Submitted',
        currentStep: 1,
        details: newDetails.trim(),
        assignedTechnician: 'Admin Service Desk',
        tasks: auto.tasks,
        history: [
          {
            id: `h-${Date.now()}`,
            timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            action: 'Ticket submitted into 3D service pipeline queue',
            performedBy: 'Engr. Clara Reyes'
          }
        ]
      };
    }

    persistUnifiedRequests([createdItem, ...requests]);
    setNewTitle('');
    setNewDetails('');
    setIsAddModalOpen(false);
    triggerToast(`Dispatched ${createdItem.ticketId} (${createdItem.pcNode}) to Admin Service Desk!`);
  };

  // CRUD: UPDATE
  const handleSaveEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequestModal) return;

    try {
      await apiClient
        .put(`/api/v1/problem-reports/${editRequestModal.dbId || editRequestModal.id}`, {
          title: editRequestModal.title,
          category: editRequestModal.category,
          labName: editRequestModal.labRoom,
          workstationId: editRequestModal.pcNode,
          priority: editRequestModal.priority,
          description: editRequestModal.details
        })
        .catch(() => {});
    } catch {}

    const stepForStatus =
      STEP_CONFIG.find(s => s.status === editRequestModal.status)?.step ||
      editRequestModal.currentStep;

    const updatedHistoryLog: ActivityLog = {
      id: `h-${Date.now()}`,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      action: `Ticket details updated (${editRequestModal.status})`,
      performedBy: 'Engr. Clara Reyes'
    };

    const updatedItem: RequestItem = {
      ...editRequestModal,
      currentStep: stepForStatus,
      category: editRequestModal.category.trim(),
      labRoom: editRequestModal.labRoom.trim(),
      history: [updatedHistoryLog, ...editRequestModal.history]
    };

    const nextList = requests.map(r => (r.id === updatedItem.id ? updatedItem : r));
    persistUnifiedRequests(nextList);
    if (inspectRequest?.id === updatedItem.id) setInspectRequest(updatedItem);
    setEditRequestModal(null);
    triggerToast(`Saved changes for ticket ${updatedItem.ticketId}.`);
  };

  // CRUD: DELETE
  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    const id = requestToDelete.id;
    const tId = requestToDelete.ticketId;
    setDeletingId(id);
    setRequestToDelete(null);

    try {
      await apiClient
        .delete(`/api/v1/problem-reports/${requestToDelete.dbId || id}`)
        .catch(() => {});
    } catch {}

    setTimeout(() => {
      const nextList = requests.filter(r => r.id !== id);
      persistUnifiedRequests(nextList);
      if (inspectRequest?.id === id) setInspectRequest(null);
      if (editRequestModal?.id === id) setEditRequestModal(null);
      setDeletingId(null);
      triggerToast(`Removed ticket ${tId} from tracker.`);
    }, 320);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ticket ID,Title,Category,Lab Room,PC Node,Priority,Status,Step,Date Submitted']
        .concat(
          filteredRequests.map(
            r =>
              `${r.ticketId},"${r.title.replace(/"/g, '""')}",${r.category},"${r.labRoom}",${
                r.pcNode || 'N/A'
              },${r.priority},${r.status},Step ${r.currentStep},${r.dateSubmitted}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `JRMSU_LabTrack_Requests_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported Ticket Requests Ledger to CSV.');
  };
  return (
    <div className="req-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* ADVANCED 3D EXTRUDED SHELL, PERSPECTIVE TILT & HOLOGRAPHIC SHIMMER STYLES */}
      <style>{`
        .req-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .req-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .req-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .req-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -4px, 8px) rotateX(1.4deg);
        }
        .req-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .req-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .req-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes reqRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .req-rig-float {
          animation: reqRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes reqCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .req-circuit-flow {
          animation: reqCircuitDash 1.4s linear infinite;
        }
        @keyframes reqHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .req-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: reqHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* DYNAMIC DATALIST SUGGESTIONS */}
      <datalist id="category-suggestions">
        <option value="Equipment & Hardware" />
        <option value="Software License" />
        <option value="Maintenance & Repair" />
        <option value="Network & Connectivity" />
        <option value="Lab Access & Schedule" />
        <option value="System Environment & OS" />
      </datalist>

      <datalist id="lab-room-suggestions">
        {dbLabRooms.map(lab => (
          <option key={lab} value={lab} />
        ))}
      </datalist>

      <datalist id="pc-node-suggestions">
        {dbPcNodes.map(pc => (
          <option key={pc} value={pc} />
        ))}
        <option value="All Workstations" />
      </datalist>

      {/* LIVE TOAST FEEDBACK BANNER */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-blue-400/50 flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
          <span className="text-xs font-mono font-black">{liveToast}</span>
        </div>
      )}

      {/* =====================================================================
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR
         ===================================================================== */}
      <div className="req-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricRequestsRig
            activeCount={metrics.underReview + metrics.inProgress}
            isSyncing={isLoading}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SYNCED WITH DATABASE &amp; ADMIN SERVICE DESK</span>
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-sky-200 rounded-full font-mono font-black text-[10px] border border-blue-400/40">
                4-STAGE 3D PIPELINE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              My Ticket Requests &amp; 3D Pipeline Tracker
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              JRMSU Computer Laboratory hardware upgrades, software licenses, and maintenance work order tracking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => {
              fetchMyRequests();
              triggerToast('Synchronized request pipeline with Database & Admin Service Desk.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewLabRoom(dbLabRooms[0] || 'ComLab 1 (Networking & ICT)');
              setNewPcNode(dbPcNodes[0] || 'PC-008');
              setIsAddModalOpen(true);
            }}
            className="req-btn-3d px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Request Ticket</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. 4 EXTRUDED 3D KPI METRIC CUBES (CLICK TO FILTER BY STATUS)
         ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus('All')}
          className={`req-card-3d-lift bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            selectedStatus === 'All'
              ? 'border-sky-300 ring-4 ring-blue-400/25 shadow-[0_7px_0_#0f172a]'
              : 'border-blue-400/50 shadow-[0_6px_0_#0f172a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-sky-300 block uppercase tracking-wider">
              TOTAL TICKETS
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-0.5">{metrics.total} Logged</p>
            <span className="text-[10.5px] text-slate-300 font-bold">All faculty requests</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Layers className="w-6 h-6 text-sky-300" />
          </div>
        </div>

        <div
          onClick={() =>
            setSelectedStatus(selectedStatus === 'Under Review' ? 'All' : 'Under Review')
          }
          className={`req-card-3d-lift bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            selectedStatus === 'Under Review'
              ? 'border-white ring-4 ring-amber-400/30 shadow-[0_7px_0_#78350f]'
              : 'border-amber-300/60 shadow-[0_6px_0_#78350f]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-amber-100 block uppercase tracking-wider">
              UNDER REVIEW
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
              {metrics.underReview} Pending
            </p>
            <span className="text-[10.5px] text-amber-100 font-bold">Steps 1 &amp; 2 queue</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Clock className="w-6 h-6 text-yellow-200" />
          </div>
        </div>

        <div
          onClick={() =>
            setSelectedStatus(selectedStatus === 'In Progress' ? 'All' : 'In Progress')
          }
          className={`req-card-3d-lift bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            selectedStatus === 'In Progress'
              ? 'border-white ring-4 ring-blue-400/30 shadow-[0_7px_0_#1e3a8a]'
              : 'border-indigo-400/50 shadow-[0_6px_0_#1e3a8a]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-indigo-200 block uppercase tracking-wider">
              IN PROGRESS
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
              {metrics.inProgress} Active
            </p>
            <span className="text-[10.5px] text-indigo-200 font-bold">Step 3 technician action</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <Activity className="w-6 h-6 text-sky-300 animate-pulse" />
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Completed' ? 'All' : 'Completed')}
          className={`req-card-3d-lift bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white p-5 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${
            selectedStatus === 'Completed'
              ? 'border-white ring-4 ring-emerald-400/30 shadow-[0_7px_0_#064e3b]'
              : 'border-emerald-400/50 shadow-[0_6px_0_#064e3b]'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-200 block uppercase tracking-wider">
              COMPLETED
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
              {metrics.completed} Done
            </p>
            <span className="text-[10.5px] text-emerald-200 font-bold">Step 4 verified &amp; closed</span>
          </div>
          <div className="p-3 bg-white/15 border border-white/25 rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. 3D REQUEST PIPELINE WORKSPACE
         ===================================================================== */}
      <div className="req-panel-3d p-5 sm:p-6 rounded-3xl space-y-5">
        {/* SEARCH AND DUAL FILTERS BAR */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, REQ-2026-089, PC-021, or laboratory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-10 pr-8 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lab Filter */}
            <select
              value={selectedLabFilter}
              onChange={e => setSelectedLabFilter(e.target.value)}
              className="bg-slate-100 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Laboratories</option>
              {dbLabRooms.map(lab => (
                <option key={lab} value={lab}>
                  {lab.split('(')[0].trim()}
                </option>
              ))}
            </select>

            {/* Dual Input Category Filter */}
            <div className="relative">
              <input
                type="text"
                list="category-suggestions"
                placeholder="Select/Type Category..."
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 w-48"
              />
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="bg-slate-100 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* 3D Cards vs Table Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('CARDS_3D')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'CARDS_3D'
                    ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                    : 'hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>3D Pipeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE_3D')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'TABLE_3D'
                    ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                    : 'hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Ledger</span>
              </button>
            </div>
          </div>
        </div>

        {/* TICKET ITEMS: 3D PIPELINE CARDS OR 3D LEDGER TABLE */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-600">No Request Tickets Found</p>
            <p className="text-xs text-slate-400">
              Click &quot;New Request Ticket&quot; to submit a request or adjust your filters.
            </p>
          </div>
        ) : viewMode === 'CARDS_3D' ? (
          <div className="space-y-4">
            {filteredRequests.map(req => {
              const isBeingDeleted = deletingId === req.id;
              const completedTasksCount = req.tasks.filter(t => t.completed).length;
              const totalTasksCount = req.tasks.length;
              const taskPct =
                totalTasksCount > 0
                  ? Math.round((completedTasksCount / totalTasksCount) * 100)
                  : 0;

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    if (!isBeingDeleted) setInspectRequest(req);
                  }}
                  className={`req-card-3d-lift bg-white hover:bg-blue-50/30 p-5 rounded-3xl border-2 border-slate-200 hover:border-blue-400 shadow-[0_6px_0_#cbd5e1] cursor-pointer space-y-4 group ${
                    isBeingDeleted ? 'opacity-0 -translate-x-12 scale-95 pointer-events-none' : ''
                  }`}
                >
                  {/* 3D INTERACTIVE 4-STEP PIPELINE TRACKER BAR */}
                  <div
                    className="bg-slate-900 p-2.5 rounded-2xl border border-slate-700 flex items-center justify-between gap-2 overflow-x-auto text-[10px] font-mono font-black"
                    onClick={e => e.stopPropagation()}
                  >
                    {STEP_CONFIG.map((st, idx) => {
                      const isReached = req.currentStep >= st.step;
                      const isCurrent = req.currentStep === st.step;
                      return (
                        <React.Fragment key={st.step}>
                          <button
                            type="button"
                            onClick={e => handleAdvanceStep(req, st.step, e)}
                            title={`Click to advance ticket to Step ${st.step}: ${st.label}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                              isCurrent
                                ? 'bg-blue-600 text-white border border-sky-300 shadow-[0_2px_0_#1e3a8a]'
                                : isReached
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full text-center leading-4 text-[9px] font-black ${
                                isCurrent
                                  ? 'bg-amber-400 text-slate-950'
                                  : isReached
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isReached && !isCurrent ? '✓' : st.step}
                            </span>
                            <span>{st.label}</span>
                          </button>
                          {idx < STEP_CONFIG.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* CARD DETAILS + 3D MINI PC RIG */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shrink-0 shadow-xs">
                        <MiniRequestPcRig
                          status={req.status}
                          priority={req.priority}
                          pcNode={req.pcNode}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-sky-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700">
                            {req.ticketId}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-mono font-black uppercase ${
                              req.priority === 'Urgent'
                                ? 'bg-rose-600 text-white shadow-[0_2px_0_#881337]'
                                : req.priority === 'High'
                                ? 'bg-amber-500 text-slate-950 shadow-[0_2px_0_#78350f]'
                                : req.priority === 'Medium'
                                ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                                : 'bg-emerald-600 text-white shadow-[0_2px_0_#064e3b]'
                            }`}
                          >
                            {req.priority} Priority
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold">
                            {req.category}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-black flex items-center gap-1">
                            <Building className="w-3 h-3 text-blue-600" />
                            {req.labRoom}
                          </span>
                          {req.pcNode && (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-mono font-black">
                              {req.pcNode}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-700 transition truncate">
                          {req.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                          {req.details}
                        </p>

                        {/* Sub-Task Progress Bar & Metadata */}
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1 text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {req.assignedTechnician || 'Admin Service Desk'}
                          </span>
                          <span className="font-mono text-[10.5px]">Submitted: {req.dateSubmitted}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                                style={{ width: `${taskPct}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-black text-blue-700">
                              {completedTasksCount}/{totalTasksCount} Tasks ({taskPct}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DIRECT CRUD ACTION BUTTONS (INSPECT, EDIT & DELETE) */}
                    <div
                      className="flex items-center gap-2 self-end lg:self-center shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectRequest(req)}
                        className="req-btn-3d px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditRequestModal(req)}
                        className="px-3 py-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-300 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                        title="Edit Ticket Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRequestToDelete(req)}
                        className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 rounded-xl transition cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 3D COMPACT LEDGER TABLE VIEW */
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-sky-300 font-mono font-black uppercase text-[10px] border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">Ticket ID</th>
                  <th className="p-3.5">3D Node &amp; Lab Room</th>
                  <th className="p-3.5">Title &amp; Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Pipeline Stage</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-semibold">
                {filteredRequests.map(req => (
                  <tr
                    key={req.id}
                    onClick={() => setInspectRequest(req)}
                    className="hover:bg-blue-50/50 transition cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-black text-blue-700 whitespace-nowrap">
                      {req.ticketId}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-xl bg-slate-900 border border-slate-700">
                          <MiniRequestPcRig
                            status={req.status}
                            priority={req.priority}
                            pcNode={req.pcNode}
                            size="sm"
                          />
                        </div>
                        <div>
                          <span className="font-black text-slate-900 block">
                            {req.labRoom.split('(')[0].trim()}
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 font-bold">
                            {req.pcNode || 'All PCs'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-slate-900 block">{req.title}</span>
                      <span className="text-[10px] text-slate-500">{req.category}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase ${
                          req.priority === 'Urgent'
                            ? 'bg-rose-600 text-white'
                            : req.priority === 'High'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[10px] font-black text-slate-800">
                        Step {req.currentStep}/4 • {req.status}
                      </span>
                    </td>
                    <td
                      className="p-3.5 text-right whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectRequest(req)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-sky-300 hover:text-white rounded-xl font-black text-[11px] cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditRequestModal(req)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestToDelete(req)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          4. 3D MODALS (INSPECT & SUB-TASKS, CREATE, EDIT, DELETE)
         ===================================================================== */}

      {/* MODAL 1: 3D TICKET INSPECTOR, SUB-TASKS CHECKLIST & ACTIVITY LOG */}
      {inspectRequest && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Ticket Inspector — {inspectRequest.ticketId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRequest(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D Workstation Preview Banner inside Inspector */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-400/40 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[9.5px] font-black">
                    STEP {inspectRequest.currentStep}/4 • {inspectRequest.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 font-bold">
                    {inspectRequest.category}
                  </span>
                </div>
                <p className="font-black text-white text-sm leading-snug">{inspectRequest.title}</p>
                <p className="text-xs font-mono text-slate-300">
                  {inspectRequest.labRoom} •{' '}
                  <strong className="text-emerald-300">{inspectRequest.pcNode || 'All PCs'}</strong>
                </p>
              </div>
              <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-700 shrink-0">
                <MiniRequestPcRig
                  status={inspectRequest.status}
                  priority={inspectRequest.priority}
                  pcNode={inspectRequest.pcNode}
                  size="lg"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-black uppercase block mb-0.5">
                Request Description
              </span>
              <p className="text-slate-800 font-semibold leading-relaxed">
                {inspectRequest.details}
              </p>
            </div>

            {/* Interactive Step Switcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                Advance Pipeline Stage (Syncs with Admin Service Desk):
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {STEP_CONFIG.map(st => (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => handleAdvanceStep(inspectRequest, st.step)}
                    className={`py-2 px-2 rounded-xl font-mono text-[10px] font-black transition cursor-pointer ${
                      inspectRequest.currentStep === st.step
                        ? 'bg-blue-600 text-white shadow-[0_3px_0_#1e3a8a]'
                        : inspectRequest.currentStep > st.step
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.step}. {st.status}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Technical Resolution Checklist */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase block">
                Technical Resolution Sub-Tasks (
                {inspectRequest.tasks.filter(t => t.completed).length}/{inspectRequest.tasks.length})
              </span>
              <div className="space-y-1.5">
                {inspectRequest.tasks.map(task => (
                  <label
                    key={task.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-xs cursor-pointer transition ${
                      task.completed
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(inspectRequest.id, task.id)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span className="font-bold flex-1">{task.label}</span>
                  </label>
                ))}
              </div>

              <form onSubmit={handleAddSubTask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a technical checklist step..."
                  value={newTaskLabel}
                  onChange={e => setNewTaskLabel(e.target.value)}
                  className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-bold focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-sky-300 hover:text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Add Step
                </button>
              </form>
            </div>

            {/* 5-Star Rating when Completed */}
            {inspectRequest.currentStep === 4 && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-200 flex items-center justify-between">
                <span className="text-xs font-black text-amber-900">
                  Rate Service Resolution:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleSetRating(inspectRequest.id, star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (inspectRequest.rating || 0) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity History Timeline */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase block">
                Activity History
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {inspectRequest.history.map(h => (
                  <div
                    key={h.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-black text-slate-800">{h.action}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                      {h.timestamp} • {h.performedBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const target = inspectRequest;
                  setInspectRequest(null);
                  setEditRequestModal(target);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black cursor-pointer"
              >
                Edit Ticket
              </button>
              <button
                type="button"
                onClick={() => setInspectRequest(null)}
                className="px-5 py-2 bg-slate-900 text-sky-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Confirm Ticket Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to cancel and delete request{' '}
                <span className="font-black text-slate-900">{requestToDelete.ticketId}</span> (
                {requestToDelete.title})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
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

      {/* MODAL 3: EDIT TICKET */}
      {editRequestModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditTicket}
            className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Edit Ticket — {editRequestModal.ticketId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditRequestModal(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Request Title</label>
                <input
                  type="text"
                  value={editRequestModal.title}
                  onChange={e =>
                    setEditRequestModal({ ...editRequestModal, title: e.target.value })
                  }
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Category (Select or Type Custom)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={editRequestModal.category}
                  onChange={e =>
                    setEditRequestModal({ ...editRequestModal, category: e.target.value })
                  }
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    value={editRequestModal.labRoom}
                    onChange={e =>
                      setEditRequestModal({ ...editRequestModal, labRoom: e.target.value })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Target PC Node (From DB)</label>
                  <input
                    type="text"
                    list="pc-node-suggestions"
                    value={editRequestModal.pcNode || ''}
                    onChange={e =>
                      setEditRequestModal({ ...editRequestModal, pcNode: e.target.value })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono font-black text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Priority Level</label>
                  <select
                    value={editRequestModal.priority}
                    onChange={e =>
                      setEditRequestModal({
                        ...editRequestModal,
                        priority: e.target.value as RequestPriority
                      })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Pipeline Status</label>
                  <select
                    value={editRequestModal.status}
                    onChange={e =>
                      setEditRequestModal({
                        ...editRequestModal,
                        status: e.target.value as RequestStatus
                      })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Details &amp; Description</label>
                <textarea
                  value={editRequestModal.details}
                  onChange={e =>
                    setEditRequestModal({ ...editRequestModal, details: e.target.value })
                  }
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditRequestModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="req-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CREATE NEW REQUEST TICKET (WITH 1-CLICK TEMPLATES & AUTO-CLASSIFIER) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Submit New Request Ticket</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Quick Request Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase block">
                1-Click Quick Request Templates:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_REQUEST_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setNewTitle(tpl.title);
                      setNewCategory(tpl.cat);
                      setNewLabRoom(tpl.lab);
                      setNewPcNode(tpl.pc);
                      setNewPriority(tpl.priority);
                      setNewDetails(tpl.details);
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-left transition cursor-pointer flex items-center justify-between text-[10.5px] font-bold text-slate-700"
                  >
                    <span className="truncate">{tpl.label}</span>
                    <span className="font-mono text-[9px] text-blue-600 font-black ml-1 shrink-0">
                      {tpl.pc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">
                  Request Title (Auto-Detects Category &amp; Priority)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Additional GPU Drivers / RAM Upgrade"
                  value={newTitle}
                  onChange={e => {
                    const val = e.target.value;
                    const auto = classifyAndGenerateTasks(val, newDetails, newPcNode);
                    setNewTitle(val);
                    setNewCategory(auto.category);
                    setNewPriority(auto.priority);
                  }}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Category (Select or Type Custom)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="Select from suggestions or type custom category..."
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Target Laboratory (From DB)</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Select or type lab..."
                    value={newLabRoom}
                    onChange={e => setNewLabRoom(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Target PC Node (From DB)</label>
                  <input
                    type="text"
                    list="pc-node-suggestions"
                    placeholder="e.g. PC-008"
                    value={newPcNode}
                    onChange={e => setNewPcNode(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono font-black text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Priority Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Medium', 'High', 'Urgent'] as RequestPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`py-2 rounded-xl text-[11px] font-mono font-black transition cursor-pointer border-2 ${
                        newPriority === p
                          ? p === 'Urgent'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-[0_3px_0_#881337]'
                            : p === 'High'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-[0_3px_0_#78350f]'
                            : p === 'Medium'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-[0_3px_0_#1e3a8a]'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-[0_3px_0_#064e3b]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Description / Details</label>
                <textarea
                  placeholder="Provide detailed information regarding your request..."
                  value={newDetails}
                  onChange={e => {
                    const val = e.target.value;
                    const auto = classifyAndGenerateTasks(newTitle, val, newPcNode);
                    setNewDetails(val);
                    setNewCategory(auto.category);
                    setNewPriority(auto.priority);
                  }}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="req-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyRequestsView;











