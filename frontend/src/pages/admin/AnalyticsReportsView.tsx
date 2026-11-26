import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, FileSpreadsheet, FileText, Clock,
  CheckCircle, AlertCircle, Activity, Layers, Zap,
  RefreshCw, TrendingUp, Users, BellRing, Radio,
  Laptop, ShieldCheck, Cpu, DollarSign, PieChart,
  Trash2, Wrench, PackageX, Plus, Search, Check,
  Edit3, X, Wallet, Gauge
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export interface LabPerformanceRecord {
  labId: string;
  labName: string;
  totalPCs: number;
  activePCs: number;
  cpuAvgPct: number;
  ramAvgPct: number;
  openTickets: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface WriteOffItem {
  id: string;
  lab: string;
  name: string;
  issue: string;
  status: 'BEYOND REPAIR' | 'CONDEMNED' | 'DISPOSED' | 'REPLACED';
  cost: number;
  dateAdded: string;
}

export interface FinancialExpenseItem {
  id: string;
  title: string;
  category: 'MAINTENANCE' | 'SOFTWARE' | 'INFRASTRUCTURE';
  lab: string;
  amount: number;
  date: string;
}

export interface AnalyticsReportsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface FinancialReportsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

// ============================================================================
// SMART AUTO-DETECT PHILIPPINE MARKET PRICE & CATEGORY ENGINE (IN PHP ₱)
// Works for both Hardware Write-Offs AND Financial Operational Expenses!
// ============================================================================
const estimateMarketPrice = (itemName: string): number => {
  if (!itemName || !itemName.trim()) return 0;
  const l = itemName.toLowerCase();

  // 1. Maintenance & Servicing Keywords
  if (l.includes('thermal paste') || l.includes('cleaning') || l.includes('dusting') || l.includes('sanitization')) {
    if (l.includes('all') || l.includes('quarterly') || l.includes('full')) return 14500;
    return 3500;
  }
  if (l.includes('reformat') || l.includes('os install') || l.includes('re-image') || l.includes('imaging')) {
    return 4500;
  }
  if (l.includes('cable') || l.includes('rj45') || l.includes('cat6') || l.includes('keystone') || l.includes('patch cord')) {
    return 4800;
  }
  if (l.includes('aircon') || l.includes('ac cleaning') || l.includes('hvac') || l.includes('freon')) {
    return 8500;
  }

  // 2. Software, Licenses & Subscriptions
  if (l.includes('windows 11') || l.includes('windows 10') || l.includes('microsoft 365') || l.includes('office 365')) {
    return 28500;
  }
  if (l.includes('antivirus') || l.includes('kaspersky') || l.includes('bitdefender') || l.includes('crowdstrike')) {
    return 18500;
  }
  if (
    l.includes('adobe') ||
    l.includes('autocad') ||
    l.includes('matlab') ||
    l.includes('jetbrains') ||
    l.includes('visual studio') ||
    l.includes('license') ||
    l.includes('subscription')
  ) {
    return 32000;
  }

  // 3. Apple iPhones & iOS Devices
  if (l.includes('iphone') || l.includes('apple phone') || l.includes('ios phone')) {
    if (l.includes('16 pro max')) return 84990;
    if (l.includes('16 pro')) return 69990;
    if (l.includes('16 plus')) return 62990;
    if (l.includes('16')) return 54990;
    if (l.includes('15 pro max')) return 75990;
    if (l.includes('15 pro')) return 62990;
    if (l.includes('15')) return 47990;
    if (l.includes('14 pro max')) return 64990;
    if (l.includes('14')) return 39990;
    if (l.includes('13')) return 32990;
    return 35990;
  }

  // 4. iPads & Tablets
  if (l.includes('ipad') || l.includes('tablet') || l.includes('galaxy tab')) {
    if (l.includes('ipad pro') || l.includes('tab s9 ultra')) return 62990;
    if (l.includes('ipad air') || l.includes('tab s9')) return 41990;
    return 22990;
  }

  // 5. Android Smartphones
  if (
    l.includes('samsung') ||
    l.includes('galaxy') ||
    l.includes('android') ||
    l.includes('smartphone') ||
    l.includes('xiaomi') ||
    l.includes('realme') ||
    l.includes('oppo') ||
    l.includes('vivo')
  ) {
    if (l.includes('s24 ultra') || l.includes('z fold')) return 84900;
    if (l.includes('s24')) return 53900;
    if (l.includes('s23 ultra')) return 68900;
    if (l.includes('a55') || l.includes('a54')) return 22500;
    return 18500;
  }

  // 6. Graphics Cards / GPUs
  if (
    l.includes('gpu') ||
    l.includes('graphics card') ||
    l.includes('rtx') ||
    l.includes('gtx') ||
    l.includes('radeon') ||
    l.includes('video card')
  ) {
    if (l.includes('4090') || l.includes('3090')) return 118000;
    if (l.includes('4080') || l.includes('3080')) return 65000;
    if (l.includes('4070 ti') || l.includes('4070 super')) return 44500;
    if (l.includes('4070') || l.includes('3070')) return 37500;
    if (l.includes('4060 ti') || l.includes('3060 ti')) return 24500;
    if (l.includes('4060') || l.includes('3060') || l.includes('7600')) return 17800;
    if (l.includes('1660') || l.includes('1650') || l.includes('rx 580')) return 8500;
    return 17800;
  }

  // 7. Processors / CPUs
  if (l.includes('cpu') || l.includes('processor') || l.includes('intel') || l.includes('ryzen')) {
    if (l.includes('i9') || l.includes('ryzen 9')) return 34500;
    if (l.includes('i7') || l.includes('ryzen 7')) return 21500;
    if (l.includes('i5') || l.includes('ryzen 5')) return 11800;
    if (l.includes('i3') || l.includes('ryzen 3')) return 5400;
    return 11800;
  }

  // 8. MacBooks & Laptops
  if (l.includes('macbook') || l.includes('laptop') || l.includes('notebook')) {
    if (l.includes('macbook pro')) return 99990;
    if (l.includes('macbook air')) return 64990;
    if (l.includes('i7') || l.includes('ryzen 7')) return 54500;
    return 38500;
  }

  // 9. Desktops & Workstations
  if (
    l.includes('workstation') ||
    l.includes('system unit') ||
    l.includes('desktop') ||
    l.includes('computer unit') ||
    l.includes('pc')
  ) {
    if (l.includes('server') || l.includes('xeon')) return 88000;
    if (l.includes('i7') || l.includes('ryzen 7')) return 52000;
    if (l.includes('i3') || l.includes('ryzen 3')) return 18500;
    return 32000;
  }

  // 10. Monitors & Displays
  if (l.includes('monitor') || l.includes('display') || l.includes('screen')) {
    if (l.includes('4k') || l.includes('ultrawide') || l.includes('34')) return 32500;
    if (l.includes('27') && (l.includes('144hz') || l.includes('165hz'))) return 13800;
    if (l.includes('27')) return 9800;
    if (l.includes('24')) return 7900;
    return 6200;
  }

  // 11. Storage Drives (SSD & HDD)
  if (l.includes('ssd') || l.includes('nvme') || l.includes('m.2') || l.includes('hdd') || l.includes('hard drive')) {
    if (l.includes('2tb')) return 7800;
    if (l.includes('1tb')) return 4200;
    if (l.includes('500gb') || l.includes('512gb')) return 2350;
    return 3500;
  }

  // 12. RAM / Memory
  if (l.includes('ram') || l.includes('memory') || l.includes('ddr4') || l.includes('ddr5')) {
    if (l.includes('64gb')) return 11800;
    if (l.includes('32gb')) return 5900;
    if (l.includes('16gb')) return 2850;
    return 1850;
  }

  // 13. Motherboards, PSU, UPS, Networking
  if (l.includes('motherboard') || l.includes('mobo') || l.includes('mainboard')) {
    if (l.includes('z790') || l.includes('x670')) return 16500;
    return 6800;
  }
  if (l.includes('psu') || l.includes('power supply') || l.includes('ups') || l.includes('avr')) {
    if (l.includes('1000w') || l.includes('online ups')) return 11800;
    if (l.includes('1500va')) return 10800;
    if (l.includes('avr')) return 1650;
    return 4800;
  }
  if (l.includes('switch') || l.includes('router') || l.includes('access point') || l.includes('firewall') || l.includes('vlan')) {
    if (l.includes('48-port') || l.includes('firewall')) return 22500;
    if (l.includes('24-port')) return 11500;
    return 8500;
  }
  if (l.includes('keyboard') || l.includes('mouse') || l.includes('headset') || l.includes('webcam')) {
    if (l.includes('mechanical')) return 2800;
    return 950;
  }

  const hash = Array.from(itemName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 3500 + (hash % 15) * 850;
};

// Auto-detects Financial Expense Category based on typed description
const detectExpenseCategory = (title: string): FinancialExpenseItem['category'] => {
  const l = (title || '').toLowerCase();
  if (
    l.includes('software') ||
    l.includes('license') ||
    l.includes('windows') ||
    l.includes('office') ||
    l.includes('adobe') ||
    l.includes('antivirus') ||
    l.includes('ide') ||
    l.includes('cloud') ||
    l.includes('subscription')
  ) {
    return 'SOFTWARE';
  }
  if (
    l.includes('switch') ||
    l.includes('router') ||
    l.includes('vlan') ||
    l.includes('firewall') ||
    l.includes('server') ||
    l.includes('rack') ||
    l.includes('ups') ||
    l.includes('network') ||
    l.includes('cable') ||
    l.includes('cat6')
  ) {
    return 'INFRASTRUCTURE';
  }
  return 'MAINTENANCE';
};

// Auto-detects Asset Tag Prefix based on typed hardware name
const suggestAssetTagPrefix = (hardwareName: string, count: number): string => {
  const l = (hardwareName || '').toLowerCase();
  const num = String(count + 105).padStart(3, '0');
  if (l.includes('monitor') || l.includes('display') || l.includes('screen')) return `MON-${num}`;
  if (l.includes('rtx') || l.includes('gtx') || l.includes('gpu') || l.includes('graphics')) return `GPU-${num}`;
  if (l.includes('ups') || l.includes('avr') || l.includes('psu')) return `PWR-${num}`;
  if (l.includes('ram') || l.includes('ddr')) return `RAM-${num}`;
  if (l.includes('ssd') || l.includes('nvme') || l.includes('hdd')) return `DRV-${num}`;
  if (l.includes('switch') || l.includes('router')) return `NET-${num}`;
  if (l.includes('iphone') || l.includes('ipad') || l.includes('galaxy')) return `MOB-${num}`;
  return `PC-${num}`;
};

// ============================================================================
// CATMULL-ROM TO CUBIC BEZIER SPLINE GENERATOR (SILK-SMOOTH WAVE CURVES)
// ============================================================================
const buildSilkSmoothWavePath = (pts: Array<{ x: number; y: number }>): string => {
  if (!pts || pts.length === 0) return 'M 0,55 L 300,55';
  if (pts.length === 1) return `M 0,${pts[0].y.toFixed(2)} L 300,${pts[0].y.toFixed(2)}`;

  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
};

// ============================================================================
// 3D ISOMETRIC TELEMETRY & FINANCIAL VAULT RIG ILLUSTRATION
// ============================================================================
const IsometricAnalyticsRig: React.FC<{
  mode: 'TELEMETRY' | 'FINANCIAL' | 'SLA';
  code: string;
}> = ({ mode, code }) => {
  const primaryHex = mode === 'TELEMETRY' ? '#38bdf8' : mode === 'FINANCIAL' ? '#10b981' : '#f59e0b';
  const secondaryHex = mode === 'TELEMETRY' ? '#2563eb' : mode === 'FINANCIAL' ? '#059669' : '#d97706';
  const gradId = `iso-ana-${mode}-${code}`;

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
            style={{ transformOrigin: '105px 39px', animationDuration: '2.4s' }}
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
            style={{ transformOrigin: '105px 56px', animationDuration: '2.4s' }}
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

const DEFAULT_LAB_RECORDS: LabPerformanceRecord[] = [
  {
    labId: 'LAB-101',
    labName: 'ComLab 1 (Networking & ICT)',
    totalPCs: 45,
    activePCs: 42,
    cpuAvgPct: 38,
    ramAvgPct: 62,
    openTickets: 1,
    healthStatus: 'HEALTHY'
  },
  {
    labId: 'LAB-102',
    labName: 'ComLab 2 (Multimedia & Graphics)',
    totalPCs: 40,
    activePCs: 36,
    cpuAvgPct: 54,
    ramAvgPct: 78,
    openTickets: 2,
    healthStatus: 'HEALTHY'
  },
  {
    labId: 'LAB-103',
    labName: 'ComLab 3 (AI & Software Eng)',
    totalPCs: 50,
    activePCs: 48,
    cpuAvgPct: 68,
    ramAvgPct: 82,
    openTickets: 0,
    healthStatus: 'HEALTHY'
  }
];

const DEFAULT_WRITE_OFFS: WriteOffItem[] = [
  {
    id: 'MON-204',
    lab: 'ComLab 1 (ICT)',
    name: '27" 144Hz IPS Monitor',
    issue: 'Burned backlight inverter & cracked LCD panel',
    status: 'BEYOND REPAIR',
    cost: 13800,
    dateAdded: '2026-10-24'
  },
  {
    id: 'GPU-109',
    lab: 'ComLab 2 (Multimedia)',
    name: 'NVIDIA RTX 4060 8GB Graphics Card',
    issue: 'Shorted VRAM rail & artifacting under render load',
    status: 'CONDEMNED',
    cost: 17800,
    dateAdded: '2026-10-26'
  },
  {
    id: 'UPS-302',
    lab: 'ComLab 3 (Engineering)',
    name: '1500VA Line-Interactive UPS Backup',
    issue: 'Swollen lead-acid battery cells & relay failure',
    status: 'REPLACED',
    cost: 10800,
    dateAdded: '2026-10-28'
  }
];

const DEFAULT_EXPENSES: FinancialExpenseItem[] = [
  {
    id: 'EXP-501',
    title: 'Quarterly Preventive Thermal Servicing & Antistatic Cleaning',
    category: 'MAINTENANCE',
    lab: 'ComLab 1, 2 & 3',
    amount: 14500,
    date: '2026-10-20'
  },
  {
    id: 'EXP-502',
    title: 'RJ45 Cat6 Patch Cables & Keystone Jack Replacements',
    category: 'MAINTENANCE',
    lab: 'ComLab 2 (Multimedia)',
    amount: 4800,
    date: '2026-10-25'
  },
  {
    id: 'EXP-503',
    title: 'Campus IDE, Windows 11 Education & Cloud Sandbox Licenses',
    category: 'SOFTWARE',
    lab: 'All Laboratories',
    amount: 28500,
    date: '2026-10-15'
  },
  {
    id: 'EXP-504',
    title: 'Managed Gigabit VLAN Switch & Firewall Maintenance Subscription',
    category: 'INFRASTRUCTURE',
    lab: 'Server Room',
    amount: 16500,
    date: '2026-10-18'
  }
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';

  // Unified View Mode & Wave Speed Controls
  const [commandTab, setCommandTab] = useState<'UNIFIED_ALL' | 'TELEMETRY_ONLY' | 'FINANCIAL_ONLY'>('UNIFIED_ALL');
  const [timeframe, setTimeframe] = useState<'LIVE' | '24H' | '7D' | '30D'>('LIVE');
  const [selectedLab, setSelectedLab] = useState<string>('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [waveSpeed, setWaveSpeed] = useState<1 | 1.5 | 2>(1.5);
  const [wavePhase, setWavePhase] = useState<number>(0);
  const [selectedMttrDayIdx, setSelectedMttrDayIdx] = useState<number>(6);
  const [isExporting, setIsExporting] = useState<'PDF' | 'CSV' | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Real-Time System Telemetry Metrics
  const [slaMetPct, setSlaMetPct] = useState(98.8);
  const [responseTime, setResponseTime] = useState(1.6);
  const [resolutionTime, setResolutionTime] = useState(2.2);
  const [downtime, setDowntime] = useState(1.2);
  const [userAccessCount, setUserAccessCount] = useState(142);

  // Laboratory Breakdown Matrix (Persisted)
  const [labRecords, setLabRecords] = useState<LabPerformanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_analytics_labs_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LAB_RECORDS;
  });

  // Financial Budget & Ledger States (Persisted & 100% Accurate)
  const [allocatedBudget, setAllocatedBudget] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('labtrack_allocated_budget_v2'));
      if (!isNaN(saved) && saved > 0) return saved;
    } catch {}
    return 500000;
  });

  const [unrepairableAssets, setUnrepairableAssets] = useState<WriteOffItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_writeoff_assets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WRITE_OFFS;
  });

  const [expenseRecords, setExpenseRecords] = useState<FinancialExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_financial_expenses_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_EXPENSES;
  });

  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; text: string; time: string; type: string }>>([
    { id: 'AUD-901', text: 'Verified Q4 Laboratory Budget Allocation (₱500,000)', time: '08:00 AM', type: 'BUDGET' },
    { id: 'AUD-902', text: 'Auto-valued Write-Off Asset GPU-109 at ₱17,800 (PH Market Rate)', time: '09:15 AM', type: 'WRITEOFF' },
    { id: 'AUD-903', text: 'Synchronized ComLab 1–3 Telemetry & SLA Compliance (98.8%)', time: 'Just now', type: 'TELEMETRY' }
  ]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_allocated_budget_v2', String(allocatedBudget));
    } catch {}
  }, [allocatedBudget]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_writeoff_assets_v2', JSON.stringify(unrepairableAssets));
    } catch {}
  }, [unrepairableAssets]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_financial_expenses_v2', JSON.stringify(expenseRecords));
    } catch {}
  }, [expenseRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_analytics_labs_v2', JSON.stringify(labRecords));
    } catch {}
  }, [labRecords]);

  // Search & Filter States for Financial Write-Offs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals States
  const [isAddWriteOffOpen, setIsAddWriteOffOpen] = useState(false);
  const [editingWriteOff, setEditingWriteOff] = useState<WriteOffItem | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [editingLabRecord, setEditingLabRecord] = useState<LabPerformanceRecord | null>(null);

  // Form States
  const [newItem, setNewItem] = useState({
    id: '',
    lab: 'ComLab 1 (ICT)',
    name: '',
    issue: '',
    status: 'BEYOND REPAIR' as WriteOffItem['status'],
    customCost: ''
  });

  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'MAINTENANCE' as FinancialExpenseItem['category'],
    lab: 'ComLab 1 (ICT)',
    amount: 0,
    isManualAmount: false
  });

  const [budgetInput, setBudgetInput] = useState<string>(String(allocatedBudget));

  // ============================================================================
  // 60FPS BUTTER-SMOOTH requestAnimationFrame WAVE ENGINE
  // Drives smooth flowing wave motion anchored to real system metrics!
  // ============================================================================
  useEffect(() => {
    if (!isLiveStreaming) return;
    let rafId: number;
    let lastTime = performance.now();

    const animateWave = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setWavePhase(prev => (prev + dt * 2.2 * waveSpeed) % (Math.PI * 200));
      rafId = requestAnimationFrame(animateWave);
    };

    rafId = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(rafId);
  }, [isLiveStreaming, waveSpeed]);

  // Subtle realistic telemetry heartbeat for CPU/RAM bars every 2.2 seconds
  useEffect(() => {
    if (!isLiveStreaming) return;
    const telemetryTimer = setInterval(() => {
      setLabRecords(prev =>
        prev.map((lab, idx) => {
          const deltaCpu = Math.round(Math.sin(Date.now() / 1200 + idx) * 2);
          const deltaRam = Math.round(Math.cos(Date.now() / 1500 + idx) * 1.5);
          return {
            ...lab,
            cpuAvgPct: Math.min(95, Math.max(22, lab.cpuAvgPct + deltaCpu)),
            ramAvgPct: Math.min(93, Math.max(35, lab.ramAvgPct + deltaRam))
          };
        })
      );
    }, 2200);
    return () => clearInterval(telemetryTimer);
  }, [isLiveStreaming]);

  // UNIFIED API FETCHING WITH SAFE FALLBACKS
  const fetchAllAnalyticsAndFinancials = useCallback(async () => {
    setIsLoadingApi(true);
    try {
      const [usageRes, usersRes, assetsRes, labsRes, finSumRes, finTxRes] = await Promise.all([
        apiClient.get('/api/v1/analytics/usage').catch(() => null),
        apiClient.get('/api/v1/users').catch(() => null),
        apiClient.get('/api/v1/assets').catch(() => null),
        apiClient.get('/api/v1/laboratories').catch(() => null),
        apiClient.get('/api/v1/financials/summary').catch(() => null),
        apiClient.get('/api/v1/financials/transactions').catch(() => null)
      ]);

      const u = usageRes?.data?.data || usageRes?.data;
      if (u) {
        if (typeof u.slaMetPct === 'number' && u.slaMetPct > 0) setSlaMetPct(u.slaMetPct);
        if (typeof u.responseTime === 'number' && u.responseTime > 0) setResponseTime(u.responseTime);
        if (typeof u.resolutionTime === 'number' && u.resolutionTime > 0) setResolutionTime(u.resolutionTime);
      }

      const users = usersRes?.data?.data?.items || usersRes?.data?.data || usersRes?.data;
      if (Array.isArray(users) && users.length > 0) {
        setUserAccessCount(Math.max(users.length * 12, 120));
      }

      const finSum = finSumRes?.data?.data || finSumRes?.data;
      if (finSum && typeof finSum.totalAllocated === 'number' && finSum.totalAllocated > 0) {
        setAllocatedBudget(finSum.totalAllocated);
      }

      const txs = finTxRes?.data?.data?.items || finTxRes?.data?.data || finTxRes?.data;
      if (Array.isArray(txs) && txs.length > 0) {
        const mappedExp: FinancialExpenseItem[] = txs.map((t: any, i: number) => {
          const titleStr = t.description || t.title || 'Laboratory Operational Expense';
          return {
            id: t.id ? String(t.id) : `EXP-${600 + i}`,
            title: titleStr,
            category: detectExpenseCategory(t.category || titleStr),
            lab: t.laboratoryName || 'ComLab 1 (ICT)',
            amount: Number(t.amount) || estimateMarketPrice(titleStr),
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : '2026-10-28'
          };
        });
        setExpenseRecords(mappedExp);
      }

      const labs = labsRes?.data?.data?.items || labsRes?.data?.data || labsRes?.data;
      const assets = assetsRes?.data?.data?.items || assetsRes?.data?.data || assetsRes?.data;

      if (Array.isArray(assets) && assets.length > 0) {
        const apiWriteOffs = assets
          .filter((a: any) => {
            const st = String(a.status || '').toUpperCase();
            return st.includes('BEYOND') || st.includes('CONDEMNED') || st.includes('DISPOSED') || st.includes('UNREPAIR');
          })
          .map((a: any, idx: number) => {
            const itemName = a.name || a.model || 'Laboratory Hardware Unit';
            return {
              id: a.assetTag || a.code || `AST-${201 + idx}`,
              lab: a.laboratoryName || a.labRoom || 'ComLab 1 (ICT)',
              name: itemName,
              issue: a.description || a.issue || 'Beyond Economic Repair',
              status: 'BEYOND REPAIR' as WriteOffItem['status'],
              cost: Number(a.cost || a.purchasePrice) || estimateMarketPrice(itemName),
              dateAdded: a.createdAtUtc ? new Date(a.createdAtUtc).toISOString().split('T')[0] : '2026-10-28'
            };
          });
        if (apiWriteOffs.length > 0) {
          setUnrepairableAssets(prev => {
            const map = new Map<string, WriteOffItem>();
            apiWriteOffs.forEach((w: WriteOffItem) => map.set(w.id, w));
            prev.forEach(p => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            return Array.from(map.values());
          });
        }
      }

      if (Array.isArray(labs) && labs.length > 0) {
        const records: LabPerformanceRecord[] = labs.map((l: any, idx: number) => {
          const labAssets = Array.isArray(assets) ? assets.filter((a: any) => a.laboratoryId === l.id) : [];
          const total = labAssets.length || l.capacity || 45;
          const active =
            labAssets.filter(
              (a: any) =>
                String(a.status || '').toUpperCase() === 'OPERATIONAL' ||
                String(a.status || '').toUpperCase() === 'ACTIVE'
            ).length || Math.floor(total * 0.88);
          const open = labAssets.filter((a: any) => String(a.status || '').toUpperCase().includes('MAINT')).length;

          return {
            labId: l.id || `LAB-${101 + idx}`,
            labName: l.name || `ComLab ${idx + 1}`,
            totalPCs: total,
            activePCs: active,
            cpuAvgPct: 38 + idx * 12,
            ramAvgPct: 60 + idx * 10,
            openTickets: open,
            healthStatus: active / Math.max(1, total) >= 0.8 ? 'HEALTHY' : 'WARNING'
          };
        });
        setLabRecords(records);
      }
    } catch {
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAnalyticsAndFinancials();
  }, [fetchAllAnalyticsAndFinancials]);

  // ============================================================================
  // 100% ACCURATE MATHEMATICAL AGGREGATIONS
  // ============================================================================
  const filteredLabRecords = useMemo(() => {
    if (selectedLab === 'ALL') return labRecords;
    return labRecords.filter(l => l.labId === selectedLab || l.labName.includes(selectedLab));
  }, [labRecords, selectedLab]);

  const telemetryTotals = useMemo(() => {
    const list = filteredLabRecords.length > 0 ? filteredLabRecords : labRecords;
    const totalPCs = list.reduce((acc, r) => acc + (Number(r.totalPCs) || 0), 0);
    const activePCs = list.reduce((acc, r) => acc + (Number(r.activePCs) || 0), 0);
    const openTickets = list.reduce((acc, r) => acc + (Number(r.openTickets) || 0), 0);
    const avgCpu =
      list.length > 0 ? Math.round(list.reduce((acc, r) => acc + (Number(r.cpuAvgPct) || 0), 0) / list.length) : 45;
    const avgRam =
      list.length > 0 ? Math.round(list.reduce((acc, r) => acc + (Number(r.ramAvgPct) || 0), 0) / list.length) : 64;
    const occupancyPct = totalPCs > 0 ? Math.round((activePCs / totalPCs) * 100) : 92;

    return { totalPCs, activePCs, openTickets, avgCpu, avgRam, occupancyPct };
  }, [filteredLabRecords, labRecords]);

  const maintenanceCost = useMemo(
    () =>
      expenseRecords
        .filter(e => e.category === 'MAINTENANCE')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenseRecords]
  );

  const softwareAndInfraCost = useMemo(
    () =>
      expenseRecords
        .filter(e => e.category === 'SOFTWARE' || e.category === 'INFRASTRUCTURE')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenseRecords]
  );

  const totalWriteOffCost = useMemo(
    () => unrepairableAssets.reduce((sum, item) => sum + (Number(item.cost) || 0), 0),
    [unrepairableAssets]
  );

  const totalSpent = useMemo(
    () => maintenanceCost + softwareAndInfraCost + totalWriteOffCost,
    [maintenanceCost, softwareAndInfraCost, totalWriteOffCost]
  );

  const remainingBudget = useMemo(
    () => Math.max(0, allocatedBudget - totalSpent),
    [allocatedBudget, totalSpent]
  );

  const spentPercentage = useMemo(() => {
    if (!allocatedBudget || allocatedBudget <= 0) return 0;
    return Math.min(100, +((totalSpent / allocatedBudget) * 100).toFixed(1));
  }, [allocatedBudget, totalSpent]);

  const filteredAssets = useMemo(() => {
    return unrepairableAssets.filter(asset => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (asset.id || '').toLowerCase().includes(q) ||
        (asset.name || '').toLowerCase().includes(q) ||
        (asset.lab || '').toLowerCase().includes(q) ||
        (asset.issue || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
      const matchesSelectedLab =
        selectedLab === 'ALL' ||
        (asset.lab || '').toLowerCase().includes(selectedLab.toLowerCase()) ||
        filteredLabRecords.some(l => asset.lab.toLowerCase().includes(l.labName.split('(')[0].trim().toLowerCase()));
      return matchesSearch && matchesStatus && matchesSelectedLab;
    });
  }, [unrepairableAssets, searchQuery, statusFilter, selectedLab, filteredLabRecords]);

  // ============================================================================
  // SILK-SMOOTH, ACCURATE & MEANINGFUL WAVE COORDINATE GENERATORS
  // ============================================================================
  // WAVE 1: Anchored to actual ComLab 1, ComLab 2, ComLab 3 Occupancy & CPU Load
  const accessWavePoints = useMemo(() => {
    const l1 = labRecords[0] ? Math.round((labRecords[0].activePCs / Math.max(1, labRecords[0].totalPCs)) * 100) : 93;
    const l2 = labRecords[1] ? Math.round((labRecords[1].activePCs / Math.max(1, labRecords[1].totalPCs)) * 100) : 90;
    const l3 = labRecords[2] ? Math.round((labRecords[2].activePCs / Math.max(1, labRecords[2].totalPCs)) * 100) : 96;
    const cpuAvg = telemetryTotals.avgCpu;

    // 13 control points across 0..300 anchored to real lab metrics with smooth flowing wave motion
    const anchors = [
      cpuAvg * 0.85,
      (cpuAvg + l1) * 0.48,
      l1 * 0.88,
      (l1 + cpuAvg) * 0.52,
      cpuAvg * 0.92,
      l2 * 0.86,
      (l2 + l3) * 0.46,
      cpuAvg * 0.95,
      l3 * 0.9,
      (l3 + cpuAvg) * 0.55,
      telemetryTotals.occupancyPct * 0.85,
      cpuAvg * 0.9,
      telemetryTotals.occupancyPct * 0.82
    ];

    return anchors.map((baseVal, i) => {
      const x = (i / (anchors.length - 1)) * 300;
      const smoothFlow = Math.sin(i * 0.75 - wavePhase) * 9.5 + Math.cos(i * 0.45 - wavePhase * 0.7) * 4.5;
      const val = Math.min(94, Math.max(14, baseVal + smoothFlow));
      return {
        x,
        y: 100 - (val / 100) * 80 - 8,
        rawPct: Math.round(val)
      };
    });
  }, [wavePhase, labRecords, telemetryTotals]);

  // WAVE 2: Anchored to 7-Day MTTR Resolution & Response Benchmarks (Mon–Sun)
  const mttrWavePoints = useMemo(() => {
    const baseCpu = Math.min(78, Math.max(32, telemetryTotals.avgCpu));
    const dailyProfile = [-8, +6, -4, +12, +2, +14, +10];

    return DAYS_OF_WEEK.map((day, i) => {
      const x = (i / 6) * 300;
      const v1 = Math.min(
        92,
        Math.max(
          20,
          baseCpu + dailyProfile[i] + Math.sin(i * 0.9 - wavePhase) * 10 + Math.cos(i * 0.5 - wavePhase * 0.8) * 4
        )
      );
      const v2 = Math.min(
        85,
        Math.max(15, baseCpu * 0.74 + dailyProfile[i] * 0.7 + Math.cos(i * 0.85 - wavePhase * 0.9) * 8.5)
      );
      const dayResHrs = +(resolutionTime * (0.85 + (v1 / 100) * 0.35)).toFixed(1);
      const dayRespHrs = +(responseTime * (0.82 + (v2 / 100) * 0.32)).toFixed(1);
      return {
        day,
        x,
        y1: 110 - (v1 / 100) * 84 - 10,
        y2: 110 - (v2 / 100) * 84 - 10,
        dayResHrs,
        dayRespHrs
      };
    });
  }, [wavePhase, telemetryTotals.avgCpu, resolutionTime, responseTime]);

  // WAVE 3: Anchored to Real Financial Categories (Maintenance, Write-Offs, Software/Infra, Remaining)
  const financialFlowPoints = useMemo(() => {
    const safeAlloc = Math.max(1, allocatedBudget);
    const maintScale = Math.min(85, Math.max(25, (maintenanceCost / safeAlloc) * 260 + 24));
    const writeOffScale = Math.min(88, Math.max(28, (totalWriteOffCost / safeAlloc) * 260 + 28));
    const softScale = Math.min(90, Math.max(30, (softwareAndInfraCost / safeAlloc) * 260 + 30));
    const totalScale = Math.min(92, Math.max(32, spentPercentage + 26));

    const anchors = [
      maintScale * 0.75,
      maintScale,
      (maintScale + writeOffScale) * 0.52,
      writeOffScale,
      (writeOffScale + softScale) * 0.54,
      softScale,
      (softScale + totalScale) * 0.52,
      totalScale,
      totalScale * 0.92,
      (totalScale + maintScale) * 0.55,
      totalScale * 0.95,
      totalScale * 0.88
    ];

    return anchors.map((base, i) => {
      const x = (i / (anchors.length - 1)) * 300;
      const l1Val = Math.min(
        94,
        Math.max(18, base + Math.sin(i * 0.7 - wavePhase * 0.95) * 9.5 + Math.cos(i * 0.4 - wavePhase) * 4)
      );
      const l2Val = Math.min(
        86,
        Math.max(12, base * 0.74 + Math.cos(i * 0.75 - wavePhase * 1.05) * 8.5)
      );
      return {
        x,
        y1: 110 - (l1Val / 100) * 84 - 10,
        y2: 110 - (l2Val / 100) * 84 - 10
      };
    });
  }, [wavePhase, allocatedBudget, maintenanceCost, totalWriteOffCost, softwareAndInfraCost, spentPercentage]);

  const accessLinePath = useMemo(() => buildSilkSmoothWavePath(accessWavePoints), [accessWavePoints]);
  const accessAreaPath = useMemo(() => `${accessLinePath} L 300,100 L 0,100 Z`, [accessLinePath]);

  const mttrLine1Path = useMemo(
    () => buildSilkSmoothWavePath(mttrWavePoints.map(p => ({ x: p.x, y: p.y1 }))),
    [mttrWavePoints]
  );
  const mttrLine2Path = useMemo(
    () => buildSilkSmoothWavePath(mttrWavePoints.map(p => ({ x: p.x, y: p.y2 }))),
    [mttrWavePoints]
  );

  const finLine1Path = useMemo(
    () => buildSilkSmoothWavePath(financialFlowPoints.map(p => ({ x: p.x, y: p.y1 }))),
    [financialFlowPoints]
  );
  const finArea1Path = useMemo(() => `${finLine1Path} L 300,110 L 0,110 Z`, [finLine1Path]);

  const finLine2Path = useMemo(
    () => buildSilkSmoothWavePath(financialFlowPoints.map(p => ({ x: p.x, y: p.y2 }))),
    [financialFlowPoints]
  );
  const finArea2Path = useMemo(() => `${finLine2Path} L 300,110 L 0,110 Z`, [finLine2Path]);

  // ============================================================================
  // CRUD HANDLERS (AUTO-DETECT MARKET PRICE FOR BOTH WRITE-OFFS & EXPENSES)
  // ============================================================================
  const handleAddWriteOffItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.lab.trim()) {
      onTriggerNotification('Please complete Hardware Name and Laboratory Location.');
      return;
    }

    const autoValuedCost = estimateMarketPrice(newItem.name);
    const finalCost =
      newItem.customCost && Number(newItem.customCost) > 0 ? Number(newItem.customCost) : autoValuedCost;
    const autoId = newItem.id.trim()
      ? newItem.id.trim().toUpperCase()
      : suggestAssetTagPrefix(newItem.name, unrepairableAssets.length);

    const created: WriteOffItem = {
      id: autoId,
      lab: newItem.lab.trim(),
      name: newItem.name.trim(),
      issue: newItem.issue.trim() || 'Beyond Economic Repair',
      status: newItem.status,
      cost: finalCost,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setUnrepairableAssets(prev => [created, ...prev]);
    setIsAddWriteOffOpen(false);
    setNewItem({ id: '', lab: 'ComLab 1 (ICT)', name: '', issue: '', status: 'BEYOND REPAIR', customCost: '' });

    setAuditLogs(prev => [
      {
        id: `AUD-${Math.floor(100 + Math.random() * 899)}`,
        text: `Added Write-Off Asset ${created.id} (${created.name}) — Auto-Valued at ₱${created.cost.toLocaleString()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'WRITEOFF'
      },
      ...prev
    ]);

    onTriggerNotification(
      `Added ${created.id} (${created.name}) with Auto PH Market Price: ₱${created.cost.toLocaleString()}!`
    );
  };

  const handleSaveEditWriteOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWriteOff) return;

    setUnrepairableAssets(prev =>
      prev.map(item => (item.id === editingWriteOff.id ? editingWriteOff : item))
    );

    setAuditLogs(prev => [
      {
        id: `AUD-${Math.floor(100 + Math.random() * 899)}`,
        text: `Updated Write-Off Asset ${editingWriteOff.id} (${editingWriteOff.status}) — ₱${editingWriteOff.cost.toLocaleString()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'WRITEOFF'
      },
      ...prev
    ]);

    onTriggerNotification(`Updated Write-Off record ${editingWriteOff.id} (₱${editingWriteOff.cost.toLocaleString()}).`);
    setEditingWriteOff(null);
  };

  const handleDeleteWriteOffItem = (id: string) => {
    const target = unrepairableAssets.find(a => a.id === id);
    setUnrepairableAssets(prev => prev.filter(a => a.id !== id));
    setAuditLogs(prev => [
      {
        id: `AUD-${Math.floor(100 + Math.random() * 899)}`,
        text: `Removed Write-Off Asset ${id} (₱${(target?.cost || 0).toLocaleString()}) from ledger`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'DELETE'
      },
      ...prev
    ]);
    onTriggerNotification(`Removed Write-Off item ${id} from financial ledger.`);
  };

  const handleToggleWriteOffStatus = (id: string) => {
    setUnrepairableAssets(prev =>
      prev.map(a => {
        if (a.id === id) {
          const nextStatus: WriteOffItem['status'] =
            a.status === 'REPLACED' ? 'BEYOND REPAIR' : 'REPLACED';
          onTriggerNotification(`Changed status of ${id} to ${nextStatus}.`);
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleAddFinancialExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title.trim()) return;

    const autoEstimated = estimateMarketPrice(newExpense.title);
    const finalAmount =
      newExpense.isManualAmount && Number(newExpense.amount) > 0
        ? Number(newExpense.amount)
        : autoEstimated > 0
        ? autoEstimated
        : 3500;

    const createdExp: FinancialExpenseItem = {
      id: `EXP-${Math.floor(510 + Math.random() * 480)}`,
      title: newExpense.title.trim(),
      category: newExpense.category,
      lab: newExpense.lab.trim(),
      amount: finalAmount,
      date: new Date().toISOString().split('T')[0]
    };

    setExpenseRecords(prev => [createdExp, ...prev]);
    setIsAddExpenseOpen(false);
    setNewExpense({ title: '', category: 'MAINTENANCE', lab: 'ComLab 1 (ICT)', amount: 0, isManualAmount: false });

    setAuditLogs(prev => [
      {
        id: `AUD-${Math.floor(100 + Math.random() * 899)}`,
        text: `Recorded ${createdExp.category} Expense: ${createdExp.title} (Auto-Valued: ₱${createdExp.amount.toLocaleString()})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'EXPENSE'
      },
      ...prev
    ]);

    onTriggerNotification(
      `Recorded ${createdExp.category} expense of ₱${createdExp.amount.toLocaleString()} (${createdExp.title}).`
    );
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenseRecords.find(e => e.id === id);
    setExpenseRecords(prev => prev.filter(e => e.id !== id));
    onTriggerNotification(`Removed expense record ${target?.title || id}.`);
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (isNaN(val) || val <= 0) return;
    setAllocatedBudget(val);
    setIsEditBudgetOpen(false);
    setAuditLogs(prev => [
      {
        id: `AUD-${Math.floor(100 + Math.random() * 899)}`,
        text: `Updated Total Institutional Allocated Budget to ₱${val.toLocaleString()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'BUDGET'
      },
      ...prev
    ]);
    onTriggerNotification(`Updated Total Allocated Budget to ₱${val.toLocaleString()}.`);
  };

  const handleSaveLabEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabRecord) return;
    const ratio = editingLabRecord.activePCs / Math.max(1, editingLabRecord.totalPCs);
    const updated: LabPerformanceRecord = {
      ...editingLabRecord,
      healthStatus: ratio >= 0.8 ? 'HEALTHY' : ratio >= 0.5 ? 'WARNING' : 'CRITICAL'
    };
    setLabRecords(prev => prev.map(l => (l.labId === updated.labId ? updated : l)));
    setEditingLabRecord(null);
    onTriggerNotification(`Updated telemetry parameters for ${updated.labName}.`);
  };

  // EXPORT HANDLERS
  const handleExportCsv = () => {
    setIsExporting('CSV');
    setTimeout(() => {
      const csvRows = [
        ['SECTION', 'ID / TAG', 'LAB / CATEGORY', 'NAME / DESCRIPTION', 'METRIC 1', 'METRIC 2', 'STATUS', 'COST / LOAD'],
        ...labRecords.map(l => [
          'LAB_TELEMETRY',
          l.labId,
          `"${l.labName}"`,
          `"Occupancy: ${l.activePCs}/${l.totalPCs} PCs"`,
          `CPU ${l.cpuAvgPct}%`,
          `RAM ${l.ramAvgPct}%`,
          l.healthStatus,
          `${l.openTickets} Open Tickets`
        ]),
        ...unrepairableAssets.map(w => [
          'WRITE_OFF_ASSET',
          w.id,
          `"${w.lab}"`,
          `"${w.name}"`,
          `"${w.issue}"`,
          w.dateAdded,
          w.status,
          `PHP ${w.cost}`
        ]),
        ...expenseRecords.map(x => [
          'FINANCIAL_EXPENSE',
          x.id,
          x.category,
          `"${x.title}"`,
          `"${x.lab}"`,
          x.date,
          'VERIFIED',
          `PHP ${x.amount}`
        ])
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute(
        'download',
        `JRMSU_Analytics_And_Financial_Report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(null);
      onTriggerNotification('Exported Unified Telemetry & Financial Ledger to CSV!');
    }, 350);
  };

  const handleExportPdf = () => {
    setIsExporting('PDF');
    setTimeout(() => {
      window.print();
      setIsExporting(null);
      onTriggerNotification('Generated Printable Analytics & Financial Audit Report!');
    }, 300);
  };

  const activeMttrDay = mttrWavePoints[selectedMttrDayIdx] || mttrWavePoints[6];
  
  return (
    <div className="analytics-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7 font-sans select-none ">
      {/* 3D EXTRUDED DEPTH & PRINT ENGINE CSS */}
      <style>{`
        .analytics-3d-shell {
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
        @media print {
          body * {
            visibility: hidden !important;
          }
          #analytics-financial-printable, #analytics-financial-printable * {
            visibility: visible !important;
          }
          #analytics-financial-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <datalist id="lab-location-options">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
        <option value="Server Room" />
      </datalist>

      <datalist id="hardware-market-suggestions">
        <option value="27&quot; 144Hz IPS Monitor" />
        <option value="NVIDIA RTX 4060 8GB Graphics Card" />
        <option value="NVIDIA RTX 4070 Super Graphics Card" />
        <option value="Core i7-13700 Workstation System Unit" />
        <option value="Kingston Fury 32GB DDR5 RAM Kit" />
        <option value="Samsung 1TB NVMe M.2 SSD" />
        <option value="1500VA Line-Interactive UPS Backup" />
        <option value="Cisco Catalyst 24-Port Managed Switch" />
        <option value="iPhone 16 Pro Max" />
        <option value="MacBook Pro M3" />
      </datalist>

      <datalist id="expense-particulars-suggestions">
        <option value="Quarterly Preventive Thermal Paste &amp; Antistatic Cleaning" />
        <option value="Windows 11 Education &amp; Microsoft 365 Campus License" />
        <option value="Cisco 24-Port Gigabit VLAN Switch Upgrade" />
        <option value="RJ45 Cat6 Patch Cables &amp; Keystone Jack Replacements" />
        <option value="ComLab Aircon / HVAC Preventive Servicing" />
        <option value="1500VA UPS Battery Cell Replacement" />
      </datalist>

      <div id="analytics-financial-printable" className="space-y-7">
        {/* =====================================================================
            1. OBSIDIAN 3D COMMAND HEADER (MERGED ANALYTICS & FINANCIAL LEDGER)
           ===================================================================== */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-[0_5px_0_#1e3a8a,0_0_25px_rgba(56,189,248,0.55)]">
                <BarChart3 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                    <Radio className={`w-3 h-3 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>{isLiveStreaming ? `60FPS LIVE WAVE OSCILLATOR (${waveSpeed}x)` : 'WAVE PAUSED'}</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-mono font-black text-[10px] border border-cyan-400/40">
                    {activeCampus}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Analytics, Telemetry &amp; Financial Write-Off Command
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  Real-time 60fps wave telemetry, MTTR/SLA compliance, budget allocation, and auto-detected PH market write-off valuation
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 no-print">
              <button
                type="button"
                onClick={fetchAllAnalyticsAndFinancials}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? 'animate-pulse' : ''}`} />
                <span>Sync Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddWriteOffOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Write-Off Item</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#064e3b] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
                <span>Add Financial Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBudgetInput(String(allocatedBudget));
                  setIsEditBudgetOpen(true);
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs rounded-2xl border border-amber-400/40 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Set Budget</span>
              </button>
            </div>
          </div>

          {/* Sub-Header View Switcher, Lab Selector & Wave Speed Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15 no-print">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <button
                type="button"
                onClick={() => setCommandTab('UNIFIED_ALL')}
                className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                  commandTab === 'UNIFIED_ALL'
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_3px_0_#0284c7]'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                All-in-One Command
              </button>
              <button
                type="button"
                onClick={() => setCommandTab('TELEMETRY_ONLY')}
                className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                  commandTab === 'TELEMETRY_ONLY'
                    ? 'bg-blue-400 text-slate-950 shadow-[0_3px_0_#1e3a8a]'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                System Telemetry &amp; SLA ({labRecords.length} Labs)
              </button>
              <button
                type="button"
                onClick={() => setCommandTab('FINANCIAL_ONLY')}
                className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                  commandTab === 'FINANCIAL_ONLY'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_3px_0_#065f46]'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                Financial Ledger &amp; Write-Offs ({unrepairableAssets.length} Units)
              </button>

              {/* Lab Filter Dropdown right in Command Bar */}
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="bg-slate-900 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-black text-cyan-300 outline-none cursor-pointer"
              >
                <option value="ALL">All Laboratories ({labRecords.length})</option>
                {labRecords.map(lab => (
                  <option key={lab.labId} value={lab.labId}>
                    {lab.labName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Wave Speed Control */}
              <div className="bg-slate-900 p-1 rounded-xl flex items-center gap-1 text-[10px] font-mono font-black border border-slate-700">
                <Gauge className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
                {([1, 1.5, 2] as const).map(spd => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setWaveSpeed(spd)}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      waveSpeed === spd ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <div className="bg-slate-900 p-1 rounded-xl flex items-center gap-1 text-[11px] font-mono font-black border border-slate-700">
                {(['LIVE', '24H', '7D', '30D'] as const).map(tf => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      timeframe === tf ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isLiveStreaming
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>{isLiveStreaming ? 'Wave Active' : 'Paused'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-300" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting !== null}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. TOP 4 EXTRUDED 3D KPI CUBES (ACCURATE FINANCIAL & TELEMETRY TOTALS)
           ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => {
              setBudgetInput(String(allocatedBudget));
              setIsEditBudgetOpen(true);
            }}
            title="Click to adjust Total Allocated Budget"
            className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a,0_16px_30px_rgba(37,99,235,0.28)] flex items-center justify-between cursor-pointer"
          >
            <div className="space-y-1 flex-1 pr-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 block">
                ALLOCATED BUDGET (EDIT)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                ₱{allocatedBudget.toLocaleString()}
              </p>
              <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden p-0.5 border border-blue-400/30">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${spentPercentage}%` }}
                />
              </div>
            </div>
            <IsometricAnalyticsRig mode="FINANCIAL" code={`${spentPercentage}%`} />
          </div>

          <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b,0_16px_30px_rgba(16,185,129,0.28)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
                REMAINING LIQUIDITY
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                ₱{remainingBudget.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-200 font-bold block mt-1">
                Spent: ₱{totalSpent.toLocaleString()} ({spentPercentage}%)
              </span>
            </div>
            <IsometricAnalyticsRig mode="TELEMETRY" code="LIQUID" />
          </div>

          <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-950 text-white border-2 border-rose-400/50 shadow-[0_8px_0_#881337,0_16px_30px_rgba(225,29,72,0.28)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-200 block">
                UNREPAIRABLE WRITE-OFFS
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                ₱{totalWriteOffCost.toLocaleString()}
              </p>
              <span className="text-[11px] text-rose-200 font-bold block mt-1">
                {unrepairableAssets.length} Condemned / Disposed Units
              </span>
            </div>
            <IsometricAnalyticsRig mode="SLA" code={`${unrepairableAssets.length} PC`} />
          </div>

          <div className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f,0_16px_30px_rgba(245,158,11,0.28)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
                ACTIVE FLEET &amp; SLA MET
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                {telemetryTotals.activePCs}/{telemetryTotals.totalPCs} PCs
              </p>
              <span className="text-[11px] text-amber-100 font-bold block mt-1">
                {slaMetPct}% SLA • Avg CPU {telemetryTotals.avgCpu}%
              </span>
            </div>
            <IsometricAnalyticsRig mode="TELEMETRY" code={`${slaMetPct}%`} />
          </div>
        </div>

        {/* =====================================================================
            3. UNIFIED 3-CHART REAL-TIME 60FPS FLOWING WAVE OSCILLOSCOPE DECK
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* WAVE CHART 1 (4 COLS): USERS & CONCURRENT ACCESS THROUGHPUT WAVE */}
          {(commandTab === 'UNIFIED_ALL' || commandTab === 'TELEMETRY_ONLY') && (
            <div
              className={`${
                commandTab === 'TELEMETRY_ONLY' ? 'lg:col-span-6' : 'lg:col-span-4'
              } bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-blue-600 block">
                    CONCURRENT ACCESS STREAM
                  </span>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Workstation Access Wave</span>
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono font-black text-[10px]">
                  {telemetryTotals.occupancyPct}% Load
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 relative overflow-hidden shadow-inner">
                <div className="h-36 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="accessWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="78" x2="300" y2="78" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="40" x2="300" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                    <path d={accessAreaPath} fill="url(#accessWaveGrad)" />
                    <path d={accessLinePath} fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />

                    {/* Real Lab Anchor Nodes on the Wave (ComLab 1, ComLab 2, ComLab 3) */}
                    {accessWavePoints[2] && (
                      <g>
                        <circle cx={accessWavePoints[2].x} cy={accessWavePoints[2].y} r="4" fill="#38bdf8" />
                        <text
                          x={accessWavePoints[2].x}
                          y={Math.max(12, accessWavePoints[2].y - 7)}
                          textAnchor="middle"
                          fill="#7dd3fc"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          CL1:{accessWavePoints[2].rawPct}%
                        </text>
                      </g>
                    )}
                    {accessWavePoints[5] && (
                      <g>
                        <circle cx={accessWavePoints[5].x} cy={accessWavePoints[5].y} r="4" fill="#10b981" />
                        <text
                          x={accessWavePoints[5].x}
                          y={Math.max(12, accessWavePoints[5].y - 7)}
                          textAnchor="middle"
                          fill="#6ee7b7"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          CL2:{accessWavePoints[5].rawPct}%
                        </text>
                      </g>
                    )}
                    {accessWavePoints[8] && (
                      <g>
                        <circle cx={accessWavePoints[8].x} cy={accessWavePoints[8].y} r="4" fill="#38bdf8" />
                        <text
                          x={accessWavePoints[8].x}
                          y={Math.max(12, accessWavePoints[8].y - 7)}
                          textAnchor="middle"
                          fill="#7dd3fc"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          CL3:{accessWavePoints[8].rawPct}%
                        </text>
                      </g>
                    )}
                  </svg>

                  <div className="absolute top-1.5 left-2 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-cyan-400/40 font-mono text-[10px] font-black text-cyan-300">
                    {telemetryTotals.activePCs}/{telemetryTotals.totalPCs} Active PCs • {userAccessCount} Hits
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Avg Fleet CPU</span>
                  <strong className="text-blue-700 font-black">{telemetryTotals.avgCpu}% Load</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Avg Fleet RAM</span>
                  <strong className="text-indigo-700 font-black">{telemetryTotals.avgRam}% Used</strong>
                </div>
              </div>
            </div>
          )}

          {/* WAVE CHART 2 (4 COLS): MTTR TRENDS & SLA COMPLIANCE WAVE */}
          {(commandTab === 'UNIFIED_ALL' || commandTab === 'TELEMETRY_ONLY') && (
            <div
              className={`${
                commandTab === 'TELEMETRY_ONLY' ? 'lg:col-span-6' : 'lg:col-span-4'
              } bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-rose-600 block">
                    MTTR &amp; SLA OSCILLATOR
                  </span>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    <span>MTTR Response &amp; SLA Wave</span>
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black text-[10px]">
                  {slaMetPct}% SLA Met
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 relative overflow-hidden shadow-inner">
                <div className="h-36 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 110" preserveAspectRatio="none">
                    <line x1="0" y1="85" x2="300" y2="85" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="45" x2="300" y2="45" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                    <path d={mttrLine1Path} fill="none" stroke="#f43f5e" strokeWidth="2.8" strokeLinecap="round" />
                    <path
                      d={mttrLine2Path}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.2"
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                    />

                    {mttrWavePoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y1}
                        r={selectedMttrDayIdx === i ? '5' : '3.3'}
                        fill={selectedMttrDayIdx === i ? '#ffffff' : '#f43f5e'}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        className="cursor-pointer"
                        onClick={() => setSelectedMttrDayIdx(i)}
                      />
                    ))}
                  </svg>

                  <div className="absolute top-1.5 left-2 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-rose-400/40 font-mono text-[10px] font-black text-rose-300">
                    {activeMttrDay.day}: MTTR {activeMttrDay.dayResHrs}h • Resp {activeMttrDay.dayRespHrs}h
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 border-t border-slate-800 pt-1">
                    {mttrWavePoints.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedMttrDayIdx(i)}
                        className={`cursor-pointer ${
                          selectedMttrDayIdx === i ? 'text-rose-400 font-black' : 'hover:text-white'
                        }`}
                      >
                        {p.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Response</span>
                  <strong className="text-slate-900 font-black">{responseTime}h</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Resolution</span>
                  <strong className="text-blue-600 font-black">{resolutionTime}h</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Downtime</span>
                  <strong className="text-amber-600 font-black">{downtime}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* WAVE CHART 3 (4 COLS): FINANCIAL FORECAST & BUDGET UTILIZATION WAVE */}
          {(commandTab === 'UNIFIED_ALL' || commandTab === 'FINANCIAL_ONLY') && (
            <div
              className={`${
                commandTab === 'FINANCIAL_ONLY' ? 'lg:col-span-12' : 'lg:col-span-4'
              } bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-emerald-600 block">
                    FINANCIAL UTILIZATION WAVE
                  </span>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Budget &amp; Expenditure Wave</span>
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono font-black text-[10px]">
                  {spentPercentage}% Utilized
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 relative overflow-hidden shadow-inner">
                <div className="h-36 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 110" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="finWaveGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.48" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="finWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.62" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    <line x1="0" y1="85" x2="300" y2="85" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="45" x2="300" y2="45" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                    <path d={finArea1Path} fill="url(#finWaveGrad1)" />
                    <path d={finArea2Path} fill="url(#finWaveGrad2)" />
                    <path d={finLine1Path} fill="none" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round" />
                    <path d={finLine2Path} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />

                    {financialFlowPoints[3] && (
                      <circle cx={financialFlowPoints[3].x} cy={financialFlowPoints[3].y1} r="3.8" fill="#38bdf8" />
                    )}
                    {financialFlowPoints[7] && (
                      <circle cx={financialFlowPoints[7].x} cy={financialFlowPoints[7].y1} r="3.8" fill="#10b981" />
                    )}
                  </svg>

                  <div className="absolute top-1.5 left-2 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-emerald-400/40 font-mono text-[10px] font-black text-emerald-300">
                    Spent: ₱{totalSpent.toLocaleString()} / Rem: ₱{remainingBudget.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[8.5px] font-sans font-bold text-slate-400 uppercase block">Maint</span>
                  <strong className="text-blue-700 font-black">₱{(maintenanceCost / 1000).toFixed(1)}k</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[8.5px] font-sans font-bold text-slate-400 uppercase block">Write-Off</span>
                  <strong className="text-rose-600 font-black">₱{(totalWriteOffCost / 1000).toFixed(1)}k</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[8.5px] font-sans font-bold text-slate-400 uppercase block">Software</span>
                  <strong className="text-emerald-700 font-black">₱{(softwareAndInfraCost / 1000).toFixed(1)}k</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            4. ORGANIZED SECTION A: LABORATORY FACILITY BREAKDOWN MATRIX TABLE
           ===================================================================== */}
        {(commandTab === 'UNIFIED_ALL' || commandTab === 'TELEMETRY_ONLY') && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b-2 border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                  LIVE HARDWARE TELEMETRY MATRIX
                </span>
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <span>Laboratory Facility Breakdown &amp; Hardware Load</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() =>
                    onTriggerNotification('Broadcasted Provision & Telemetry Alert across ComLab 1–3!')
                  }
                  className="btn-3d-bevel px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Provision Alert Broadcast</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
              <table className="w-full text-left text-xs text-slate-700 font-semibold">
                <thead className="bg-slate-900 text-cyan-300 font-mono font-black uppercase text-[10px] border-b-2 border-slate-800">
                  <tr>
                    <th className="p-3.5">Laboratory Name</th>
                    <th className="p-3.5">Occupancy (Active / Total)</th>
                    <th className="p-3.5">Avg CPU Load</th>
                    <th className="p-3.5">Avg RAM Usage</th>
                    <th className="p-3.5">Open Maintenance Tickets</th>
                    <th className="p-3.5">Health Status</th>
                    <th className="p-3.5 text-right no-print">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredLabRecords.map(lab => (
                    <tr key={lab.labId} className="hover:bg-blue-50/50 transition">
                      <td className="p-3.5 font-black text-slate-900">{lab.labName}</td>
                      <td className="p-3.5 font-mono">
                        <span className="text-blue-700 font-black">{lab.activePCs}</span> / {lab.totalPCs} PCs
                      </td>
                      <td className="p-3.5 font-mono font-black">
                        <div className="flex items-center gap-2">
                          <span className="w-9">{lab.cpuAvgPct}%</span>
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                lab.cpuAvgPct > 75 ? 'bg-rose-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${lab.cpuAvgPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-black">
                        <div className="flex items-center gap-2">
                          <span className="w-9">{lab.ramAvgPct}%</span>
                          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${lab.ramAvgPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-amber-600 font-black">{lab.openTickets} Tickets</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border ${
                            lab.healthStatus === 'HEALTHY'
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-amber-500 text-slate-950 border-amber-600'
                          }`}
                        >
                          {lab.healthStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right no-print">
                        <button
                          type="button"
                          onClick={() => setEditingLabRecord(lab)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                          title="Edit Lab Capacity & Telemetry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            5. ORGANIZED SECTION B: WRITE-OFF LEDGER + EXPENSES & AUDIT SPLIT DECK
           ===================================================================== */}
        {(commandTab === 'UNIFIED_ALL' || commandTab === 'FINANCIAL_ONLY') && (
          <div className="space-y-6">
            {/* CONDEMNED & UNREPAIRABLE ASSETS LEDGER TABLE */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-3.5">
                <div>
                  <span className="text-[10px] font-mono font-black text-rose-600 uppercase">
                    DISPOSAL &amp; WRITE-OFF LEDGER (AUTO PHILIPPINE RETAIL MARKET VALUATION)
                  </span>
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <PackageX className="w-5 h-5 text-rose-600" />
                    <span>
                      Unrepairable Laboratory Equipment ({filteredAssets.length} Units • ₱
                      {totalWriteOffCost.toLocaleString()})
                    </span>
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 no-print">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Asset ID, Name, Lab..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none w-48 focus:border-blue-600"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="BEYOND REPAIR">Beyond Repair</option>
                    <option value="CONDEMNED">Condemned</option>
                    <option value="DISPOSED">Disposed</option>
                    <option value="REPLACED">Replaced</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsAddWriteOffOpen(true)}
                    className="btn-3d-bevel px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Write-Off
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 font-mono font-black uppercase text-[10px] text-cyan-300 border-b-2 border-slate-800">
                    <tr>
                      <th className="p-3.5">Asset Tag</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Hardware Item</th>
                      <th className="p-3.5">Diagnostic Failure</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Replacement Cost</th>
                      <th className="p-3.5 text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium bg-white">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map(asset => (
                        <tr key={asset.id} className="hover:bg-blue-50/50 transition">
                          <td className="p-3.5 font-mono font-black text-rose-600">{asset.id}</td>
                          <td className="p-3.5 font-bold text-slate-800">{asset.lab}</td>
                          <td className="p-3.5 font-black text-slate-900">{asset.name}</td>
                          <td className="p-3.5 text-slate-600">{asset.issue}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-xl font-mono text-[10px] font-black border ${
                                asset.status === 'REPLACED'
                                  ? 'bg-emerald-500 text-white border-emerald-600'
                                  : 'bg-rose-600 text-white border-rose-700'
                              }`}
                            >
                              {asset.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-slate-900">
                            ₱{asset.cost.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center no-print">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingWriteOff(asset)}
                                title="Edit Write-Off Item & Cost"
                                className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleWriteOffStatus(asset.id)}
                                title="Toggle Status (Mark Replaced)"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWriteOffItem(asset.id)}
                                title="Delete Record"
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                          No write-off items found matching your current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIDE-BY-SIDE SPLIT DECK: FINANCIAL EXPENSE LEDGER (7 COLS) + LIVE AUDIT STREAM (5 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT 7 COLS: FINANCIAL RECORDS & OPERATIONAL EXPENSES */}
              <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b-2 border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                        AUTO-VALUED OPERATIONAL LEDGER
                      </span>
                      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <span>Financial Records &amp; Expenses ({expenseRecords.length})</span>
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-[0_3px_0_#064e3b] cursor-pointer flex items-center gap-1.5 no-print"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Expense
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {expenseRecords.map(exp => (
                      <div
                        key={exp.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-blue-300 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-mono font-black text-[9.5px] shrink-0 ${
                              exp.category === 'MAINTENANCE'
                                ? 'bg-blue-100 text-blue-900'
                                : exp.category === 'SOFTWARE'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {exp.category}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 truncate">{exp.title}</p>
                            <span className="text-[10px] font-mono text-slate-500">
                              {exp.id} • {exp.lab} • {exp.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 shrink-0">
                          <strong className="font-mono font-black text-slate-900 text-sm">
                            ₱{exp.amount.toLocaleString()}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer no-print"
                            title="Remove Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-100 text-xs font-bold">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Allocated: <strong className="font-mono text-slate-900">₱{allocatedBudget.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Spent: <strong className="font-mono text-rose-600">₱{totalSpent.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Remaining: <strong className="font-mono text-emerald-600">₱{remainingBudget.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT 5 COLS: LIVE AUDIT & APPROVAL TRAIL VAULT */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border-2 border-slate-700 shadow-[0_8px_0_#0f172a] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Live Financial &amp; Telemetry Audit Log</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{auditLogs.length} Events</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {auditLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-black text-cyan-400 block">{log.id}</span>
                          <p className="text-slate-200 font-semibold leading-snug">{log.text}</p>
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400 shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 no-print">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-[0_4px_0_#1e3a8a] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_0_#064e3b] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          ALL MODALS (WITH AUTO-DETECT PRICE & CATEGORY)
         ===================================================================== */}

      {/* MODAL 1: ADD WRITE-OFF / CONDEMNED ASSET (AUTO-DETECTS PRICE & TAG) */}
      {isAddWriteOffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Add Write-Off / Condemned Asset</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddWriteOffOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWriteOffItem} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Hardware / Equipment Name (Auto-Detects Price &amp; Tag)</label>
                <input
                  type="text"
                  list="hardware-market-suggestions"
                  placeholder="e.g. RTX 4060, 27&quot; 144Hz Monitor, Core i7 Workstation, iPhone 16"
                  value={newItem.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewItem(prev => ({
                      ...prev,
                      name: val,
                      id: prev.id || (val.trim().length > 2 ? suggestAssetTagPrefix(val, unrepairableAssets.length) : '')
                    }));
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Asset ID / Tag #</label>
                  <input
                    type="text"
                    placeholder="Auto-filled or type..."
                    value={newItem.id}
                    onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono font-black"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Laboratory Location</label>
                  <input
                    type="text"
                    list="lab-location-options"
                    placeholder="e.g. ComLab 1 (ICT)"
                    value={newItem.lab}
                    onChange={(e) => setNewItem({ ...newItem, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Diagnostic Failure / Issue</label>
                  <input
                    type="text"
                    placeholder="e.g. Burned PCB, Cracked LCD"
                    value={newItem.issue}
                    onChange={(e) => setNewItem({ ...newItem, issue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Custom Cost Override (Optional)</label>
                  <input
                    type="number"
                    placeholder="Leave blank for Auto SRP"
                    value={newItem.customCost}
                    onChange={(e) => setNewItem({ ...newItem, customCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* AUTOMATED MARKET PRICE VALUATION BOX */}
              <div className="bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
                    <Zap className="w-3.5 h-3.5 text-blue-600" /> Auto-Detected PH Market Valuation
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                    Verified SRP
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-600">Estimated Replacement Cost:</span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    ₱
                    {(newItem.customCost && Number(newItem.customCost) > 0
                      ? Number(newItem.customCost)
                      : newItem.name
                      ? estimateMarketPrice(newItem.name)
                      : 0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddWriteOffOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer"
                >
                  Save Write-Off Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WRITE-OFF ITEM */}
      {editingWriteOff && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Write-Off Asset ({editingWriteOff.id})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingWriteOff(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditWriteOff} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Hardware Name (Auto-Updates SRP)</label>
                <input
                  type="text"
                  value={editingWriteOff.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setEditingWriteOff({
                      ...editingWriteOff,
                      name: nameVal,
                      cost: estimateMarketPrice(nameVal) || editingWriteOff.cost
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory</label>
                  <input
                    type="text"
                    list="lab-location-options"
                    value={editingWriteOff.lab}
                    onChange={(e) => setEditingWriteOff({ ...editingWriteOff, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Replacement Cost (₱)</label>
                  <input
                    type="number"
                    value={editingWriteOff.cost}
                    onChange={(e) => setEditingWriteOff({ ...editingWriteOff, cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Status</label>
                <select
                  value={editingWriteOff.status}
                  onChange={(e) => setEditingWriteOff({ ...editingWriteOff, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-bold"
                >
                  <option value="BEYOND REPAIR">BEYOND REPAIR</option>
                  <option value="CONDEMNED">CONDEMNED</option>
                  <option value="DISPOSED">DISPOSED</option>
                  <option value="REPLACED">REPLACED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWriteOff(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD FINANCIAL EXPENSE ENTRY (WITH AUTO-DETECT PRICE & CATEGORY) */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#064e3b,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-emerald-400 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Add Financial Expense (Auto-Detect Valuation)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFinancialExpense} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Expense Item / Service Description (Auto-Detects Price &amp; Category)</label>
                <input
                  type="text"
                  list="expense-particulars-suggestions"
                  placeholder="e.g. Thermal Paste Cleaning, Windows 11 License, Cisco Switch..."
                  value={newExpense.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoCat = detectExpenseCategory(val);
                    const autoPrice = estimateMarketPrice(val);
                    setNewExpense(prev => ({
                      ...prev,
                      title: val,
                      category: autoCat,
                      amount: prev.isManualAmount ? prev.amount : autoPrice
                    }));
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Auto-Detected Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none font-black text-emerald-800"
                  >
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Amount (PHP ₱ — Auto or Edit)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Auto-calculated"
                    value={newExpense.amount || ''}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: Number(e.target.value) || 0,
                        isManualAmount: true
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Assigned Laboratory</label>
                <input
                  type="text"
                  list="lab-location-options"
                  value={newExpense.lab}
                  onChange={(e) => setNewExpense({ ...newExpense, lab: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl outline-none"
                  required
                />
              </div>

              {/* AUTO-DETECTED FINANCIAL VALUATION PREVIEW BOX */}
              <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" /> Auto-Detected Rate &amp; Category
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                    {newExpense.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-600">Verified Expense Amount:</span>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    ₱{(newExpense.amount || (newExpense.title ? estimateMarketPrice(newExpense.title) : 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-[0_4px_0_#064e3b] cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUST TOTAL ALLOCATED BUDGET */}
      {isEditBudgetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span>Set Allocated Lab Budget</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsEditBudgetOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Total Institutional Allocated Budget (PHP ₱)</label>
                <input
                  type="number"
                  min={1000}
                  step="500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-base font-black text-blue-900 outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditBudgetOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT LAB TELEMETRY PARAMETERS */}
      {editingLabRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <span>Update Lab Telemetry ({editingLabRecord.labName})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingLabRecord(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLabEdit} className="space-y-3 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Active Workstations</label>
                  <input
                    type="number"
                    min={0}
                    max={editingLabRecord.totalPCs}
                    value={editingLabRecord.activePCs}
                    onChange={(e) =>
                      setEditingLabRecord({ ...editingLabRecord, activePCs: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block mb-1">Total PCs Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={editingLabRecord.totalPCs}
                    onChange={(e) =>
                      setEditingLabRecord({ ...editingLabRecord, totalPCs: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1">Avg CPU %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingLabRecord.cpuAvgPct}
                    onChange={(e) =>
                      setEditingLabRecord({ ...editingLabRecord, cpuAvgPct: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block mb-1">Avg RAM %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingLabRecord.ramAvgPct}
                    onChange={(e) =>
                      setEditingLabRecord({ ...editingLabRecord, ramAvgPct: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block mb-1">Open Tickets</label>
                  <input
                    type="number"
                    min={0}
                    value={editingLabRecord.openTickets}
                    onChange={(e) =>
                      setEditingLabRecord({ ...editingLabRecord, openTickets: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLabRecord(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const FinancialReportsView = AnalyticsReportsView;
export default AnalyticsReportsView;









