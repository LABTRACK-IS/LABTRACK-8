import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wrench, Calendar, CheckCircle2, Plus,
  Download, RefreshCw, X, Search, Check, Trash2,
  ChevronLeft, ChevronRight, Edit3, Eye, Sparkles, Monitor, Building2,
  User, Clock, Layers, Printer, QrCode, ShieldAlert,
  Thermometer, Grid, Zap
} from 'lucide-react';

export type AvailabilityState = 'Available' | 'In Use' | 'Maintenance' | 'Offline';

export interface Workstation {
  id: string;
  dbId?: string;
  lab: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  availabilityStatus?: AvailabilityState;
  cpu: string;
  ram: string;
  storage: string;
  ping: string;
  activeUser: string;
  adminNote?: string;
  ip: string;
  temp: string;
  cpuLoad?: number;
  tempC?: number;
  power: string;
  score: string;
  scheduleDay?: string;
  scheduleTime?: string;
}

export interface DeskScheduleSlot {
  id: string;
  pcId: string;
  lab?: string;
  user: string;
  purpose?: string;
  day: string;
  dateString?: string;
  time?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
}

export interface MaintenanceTask {
  id: string;
  dbId?: string;
  title: string;
  lab: string;
  pcRange: string;
  category: 'PREVENTIVE' | 'SOFTWARE' | 'HARDWARE' | 'CLEANING' | 'INSPECTION';
  scheduledDate: string; // YYYY-MM-DD
  cost: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  color: string;
  notes?: string;
}

interface MaintenanceViewProps {
  campusName?: string;
  selectedCampus?: string;
  campusInfo?: any;
  workstations?: Workstation[];
  setWorkstations?: React.Dispatch<React.SetStateAction<Workstation[]>>;
  selectedAssetCard?: Workstation | null;
  setSelectedAssetCard?: (pc: Workstation) => void;
  deskSchedules?: DeskScheduleSlot[];
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  setIsAddAssetOpen?: (open: boolean) => void;
  setIsQrModalOpen?: (open: boolean) => void;
  onDrilldown?: (info: string) => void;
  onTriggerNotification?: (msg: string) => void;
  triggerNotification?: (msg: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDayNameFromIso = (isoDate: string): string => {
  const parts = (isoDate || '').split('-').map(Number);
  if (parts.length !== 3 || !parts[0]) return 'Mon';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return DAY_NAMES[d.getDay()] || 'Mon';
};

const getCategoryBadgeColor = (cat: string): string => {
  const c = (cat || '').toUpperCase();
  if (c === 'HARDWARE') return 'bg-amber-500';
  if (c === 'CLEANING') return 'bg-emerald-500';
  if (c === 'INSPECTION') return 'bg-purple-500';
  if (c === 'SOFTWARE') return 'bg-cyan-500';
  return 'bg-blue-600';
};

const formatPeso = (val: number): string => {
  return (
    '₱' +
    (Number(val) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  );
};

// ============================================================================
// HELPER CONVERTERS BETWEEN ADMIN WORKSTATION & INSTRUCTOR LAB AVAILABILITY
// ============================================================================
const resolveAvailabilityState = (pc: Partial<Workstation>): AvailabilityState => {
  if (pc.availabilityStatus) return pc.availabilityStatus;
  if (pc.status === 'UNDER_MAINTENANCE') return 'Maintenance';
  if (pc.status === 'OUT_OF_ORDER') return 'Offline';
  const userStr = (pc.activeUser || '').toLowerCase();
  if (
    userStr &&
    !userStr.includes('available') &&
    !userStr.includes('ready') &&
    !userStr.includes('AVAILABLE') &&
    !userStr.includes('none') &&
    !userStr.includes('idle')
  ) {
    return 'In Use';
  }
  return 'Available';
};

const mapAvailabilityToAdminStatus = (
  avail: AvailabilityState
): Workstation['status'] => {
  if (avail === 'Maintenance') return 'UNDER_MAINTENANCE';
  if (avail === 'Offline') return 'OUT_OF_ORDER';
  return 'OPERATIONAL';
};

const normalizeSharedNodeToAdminWorkstation = (raw: any, idx: number): Workstation => {
  const code = String(raw.pcNumber || raw.id || `PC-${String(idx + 1).padStart(3, '0')}`).toUpperCase();
  const lab = raw.labRoom || raw.lab || 'ComLab 1 (Networking & ICT)';
  const rawSt = String(raw.availabilityStatus || raw.status || 'Available');

  let avail: AvailabilityState = 'Available';
  if (rawSt === 'In Use' || rawSt === 'IN_USE') avail = 'In Use';
  else if (rawSt === 'Maintenance' || rawSt === 'UNDER_MAINTENANCE') avail = 'Maintenance';
  else if (rawSt === 'Offline' || rawSt === 'OUT_OF_ORDER') avail = 'Offline';

  const adminStatus = mapAvailabilityToAdminStatus(avail);

  const specsParts = String(raw.specs || '').split('/').map((s: string) => s.trim());
  const cpu = raw.cpu || specsParts[0] || 'Core i7-13700';
  const ram = raw.ram || specsParts[1] || '32GB DDR5';
  const storage = raw.storage || specsParts[2] || 'RTX 4060 / 1TB NVMe';

  const tempNum = Number(raw.tempC) || parseInt(String(raw.temp || '38'), 10) || 38;
  const cpuNum =
    Number(raw.cpuLoad) ||
    (avail === 'In Use' ? 52 : avail === 'Maintenance' ? 14 : avail === 'Offline' ? 0 : 8);

  const activeUser =
    avail === 'Available'
      ? 'Available / Ready'
      : avail === 'Maintenance'
      ? raw.assignedUser || 'Locked (Maintenance)'
      : avail === 'Offline'
      ? 'Offline / Powered Down'
      : raw.assignedUser || raw.activeUser || 'Active Student Session';

  return {
    id: code,
    dbId: raw.dbId,
    lab,
    status: adminStatus,
    availabilityStatus: avail,
    cpu,
    ram,
    storage,
    ping: avail === 'Offline' ? 'TIMEOUT' : '1ms',
    activeUser,
    adminNote: raw.adminSyncSource || raw.adminNote || `Admin Synced: ${avail}`,
    ip: raw.ipAddress || raw.ip || `10.101.0.${101 + idx}`,
    temp: `${tempNum}°C`,
    cpuLoad: cpuNum,
    tempC: tempNum,
    power: avail === 'Offline' ? '0W' : avail === 'In Use' ? '165W' : '95W',
    score: avail === 'Offline' ? '0%' : avail === 'Maintenance' ? '76%' : '98%',
    scheduleDay: raw.scheduleDay,
    scheduleTime: raw.scheduleTime
  };
};

const convertAdminWorkstationToSharedNode = (pc: Workstation) => {
  const avail = resolveAvailabilityState(pc);
  const tempNum = pc.tempC || parseInt(String(pc.temp || '38'), 10) || 38;
  const cpuNum =
    typeof pc.cpuLoad === 'number'
      ? pc.cpuLoad
      : avail === 'In Use'
      ? 54
      : avail === 'Maintenance'
      ? 14
      : avail === 'Offline'
      ? 0
      : 8;

  return {
    id: `ws-${pc.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    dbId: pc.dbId,
    pcNumber: pc.id.toUpperCase(),
    labRoom: pc.lab,
    ipAddress: pc.ip,
    specs: `${pc.cpu} / ${pc.ram} / ${pc.storage}`,
    cpu: pc.cpu,
    ram: pc.ram,
    storage: pc.storage,
    status: avail,
    availabilityStatus: avail,
    assignedUser:
      avail === 'Available'
        ? undefined
        : pc.activeUser === 'Available / Ready'
        ? 'Active Session'
        : pc.activeUser,
    adminSyncSource:
      pc.adminNote ||
      (avail === 'Available'
        ? 'Admin Fleet: Authorized & Available'
        : `Admin Override: ${avail}`),
    cpuLoad: cpuNum,
    tempC: tempNum,
    scheduleDay: pc.scheduleDay,
    scheduleTime: pc.scheduleTime
  };
};

// ============================================================================
// REALISTIC 3D ISOMETRIC DESKTOP WORKSTATION RIG (ANGLED MONITOR + RGB TOWER)
// ============================================================================
const IsometricDesktopRig: React.FC<{
  status: Workstation['status'];
  availabilityStatus?: AvailabilityState;
  code: string;
  size?: 'sm' | 'lg';
}> = ({ status, availabilityStatus, code, size = 'sm' }) => {
  const avail =
    availabilityStatus ||
    (status === 'UNDER_MAINTENANCE'
      ? 'Maintenance'
      : status === 'OUT_OF_ORDER'
      ? 'Offline'
      : 'Available');

  const isMaint = avail === 'Maintenance';
  const isOut = avail === 'Offline';
  const isInUse = avail === 'In Use';

  const neonHex = isOut
    ? '#ef4444'
    : isMaint
    ? '#f59e0b'
    : isInUse
    ? '#38bdf8'
    : '#10b981';

  const secondaryHex = isOut
    ? '#dc2626'
    : isMaint
    ? '#d97706'
    : isInUse
    ? '#2563eb'
    : '#059669';

  const screenGradId = `iso-rig-scr-${code.replace(/[^a-zA-Z0-9]/g, '')}-${avail}-${size}`;

  return (
    <div className={size === 'lg' ? 'w-28 h-24 shrink-0' : 'w-18 h-14 shrink-0'}>
      <svg viewBox="0 0 140 115" className="w-full h-full drop-shadow-[0_10px_12px_rgba(15,23,42,0.45)]">
        <defs>
          <linearGradient id={screenGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={neonHex} stopOpacity="0.95" />
            <stop offset="50%" stopColor={secondaryHex} stopOpacity="0.88" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.96" />
          </linearGradient>
        </defs>

        {/* Extruded Isometric Desk Platform */}
        <polygon points="70,106 10,82 70,58 130,82" fill="#1e293b" stroke={neonHex} strokeWidth="1.3" />
        <polygon points="10,82 70,106 70,113 10,89" fill="#0f172a" />
        <polygon points="130,82 70,106 70,113 130,89" fill="#020617" />

        {/* Tempered-Glass System Unit Tower with Spinning RGB Cooling Fans */}
        <g>
          <polygon points="98,20 116,12 130,18 112,26" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
          <polygon points="98,20 112,26 112,74 98,68" fill="#020617" stroke={neonHex} strokeWidth="1.2" />
          <polygon points="112,26 130,18 130,66 112,74" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <ellipse
            cx="105"
            cy="39"
            rx="4.2"
            ry="6.5"
            fill="none"
            stroke={neonHex}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            className={!isOut ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 39px', animationDuration: isInUse ? '1.2s' : '3.2s' }}
          />
          <ellipse
            cx="105"
            cy="56"
            rx="4.2"
            ry="6.5"
            fill="none"
            stroke={neonHex}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            className={!isOut ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 56px', animationDuration: isInUse ? '1.2s' : '3.2s' }}
          />
          <line x1="121" y1="26" x2="121" y2="64" stroke={neonHex} strokeWidth="2" strokeLinecap="round" />
          <circle cx="121" cy="23" r="1.8" fill="#ffffff" />
        </g>

        {/* Angled Widescreen Monitor & Stand */}
        <g>
          <polygon points="52,78 68,72 78,76 62,82" fill="#475569" />
          <polygon points="60,58 66,56 66,76 60,78" fill="#334155" />
          <polygon points="22,22 84,8 88,11 26,25" fill="#475569" />
          <polygon points="84,8 88,11 88,53 84,50" fill="#1e293b" />
          <polygon points="22,22 84,8 84,52 22,66" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <polygon points="25,25 81,12 81,49 25,62" fill={`url(#${screenGradId})`} />
          <line x1="30" y1="30" x2="54" y2="24" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="30" y1="36" x2="68" y2="27" stroke="#e2e8f0" strokeWidth="1.6" strokeOpacity="0.8" strokeLinecap="round" />
          <line x1="30" y1="41" x2="60" y2="34" stroke={neonHex} strokeWidth="1.6" strokeLinecap="round" />
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

        {/* Isometric Mechanical Keyboard & Mouse */}
        <polygon points="32,82 74,68 82,73 40,87" fill="#0f172a" stroke={neonHex} strokeWidth="1" />
        <line x1="37" y1="82" x2="73" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={neonHex} strokeWidth="1" />
      </svg>
    </div>
  );
};

// ============================================================================
// DEFAULT SHARED FLEET SEED (COMLAB 1 TO COMLAB 3 — SYNCED WITH INSTRUCTOR)
// ============================================================================
const INITIAL_SHARED_FLEET_SEED: Workstation[] = [
  // ComLab 1
  { id: 'PC-001', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.101.0.101', temp: '38°C', cpuLoad: 8, tempC: 38, power: '95W', score: '98%', scheduleDay: 'Mon', scheduleTime: '08:00 - 10:00 AM' },
  { id: 'PC-002', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.101.0.102', temp: '39°C', cpuLoad: 9, tempC: 39, power: '95W', score: '98%' },
  { id: 'PC-003', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.101.0.103', temp: '37°C', cpuLoad: 6, tempC: 37, power: '90W', score: '99%' },
  { id: 'PC-004', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.101.0.104', temp: '38°C', cpuLoad: 7, tempC: 38, power: '95W', score: '98%' },
  { id: 'PC-005', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.101.0.105', temp: '39°C', cpuLoad: 9, tempC: 39, power: '95W', score: '97%' },
  { id: 'PC-008', lab: 'ComLab 1 (Networking & ICT)', status: 'OPERATIONAL', availabilityStatus: 'In Use', cpu: 'Core i7-13700', ram: '32GB DDR5', storage: 'RTX 4060 / 1TB NVMe', ping: '1ms', activeUser: '2024-IS-0142 (Maria Clara Santos)', ip: '10.101.0.108', temp: '58°C', cpuLoad: 54, tempC: 58, power: '165W', score: '96%', scheduleDay: 'Wed', scheduleTime: '08:00 - 10:00 AM' },

  // ComLab 2
  { id: 'PC-011', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '1ms', activeUser: 'Available / Ready', ip: '10.102.0.111', temp: '39°C', cpuLoad: 10, tempC: 39, power: '105W', score: '98%' },
  { id: 'PC-012', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '1ms', activeUser: 'Available / Ready', ip: '10.102.0.112', temp: '40°C', cpuLoad: 11, tempC: 40, power: '105W', score: '97%' },
  { id: 'PC-014', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'UNDER_MAINTENANCE', availabilityStatus: 'Maintenance', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '12ms', activeUser: 'Admin Service Desk (Maint)', ip: '10.102.0.114', temp: '43°C', cpuLoad: 14, tempC: 43, power: '65W', score: '76%' },
  { id: 'PC-015', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '1ms', activeUser: 'Available / Ready', ip: '10.102.0.115', temp: '38°C', cpuLoad: 7, tempC: 38, power: '98W', score: '99%' },
  { id: 'PC-018', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '1ms', activeUser: 'Available / Ready', ip: '10.102.0.118', temp: '38°C', cpuLoad: 8, tempC: 38, power: '98W', score: '98%' },
  { id: 'PC-019', lab: 'ComLab 2 (Multimedia & Graphics)', status: 'UNDER_MAINTENANCE', availabilityStatus: 'Maintenance', cpu: 'Ryzen 7 7700X', ram: '32GB DDR5', storage: 'RTX 4070 Super', ping: '15ms', activeUser: 'NIC Port Inspection', ip: '10.102.0.119', temp: '41°C', cpuLoad: 10, tempC: 41, power: '60W', score: '78%' },

  // ComLab 3
  { id: 'PC-021', lab: 'ComLab 3 (AI & Software Eng)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.103.0.121', temp: '37°C', cpuLoad: 7, tempC: 37, power: '120W', score: '99%', scheduleDay: 'Fri', scheduleTime: '01:00 - 03:00 PM' },
  { id: 'PC-022', lab: 'ComLab 3 (AI & Software Eng)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.103.0.122', temp: '36°C', cpuLoad: 5, tempC: 36, power: '115W', score: '99%' },
  { id: 'PC-023', lab: 'ComLab 3 (AI & Software Eng)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.103.0.123', temp: '37°C', cpuLoad: 8, tempC: 37, power: '118W', score: '98%' },
  { id: 'PC-024', lab: 'ComLab 3 (AI & Software Eng)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.103.0.124', temp: '38°C', cpuLoad: 9, tempC: 38, power: '120W', score: '98%' },
  { id: 'PC-025', lab: 'ComLab 3 (AI & Software Eng)', status: 'OPERATIONAL', availabilityStatus: 'Available', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: '1ms', activeUser: 'Available / Ready', ip: '10.103.0.125', temp: '37°C', cpuLoad: 6, tempC: 37, power: '115W', score: '99%' },
  { id: 'PC-026', lab: 'ComLab 3 (AI & Software Eng)', status: 'OUT_OF_ORDER', availabilityStatus: 'Offline', cpu: 'Core i9-14900K', ram: '64GB DDR5', storage: 'RTX 4080 / 2TB NVMe', ping: 'TIMEOUT', activeUser: 'Offline / Power Supply Check', ip: '10.103.0.126', temp: '29°C', cpuLoad: 0, tempC: 29, power: '0W', score: '0%' }
];

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  campusName,
  selectedCampus,
  workstations: propWorkstations = [],
  setWorkstations: propSetWorkstations,
  selectedAssetCard: propSelectedAssetCard = null,
  setSelectedAssetCard: propSetSelectedAssetCard,
  deskSchedules = [],
  onDrilldown,
  onTriggerNotification,
  triggerNotification
}) => {
  const activeCampus = selectedCampus || campusName || 'JRMSU Dapitan Main Campus';
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const notify = useCallback(
    (msg: string) => {
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 3500);
      if (onTriggerNotification) onTriggerNotification(msg);
      else if (triggerNotification) triggerNotification(msg);
    },
    [onTriggerNotification, triggerNotification]
  );

  // Unified Calendar State (Default October 2026)
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wsLabTab, setWsLabTab] = useState<'ALL' | 'ComLab 1' | 'ComLab 2' | 'ComLab 3'>('ALL');
  const [wsAvailFilter, setWsAvailFilter] = useState<'ALL' | AvailabilityState>('ALL');
  const [activeBottomTab, setActiveBottomTab] = useState<'BOTH' | 'MATRIX_3D' | 'WORKSTATIONS' | 'MAINTENANCE'>('BOTH');

  // ============================================================================
  // SHARED WORKSTATION STATE (100% CONNECTED WITH INSTRUCTOR LAB AVAILABILITY)
  // ============================================================================
  const [localWorkstations, setLocalWorkstations] = useState<Workstation[]>(() => {
    try {
      const savedShared = localStorage.getItem('labtrack_workstations_v4');
      if (savedShared) {
        const parsed = JSON.parse(savedShared);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => normalizeSharedNodeToAdminWorkstation(item, idx));
        }
      }
    } catch {}
    if (propWorkstations && propWorkstations.length > 0) {
      return propWorkstations.map((item, idx) => normalizeSharedNodeToAdminWorkstation(item, idx));
    }
    return INITIAL_SHARED_FLEET_SEED;
  });

  const [selectedPcCard, setSelectedPcCard] = useState<Workstation | null>(
    propSelectedAssetCard || localWorkstations[0] || INITIAL_SHARED_FLEET_SEED[0]
  );

  const persistFleetToSharedStorage = useCallback((fleet: Workstation[]) => {
    try {
      const sharedNodes = fleet.map(convertAdminWorkstationToSharedNode);
      localStorage.setItem('labtrack_workstations_v4', JSON.stringify(sharedNodes));
      localStorage.setItem('labtrack_workstations_v3', JSON.stringify(sharedNodes));

      const overrides: Record<string, AvailabilityState> = {};
      sharedNodes.forEach(node => {
        overrides[node.pcNumber.toUpperCase()] = node.status;
      });
      localStorage.setItem('labtrack_admin_pc_overrides', JSON.stringify(overrides));
    } catch {}
  }, []);

  useEffect(() => {
    if (localWorkstations.length > 0) {
      persistFleetToSharedStorage(localWorkstations);
    }
  }, [localWorkstations, persistFleetToSharedStorage]);

  const syncFromSharedStorage = useCallback(() => {
    try {
      const savedShared = localStorage.getItem('labtrack_workstations_v4');
      if (savedShared) {
        const parsed = JSON.parse(savedShared);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((item, idx) =>
            normalizeSharedNodeToAdminWorkstation(item, idx)
          );
          setLocalWorkstations(normalized);
          if (propSetWorkstations) propSetWorkstations(normalized);
        }
      }
    } catch {}
  }, [propSetWorkstations]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'labtrack_workstations_v4' || e.key === 'labtrack_qr_attendance_logs_v2') {
        syncFromSharedStorage();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromSharedStorage]);

  const updateWorkstationsList = useCallback(
    (updater: Workstation[] | ((prev: Workstation[]) => Workstation[])) => {
      setLocalWorkstations(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persistFleetToSharedStorage(next);
        if (propSetWorkstations) propSetWorkstations(next);
        return next;
      });
    },
    [persistFleetToSharedStorage, propSetWorkstations]
  );

  const selectWorkstation = (pc: Workstation) => {
    setSelectedPcCard(pc);
    if (propSetSelectedAssetCard) propSetSelectedAssetCard(pc);
  };

  // Recorded Workstation Reservation Schedules
  const [localSchedules, setLocalSchedules] = useState<DeskScheduleSlot[]>([
    { id: 'SCH-1001', pcId: 'PC-001', lab: 'ComLab 1 (Networking & ICT)', user: 'BSIS-3A Programming', purpose: 'System Integration Lab', day: 'Mon', dateString: '2026-10-26', time: '08:00 - 10:00 AM', status: 'Approved' },
    { id: 'SCH-1002', pcId: 'PC-008', lab: 'ComLab 1 (Networking & ICT)', user: 'Maria Clara Santos', purpose: 'Cisco Packet Tracer', day: 'Wed', dateString: '2026-10-28', time: '08:00 - 10:00 AM', status: 'Approved' },
    { id: 'SCH-1003', pcId: 'PC-021', lab: 'ComLab 3 (AI & Software Eng)', user: 'AI Capstone Group', purpose: 'Model Training & QA', day: 'Fri', dateString: '2026-10-30', time: '01:00 - 03:00 PM', status: 'In Progress' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('labtrack_desk_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalSchedules(parsed);
        }
      } else if (deskSchedules && deskSchedules.length > 0) {
        setLocalSchedules(deskSchedules);
      }
    } catch {}
  }, [deskSchedules]);

  useEffect(() => {
    try {
      if (localSchedules.length > 0) {
        localStorage.setItem('labtrack_desk_schedules', JSON.stringify(localSchedules));
      }
    } catch {}
  }, [localSchedules]);

  // Maintenance Tasks Seed
  const defaultSeedTasks: MaintenanceTask[] = useMemo(
    () => [
      {
        id: 'MNT-101',
        title: 'Thermal Paste Replacement & Fan Servicing',
        lab: 'ComLab 1 (Networking & ICT)',
        pcRange: 'PC-001 to PC-008',
        category: 'HARDWARE',
        scheduledDate: '2026-10-28',
        cost: 3500,
        status: 'IN_PROGRESS',
        color: 'bg-amber-500',
        notes: 'Scheduled thermal check for high-load workstations in ComLab 1.'
      },
      {
        id: 'MNT-102',
        title: 'Windows 11 Security Patch & IDE Image Sync',
        lab: 'ComLab 2 (Multimedia & Graphics)',
        pcRange: 'PC-011 to PC-019',
        category: 'SOFTWARE',
        scheduledDate: '2026-10-29',
        cost: 1200,
        status: 'PENDING',
        color: 'bg-cyan-500',
        notes: 'Visual Studio 2022, .NET 8 SDK, and Python 3.12 environment verification.'
      },
      {
        id: 'MNT-103',
        title: 'Full Antistatic Dusting & Peripheral Sanitization',
        lab: 'ComLab 3 (AI & Software Eng)',
        pcRange: 'PC-021 to PC-026',
        category: 'CLEANING',
        scheduledDate: '2026-10-24',
        cost: 800,
        status: 'COMPLETED',
        color: 'bg-emerald-500',
        notes: 'Completed routine cleaning for AI & Multimedia workstations.'
      }
    ],
    []
  );

  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_admin_maint_tasks_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultSeedTasks;
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    try {
      if (tasks.length > 0) {
        localStorage.setItem('labtrack_admin_maint_tasks_v4', JSON.stringify(tasks));
      }
    } catch {}
  }, [tasks]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [inspectingTask, setInspectingTask] = useState<MaintenanceTask | null>(null);
  const [inspectingAsset, setInspectingAsset] = useState<Workstation | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isRegisterAssetModalOpen, setIsRegisterAssetModalOpen] = useState(false);
  const [isQrModalOpenLocal, setIsQrModalOpenLocal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Workstation | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // Form State: New Maintenance Task
  const [newTask, setNewTask] = useState<{
    title: string;
    lab: string;
    category: MaintenanceTask['category'];
    scheduledDate: string;
    cost: number;
    notes: string;
  }>({
    title: '',
    lab: 'ComLab 1 (Networking & ICT)',
    category: 'PREVENTIVE',
    scheduledDate: '2026-10-29',
    cost: 1500,
    notes: ''
  });
  const [newTaskPcRange, setNewTaskPcRange] = useState<string>('PC-001 to PC-008');

  // Form State: Add Reservation / Schedule Slot
  const [newSchedPcId, setNewSchedPcId] = useState('PC-001');
  const [newSchedLab, setNewSchedLab] = useState('ComLab 1 (Networking & ICT)');
  const [newSchedUser, setNewSchedUser] = useState('');
  const [newSchedPurpose, setNewSchedPurpose] = useState('Laboratory Class Session');
  const [newSchedDay, setNewSchedDay] = useState('Wed');
  const [newSchedTime, setNewSchedTime] = useState('08:00 - 10:00 AM');
  const [newSchedStatus, setNewSchedStatus] = useState<'Approved' | 'Pending' | 'Rejected' | 'In Progress'>('Approved');

  // Form State: Register New Workstation Asset
  const [newAssetCode, setNewAssetCode] = useState('');
  const [newAssetLab, setNewAssetLab] = useState('ComLab 1 (Networking & ICT)');
  const [newAssetAvailability, setNewAssetAvailability] = useState<AvailabilityState>('Available');
  const [newAssetCpu, setNewAssetCpu] = useState('Core i7-13700');
  const [newAssetRam, setNewAssetRam] = useState('32GB DDR5');
  const [newAssetStorage, setNewAssetStorage] = useState('RTX 4060 / 1TB NVMe');
  const [newAssetIp, setNewAssetIp] = useState('10.101.0.127');
  const [newAssetUser, setNewAssetUser] = useState('');
  const [newAssetAdminNote, setNewAssetAdminNote] = useState('Admin Provisioned: Authorized for Student Use');

  // Form State: Edit Workstation Asset
  const [editNodeId, setEditNodeId] = useState('');
  const [editLab, setEditLab] = useState('');
  const [editAvailability, setEditAvailability] = useState<AvailabilityState>('Available');
  const [editCpu, setEditCpu] = useState('');
  const [editRam, setEditRam] = useState('');
  const [editStorage, setEditStorage] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editActiveUser, setEditActiveUser] = useState('');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editSchedDay, setEditSchedDay] = useState('Mon');
  const [editSchedTime, setEditSchedTime] = useState('08:00 - 10:00 AM');

  // Sync Workstations & Maintenance Records from Backend + Shared Storage
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      syncFromSharedStorage();

      const [mntRes] = await Promise.allSettled([
        apiClient.get('/api/v1/maintenance/records')
      ]);

      if (mntRes.status === 'fulfilled') {
        const data =
          mntRes.value.data?.data?.items ||
          mntRes.value.data?.data ||
          mntRes.value.data ||
          [];
        if (Array.isArray(data) && data.length > 0) {
          const mappedTasks: MaintenanceTask[] = data.map((raw: any, idx: number) => {
            const rawLab = String(raw.lab || raw.workstationCodes || 'ComLab 1 (Networking & ICT)');
            const parts = rawLab.includes('|')
              ? rawLab.split('|').map((s: string) => s.trim())
              : [rawLab, 'PC-001 to PC-008'];
            const cat = String(raw.category || 'PREVENTIVE').toUpperCase() as MaintenanceTask['category'];
            return {
              id: typeof raw.id === 'string' && raw.id.startsWith('MNT-') ? raw.id : `MNT-${101 + idx}`,
              dbId: raw.id,
              title: raw.title || 'Scheduled Maintenance',
              lab: parts[0] || 'ComLab 1 (Networking & ICT)',
              pcRange: parts[1] || 'PC-001 to PC-008',
              category: ['PREVENTIVE', 'SOFTWARE', 'HARDWARE', 'CLEANING', 'INSPECTION'].includes(cat)
                ? cat
                : 'PREVENTIVE',
              scheduledDate: raw.scheduledDate || '2026-10-28',
              cost: Number(raw.cost) || 0,
              status:
                raw.status === 'COMPLETED'
                  ? 'COMPLETED'
                  : raw.status === 'IN_PROGRESS'
                  ? 'IN_PROGRESS'
                  : 'PENDING',
              color: getCategoryBadgeColor(cat),
              notes: raw.notes || ''
            };
          });
          setTasks(mappedTasks);
        }
      }
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, [syncFromSharedStorage]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const [pulseActive, setPulseActive] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulseActive(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  // Workstation Status Summary
  const wsSummary = useMemo(() => {
    const total = localWorkstations.length;
    const available = localWorkstations.filter(w => resolveAvailabilityState(w) === 'Available').length;
    const inUse = localWorkstations.filter(w => resolveAvailabilityState(w) === 'In Use').length;
    const maintenance = localWorkstations.filter(w => resolveAvailabilityState(w) === 'Maintenance').length;
    const offline = localWorkstations.filter(w => resolveAvailabilityState(w) === 'Offline').length;
    return {
      total,
      available,
      inUse,
      operational: available + inUse,
      maintenance,
      outOfOrder: offline
    };
  }, [localWorkstations]);

  // Computed Financials & Stats
  const totalCost = useMemo(() => tasks.reduce((sum, t) => sum + (Number(t.cost) || 0), 0), [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'COMPLETED').length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter(t => t.status !== 'COMPLETED').length, [tasks]);
  const hardwareCost = useMemo(
    () =>
      tasks
        .filter(t => t.category === 'HARDWARE' || t.category === 'INSPECTION')
        .reduce((s, t) => s + (Number(t.cost) || 0), 0),
    [tasks]
  );
  const cleaningCost = useMemo(
    () => tasks.filter(t => t.category === 'CLEANING').reduce((s, t) => s + (Number(t.cost) || 0), 0),
    [tasks]
  );
  const softwareCost = useMemo(
    () =>
      tasks
        .filter(t => t.category === 'SOFTWARE' || t.category === 'PREVENTIVE')
        .reduce((s, t) => s + (Number(t.cost) || 0), 0),
    [tasks]
  );

  // Single Unified Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = activeMonthDate.getFullYear();
    const month = activeMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray: Array<{ dayNumber: number; dateString: string; dayName: string } | null> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(year, month, day).getDay();
      daysArray.push({
        dayNumber: day,
        dateString,
        dayName: DAY_NAMES[dayOfWeek] || 'Mon'
      });
    }
    return daysArray;
  }, [activeMonthDate]);

  const currentMonthYearHeader = useMemo(() => {
    return activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [activeMonthDate]);

  const selectedDayOfWeek = useMemo(() => getDayNameFromIso(selectedDate), [selectedDate]);

  const selectedDateMaintenanceTasks = useMemo(
    () => tasks.filter(t => t.scheduledDate === selectedDate),
    [tasks, selectedDate]
  );

  const selectedDateReservationSlots = useMemo(
    () =>
      localSchedules.filter(
        s => s.dateString === selectedDate || (!s.dateString && s.day === selectedDayOfWeek)
      ),
    [localSchedules, selectedDate, selectedDayOfWeek]
  );

  // Filtered Lists for Tables
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.lab || '').toLowerCase().includes(q) ||
        (t.pcRange || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter]);

  const filteredWorkstations = useMemo(() => {
    return localWorkstations.filter(pc => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (pc.id || '').toLowerCase().includes(q) ||
        (pc.lab || '').toLowerCase().includes(q) ||
        (pc.activeUser || '').toLowerCase().includes(q) ||
        (pc.ip || '').toLowerCase().includes(q) ||
        (pc.cpu || '').toLowerCase().includes(q);
      const avail = resolveAvailabilityState(pc);
      const matchesStatus = wsAvailFilter === 'ALL' || avail === wsAvailFilter;
      const matchesLab =
        wsLabTab === 'ALL' || (pc.lab || '').toLowerCase().includes(wsLabTab.toLowerCase());
      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [localWorkstations, searchQuery, wsAvailFilter, wsLabTab]);

  // ============================================================================
  // SYNCHRONIZED WORKSTATION CRUD HANDLERS (AUTO-UPDATES INSTRUCTOR PAGE!)
  // ============================================================================
  const syncSideEffectsForWorkstation = (pcCode: string, avail: AvailabilityState) => {
    const cleanCode = pcCode.trim().toUpperCase();
    if (avail === 'Available') {
      try {
        const rawTks = JSON.parse(localStorage.getItem('labtrack_service_tickets_v4') || '[]');
        if (Array.isArray(rawTks)) {
          const updatedTks = rawTks.map((t: any) =>
            String(t.workstation || '').toUpperCase() === cleanCode ? { ...t, status: 'RESOLVED' } : t
          );
          localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify(updatedTks));
        }
      } catch {}

      try {
        const rawQr = JSON.parse(localStorage.getItem('labtrack_qr_attendance_logs_v2') || '[]');
        if (Array.isArray(rawQr)) {
          const updatedQr = rawQr.map((q: any) =>
            String(q.workstation || '').toUpperCase() === cleanCode && q.status === 'IN_SESSION'
              ? { ...q, status: 'COMPLETED', timeOut: new Date().toLocaleTimeString() }
              : q
          );
          localStorage.setItem('labtrack_qr_attendance_logs_v2', JSON.stringify(updatedQr));
        }
      } catch {}
    }
  };

  const handleSetWorkstationAvailability = async (
    pc: Workstation,
    nextAvail: AvailabilityState,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const nextAdminStatus = mapAvailabilityToAdminStatus(nextAvail);

    const nextActiveUser =
      nextAvail === 'Available'
        ? 'Available / Ready'
        : nextAvail === 'Maintenance'
        ? 'Locked (Admin Maintenance)'
        : nextAvail === 'Offline'
        ? 'Offline / Powered Down'
        : pc.activeUser && !pc.activeUser.includes('Available') && !pc.activeUser.includes('Locked')
        ? pc.activeUser
        : 'Active Lab Session';

    syncSideEffectsForWorkstation(pc.id, nextAvail);

    updateWorkstationsList(prev =>
      prev.map(item =>
        item.id === pc.id
          ? {
              ...item,
              status: nextAdminStatus,
              availabilityStatus: nextAvail,
              activeUser: nextActiveUser,
              adminNote: `Admin Set: ${nextAvail}`,
              cpuLoad:
                nextAvail === 'In Use'
                  ? 52
                  : nextAvail === 'Maintenance'
                  ? 14
                  : nextAvail === 'Offline'
                  ? 0
                  : 8,
              tempC:
                nextAvail === 'In Use'
                  ? 58
                  : nextAvail === 'Maintenance'
                  ? 42
                  : nextAvail === 'Offline'
                  ? 28
                  : 38,
              temp:
                nextAvail === 'In Use'
                  ? '58°C'
                  : nextAvail === 'Maintenance'
                  ? '42°C'
                  : nextAvail === 'Offline'
                  ? '28°C'
                  : '38°C'
            }
          : item
      )
    );

    if (pc.dbId) {
      try {
        await apiClient.patch(`/api/v1/workstations/${pc.dbId}/status`, { status: nextAvail });
      } catch {}
    }

    notify(
      `Synced ${pc.id} (${pc.lab.split('(')[0].trim()}) to "${nextAvail.toUpperCase()}" — Automatically updated in Instructor Lab Availability!`
    );
  };

  const handleQuickMaintenanceToggle = async (pc: Workstation, e?: React.MouseEvent) => {
    const currentAvail = resolveAvailabilityState(pc);
    const nextAvail: AvailabilityState =
      currentAvail === 'Maintenance' ? 'Available' : 'Maintenance';
    await handleSetWorkstationAvailability(pc, nextAvail, e);
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const defaultNextNum = localWorkstations.length + 1;
    const code = (
      newAssetCode || `PC-${String(defaultNextNum).padStart(3, '0')}`
    )
      .trim()
      .toUpperCase();

    const adminStatus = mapAvailabilityToAdminStatus(newAssetAvailability);
    const activeUserText =
      newAssetAvailability === 'Available'
        ? 'Available / Ready'
        : newAssetAvailability === 'Maintenance'
        ? newAssetUser.trim() || 'Locked (Admin Maintenance)'
        : newAssetAvailability === 'Offline'
        ? 'Offline / Powered Down'
        : newAssetUser.trim() || 'Active Student Session';

    const tempVal =
      newAssetAvailability === 'In Use'
        ? 56
        : newAssetAvailability === 'Maintenance'
        ? 42
        : newAssetAvailability === 'Offline'
        ? 28
        : 38;
    const cpuVal =
      newAssetAvailability === 'In Use'
        ? 48
        : newAssetAvailability === 'Maintenance'
        ? 14
        : newAssetAvailability === 'Offline'
        ? 0
        : 8;

    const newPc: Workstation = {
      id: code,
      lab: newAssetLab.trim() || 'ComLab 1 (Networking & ICT)',
      status: adminStatus,
      availabilityStatus: newAssetAvailability,
      cpu: newAssetCpu.trim() || 'Core i7-13700',
      ram: newAssetRam.trim() || '32GB DDR5',
      storage: newAssetStorage.trim() || 'RTX 4060 / 1TB NVMe',
      ping: newAssetAvailability === 'Offline' ? 'TIMEOUT' : '1ms',
      activeUser: activeUserText,
      adminNote: newAssetAdminNote.trim() || `Admin Provisioned: ${newAssetAvailability}`,
      ip: newAssetIp.trim() || '10.101.0.127',
      temp: `${tempVal}°C`,
      cpuLoad: cpuVal,
      tempC: tempVal,
      power: newAssetAvailability === 'Offline' ? '0W' : '110W',
      score: newAssetAvailability === 'Offline' ? '0%' : '99%'
    };

    updateWorkstationsList(prev => [newPc, ...prev.filter(item => item.id.toUpperCase() !== code)]);
    setSelectedPcCard(newPc);
    setIsRegisterAssetModalOpen(false);
    setNewAssetCode('');
    setNewAssetUser('');

    try {
      await apiClient.post('/api/v1/workstations', {
        laboratoryName: newPc.lab,
        code: newPc.id,
        name: `Workstation ${newPc.id}`,
        status: newAssetAvailability,
        ipAddress: newPc.ip,
        osVersion: `${newPc.cpu} / ${newPc.ram} / ${newPc.storage}`
      });
    } catch {}

    notify(
      `Provisioned ${newPc.id} as "${newAssetAvailability}" in ${newPc.lab} — Automatically added to Instructor Lab Availability!`
    );
  };

  const handleOpenEditModal = (pc: Workstation) => {
    const avail = resolveAvailabilityState(pc);
    setEditingAsset(pc);
    setEditNodeId(pc.id);
    setEditLab(pc.lab);
    setEditAvailability(avail);
    setEditCpu(pc.cpu);
    setEditRam(pc.ram);
    setEditStorage(pc.storage || 'RTX 4060 / 1TB NVMe');
    setEditIp(pc.ip || '10.101.0.101');
    setEditActiveUser(pc.activeUser || 'Available / Ready');
    setEditAdminNote(pc.adminNote || `Admin Synced: ${avail}`);
    setEditSchedDay(pc.scheduleDay || 'Mon');
    setEditSchedTime(pc.scheduleTime || '08:00 - 10:00 AM');
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const formattedNodeId = editNodeId.trim().toUpperCase();
    const formattedLab = editLab.trim();
    const nextAdminStatus = mapAvailabilityToAdminStatus(editAvailability);

    const resolvedUser =
      editAvailability === 'Available'
        ? 'Available / Ready'
        : editAvailability === 'Maintenance' && editActiveUser === 'Available / Ready'
        ? 'Locked (Admin Maintenance)'
        : editAvailability === 'Offline'
        ? 'Offline / Powered Down'
        : editActiveUser.trim() || 'Active Session';

    syncSideEffectsForWorkstation(formattedNodeId, editAvailability);

    if (editingAsset.id.toUpperCase() !== formattedNodeId) {
      try {
        const rawOv = JSON.parse(localStorage.getItem('labtrack_admin_pc_overrides') || '{}');
        delete rawOv[editingAsset.id.toUpperCase()];
        localStorage.setItem('labtrack_admin_pc_overrides', JSON.stringify(rawOv));
      } catch {}
    }

    updateWorkstationsList(prev =>
      prev.map(pc =>
        pc.id === editingAsset.id
          ? {
              ...pc,
              id: formattedNodeId,
              lab: formattedLab,
              status: nextAdminStatus,
              availabilityStatus: editAvailability,
              cpu: editCpu.trim(),
              ram: editRam.trim(),
              storage: editStorage.trim(),
              ip: editIp.trim(),
              activeUser: resolvedUser,
              adminNote: editAdminNote.trim() || `Admin Synced: ${editAvailability}`,
              scheduleDay: editSchedDay,
              scheduleTime: editSchedTime
            }
          : pc
      )
    );

    setLocalSchedules(prev =>
      prev.map(s =>
        s.pcId.toUpperCase() === editingAsset.id.toUpperCase()
          ? {
              ...s,
              pcId: formattedNodeId,
              lab: formattedLab,
              user: resolvedUser,
              day: editSchedDay,
              time: editSchedTime
            }
          : s
      )
    );

    if (editingAsset.dbId) {
      try {
        await apiClient.put(`/api/v1/workstations/${editingAsset.dbId}`, {
          code: formattedNodeId,
          name: `Workstation ${formattedNodeId}`,
          status: editAvailability,
          ipAddress: editIp.trim(),
          osVersion: `${editCpu} / ${editRam} / ${editStorage}`
        });
      } catch {}
    }

    notify(
      `Workstation ${formattedNodeId} (${editAvailability}) updated and automatically synced to Instructor Lab Availability!`
    );
    setEditingAsset(null);
  };

  const handleDeleteAssetConfirm = async () => {
    if (!deletingAssetId) return;
    const targetCode = deletingAssetId.trim().toUpperCase();
    const targetPc = localWorkstations.find(pc => pc.id.toUpperCase() === targetCode);

    updateWorkstationsList(prev => prev.filter(pc => pc.id.toUpperCase() !== targetCode));
    setLocalSchedules(prev => prev.filter(s => s.pcId.toUpperCase() !== targetCode));

    try {
      const rawOv = JSON.parse(localStorage.getItem('labtrack_admin_pc_overrides') || '{}');
      delete rawOv[targetCode];
      localStorage.setItem('labtrack_admin_pc_overrides', JSON.stringify(rawOv));
    } catch {}

    if (targetPc?.dbId) {
      try {
        await apiClient.delete(`/api/v1/workstations/${targetPc.dbId}`);
      } catch {}
    }

    notify(
      `Workstation ${targetCode} deleted from Admin Fleet and automatically removed from Instructor Lab Availability!`
    );
    setDeletingAssetId(null);
  };

  // MAINTENANCE TASK CRUD HANDLERS
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.lab.trim()) {
      notify('Please complete all required maintenance fields.');
      return;
    }

    const tempId = `MNT-${Math.floor(106 + Math.random() * 900)}`;
    const created: MaintenanceTask = {
      id: tempId,
      title: newTask.title.trim(),
      lab: newTask.lab.trim(),
      pcRange: newTaskPcRange.trim() || 'PC-001 to PC-008',
      category: newTask.category,
      scheduledDate: newTask.scheduledDate,
      cost: Number(newTask.cost) || 0,
      status: 'PENDING',
      color: getCategoryBadgeColor(newTask.category),
      notes: newTask.notes
    };

    setTasks(prev => [created, ...prev]);
    setSelectedDate(created.scheduledDate);
    setIsAddModalOpen(false);

    const singlePcMatch = localWorkstations.find(
      w => w.id.toUpperCase() === created.pcRange.trim().toUpperCase()
    );
    if (singlePcMatch) {
      await handleSetWorkstationAvailability(singlePcMatch, 'Maintenance');
    }

    try {
      const res = await apiClient.post('/api/v1/maintenance/records', {
        Title: created.title,
        Lab: `${created.lab} | ${created.pcRange}`,
        Category: created.category,
        Notes: created.notes || '',
        Cost: created.cost,
        ScheduledDate: created.scheduledDate,
        Status: 'PENDING'
      });
      const savedId = res.data?.data?.id;
      if (savedId) {
        setTasks(prev => prev.map(t => (t.id === tempId ? { ...t, dbId: savedId } : t)));
      }
    } catch {}

    setNewTaskPcRange('PC-001 to PC-008');
    setNewTask({
      title: '',
      lab: 'ComLab 1 (Networking & ICT)',
      category: 'PREVENTIVE',
      scheduledDate: selectedDate,
      cost: 1500,
      notes: ''
    });
    notify(`Maintenance Task ${created.id} added to the unified calendar.`);
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const updated = {
      ...editingTask,
      color: getCategoryBadgeColor(editingTask.category)
    };
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    setEditingTask(null);

    if (updated.dbId) {
      try {
        await apiClient.put(`/api/v1/maintenance/records/${updated.dbId}`, {
          Title: updated.title,
          Lab: `${updated.lab} | ${updated.pcRange}`,
          Category: updated.category,
          Notes: updated.notes || '',
          Cost: updated.cost,
          ScheduledDate: updated.scheduledDate,
          Status: updated.status
        });
      } catch {}
    }
    notify(`Updated Maintenance Task ${updated.id}.`);
  };

  const handleToggleStatus = async (task: MaintenanceTask) => {
    const nextStatus: MaintenanceTask['status'] =
      task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    if (nextStatus === 'COMPLETED') {
      const matchedPc = localWorkstations.find(
        w => w.id.toUpperCase() === task.pcRange.trim().toUpperCase()
      );
      if (matchedPc) {
        await handleSetWorkstationAvailability(matchedPc, 'Available');
      }
    }

    if (task.dbId) {
      try {
        await apiClient.put(`/api/v1/maintenance/records/${task.dbId}`, {
          Title: task.title,
          Lab: `${task.lab} | ${task.pcRange}`,
          Category: task.category,
          Notes: task.notes || '',
          Cost: task.cost,
          ScheduledDate: task.scheduledDate,
          Status: nextStatus
        });
      } catch {}
    }

    notify(
      nextStatus === 'COMPLETED'
        ? `Task ${task.id} marked COMPLETED. Workstations (${task.pcRange}) restored to Available.`
        : `Task ${task.id} reopened as PENDING.`
    );
  };

  const handleDeleteTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setDeletingTaskId(null);

    if (target?.dbId) {
      try {
        await apiClient.delete(`/api/v1/maintenance/records/${target.dbId}`);
      } catch {}
    }
    notify(`Maintenance Task ${id} removed.`);
  };

  const handleCreateScheduleSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedPcId.trim() || !newSchedUser.trim()) {
      notify('Please complete Workstation Tag and User/Class Name.');
      return;
    }

    const createdSlot: DeskScheduleSlot = {
      id: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      pcId: newSchedPcId.trim().toUpperCase(),
      lab: newSchedLab.trim() || 'ComLab 1 (Networking & ICT)',
      user: newSchedUser.trim(),
      purpose: newSchedPurpose.trim() || 'Class Session',
      day: newSchedDay,
      dateString: selectedDate,
      time: (newSchedTime || '08:00 - 10:00 AM').trim(),
      status: newSchedStatus
    };

    setLocalSchedules(prev => [createdSlot, ...prev]);

    updateWorkstationsList(prev =>
      prev.map(pc =>
        pc.id.toUpperCase() === createdSlot.pcId
          ? {
              ...pc,
              activeUser: createdSlot.user,
              scheduleDay: createdSlot.day,
              scheduleTime: createdSlot.time
            }
          : pc
      )
    );

    setIsAddScheduleModalOpen(false);
    setNewSchedPcId('PC-001');
    setNewSchedUser('');
    notify(`Reservation recorded for ${createdSlot.pcId} on ${selectedDate} (${createdSlot.time}).`);
  };

  const handleDeleteScheduleSlot = (slotId: string, pcId: string) => {
    setLocalSchedules(prev => prev.filter(s => s.id !== slotId));
    notify(`Schedule slot ${slotId} for ${pcId} removed.`);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['PC Number', 'Laboratory', 'Availability Status (Instructor Synced)', 'Assigned User', 'IP Address', 'CPU', 'RAM', 'GPU / Storage'],
      ...localWorkstations.map(w => [
        w.id,
        `"${w.lab}"`,
        resolveAvailabilityState(w),
        `"${w.activeUser}"`,
        w.ip,
        `"${w.cpu}"`,
        `"${w.ram}"`,
        `"${w.storage}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRMSU_Admin_Instructor_Synced_Fleet_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported Synchronized Workstation & Maintenance Ledger to CSV.');
  };

  const handlePrevMonth = () => {
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  return (
    <div className="deck-extruded-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7  font-sans select-none relative">
      {/* EXTRUDED DEPTH, TACTILE KEYCAPS & PERSPECTIVE CSS */}
      <style>{`
        .deck-extruded-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 10px 0 #94a3b8,
            0 22px 45px -10px rgba(15, 23, 42, 0.25),
            inset 0 2px 0 #ffffff;
        }
        .card-extruded-lift {
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease;
          transform: translateZ(0);
        }
        .card-extruded-lift:hover {
          transform: translate3d(0, -3px, 0);
        }
        .keycap-tactile {
          box-shadow: 0 4px 0 #cbd5e1, 0 6px 12px rgba(15, 23, 42, 0.08);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .keycap-tactile:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #94a3b8, 0 10px 18px rgba(15, 23, 42, 0.14);
        }
        .keycap-tactile-active {
          box-shadow: 0 5px 0 #1e3a8a, 0 12px 24px rgba(37, 99, 235, 0.4);
          transform: translateY(-3px);
        }
        .vault-obsidian-dark {
          background: linear-gradient(145deg, #0f172a 0%, #020617 100%);
          border: 2px solid #334155;
          box-shadow: 0 8px 0 #020617, 0 18px 35px rgba(2, 6, 23, 0.4);
        }
        .btn-press-bevel {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-press-bevel:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .btn-press-bevel:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
      `}</style>

      {/* DATALISTS (STRICTLY COMLAB 1–3) */}
      <datalist id="mnt-lab-list">
        <option value="ComLab 1 (Networking & ICT)" />
        <option value="ComLab 2 (Multimedia & Graphics)" />
        <option value="ComLab 3 (AI & Software Eng)" />
      </datalist>

      <datalist id="workstation-node-datalist">
        {localWorkstations.map(w => (
          <option key={w.id} value={w.id}>
            {w.id} • {w.lab} ({resolveAvailabilityState(w)})
          </option>
        ))}
        <option value="PC-001 to PC-008" />
        <option value="PC-011 to PC-019" />
        <option value="PC-021 to PC-026" />
      </datalist>

      {/* LIVE TOAST FEEDBACK BANNER */}
      {liveToast && (
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all animate-in slide-in-from-top duration-300 border-2 border-cyan-400">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
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
          1. OBSIDIAN COMMAND HEADER BANNER (SYNCED WITH INSTRUCTOR AVAILABILITY)
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-2xl shadow-[0_5px_0_#78350f,0_0_25px_rgba(245,158,11,0.5)]">
            <Wrench className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Assets, Workstation Desk &amp; Preventive Maintenance
              </h3>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-black transition-all duration-500 ${
                  pulseActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                }`}
              >
                ● SYNCED WITH INSTRUCTOR LAB AVAILABILITY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Adding, editing, or deleting a PC here automatically updates the Instructor&apos;s Lab Availability Matrix • {activeCampus}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchAllData();
              notify('Synchronized Workstation Fleet with Instructor Lab Availability & Backend DB.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
            <span>Sync Fleet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextNum = localWorkstations.length + 1;
              setNewAssetCode(`PC-${String(nextNum).padStart(3, '0')}`);
              setIsRegisterAssetModalOpen(true);
            }}
            className="btn-press-bevel px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Monitor className="w-4 h-4" />
            <span>Add / Register Workstation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewSchedDay(getDayNameFromIso(selectedDate));
              setIsAddScheduleModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_5px_0_#064e3b,0_10px_20px_rgba(16,185,129,0.3)] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 stroke-[2.5]" />
            <span>Add Reservation / Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewTask(prev => ({ ...prev, scheduledDate: selectedDate }));
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_5px_0_#1e3a8a,0_10px_20px_rgba(6,182,212,0.35)] active:translate-y-0.5 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Maintenance Task</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 5 INTERACTIVE 3D KPI CUBES (CLICK TO FILTER BY AVAILABILITY)
         ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          onClick={() => setWsAvailFilter('ALL')}
          className="card-extruded-lift p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-800 via-blue-950 to-slate-900 text-white border-2 border-cyan-400/50 shadow-[0_8px_0_#0f172a] cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300 block">
              TOTAL FLEET
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              {wsSummary.total} PCs
            </p>
            <span className="text-[10.5px] text-slate-300 font-bold">ComLab 1, 2 &amp; 3</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
            <Monitor className="w-5 h-5 text-cyan-300" />
          </div>
        </div>

        <div
          onClick={() => setWsAvailFilter(wsAvailFilter === 'Available' ? 'ALL' : 'Available')}
          className="card-extruded-lift p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b] cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
              AVAILABLE / READY
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              {wsSummary.available} Ready
            </p>
            <span className="text-[10.5px] text-emerald-200 font-bold">Open in Instructor View</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/15 border border-white/25">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          </div>
        </div>

        <div
          onClick={() => setWsAvailFilter(wsAvailFilter === 'In Use' ? 'ALL' : 'In Use')}
          className="card-extruded-lift p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a] cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-sky-200 block">
              ACTIVE / IN USE
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              {wsSummary.inUse} Active
            </p>
            <span className="text-[10.5px] text-blue-200 font-bold">Student QR Sessions</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/15 border border-white/25">
            <Zap className="w-5 h-5 text-sky-300" />
          </div>
        </div>

        <div
          onClick={() => setWsAvailFilter(wsAvailFilter === 'Maintenance' ? 'ALL' : 'Maintenance')}
          className="card-extruded-lift p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f] cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
              MAINTENANCE / OFFLINE
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              {wsSummary.maintenance + wsSummary.outOfOrder} Units
            </p>
            <span className="text-[10.5px] text-amber-100 font-bold">
              {wsSummary.maintenance} Maint • {wsSummary.outOfOrder} Offline
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/15 border border-white/25">
            <Wrench className="w-5 h-5 text-yellow-200" />
          </div>
        </div>

        <div className="card-extruded-lift p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-700 to-slate-900 text-white border-2 border-purple-400/50 shadow-[0_8px_0_#312e81] flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-200 block">
              ALLOCATED BUDGET
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              {formatPeso(totalCost)}
            </p>
            <span className="text-[10.5px] text-purple-200 font-bold">
              {localSchedules.length} Booked Class Slots
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/15 border border-white/25">
            <Calendar className="w-5 h-5 text-purple-200" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN 3-COLUMN COMMAND MATRIX WITH ONE SINGLE UNIFIED CALENDAR
         ===================================================================== */}
      <div className="bg-slate-100/90 p-5 sm:p-6 rounded-[2rem] border-2 border-slate-300 space-y-5 shadow-inner">
        {/* Category Filter Pills & Quick Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            {['ALL', 'PREVENTIVE', 'SOFTWARE', 'HARDWARE', 'CLEANING', 'INSPECTION'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-[0_4px_0_#1e3a8a] -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpenLocal(true)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border-2 border-slate-300 shadow-[0_4px_0_#94a3b8] active:translate-y-0.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print QR Tags</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-[0_4px_0_#020617] active:translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Fleet (CSV)</span>
            </button>
          </div>
        </div>

        {/* 3 COLUMNS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN (4 COLS): ISOMETRIC WORKSTATION BAY + SERVICING QUEUE */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            {/* Featured Isometric Workstation Nodes (CLEAN STACKED ACTION ROW — NEVER OVERLAPS!) */}
            <div className="bg-white p-4.5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Featured Workstation Bay</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = localWorkstations.length + 1;
                    setNewAssetCode(`PC-${String(nextNum).padStart(3, '0')}`);
                    setIsRegisterAssetModalOpen(true);
                  }}
                  className="text-[10px] font-mono font-black bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add PC
                </button>
              </div>

              <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                {filteredWorkstations.slice(0, 4).map(pc => {
                  const isSelected = selectedPcCard?.id === pc.id;
                  const avail = resolveAvailabilityState(pc);
                  return (
                    <div
                      key={pc.id}
                      onClick={() => selectWorkstation(pc)}
                      className={`card-extruded-lift p-3.5 rounded-2xl border-2 cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-cyan-400 shadow-[0_5px_0_#0284c7]'
                          : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700 shadow-[0_4px_0_#0f172a] hover:border-blue-400'
                      }`}
                    >
                      {/* Top Row: 3D Rig + Full Unobstructed PC Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <IsometricDesktopRig
                          status={pc.status}
                          availabilityStatus={avail}
                          code={pc.id}
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-mono font-black text-white text-sm">{pc.id}</h4>
                            <span className="text-[9px] text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-400/40 font-mono font-bold whitespace-nowrap shrink-0">
                              {pc.lab.split('(')[0].trim()}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-emerald-300 truncate font-bold">
                            {pc.activeUser}
                          </p>
                          <p className="text-[9.5px] text-slate-300 truncate font-mono">
                            {pc.cpu} • {pc.ip}
                          </p>
                        </div>
                      </div>

                      {/* Dedicated Bottom Action Bar (Never Covered or Squished!) */}
                      <div
                        className="pt-2 border-t border-white/10 flex items-center justify-between gap-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={e => handleQuickMaintenanceToggle(pc, e)}
                          className={`px-2.5 py-1 rounded-xl font-mono font-black text-[9.5px] border cursor-pointer whitespace-nowrap shrink-0 ${
                            avail === 'Maintenance'
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : avail === 'Offline'
                              ? 'bg-rose-600 text-white border-rose-400'
                              : avail === 'In Use'
                              ? 'bg-blue-500 text-white border-blue-300'
                              : 'bg-emerald-500 text-slate-950 border-emerald-300'
                          }`}
                        >
                          {avail === 'Available' ? '✓ AVAILABLE' : avail.toUpperCase()}
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-cyan-300 hover:text-white rounded-xl border border-slate-600 font-mono font-black text-[10px] cursor-pointer flex items-center gap-1 transition"
                            title="Edit Workstation"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAssetId(pc.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-slate-600 font-mono font-black text-[10px] cursor-pointer flex items-center gap-1 transition"
                            title="Delete Workstation"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Servicing Queue */}
            <div className="bg-white p-4.5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Scheduled Servicing Queue
                  </span>
                  <span className="text-[10px] font-mono font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                    {filteredTasks.length} Tasks
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => {
                      const isSel = selectedDate === task.scheduledDate;
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedDate(task.scheduledDate)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                            isSel
                              ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white border-cyan-400 shadow-[0_4px_0_#0284c7]'
                              : 'bg-slate-50 text-slate-800 border-slate-300 shadow-[0_3px_0_#cbd5e1] hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="flex items-center gap-2 font-black text-xs min-w-0">
                              <span className={`w-2 h-2 rounded-full ${task.color} shrink-0`} />
                              <span className="truncate">{task.title}</span>
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-black shrink-0">
                              {task.id}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className={`font-bold truncate ${isSel ? 'text-cyan-300' : 'text-blue-700'}`}>
                              {task.lab.split('(')[0].trim()} ({task.pcRange})
                            </span>
                            <span className={`font-mono font-black shrink-0 ${isSel ? 'text-emerald-300' : 'text-slate-900'}`}>
                              {formatPeso(task.cost)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-bold">
                      No maintenance tasks found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN (5 COLS): THE SINGLE UNIFIED TACTILE KEYCAP CALENDAR */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-black text-blue-600 uppercase tracking-wider block">
                    Single Unified Servicing &amp; Reservation Calendar
                  </span>
                  <h4 className="text-lg font-black text-slate-900">{currentMonthYearHeader}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 shadow-[0_3px_0_#94a3b8] active:translate-y-0.5 cursor-pointer transition"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-800" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 shadow-[0_3px_0_#94a3b8] active:translate-y-0.5 cursor-pointer transition"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-800" />
                  </button>
                </div>
              </div>

              {/* Dual-Indicator Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono font-black bg-slate-900 text-white px-3.5 py-2 rounded-2xl border border-slate-700 shadow-inner">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                  MAINTENANCE TASK
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  WORKSTATION RESERVATION
                </span>
              </div>

              {/* TACTILE KEYCAP MONTH DAYS GRID */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-black pt-1">
                {DAY_NAMES.map((day, i) => (
                  <span key={i} className="text-[10px] font-mono text-slate-500 py-1 uppercase">
                    {day}
                  </span>
                ))}

                {calendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="py-2.5" />;
                  }

                  const { dayNumber, dateString, dayName } = item;
                  const dayMaintTasks = tasks.filter(t => t.scheduledDate === dateString);
                  const dayReservations = localSchedules.filter(
                    s => s.dateString === dateString || (!s.dateString && s.day === dayName)
                  );
                  const hasMaint = dayMaintTasks.length > 0;
                  const hasRes = dayReservations.length > 0;
                  const isSelected = selectedDate === dateString;

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => setSelectedDate(dateString)}
                      className={`py-2.5 rounded-2xl text-xs font-mono font-black cursor-pointer relative flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white border-blue-400 keycap-tactile-active z-10'
                          : hasMaint && hasRes
                          ? 'bg-gradient-to-b from-amber-50 to-emerald-50 text-slate-900 border-blue-300 keycap-tactile'
                          : hasMaint
                          ? 'bg-amber-50 text-amber-900 border-amber-300 keycap-tactile'
                          : hasRes
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 keycap-tactile'
                          : 'bg-slate-50 text-slate-800 border-slate-200 keycap-tactile'
                      }`}
                    >
                      <span>{dayNumber}</span>
                      <div className="flex items-center gap-1 absolute bottom-1">
                        {hasMaint && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-amber-300' : 'bg-rose-500'
                            }`}
                          />
                        )}
                        {hasRes && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-cyan-200' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UNIFIED DAILY AGENDA WELL */}
            <div className="bg-slate-950 text-white p-4 rounded-2xl border-2 border-slate-800 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-2">
                <span className="font-black text-cyan-300">
                  AGENDA // {selectedDate} ({selectedDayOfWeek.toUpperCase()})
                </span>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {selectedDateMaintenanceTasks.length} Maint
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {selectedDateReservationSlots.length} Booked
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedDateMaintenanceTasks.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setInspectingTask(m)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/40 hover:border-rose-400 flex items-center justify-between gap-2 text-[11px] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono font-black text-[9px] shrink-0">
                        {m.id}
                      </span>
                      <span className="font-bold text-white truncate">{m.title}</span>
                      <span className="text-[10px] font-mono text-amber-300 shrink-0">
                        ({m.pcRange})
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-black text-cyan-300 shrink-0">
                      {m.status}
                    </span>
                  </div>
                ))}

                {selectedDateReservationSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2 text-[11px] group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-mono font-black text-[9px] shrink-0">
                        {slot.pcId}
                      </span>
                      <span className="font-bold text-white truncate">{slot.user}</span>
                      <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                        {slot.time}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteScheduleSlot(slot.id, slot.pcId)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
                      title="Delete Reservation Slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {selectedDateMaintenanceTasks.length === 0 &&
                  selectedDateReservationSlots.length === 0 && (
                    <div className="text-center py-4 text-[11px] font-mono text-slate-500">
                      No maintenance tasks or workstation reservations on {selectedDate}.
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (3 COLS): OBSIDIAN FUND BUDGET & INSTRUCTOR SYNC VAULT */}
          <div className="lg:col-span-3 vault-obsidian-dark text-white p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">
                  Fund Budget &amp; Sync Vault
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/40 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Total Allocated Cost
                </span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {formatPeso(totalCost)}
                </p>
                <div className="flex justify-between text-[10px] font-mono text-slate-300 pt-1">
                  <span className="text-emerald-300 font-bold">{completedCount} Completed</span>
                  <span className="text-amber-300 font-bold">{pendingCount} Active</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-mono font-bold">
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Hardware &amp; Parts</span>
                    <span className="text-rose-400 font-black">{formatPeso(hardwareCost)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full w-3/4" />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Routine Cleaning</span>
                    <span className="text-emerald-400 font-black">{formatPeso(cleaningCost)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full w-1/2" />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Software &amp; Preventive</span>
                    <span className="text-cyan-400 font-black">{formatPeso(softwareCost)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full w-2/3" />
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/50 rounded-2xl border border-emerald-500/30 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-200">Available (Instructor)</span>
                    <span className="text-emerald-300 font-black">{wsSummary.available} PCs</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Maint / Offline</span>
                    <span className="text-amber-300 font-black">
                      {wsSummary.maintenance + wsSummary.outOfOrder} PCs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                persistFleetToSharedStorage(localWorkstations);
                notify(
                  `Force-synced all ${localWorkstations.length} workstations (${wsSummary.available} Available, ${wsSummary.inUse} In Use, ${wsSummary.maintenance} Maint) with Instructor Lab Availability!`
                );
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Sync with Instructor Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. UNIFIED VIEW SWITCHER & SEARCH BAR
         ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveBottomTab('BOTH')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeBottomTab === 'BOTH'
                ? 'bg-slate-900 text-cyan-300 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                : 'bg-white text-slate-700 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
            }`}
          >
            All Views (Unified)
          </button>
          <button
            type="button"
            onClick={() => setActiveBottomTab('MATRIX_3D')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeBottomTab === 'MATRIX_3D'
                ? 'bg-slate-900 text-cyan-300 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                : 'bg-white text-slate-700 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            <span>3D PC Rigs Matrix ({localWorkstations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveBottomTab('WORKSTATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeBottomTab === 'WORKSTATIONS'
                ? 'bg-slate-900 text-cyan-300 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                : 'bg-white text-slate-700 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
            }`}
          >
            Workstation Inventory Table ({localWorkstations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveBottomTab('MAINTENANCE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeBottomTab === 'MAINTENANCE'
                ? 'bg-slate-900 text-cyan-300 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                : 'bg-white text-slate-700 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
            }`}
          >
            Maintenance Work Orders ({tasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border-2 border-slate-300 shadow-inner w-full md:w-80 focus-within:border-blue-600">
          <Search className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            placeholder="Search PC-001, Task, ComLab 1–3, IP, or User..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs font-bold outline-none w-full text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* =====================================================================
          5A. 3D PC RIGS FLOOR MATRIX (SPACIOUS 4-COLUMN GRID — NO OVERLAP!)
         ===================================================================== */}
      {(activeBottomTab === 'BOTH' || activeBottomTab === 'MATRIX_3D') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                TWO-WAY SYNCED 3D WORKSTATION FLOOR MATRIX
              </span>
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-600" />
                <span>ComLab 1–3 Live 3D Desktop Rigs ({filteredWorkstations.length} Shown)</span>
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ComLab 1', 'ComLab 2', 'ComLab 3'] as const).map(labTab => (
                <button
                  key={labTab}
                  type="button"
                  onClick={() => setWsLabTab(labTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    wsLabTab === labTab
                      ? 'bg-blue-600 text-white shadow-[0_3px_0_#1e3a8a]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {labTab === 'ALL' ? 'All Labs (CL 1–3)' : labTab}
                </button>
              ))}

              <select
                value={wsAvailFilter}
                onChange={(e: any) => setWsAvailFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-black outline-none cursor-pointer"
              >
                <option value="ALL">All Status ({wsSummary.total})</option>
                <option value="Available">AVAILABLE / READY ({wsSummary.available})</option>
                <option value="In Use">In Use ({wsSummary.inUse})</option>
                <option value="Maintenance">Maintenance ({wsSummary.maintenance})</option>
                <option value="Offline">Offline ({wsSummary.outOfOrder})</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-slate-100/90 rounded-3xl border-2 border-slate-200 shadow-inner">
            {filteredWorkstations.map(pc => {
              const avail = resolveAvailabilityState(pc);
              return (
                <div
                  key={pc.id}
                  onClick={() => setInspectingAsset(pc)}
                  className={`card-extruded-lift p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-3 ${
                    avail === 'In Use'
                      ? 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white border-cyan-400/70 shadow-[0_6px_0_#0f172a]'
                      : avail === 'Available'
                      ? 'bg-white text-slate-800 border-emerald-400 hover:border-emerald-500 shadow-[0_6px_0_#6ee7b7]'
                      : avail === 'Maintenance'
                      ? 'bg-amber-50/95 text-amber-950 border-amber-400 shadow-[0_6px_0_#fcd34d]'
                      : 'bg-rose-50/95 text-rose-950 border-rose-300 shadow-[0_6px_0_#fda4af]'
                  }`}
                >
                  {/* Top Header of 3D Card */}
                  <div className="flex justify-between items-center text-xs font-mono font-black">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          avail === 'Available'
                            ? 'bg-emerald-500'
                            : avail === 'In Use'
                            ? 'bg-cyan-300 animate-ping'
                            : avail === 'Maintenance'
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                      />
                      {pc.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] uppercase whitespace-nowrap ${
                        avail === 'In Use'
                          ? 'bg-blue-600 text-white'
                          : avail === 'Available'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : avail === 'Maintenance'
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {avail === 'Available' ? 'AVAILABLE' : avail}
                    </span>
                  </div>

                  {/* Middle: 3D Rig + Details */}
                  <div className="flex items-center gap-3 bg-slate-900/95 rounded-2xl p-2.5 border border-slate-800 text-white">
                    <IsometricDesktopRig
                      status={pc.status}
                      availabilityStatus={avail}
                      code={pc.id}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-black text-white truncate">
                        {pc.lab.split('(')[0].trim()}
                      </p>
                      <p className="text-[10px] font-mono text-cyan-300 truncate">
                        {pc.activeUser}
                      </p>
                      <p className="text-[9.5px] font-mono text-slate-400 truncate">
                        {pc.ip} • {pc.temp}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Stacked Status Selector + Full Edit & Delete Buttons (Zero Overlap!) */}
                  <div
                    className="space-y-2 pt-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <select
                      value={avail}
                      onChange={e =>
                        handleSetWorkstationAvailability(pc, e.target.value as AvailabilityState)
                      }
                      className="w-full bg-slate-900 text-cyan-300 font-mono font-black text-[10.5px] px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Available">✓ AVAILABLE / READY</option>
                      <option value="In Use">● In Use (Occupied)</option>
                      <option value="Maintenance">🔧 Under Maintenance</option>
                      <option value="Offline">✕ Offline / Outage</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(pc)}
                        className="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10.5px] shadow-[0_2px_0_#1e3a8a] transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit PC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAssetId(pc.id)}
                        className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[10.5px] shadow-[0_2px_0_#881337] transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          5B. TABLE 1: WORKSTATION ASSETS & SCHEDULE INVENTORY TABLE
         ===================================================================== */}
      {(activeBottomTab === 'BOTH' || activeBottomTab === 'WORKSTATIONS') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                Assets &amp; Workstation Desk (Connected to Instructor Page)
              </span>
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Workstation Inventory, Availability Status &amp; Schedule Slots</span>
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ComLab 1', 'ComLab 2', 'ComLab 3'] as const).map(labTab => (
                <button
                  key={labTab}
                  type="button"
                  onClick={() => setWsLabTab(labTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    wsLabTab === labTab
                      ? 'bg-blue-600 text-white shadow-[0_3px_0_#1e3a8a]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {labTab === 'ALL' ? 'All Labs' : labTab}
                </button>
              ))}

              <select
                value={wsAvailFilter}
                onChange={(e: any) => setWsAvailFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Status ({wsSummary.total})</option>
                <option value="Available">AVAILABLE / READY ({wsSummary.available})</option>
                <option value="In Use">In Use ({wsSummary.inUse})</option>
                <option value="Maintenance">Maintenance ({wsSummary.maintenance})</option>
                <option value="Offline">Offline ({wsSummary.outOfOrder})</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-900 text-cyan-300 font-mono font-black uppercase tracking-wider text-[10px] border-b-2 border-slate-800">
                <tr>
                  <th className="p-4 whitespace-nowrap">ASSET TAG / NODE</th>
                  <th className="p-4 whitespace-nowrap">ASSIGNED LAB</th>
                  <th className="p-4 whitespace-nowrap">VLAN IP ADDRESS</th>
                  <th className="p-4 whitespace-nowrap">SPECS (CPU / RAM / GPU)</th>
                  <th className="p-4 whitespace-nowrap">INSTRUCTOR SYNC STATUS</th>
                  <th className="p-4 whitespace-nowrap">ACTIVE USER / NOTE</th>
                  <th className="p-4 whitespace-nowrap">SCHEDULE SLOT</th>
                  <th className="p-4 text-right whitespace-nowrap min-w-[210px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredWorkstations.length > 0 ? (
                  filteredWorkstations.map(pc => {
                    const matchedSched = localSchedules.find(
                      s => s.pcId.toUpperCase() === pc.id.toUpperCase()
                    );
                    const avail = resolveAvailabilityState(pc);
                    return (
                      <tr
                        key={pc.id}
                        className={`hover:bg-blue-50/60 transition cursor-pointer ${
                          selectedPcCard?.id === pc.id ? 'bg-blue-50/90' : ''
                        }`}
                        onClick={() => selectWorkstation(pc)}
                      >
                        <td className="p-3.5 font-mono font-black text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-xl bg-slate-900 text-cyan-400 shadow-[0_3px_0_#1e3a8a] shrink-0">
                              <QrCode className="w-4 h-4" />
                            </div>
                            <span>{pc.id}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-extrabold text-blue-900 whitespace-nowrap">{pc.lab}</td>
                        <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">{pc.ip}</td>
                        <td className="p-3.5 text-slate-700 whitespace-nowrap">
                          {pc.cpu} / {pc.ram} / <span className="text-blue-700">{pc.storage}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <select
                            value={avail}
                            onChange={e =>
                              handleSetWorkstationAvailability(
                                pc,
                                e.target.value as AvailabilityState
                              )
                            }
                            className={`px-3 py-1 rounded-xl font-mono font-black text-[10px] border cursor-pointer transition shadow-[0_2px_0_rgba(0,0,0,0.18)] outline-none ${
                              avail === 'Available'
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : avail === 'In Use'
                                ? 'bg-blue-600 text-white border-blue-700'
                                : avail === 'Maintenance'
                                ? 'bg-amber-500 text-slate-950 border-amber-600'
                                : 'bg-rose-600 text-white border-rose-700'
                            }`}
                          >
                            <option value="Available" className="bg-slate-900 text-emerald-300">
                              AVAILABLE / READY
                            </option>
                            <option value="In Use" className="bg-slate-900 text-sky-300">
                              IN USE (OCCUPIED)
                            </option>
                            <option value="Maintenance" className="bg-slate-900 text-amber-300">
                              UNDER MAINTENANCE
                            </option>
                            <option value="Offline" className="bg-slate-900 text-rose-300">
                              OFFLINE / OUT OF ORDER
                            </option>
                          </select>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-slate-800 font-bold block">{pc.activeUser || 'Available / Ready'}</span>
                          {pc.adminNote && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {pc.adminNote}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {matchedSched || pc.scheduleDay ? (
                            <span className="text-blue-900 bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-xl font-mono font-black text-[10px] inline-block shadow-2xs">
                              {matchedSched?.day || pc.scheduleDay} •{' '}
                              {matchedSched?.time || pc.scheduleTime || '08:00 - 10:00 AM'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Unscheduled</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onDrilldown) {
                                  onDrilldown(
                                    `Workstation ${pc.id} (${pc.lab}): Status ${avail} | IP: ${pc.ip} | CPU: ${pc.cpu} | RAM: ${pc.ram}`
                                  );
                                } else {
                                  setInspectingAsset(pc);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-cyan-300 hover:text-white rounded-xl font-black text-[11px] transition cursor-pointer shrink-0"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(pc)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[11px] shadow-[0_2px_0_#1e3a8a] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Edit Workstation & Sync to Instructor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingAssetId(pc.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 font-black text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0"
                              title="Delete Workstation from Both Admin & Instructor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      No workstations found matching your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. TABLE 2: SCHEDULED MAINTENANCE WORK ORDERS LEDGER TABLE
         ===================================================================== */}
      {(activeBottomTab === 'BOTH' || activeBottomTab === 'MAINTENANCE') && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                Work Orders Ledger
              </span>
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Scheduled Work Orders &amp; Workstation Lock Status</span>
              </h4>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-900 font-mono font-black uppercase text-[10px] text-cyan-300 border-b-2 border-slate-800">
                <tr>
                  <th className="p-4 whitespace-nowrap">Task ID</th>
                  <th className="p-4 whitespace-nowrap">Title &amp; Category</th>
                  <th className="p-4 whitespace-nowrap">Laboratory</th>
                  <th className="p-4 whitespace-nowrap">PC Range / Workstations</th>
                  <th className="p-4 whitespace-nowrap">Scheduled Date</th>
                  <th className="p-4 text-right whitespace-nowrap">Cost (PHP)</th>
                  <th className="p-4 text-center whitespace-nowrap">Status</th>
                  <th className="p-4 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/50 transition">
                      <td className="p-3.5 font-mono font-black text-blue-700 whitespace-nowrap">{t.id}</td>
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{t.title}</div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 whitespace-nowrap">{t.lab}</td>
                      <td className="p-3.5 font-mono text-xs font-black text-blue-700 whitespace-nowrap">
                        {t.pcRange}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 font-bold whitespace-nowrap">
                        {t.scheduledDate}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatPeso(t.cost)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-xl font-mono text-[10px] font-black border shadow-[0_2px_0_rgba(0,0,0,0.15)] inline-block ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-blue-600 text-white border-blue-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingTask(t)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer shrink-0"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTask(t)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10.5px] transition cursor-pointer flex items-center gap-1 shrink-0"
                            title="Edit Task"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition cursor-pointer shrink-0"
                            title="Toggle Completion Status"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTaskId(t.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No maintenance schedules found matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          EXTRUDED MODALS (Z-[100] & SCROLLABLE — NEVER COVERED!)
         ===================================================================== */}

      {/* MODAL 1: ADD RESERVATION / SCHEDULE SLOT */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#064e3b,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 border-2 border-emerald-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Add Reservation / Schedule Slot ({selectedDate})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduleSlot} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" /> Workstation Node Tag
                  </label>
                  <input
                    type="text"
                    list="workstation-node-datalist"
                    value={newSchedPcId}
                    onChange={e => setNewSchedPcId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 font-mono font-black outline-none focus:border-emerald-600"
                    placeholder="e.g. PC-001"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Assigned Laboratory
                  </label>
                  <input
                    type="text"
                    list="mnt-lab-list"
                    value={newSchedLab}
                    onChange={e => setNewSchedLab(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 font-bold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> User / Class / Reservation Name
                </label>
                <input
                  type="text"
                  value={newSchedUser}
                  onChange={e => setNewSchedUser(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-emerald-600"
                  placeholder="e.g. BSIS-3A Lab Class"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Course / Activity Purpose
                </label>
                <input
                  type="text"
                  value={newSchedPurpose}
                  onChange={e => setNewSchedPurpose(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-emerald-600"
                  placeholder="e.g. Laboratory Class Session"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Day of Week</label>
                  <select
                    value={newSchedDay}
                    onChange={e => setNewSchedDay(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Time Slot
                  </label>
                  <input
                    type="text"
                    list="sched-time-datalist"
                    value={newSchedTime}
                    onChange={e => setNewSchedTime(e.target.value)}
                    placeholder="e.g. 08:00 - 10:00 AM"
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-emerald-600"
                    required
                  />
                  <datalist id="sched-time-datalist">
                    <option value="08:00 - 10:00 AM" />
                    <option value="10:00 - 12:00 PM" />
                    <option value="01:00 - 03:00 PM" />
                    <option value="03:00 - 05:00 PM" />
                    <option value="05:00 - 07:00 PM" />
                  </datalist>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_4px_0_#064e3b] cursor-pointer"
                >
                  Record Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MAINTENANCE TASK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Maintenance Schedule Task</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Lab Location</label>
                  <input
                    type="text"
                    list="mnt-lab-list"
                    placeholder="e.g. ComLab 1 (Networking & ICT)"
                    value={newTask.lab}
                    onChange={e => setNewTask({ ...newTask, lab: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">PC Range / Workstation</label>
                  <input
                    type="text"
                    list="workstation-node-datalist"
                    value={newTaskPcRange}
                    onChange={e => setNewTaskPcRange(e.target.value)}
                    placeholder="e.g. PC-001 to PC-008"
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Task Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Cleaning & Thermal Paste Replacement"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => {
                      const cat = e.target.value as MaintenanceTask['category'];
                      setNewTask({
                        ...newTask,
                        category: cat,
                        cost: cat === 'CLEANING' ? 0 : newTask.cost
                      });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CLEANING">CLEANING</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newTask.scheduledDate}
                    onChange={e => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Cost (₱)</label>
                  <input
                    type="number"
                    value={newTask.cost}
                    onChange={e => setNewTask({ ...newTask, cost: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Additional Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Optional details or servicing instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-normal h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-[0_4px_0_#1e3a8a] transition cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT MAINTENANCE TASK */}
      {editingTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Task ({editingTask.id})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Lab Location</label>
                  <input
                    type="text"
                    list="mnt-lab-list"
                    value={editingTask.lab}
                    onChange={e => setEditingTask({ ...editingTask, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">PC Range</label>
                  <input
                    type="text"
                    value={editingTask.pcRange}
                    onChange={e => setEditingTask({ ...editingTask, pcRange: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={editingTask.category}
                    onChange={e => setEditingTask({ ...editingTask, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CLEANING">CLEANING</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editingTask.scheduledDate}
                    onChange={e => setEditingTask({ ...editingTask, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Cost (₱)</label>
                  <input
                    type="number"
                    value={editingTask.cost}
                    onChange={e => setEditingTask({ ...editingTask, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-[0_4px_0_#1e3a8a] cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INSPECT TASK OR WORKSTATION DETAILS */}
      {(inspectingTask || inspectingAsset) && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] border-2 border-blue-400 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>
                  {inspectingTask
                    ? `Task Details (${inspectingTask.id})`
                    : `Workstation Details (${inspectingAsset?.id})`}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setInspectingTask(null);
                  setInspectingAsset(null);
                }}
                className="cursor-pointer text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectingTask ? (
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-400">Task Name:</span>
                  <strong className="text-slate-900 text-right">{inspectingTask.title}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-400">Facility:</span>
                  <strong className="text-blue-600">{inspectingTask.lab}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-400">PC Range:</span>
                  <strong className="text-slate-800 font-mono">{inspectingTask.pcRange}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-400">Category:</span>
                  <strong className="text-slate-800">{inspectingTask.category}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-400">Cost:</span>
                  <strong className="text-emerald-600">{formatPeso(inspectingTask.cost)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <strong className="text-amber-600">{inspectingTask.status}</strong>
                </div>
              </div>
            ) : inspectingAsset ? (
              <div className="space-y-3">
                <div className="bg-slate-900 p-3 rounded-2xl flex items-center justify-center">
                  <IsometricDesktopRig
                    status={inspectingAsset.status}
                    availabilityStatus={resolveAvailabilityState(inspectingAsset)}
                    code={inspectingAsset.id}
                    size="lg"
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-200/70 pb-1">
                    <span className="text-slate-400">Node Code:</span>
                    <strong className="text-slate-900 font-mono">{inspectingAsset.id}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-1">
                    <span className="text-slate-400">Instructor Sync Status:</span>
                    <strong className="text-emerald-600 font-mono">
                      {resolveAvailabilityState(inspectingAsset)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-1">
                    <span className="text-slate-400">Laboratory:</span>
                    <strong className="text-blue-600">{inspectingAsset.lab}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-1">
                    <span className="text-slate-400">VLAN IP:</span>
                    <strong className="text-slate-800 font-mono">{inspectingAsset.ip}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware:</span>
                    <strong className="text-slate-800">
                      {inspectingAsset.cpu} / {inspectingAsset.ram}
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              {inspectingAsset && (
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectingAsset;
                    setInspectingAsset(null);
                    handleOpenEditModal(target);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#1e3a8a] cursor-pointer"
                >
                  Edit Workstation
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setInspectingTask(null);
                  setInspectingAsset(null);
                }}
                className="flex-1 bg-slate-900 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#020617] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE MAINTENANCE TASK CONFIRMATION */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-base">Delete Maintenance Task?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete maintenance order{' '}
                <strong className="text-slate-900">{deletingTaskId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTaskId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(deletingTaskId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: REGISTER NEW WORKSTATION ASSET */}
      {isRegisterAssetModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span>Add / Register Workstation (Syncs to Instructor)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterAssetModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Workstation Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. PC-027"
                    value={newAssetCode}
                    onChange={e => setNewAssetCode(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Laboratory (ComLab 1–3)</label>
                  <input
                    type="text"
                    list="mnt-lab-list"
                    value={newAssetLab}
                    onChange={e => setNewAssetLab(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-slate-800">
                  Initial Availability Status (Synced with Instructor Lab Availability)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'Available', label: '✓ AVAILABLE / READY', style: 'bg-emerald-600 text-white border-emerald-700' },
                      { id: 'In Use', label: '● In Use (Occupied)', style: 'bg-blue-600 text-white border-blue-700' },
                      { id: 'Maintenance', label: '🔧 Under Maintenance', style: 'bg-amber-500 text-slate-950 border-amber-600' },
                      { id: 'Offline', label: '✕ Offline / Outage', style: 'bg-rose-600 text-white border-rose-700' }
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewAssetAvailability(opt.id)}
                      className={`py-2 px-2.5 rounded-xl font-mono text-[10.5px] font-black border-2 transition cursor-pointer ${
                        newAssetAvailability === opt.id
                          ? `${opt.style} shadow-[0_3px_0_rgba(0,0,0,0.25)] -translate-y-0.5`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">CPU Spec</label>
                  <input
                    type="text"
                    value={newAssetCpu}
                    onChange={e => setNewAssetCpu(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">RAM Capacity</label>
                  <input
                    type="text"
                    value={newAssetRam}
                    onChange={e => setNewAssetRam(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">GPU / Storage Drive</label>
                  <input
                    type="text"
                    value={newAssetStorage}
                    onChange={e => setNewAssetStorage(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Static IP Address</label>
                  <input
                    type="text"
                    value={newAssetIp}
                    onChange={e => setNewAssetIp(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Assigned User (If In Use)</label>
                  <input
                    type="text"
                    placeholder="Leave blank if Available..."
                    value={newAssetUser}
                    onChange={e => setNewAssetUser(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Admin Sync Note</label>
                  <input
                    type="text"
                    value={newAssetAdminNote}
                    onChange={e => setNewAssetAdminNote(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterAssetModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-press-bevel w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl cursor-pointer"
                >
                  Save &amp; Sync to Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT WORKSTATION & SYNC TO INSTRUCTOR */}
      {editingAsset && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Workstation ({editingAsset.id}) — Syncs to Instructor</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="space-y-3.5 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Workstation Node Tag</label>
                  <input
                    type="text"
                    value={editNodeId}
                    onChange={e => setEditNodeId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Assigned Laboratory</label>
                  <input
                    type="text"
                    list="mnt-lab-list"
                    value={editLab}
                    onChange={e => setEditLab(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5">
                  Availability Status (Auto-Updates Instructor Lab Availability)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'Available', label: '✓ AVAILABLE / READY', style: 'bg-emerald-600 text-white border-emerald-700' },
                      { id: 'In Use', label: '● In Use (Occupied)', style: 'bg-blue-600 text-white border-blue-700' },
                      { id: 'Maintenance', label: '🔧 Under Maintenance', style: 'bg-amber-500 text-slate-950 border-amber-600' },
                      { id: 'Offline', label: '✕ Offline / Outage', style: 'bg-rose-600 text-white border-rose-700' }
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditAvailability(opt.id)}
                      className={`py-2 px-2.5 rounded-xl font-mono text-[10.5px] font-black border-2 transition cursor-pointer ${
                        editAvailability === opt.id
                          ? `${opt.style} shadow-[0_3px_0_rgba(0,0,0,0.25)]`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Active User / Class</label>
                  <input
                    type="text"
                    value={editActiveUser}
                    onChange={e => setEditActiveUser(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Static IP Address</label>
                  <input
                    type="text"
                    value={editIp}
                    onChange={e => setEditIp(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">CPU</label>
                  <input
                    type="text"
                    value={editCpu}
                    onChange={e => setEditCpu(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">RAM</label>
                  <input
                    type="text"
                    value={editRam}
                    onChange={e => setEditRam(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">GPU / Storage</label>
                  <input
                    type="text"
                    value={editStorage}
                    onChange={e => setEditStorage(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2 rounded-xl text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Schedule Day</label>
                  <select
                    value={editSchedDay}
                    onChange={e => setEditSchedDay(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Schedule Time Slot</label>
                  <select
                    value={editSchedTime}
                    onChange={e => setEditSchedTime(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="08:00 - 10:00 AM">08:00 - 10:00 AM</option>
                    <option value="10:00 - 12:00 PM">10:00 - 12:00 PM</option>
                    <option value="01:00 - 03:00 PM">01:00 - 03:00 PM</option>
                    <option value="03:00 - 05:00 PM">03:00 - 05:00 PM</option>
                    <option value="05:00 - 07:00 PM">05:00 - 07:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-press-bevel w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl cursor-pointer"
                >
                  Save &amp; Sync Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: CONFIRM DELETE WORKSTATION ASSET */}
      {deletingAssetId && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Delete Workstation {deletingAssetId}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently remove <strong className="text-slate-900">{deletingAssetId}</strong> from both the Admin Fleet and the Instructor&apos;s Lab Availability Matrix.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAssetId(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAssetConfirm}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: PRINT QR TAGS */}
      {isQrModalOpenLocal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Workstation QR Code Tags ({localWorkstations.length} Units)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsQrModalOpenLocal(false)}
                className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
              {localWorkstations.map(pc => (
                <div
                  key={pc.id}
                  className="p-3 rounded-2xl border-2 border-slate-200 text-center space-y-1 bg-slate-50 shadow-[0_3px_0_#cbd5e1]"
                >
                  <QrCode className="w-10 h-10 text-slate-900 mx-auto" />
                  <p className="text-xs font-mono font-black text-blue-700">{pc.id}</p>
                  <p className="text-[10px] font-bold text-slate-500">{pc.lab.split('(')[0].trim()}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpenLocal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsQrModalOpenLocal(false);
                }}
                className="btn-press-bevel w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;











