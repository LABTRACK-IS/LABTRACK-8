import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Monitor, Wifi, Activity, TrendingUp, TrendingDown,
  ChevronDown, Plus, RefreshCw, Clock, MapPin,
  CheckCircle2, Wrench, BookOpen, Search, Filter,
  Calendar, Download, Layers, UserCheck
} from 'lucide-react';

export interface OverviewViewProps {
  instructorName?: string;
  selectedCampus?: string;
  liveClock?: string;
  myClasses?: any[];
  labAvailability?: any[];
  reservations?: any[];
  myRequests?: any[];
  [key: string]: any;
}

interface LabResourceItem {
  id: string;
  dbId?: string;
  code: string;
  name: string;
  location: string;
  category: string;
  status: 'Optimal' | 'Maintenance' | 'In Use';
}

const GENERIC_PLACEHOLDERS = new Set([
  'faculty instructor',
  'instructor',
  'faculty',
  'teacher',
  'user',
  'admin',
  'administrator',
  'staff'
]);

const resolveLoggedInInstructor = (propName?: string): { name: string; userKey: string; hasPriorLogin: boolean } => {
  let detectedName = '';
  let userKey = '';
  let hasPriorLogin = false;

  const isValidPersonalName = (val?: any): boolean => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    return trimmed.length > 1 && !GENERIC_PLACEHOLDERS.has(trimmed.toLowerCase());
  };

  const formatCleanName = (raw: string): string => {
    return raw
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const extractFromUserObj = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return '';
    const target = obj.user || obj.state?.user || obj.data?.user || obj.data || obj;
    if (!target || typeof target !== 'object') return '';

    const first = target.firstName || target.FirstName || target.given_name || '';
    const last = target.lastName || target.LastName || target.family_name || '';
    const combined = `${first} ${last}`.trim();

    const candidates = [
      target.fullName,
      target.FullName,
      target.displayName,
      target.DisplayName,
      combined,
      target.name,
      target.Name,
      target.username,
      target.Username,
      typeof target.email === 'string' ? target.email.split('@')[0] : '',
      typeof target.Email === 'string' ? target.Email.split('@')[0] : ''
    ];

    for (const c of candidates) {
      if (isValidPersonalName(c)) {
        userKey = String(target.id || target.Id || target.email || target.Email || c).toLowerCase();
        if (target.lastLoginAt || target.lastLoginUtc || target.LastLoginUtc || (Number(target.loginCount) || 0) > 1) {
          hasPriorLogin = true;
        }
        return formatCleanName(String(c));
      }
    }
    return '';
  };

  // 1. Check propName first if passed from PortalShell
  if (isValidPersonalName(propName)) {
    detectedName = formatCleanName(String(propName));
  }

  // 2. Scan sessionStorage and localStorage keys
  if (!detectedName) {
    const priorityKeys = ['labtrack_user', 'auth-storage', 'user', 'labtrack_auth', 'currentUser'];
    for (const key of priorityKeys) {
      try {
        const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const found = extractFromUserObj(parsed);
        if (found) {
          detectedName = found;
          break;
        }
      } catch {}
    }
  }

  // 3. Scan all remaining storage keys
  if (!detectedName) {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (!k) continue;
          const raw = storage.getItem(k);
          if (!raw || !raw.startsWith('{')) continue;
          const parsed = JSON.parse(raw);
          const found = extractFromUserObj(parsed);
          if (found) {
            detectedName = found;
            break;
          }
        }
        if (detectedName) break;
      } catch {}
    }
  }

  // 4. Decode JWT token if present
  if (!detectedName) {
    const tokenKeys = ['labtrack_token', 'token', 'accessToken'];
    for (const tk of tokenKeys) {
      try {
        const token = sessionStorage.getItem(tk) || localStorage.getItem(tk);
        if (!token || !token.includes('.')) continue;
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const jwtFirstLast = `${payload.given_name || payload.firstName || ''} ${payload.family_name || payload.lastName || ''}`.trim();
        const claims = [
          payload.fullName,
          payload.name,
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
          jwtFirstLast,
          payload.unique_name,
          typeof payload.email === 'string' ? payload.email.split('@')[0] : '',
          typeof payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] === 'string'
            ? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'].split('@')[0]
            : ''
        ];
        for (const c of claims) {
          if (isValidPersonalName(c)) {
            detectedName = formatCleanName(String(c));
            if (!userKey) userKey = String(payload.sub || payload.email || detectedName).toLowerCase();
            break;
          }
        }
        if (detectedName) break;
      } catch {}
    }
  }

  if (!detectedName) {
    detectedName = 'John Sven Morales';
  }
  if (!userKey) {
    userKey = detectedName.toLowerCase();
  }

  return { name: detectedName, userKey, hasPriorLogin };
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  instructorName = '',
  selectedCampus = 'JRMSU Dapitan Main Campus',
  liveClock: initialLiveClock,
  myClasses = [],
  reservations = [],
  myRequests = []
}) => {
  // Dynamic Instructor Identity & First-Time ("Welcome") vs Returning ("Welcome back")
  const { resolvedInstructorName, isReturningUser } = useMemo(() => {
    const { name, userKey, hasPriorLogin } = resolveLoggedInInstructor(instructorName);

    const seenKey = `labtrack_seen_instructor_${userKey}`;
    const sessionKey = `labtrack_session_instructor_${userKey}`;
    let returning = hasPriorLogin;

    try {
      const sessionVal = sessionStorage.getItem(sessionKey);
      const seenVal = localStorage.getItem(seenKey);
      if (sessionVal) {
        returning = sessionVal === 'returning';
      } else if (seenVal === 'true' || hasPriorLogin) {
        returning = true;
        sessionStorage.setItem(sessionKey, 'returning');
      } else {
        returning = false;
        sessionStorage.setItem(sessionKey, 'first_time');
        localStorage.setItem(seenKey, 'true');
      }
    } catch {}

    return { resolvedInstructorName: name, isReturningUser: returning };
  }, [instructorName]);

  // Organized Two-Part Typewriter Text: Base Greeting + Highlighted Logged-In Name
  const greetingPrefix = isReturningUser ? 'Welcome back' : 'Welcome';
  const baseGreetingText = `${greetingPrefix}, Instructor `;
  const appendedUserName = resolvedInstructorName.toUpperCase();
  const fullWelcomeText = `${baseGreetingText}${appendedUserName}`;

  const [charIndex, setCharIndex] = useState(fullWelcomeText.length);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCharIndex(0);
    setIsDeleting(false);
  }, [fullWelcomeText]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isDeleting && charIndex < fullWelcomeText.length) {
      timer = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, 38);
    } else if (!isDeleting && charIndex === fullWelcomeText.length) {
      timer = setTimeout(() => setIsDeleting(true), 3200);
    } else if (isDeleting && charIndex > 0) {
      timer = setTimeout(() => {
        setCharIndex((prev) => prev - 1);
      }, 20);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, fullWelcomeText]);

  const typedBasePart = fullWelcomeText.slice(0, Math.min(charIndex, baseGreetingText.length));
  const typedNamePart =
    charIndex > baseGreetingText.length
      ? fullWelcomeText.slice(baseGreetingText.length, charIndex)
      : '';

  // Filter & Timeframe States
  const [barTimeframe, setBarTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [reportTimeframe, setReportTimeframe] = useState<'Monthly' | 'Weekly'>('Monthly');
  const [pieTimeframe, setPieTimeframe] = useState('This Month');
  const [hoveredBarIdx, setHoveredBarIdx] = useState(3);
  const [hoveredPoint, setHoveredPoint] = useState(6);
  const [hoveredPieSegment, setHoveredPieSegment] = useState<string | null>(null);
  const [selectedLabFilter, setSelectedLabFilter] = useState('ALL');

  // Table Search and Status Filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('All');
  const [actionToast, setActionToast] = useState('');

  // Fast & Smooth Real-Time Telemetry Engine (380ms fluid phase step)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [clock, setClock] = useState(initialLiveClock || new Date().toLocaleTimeString());
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAutoRefreshing) return;
    const interval = setInterval(() => {
      setLiveTick((t) => (t + 1) % 720);
    }, 380);
    return () => clearInterval(interval);
  }, [isAutoRefreshing]);

  // LabTrack Inventory State (ComLab 1, ComLab 2, ComLab 3 with descriptive text preserved)
  const [resourceList, setResourceList] = useState<LabResourceItem[]>([
    { id: '1', code: '#PC-101', name: 'High-End AI Workstation', location: 'ComLab 1 (Networking)', category: 'Core i7 / RTX 3060', status: 'Optimal' },
    { id: '2', code: '#NET-204', name: 'Cisco Managed Switch 24-Port', location: 'ComLab 2 (Software Eng)', category: 'Network Hardware', status: 'Optimal' },
    { id: '3', code: '#PC-309', name: 'Multimedia Editing Rig', location: 'ComLab 3 (AI & Multimedia)', category: 'Ryzen 7 / 32GB RAM', status: 'Maintenance' },
    { id: '4', code: '#SRV-201', name: 'Laboratory Local Server Host', location: 'ComLab 2 (Software Eng)', category: 'Server Node', status: 'In Use' },
    { id: '5', code: '#PC-108', name: 'Development Node Alpha', location: 'ComLab 1 (Networking)', category: 'Core i5 / 16GB RAM', status: 'Optimal' },
    { id: '6', code: '#PC-312', name: '3D Rendering Workstation', location: 'ComLab 3 (AI & Multimedia)', category: 'RTX 4080 / 64GB RAM', status: 'In Use' },
  ]);

  // Add Resource Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('ComLab 1 (Networking)');
  const [newItemCategory, setNewItemCategory] = useState('Workstation PC');
  const [newItemStatus, setNewItemStatus] = useState<'Optimal' | 'Maintenance' | 'In Use'>('Optimal');

  // Edit Resource State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState<'Optimal' | 'Maintenance' | 'In Use'>('Optimal');

  const showToast = (msg: string) => {
    setActionToast(msg);
    window.setTimeout(() => setActionToast(''), 3200);
  };

  const normalizeLabWithSubtitle = (rawLoc: string, idx: number): string => {
    const str = String(rawLoc || '');
    if (str.includes('1')) return 'ComLab 1 (Networking)';
    if (str.includes('2')) return 'ComLab 2 (Software Eng)';
    if (str.includes('3')) return 'ComLab 3 (AI & Multimedia)';
    const defaults = [
      'ComLab 1 (Networking)',
      'ComLab 2 (Software Eng)',
      'ComLab 3 (AI & Multimedia)'
    ];
    return defaults[idx % 3];
  };

  // Auto-Fetch & 15s Polling from Backend
  const fetchResourcesFromApi = useCallback(async () => {
    try {
      const wsResp = await apiClient.get('/api/v1/workstations').catch(() => null);
      const raw = wsResp?.data?.data?.items || wsResp?.data?.data || wsResp?.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: LabResourceItem[] = raw.map((w: any, idx: number) => {
          const codeStr = w.code || w.workstationNumber || `#PC-${101 + idx}`;
          const stRaw = String(w.status || '').toUpperCase();
          const st: LabResourceItem['status'] = stRaw.includes('MAINT')
            ? 'Maintenance'
            : stRaw.includes('USE') || stRaw.includes('OCCUP') || stRaw.includes('ACTIVE')
            ? 'In Use'
            : 'Optimal';

          return {
            id: String(w.id || codeStr),
            dbId: w.id,
            code: codeStr.startsWith('#') ? codeStr : `#${codeStr}`,
            name: w.name || `Workstation ${codeStr}`,
            location: normalizeLabWithSubtitle(w.laboratoryName || w.lab || w.location || '', idx),
            category: w.osVersion || w.cpuModel || 'Workstation PC',
            status: st
          };
        });
        setResourceList(mapped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchResourcesFromApi();
    const poll = setInterval(fetchResourcesFromApi, 15000);
    return () => clearInterval(poll);
  }, [fetchResourcesFromApi]);

  // DYNAMIC RESOURCE ALLOCATION MATH (COMLAB 1, COMLAB 2, COMLAB 3)
  const labDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'ComLab 1': 0,
      'ComLab 2': 0,
      'ComLab 3': 0,
    };

    resourceList.forEach((r) => {
      if (r.location.includes('ComLab 1')) counts['ComLab 1']++;
      else if (r.location.includes('ComLab 2')) counts['ComLab 2']++;
      else counts['ComLab 3']++;
    });

    const total = resourceList.length || 1;
    const p1 = Math.round((counts['ComLab 1'] / total) * 100);
    const p2 = Math.round((counts['ComLab 2'] / total) * 100);
    const p3 = Math.max(0, 100 - (p1 + p2));

    return { p1, p2, p3, counts, total };
  }, [resourceList]);

  // CRUD Handlers
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const code = `#DEV-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: LabResourceItem = {
      id: Date.now().toString(),
      code,
      name: newItemName.trim(),
      location: newItemLocation,
      category: newItemCategory.trim() || 'Workstation PC',
      status: newItemStatus,
    };

    setResourceList((prev) => [newItem, ...prev]);
    setNewItemName('');
    setIsAddingItem(false);
    showToast(`Added ${newItem.name} (${code}) to ${newItemLocation}.`);

    try {
      await apiClient.post('/api/v1/workstations', {
        laboratoryName: newItemLocation,
        code: code.replace('#', ''),
        name: newItem.name,
        status: newItemStatus === 'Maintenance' ? 'UNDER_MAINTENANCE' : newItemStatus === 'In Use' ? 'In Use' : 'Available',
        osVersion: newItem.category
      });
      fetchResourcesFromApi();
    } catch {}
  };

  const handleStartEdit = (item: LabResourceItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditLocation(item.location);
    setEditCategory(item.category);
    setEditStatus(item.status);
  };

  const handleSaveEdit = async (id: string) => {
    const target = resourceList.find((r) => r.id === id);
    setResourceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: editName.trim() || item.name,
              location: editLocation,
              category: editCategory.trim() || item.category,
              status: editStatus,
            }
          : item
      )
    );
    setEditingId(null);
    showToast(`Updated ${target?.code || 'equipment'} details.`);

    if (target?.dbId) {
      try {
        await apiClient.put(`/api/v1/workstations/${target.dbId}`, {
          code: target.code.replace('#', ''),
          name: editName.trim() || target.name,
          status: editStatus === 'Maintenance' ? 'UNDER_MAINTENANCE' : editStatus === 'In Use' ? 'In Use' : 'Available',
          osVersion: editCategory.trim() || target.category
        });
      } catch {}
    }
  };

  const handleQuickStatusToggle = async (item: LabResourceItem) => {
    const nextStatus: LabResourceItem['status'] =
      item.status === 'Optimal' ? 'In Use' : item.status === 'In Use' ? 'Maintenance' : 'Optimal';

    setResourceList((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: nextStatus } : r))
    );
    showToast(`${item.code} status changed to ${nextStatus}.`);

    if (item.dbId) {
      try {
        const backendStatus =
          nextStatus === 'Maintenance' ? 'UNDER_MAINTENANCE' : nextStatus === 'In Use' ? 'In Use' : 'Available';
        await apiClient.patch(`/api/v1/workstations/${item.dbId}/status`, { status: backendStatus });
      } catch {}
    }
  };

  const handleDeleteResource = async (id: string) => {
    const target = resourceList.find((r) => r.id === id);
    setResourceList((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed ${target?.name || 'equipment'} from inventory.`);

    if (target?.dbId) {
      try {
        await apiClient.delete(`/api/v1/workstations/${target.dbId}`);
      } catch {}
    }
  };

  const handleExportCsv = () => {
    const headers = ['Device ID,Equipment Name,Laboratory Location,Specifications,Status'];
    const rows = resourceList.map(
      (r) => `"${r.code}","${r.name}","${r.location}","${r.category}","${r.status}"`
    );
    const csvBlob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabTrack_Instructor_Equipment_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported laboratory equipment report to CSV.');
  };

  // Quick Table Filtering
  const filteredResources = useMemo(() => {
    return resourceList.filter((item) => {
      const q = tableSearch.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      const matchesStatus = tableStatusFilter === 'All' || item.status === tableStatusFilter;
      const matchesLab = selectedLabFilter === 'ALL' || item.location.includes(selectedLabFilter);
      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [resourceList, tableSearch, tableStatusFilter, selectedLabFilter]);

  const statusCounts = useMemo(() => {
    return {
      total: resourceList.length,
      optimal: resourceList.filter((r) => r.status === 'Optimal').length,
      inUse: resourceList.filter((r) => r.status === 'In Use').length,
      maintenance: resourceList.filter((r) => r.status === 'Maintenance').length,
    };
  }, [resourceList]);

  // FAST & SMOOTH LEFT BAR CHART DATA
  const weeklyBarData = useMemo(() => {
    const phase = liveTick * 0.42;
    if (barTimeframe === 'Monthly') {
      const baseM = [68, 54, 76, 86, 64, 80, 62];
      return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'].map((day, i) => {
        const dynamicPct = Math.round(baseM[i] + Math.sin(phase + i * 0.85) * 11);
        return { day, count: Math.round(dynamicPct * 0.85), pct: Math.max(24, Math.min(96, dynamicPct)) };
      });
    }
    const baseW = [70, 54, 74, 86, 64, 76, 56];
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
      const dynamicPct = Math.round(baseW[i] + Math.sin(phase + i * 0.85) * 11);
      return { day, count: Math.round(dynamicPct * 0.52), pct: Math.max(24, Math.min(96, dynamicPct)) };
    });
  }, [liveTick, barTimeframe]);

  // FAST & SMOOTH RIGHT AREA WAVE DATA (DUAL HARMONIC WAVES)
  const telemetryMonthlyData = useMemo(() => {
    const phase = liveTick * 0.38;
    if (reportTimeframe === 'Weekly') {
      const baseW = [54, 68, 52, 74, 86, 66, 78];
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((month, i) => ({
        month,
        val: Math.round(baseW[i] + Math.sin(phase + i * 0.75) * 11),
        secondary: Math.round(baseW[i] * 0.78 + Math.cos(phase + i * 0.65) * 9)
      }));
    }
    const baseM = [46, 60, 44, 64, 78, 62, 84, 70, 64, 58, 80, 86];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => ({
      month,
      val: Math.round(baseM[i] + Math.sin(phase + i * 0.65) * 11),
      secondary: Math.round(baseM[i] * 0.76 + Math.cos(phase + i * 0.55) * 9)
    }));
  }, [liveTick, reportTimeframe]);

  const { waveSvgPath, areaSvgPath, secondarySvgPath, chartPoints, activePt } = useMemo(() => {
    const width = 540;
    const height = 140;
    const stepX = width / Math.max(1, telemetryMonthlyData.length - 1);

    const pts = telemetryMonthlyData.map((d, idx) => {
      const v = Math.max(18, Math.min(96, d.val));
      const s = Math.max(14, Math.min(90, d.secondary));
      const x = Math.round(idx * stepX);
      const y = Math.round(height - (v / 100) * (height - 28) - 10);
      const y2 = Math.round(height - (s / 100) * (height - 28) - 10);
      return { x, y, y2, month: d.month, val: v };
    });

    let line = `M ${pts[0].x} ${pts[0].y}`;
    let line2 = `M ${pts[0].x} ${pts[0].y2}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = Math.round((p0.x + p1.x) / 2);
      line += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      line2 += ` C ${midX} ${p0.y2}, ${midX} ${p1.y2}, ${p1.x} ${p1.y2}`;
    }

    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    const safeIdx = hoveredPoint !== null && hoveredPoint < pts.length ? hoveredPoint : Math.min(6, pts.length - 1);
    return {
      waveSvgPath: line,
      areaSvgPath: area,
      secondarySvgPath: line2,
      chartPoints: pts,
      activePt: pts[safeIdx] || pts[0]
    };
  }, [telemetryMonthlyData, hoveredPoint]);
  return (
    <div className="min-h-screen bg-white p-4 sm:p-7 text-slate-800 font-sans select-none rounded-3xl">
      {/* 60FPS GPU-ACCELERATED SYSTEM BLUE BOX + MULTI-COLOR INNER ELEMENTS */}
      <style>{`
        .system-blue-box {
          background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #eff6ff 100%);
          border: 1.5px solid #93c5fd;
          box-shadow: 0 12px 30px -8px rgba(37, 99, 235, 0.16);
          transform: translateZ(0);
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .system-blue-box:hover {
          transform: translate3d(0, -3px, 0);
          border-color: #3b82f6;
          box-shadow: 0 18px 38px -10px rgba(37, 99, 235, 0.24);
        }
        @keyframes eq-fast-bounce {
          0%, 100% { transform: scaleY(0.32); }
          50% { transform: scaleY(1); }
        }
        .eq-bar-fast {
          transform-origin: bottom;
          will-change: transform;
          animation: eq-fast-bounce 0.72s ease-in-out infinite;
        }
        .smooth-svg-motion {
          transition: all 380ms linear;
          will-change: d, transform, height;
        }
      `}</style>

      {/* Action Feedback Toast */}
      {actionToast && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-800 to-cyan-600 text-white text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast('')} className="text-cyan-100 hover:text-white cursor-pointer">
            •
          </button>
        </div>
      )}

      {/* =====================================================================
          1. ORGANIZED SYSTEM BLUE WELCOME BOX (FULL-WIDTH VISIBLE TYPEWRITER + NAME)
         ===================================================================== */}
      <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white shadow-[0_18px_40px_-12px_rgba(29,78,216,0.45)] border border-blue-400/40 space-y-4">
        
        {/* Top Row: Live Badge + Active User Pill + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Faculty Command &amp; Live Classroom Telemetry</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-[11px] font-black text-amber-200">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Instructor: {resolvedInstructorName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Term • Active</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedLabFilter((prev) =>
                  prev === 'ALL' ? 'ComLab 1' : prev === 'ComLab 1' ? 'ComLab 2' : prev === 'ComLab 2' ? 'ComLab 3' : 'ALL'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Filter className="w-3.5 h-3.5 text-cyan-300" />
              <span>{selectedLabFilter === 'ALL' ? 'Filter Lab' : selectedLabFilter}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                isAutoRefreshing
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300 shadow-lg'
                  : 'bg-blue-950/60 text-blue-200 border-white/15'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-pulse text-white' : ''}`} />
              <span>{isAutoRefreshing ? 'FAST STREAM ON' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* Middle Row: Full-Width Ghost-Locked Typewriter Heading (Never Truncates & Never Jumps) */}
        <div className="relative w-full">
          {/* Invisible Ghost Sizer locks exact height so box never jumps */}
          <div
            aria-hidden="true"
            className="invisible text-lg sm:text-2xl md:text-[26px] font-black tracking-tight leading-snug break-words"
          >
            <span>{baseGreetingText}</span>
            <span>{appendedUserName}</span>
            <span className="inline-block w-2 h-6 ml-1.5" />
          </div>

          {/* Visible Animated Typewriter Layer with Highlighted Appended Name */}
          <h1 className="absolute inset-0 text-lg sm:text-2xl md:text-[26px] font-black tracking-tight leading-snug break-words">
            <span className="text-white drop-shadow-xs">{typedBasePart}</span>
            <span className="text-amber-300 underline decoration-cyan-400/70 decoration-2 underline-offset-4 drop-shadow-sm">
              {typedNamePart}
            </span>
            <span className="w-1.5 h-5 sm:h-6 bg-cyan-300 animate-pulse inline-block ml-1.5 align-middle" />
          </h1>
        </div>

        {/* Bottom Row: Campus & Live Clock Metadata */}
        <p className="text-xs text-blue-100 font-medium flex flex-wrap items-center gap-2 pt-0.5">
          <span>Here's your current laboratory telemetry &amp; equipment overview</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <MapPin className="w-3.5 h-3.5" /> {selectedCampus}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-cyan-200 font-bold">
            <Clock className="w-3.5 h-3.5" /> {clock}
          </span>
        </p>
      </div>

      {/* =====================================================================
          2. ROW 1: 4 SYSTEM BLUE BOXES WITH COLORFUL ICONS & EQUALIZERS
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        
        {/* Box 1: Blue Box + Warm Amber-Orange Icon & Equalizer */}
        <div className="system-blue-box p-5 rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950">
              <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shrink-0">
                <BookOpen className="w-4 h-4" />
              </span>
              <span>Active Lab Sessions</span>
            </div>
            <div className="flex items-end gap-0.5 h-6 shrink-0">
              {[0.05, 0.2, 0.35, 0.15, 0.3].map((d, i) => (
                <span key={i} className="w-1 bg-orange-500 rounded-full h-full eq-bar-fast" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {myClasses.length > 0 ? `${myClasses.length} Classes` : `${reservations.length || 12} Classes`}
            </p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-2xs">
              +15%
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Compared to last week</span>
          </p>
        </div>

        {/* Box 2: Blue Box + Ocean Sky-Blue Icon & Equalizer */}
        <div className="system-blue-box p-5 rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950">
              <span className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shrink-0">
                <Monitor className="w-4 h-4" />
              </span>
              <span>PC Workstations Online</span>
            </div>
            <div className="flex items-end gap-0.5 h-6 shrink-0">
              {[0.15, 0.3, 0.1, 0.25, 0.05].map((d, i) => (
                <span key={i} className="w-1 bg-blue-600 rounded-full h-full eq-bar-fast" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {138 + (liveTick % 6)} / 150
            </p>
            <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black shadow-2xs">
              +92%
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Operational across ComLab 1–3</span>
          </p>
        </div>

        {/* Box 3: Blue Box + Violet-Rose Icon & Equalizer */}
        <div className="system-blue-box p-5 rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950">
              <span className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-rose-500 text-white shadow-md shrink-0">
                <Wrench className="w-4 h-4" />
              </span>
              <span>Maintenance Tickets</span>
            </div>
            <div className="flex items-end gap-0.5 h-6 shrink-0">
              {[0.25, 0.1, 0.3, 0.05, 0.2].map((d, i) => (
                <span key={i} className="w-1 bg-purple-600 rounded-full h-full eq-bar-fast" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {statusCounts.maintenance + myRequests.length} Active
            </p>
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-2xs">
              -10%
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Downtime resolved quickly</span>
          </p>
        </div>

        {/* Box 4: Blue Box + Emerald-Teal Icon & Equalizer */}
        <div className="system-blue-box p-5 rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950">
              <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shrink-0">
                <Wifi className="w-4 h-4" />
              </span>
              <span>System Network Traffic</span>
            </div>
            <div className="flex items-end gap-0.5 h-6 shrink-0">
              {[0.1, 0.25, 0.05, 0.35, 0.18].map((d, i) => (
                <span key={i} className="w-1 bg-emerald-600 rounded-full h-full eq-bar-fast" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {(4.2 + ((liveTick % 9) * 0.1)).toFixed(1)} Gbps
            </p>
            <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black shadow-2xs">
              +20%
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Peak laboratory class hours</span>
          </p>
        </div>

      </div>

      {/* =====================================================================
          3. ROW 2: 2 SYSTEM BLUE BOXES WITH COLORFUL ANALYTICS CHARTS INSIDE
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* LEFT BLUE BOX: COLORFUL TOTAL LAB SESSIONS VERTICAL PILL BAR CHART */}
        <div className="system-blue-box p-6 rounded-3xl flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <span className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                  <Layers className="w-4 h-4" />
                </span>
                <span>Total Lab Sessions</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5 pt-1">
                <h3 className="text-3xl font-black text-slate-900">
                  {weeklyBarData.reduce((acc, d) => acc + d.count, 0)}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-2xs">
                  +12%
                </span>
                <span className="text-[11px] text-blue-900/80 font-semibold">
                  Compared to last week
                </span>
              </div>
            </div>

            <div className="relative">
              <select
                value={barTimeframe}
                onChange={(e) => setBarTimeframe(e.target.value as 'Weekly' | 'Monthly')}
                className="text-xs font-bold text-blue-950 bg-white/95 border border-blue-300 rounded-xl px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none shadow-2xs"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-700 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 7 Colorful Animated Pill Bars Inside System Blue Box */}
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-5 pt-10 px-2 relative">
            <div className="flex flex-col justify-between h-full text-[10px] text-blue-800/70 font-bold pr-1 pb-6">
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>0</span>
            </div>

            {weeklyBarData.map((bar, idx) => {
              const isSelected = hoveredBarIdx === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBarIdx(idx)}
                  onClick={() => setHoveredBarIdx(idx)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 cursor-pointer relative group"
                >
                  {isSelected && (
                    <div className="absolute -top-8 z-20 bg-slate-900 text-white border border-amber-400 shadow-xl rounded-xl px-2.5 py-1 text-center whitespace-nowrap ">
                      <p className="text-[11px] font-black text-amber-300">{bar.count} sessions</p>
                      <p className="text-[9px] text-slate-300 font-semibold">{bar.day} Live</p>
                    </div>
                  )}

                  {/* White/Blue Pill Track + Colorful Gradient Fill */}
                  <div className="w-full max-w-[36px] h-36 bg-white/85 rounded-2xl overflow-hidden flex items-end p-1 border border-blue-300/80 shadow-inner">
                    <div
                      className={`w-full rounded-xl smooth-svg-motion ${
                        isSelected
                          ? 'bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                          : idx % 2 === 0
                          ? 'bg-gradient-to-t from-[#0f766e] via-[#14b8a6] to-[#2dd4bf] group-hover:from-orange-500 group-hover:to-amber-400'
                          : 'bg-gradient-to-t from-[#1d4ed8] via-[#0284c7] to-[#38bdf8] group-hover:from-orange-500 group-hover:to-amber-400'
                      }`}
                      style={{ height: `${bar.pct}%` }}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-orange-600 font-black scale-110' : 'text-blue-950'
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT BLUE BOX: COLORFUL DUAL-WAVE SMOOTH AREA TELEMETRY CHART */}
        <div className="system-blue-box p-6 rounded-3xl flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <span className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-sm">
                  <Activity className="w-4 h-4" />
                </span>
                <span>Lab System Telemetry Report</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5 pt-1">
                <h3 className="text-3xl font-black text-slate-900">
                  {(3820 + liveTick * 4).toLocaleString()}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-2xs">
                  +18%
                </span>
                <span className="text-[11px] text-blue-900/80 font-semibold">
                  Real-time workstation utilization
                </span>
              </div>
            </div>

            <div className="relative">
              <select
                value={reportTimeframe}
                onChange={(e) => {
                  setReportTimeframe(e.target.value as 'Monthly' | 'Weekly');
                  setHoveredPoint(0);
                }}
                className="text-xs font-bold text-blue-950 bg-white/95 border border-blue-300 rounded-xl px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none shadow-2xs"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-700 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="h-56 relative pt-8">
            <div className="absolute inset-x-0 top-8 bottom-6 flex flex-col justify-between text-[10px] font-sans text-blue-800/60 font-semibold pointer-events-none">
              <div className="flex items-center gap-2"><span className="w-7 text-right">100%</span><div className="w-full border-b border-blue-300/60 border-dashed" /></div>
              <div className="flex items-center gap-2"><span className="w-7 text-right">75%</span><div className="w-full border-b border-blue-300/60 border-dashed" /></div>
              <div className="flex items-center gap-2"><span className="w-7 text-right">50%</span><div className="w-full border-b border-blue-300/60 border-dashed" /></div>
              <div className="flex items-center gap-2"><span className="w-7 text-right">25%</span><div className="w-full border-b border-blue-300/60 border-dashed" /></div>
              <div className="flex items-center gap-2"><span className="w-7 text-right">0%</span><div className="w-full border-b border-blue-300/60 border-dashed" /></div>
            </div>

            {activePt && (
              <div
                className="absolute top-0 z-20 bg-slate-900 text-white border border-cyan-400 px-3 py-1 rounded-xl shadow-xl text-[10px] font-sans pointer-events-none smooth-svg-motion"
                style={{
                  left: `calc(${Math.min(72, Math.max(10, (activePt.x / 540) * 100))}%)`
                }}
              >
                <p className="font-black text-cyan-300">{activePt.val}% Active PC Load</p>
                <p className="text-[9px] text-slate-300 font-semibold">{activePt.month} Telemetry Peak</p>
              </div>
            )}

            <div className="w-full h-40 pl-9 pr-2 relative z-10">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 540 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="vibrantAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="vibrantLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                <path
                  d={areaSvgPath}
                  fill="url(#vibrantAreaGrad)"
                  className="smooth-svg-motion"
                />

                <path
                  d={secondarySvgPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeDasharray="5 4"
                  className="smooth-svg-motion opacity-85"
                />

                <path
                  d={waveSvgPath}
                  fill="none"
                  stroke="url(#vibrantLineGrad)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="smooth-svg-motion"
                />

                {activePt && (
                  <line
                    x1={activePt.x}
                    y1={activePt.y}
                    x2={activePt.x}
                    y2={140}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {chartPoints.map((pt, idx) => {
                  const isCurr = activePt && activePt.month === pt.month;
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurr ? 5 : 3}
                      fill={isCurr ? '#f59e0b' : '#ffffff'}
                      stroke="#0f766e"
                      strokeWidth={isCurr ? 3 : 2}
                      className="smooth-svg-motion cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onClick={() => setHoveredPoint(idx)}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between pl-9 pr-2 text-[10px] font-bold text-blue-950 mt-1">
              {telemetryMonthlyData.map((m, idx) => (
                <span
                  key={idx}
                  className={`cursor-pointer px-1.5 py-0.5 rounded-md transition ${
                    hoveredPoint === idx ? 'bg-teal-700 text-white font-black' : 'hover:text-teal-800'
                  }`}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onClick={() => setHoveredPoint(idx)}
                >
                  {m.month}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* =====================================================================
          4. ROW 3: SYSTEM BLUE EQUIPMENT TABLE BOX (2 COLS) + SYSTEM BLUE ALLOCATION BOX (1 COL)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* LEFT (2 COLS): SYSTEM BLUE LABORATORY EQUIPMENT & WORKSTATIONS BOX */}
        <div className="lg:col-span-2 system-blue-box rounded-3xl overflow-hidden flex flex-col justify-between">
          
          {/* Table Header Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-200/75 via-sky-200/75 to-cyan-100/75 border-b border-blue-300 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Laboratory Equipment &amp; Workstations</h3>
              <p className="text-xs text-blue-900 font-semibold">
                Tracked hardware assets and network node health
              </p>
            </div>

            {/* Quick Analytics Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTableStatusFilter('All')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                  tableStatusFilter === 'All'
                    ? 'bg-[#0f3d3e] text-white border-[#0f3d3e] shadow-sm'
                    : 'bg-white/90 text-slate-700 border-blue-200 hover:bg-white'
                }`}
              >
                All ({statusCounts.total})
              </button>
              <button
                type="button"
                onClick={() => setTableStatusFilter('Optimal')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                  tableStatusFilter === 'Optimal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Optimal ({statusCounts.optimal})
              </button>
              <button
                type="button"
                onClick={() => setTableStatusFilter('In Use')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                  tableStatusFilter === 'In Use'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-sky-100/90 text-sky-800 border-sky-300 hover:bg-sky-100'
                }`}
              >
                In Use ({statusCounts.inUse})
              </button>
              <button
                type="button"
                onClick={() => setTableStatusFilter('Maintenance')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                  tableStatusFilter === 'Maintenance'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-amber-100/90 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                Maintenance ({statusCounts.maintenance})
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 flex-1">
            {/* SEARCH & ADD ACTION BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-blue-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search equipment, ID or lab..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-white/95 text-xs font-semibold text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#0f766e] to-[#0284c7] hover:from-[#0d9488] hover:to-[#0369a1] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>
            </div>

            {/* ADD EQUIPMENT FORM */}
            {isAddingItem && (
              <form
                onSubmit={handleAddResource}
                className="p-4 bg-white/95 rounded-2xl border border-blue-300 space-y-3 "
              >
                <p className="text-xs font-black text-blue-950">Add New Laboratory Resource</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Equipment Name (e.g. Cisco Router)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 font-semibold text-slate-800 focus:outline-none"
                    required
                  />
                  <select
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                    className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 font-semibold text-slate-800"
                  >
                    <option value="ComLab 1 (Networking)">ComLab 1 (Networking)</option>
                    <option value="ComLab 2 (Software Eng)">ComLab 2 (Software Eng)</option>
                    <option value="ComLab 3 (AI & Multimedia)">ComLab 3 (AI & Multimedia)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Specs / Category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 font-semibold text-slate-800 focus:outline-none"
                  />
                  <select
                    value={newItemStatus}
                    onChange={(e) => setNewItemStatus(e.target.value as 'Optimal' | 'Maintenance' | 'In Use')}
                    className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 font-semibold text-slate-800"
                  >
                    <option value="Optimal">Optimal</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-3.5 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0f766e] text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
                  >
                    Save Resource
                  </button>
                </div>
              </form>
            )}

            {/* DATA TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white/95">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-black text-blue-950 bg-gradient-to-r from-blue-100/90 via-sky-100/80 to-teal-100/80 border-b border-blue-200">
                    <th className="p-3.5">Equipment Name</th>
                    <th className="p-3.5">Device ID</th>
                    <th className="p-3.5">Laboratory Location</th>
                    <th className="p-3.5">Specifications / Type</th>
                    <th className="p-3.5">Condition Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-xs font-semibold">
                  {filteredResources.length > 0 ? (
                    filteredResources.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-all ${
                          editingId === item.id
                            ? 'bg-emerald-100/70 border-l-4 border-l-[#0f766e]'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-blue-50/70'
                            : 'bg-blue-50/40 hover:bg-blue-100/60'
                        }`}
                      >
                        {editingId === item.id ? (
                          <>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full p-2 bg-white rounded-lg border border-blue-500 text-xs font-bold focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5 font-mono text-teal-800 font-bold">{item.code}</td>
                            <td className="p-2.5">
                              <select
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="w-full p-2 bg-white rounded-lg border border-blue-300 text-xs focus:outline-none"
                              >
                                <option value="ComLab 1 (Networking)">ComLab 1 (Networking)</option>
                                <option value="ComLab 2 (Software Eng)">ComLab 2 (Software Eng)</option>
                                <option value="ComLab 3 (AI & Multimedia)">ComLab 3 (AI & Multimedia)</option>
                              </select>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full p-2 bg-white rounded-lg border border-blue-300 text-xs focus:outline-none"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as 'Optimal' | 'Maintenance' | 'In Use')}
                                className="w-full p-2 bg-white rounded-lg border border-blue-300 text-xs focus:outline-none"
                              >
                                <option value="Optimal">Optimal</option>
                                <option value="In Use">In Use</option>
                                <option value="Maintenance">Maintenance</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-3 py-1.5 bg-[#0f766e] text-white rounded-lg text-xs font-bold hover:bg-[#115e59] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3.5 font-extrabold text-slate-900">{item.name}</td>
                            <td className="p-3.5 font-mono text-teal-800 font-bold">{item.code}</td>
                            <td className="p-3.5 text-slate-700 font-bold">{item.location}</td>
                            <td className="p-3.5 text-slate-600">{item.category}</td>
                            <td className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleQuickStatusToggle(item)}
                                title="Click to toggle status"
                                className={`px-3 py-1 rounded-full text-[10px] font-black border cursor-pointer transition shadow-2xs ${
                                  item.status === 'Optimal'
                                    ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                    : item.status === 'In Use'
                                    ? 'bg-sky-600 text-white border-sky-700 hover:bg-sky-700'
                                    : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                }`}
                              >
                                {item.status}
                              </button>
                            </td>
                            <td className="p-3.5 text-right font-bold text-slate-600 space-x-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-600 text-teal-900 hover:text-white transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteResource(item.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                        No equipment found matching "{tableSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-3.5 bg-blue-200/50 border-t border-blue-300 flex items-center justify-between text-[11px] text-blue-950 font-bold">
            <span>Showing {filteredResources.length} of {resourceList.length} laboratory resources</span>
            <span>JRMSU Dapitan Main Campus</span>
          </div>
        </div>

        {/* RIGHT (1 COL): ORGANIZED SYSTEM BLUE RESOURCE ALLOCATION BOX WITH FULL TEXT VISIBILITY */}
        <div className="system-blue-box p-6 rounded-3xl flex flex-col justify-between space-y-5">
          
          {/* 1. Organized Header */}
          <div className="flex justify-between items-center border-b border-blue-300/80 pb-3.5">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Resource Allocation</h3>
              <p className="text-[11px] text-blue-900/80 font-semibold">Real-time assets per ComLab</p>
            </div>
            <div className="relative">
              <select
                value={pieTimeframe}
                onChange={(e) => setPieTimeframe(e.target.value)}
                className="text-xs font-bold text-blue-950 bg-white/95 border border-blue-300 rounded-xl px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none shadow-2xs"
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-700 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Centered Vibrant 3-Color Donut Chart Inside Blue Box */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-40 h-40 relative">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ffffff" strokeWidth="4.2" />

                {/* ComLab 1 Segment (Vibrant Orange-Amber #f97316) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="4.2"
                  strokeDasharray={`${labDistribution.p1} ${Math.max(0, 100 - labDistribution.p1)}`}
                  strokeDashoffset="0"
                  className="smooth-svg-motion cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 1')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                  onClick={() => setSelectedLabFilter(selectedLabFilter === 'ComLab 1' ? 'ALL' : 'ComLab 1')}
                />

                {/* ComLab 2 Segment (Vibrant Teal-Emerald #0d9488) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#0d9488"
                  strokeWidth="4.2"
                  strokeDasharray={`${labDistribution.p2} ${Math.max(0, 100 - labDistribution.p2)}`}
                  strokeDashoffset={`-${labDistribution.p1}`}
                  className="smooth-svg-motion cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 2')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                  onClick={() => setSelectedLabFilter(selectedLabFilter === 'ComLab 2' ? 'ALL' : 'ComLab 2')}
                />

                {/* ComLab 3 Segment (Deep Royal Indigo-Blue #1e3a8a) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#1e3a8a"
                  strokeWidth="4.2"
                  strokeDasharray={`${labDistribution.p3} ${Math.max(0, 100 - labDistribution.p3)}`}
                  strokeDashoffset={`-${labDistribution.p1 + labDistribution.p2}`}
                  className="smooth-svg-motion cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 3')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                  onClick={() => setSelectedLabFilter(selectedLabFilter === 'ComLab 3' ? 'ALL' : 'ComLab 3')}
                />
              </svg>

              {/* Center Total Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[10px] text-blue-900 font-bold uppercase">Total</span>
                <span className="text-2xl font-black text-slate-900 leading-none my-0.5">
                  {labDistribution.total}
                </span>
                <span className="text-[9px] text-orange-600 font-extrabold">
                  {hoveredPieSegment || 'Tracked Units'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Neatly Organized Colorful Breakdown Cards (Full Text Visible, Never Cut Off) */}
          <div className="space-y-2.5 border-t border-blue-300/80 pt-3.5">
            {[
              {
                key: 'ComLab 1',
                title: 'ComLab 1',
                subtitle: 'Networking Lab',
                count: labDistribution.counts['ComLab 1'],
                pct: labDistribution.p1,
                dot: 'bg-orange-500',
                bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
                cardBg: 'bg-white/95 border-orange-300 text-orange-950',
                badgeBg: 'bg-orange-500 text-white'
              },
              {
                key: 'ComLab 2',
                title: 'ComLab 2',
                subtitle: 'Software Engineering',
                count: labDistribution.counts['ComLab 2'],
                pct: labDistribution.p2,
                dot: 'bg-teal-600',
                bar: 'bg-gradient-to-r from-teal-600 to-emerald-400',
                cardBg: 'bg-white/95 border-teal-300 text-teal-950',
                badgeBg: 'bg-teal-600 text-white'
              },
              {
                key: 'ComLab 3',
                title: 'ComLab 3',
                subtitle: 'AI & Multimedia',
                count: labDistribution.counts['ComLab 3'],
                pct: labDistribution.p3,
                dot: 'bg-blue-900',
                bar: 'bg-gradient-to-r from-blue-900 to-sky-500',
                cardBg: 'bg-white/95 border-blue-300 text-blue-950',
                badgeBg: 'bg-blue-900 text-white'
              },
            ].map((seg) => {
              const isSelected = selectedLabFilter === seg.key || hoveredPieSegment === seg.key;
              return (
                <div
                  key={seg.key}
                  onMouseEnter={() => setHoveredPieSegment(seg.key)}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                  onClick={() => setSelectedLabFilter(selectedLabFilter === seg.key ? 'ALL' : seg.key)}
                  className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 ${seg.cardBg} ${
                    isSelected
                      ? 'ring-2 ring-blue-600 scale-[1.01] shadow-sm'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${seg.dot} shrink-0`} />
                      <div>
                        <p className="text-xs font-black leading-tight">{seg.title}</p>
                        <p className="text-[10px] font-semibold opacity-75 leading-tight">{seg.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold">{seg.count} Units</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${seg.badgeBg}`}>
                        {seg.pct}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${seg.bar}`}
                      style={{ width: `${seg.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Organized Footer */}
          <div className="border-t border-blue-300/80 pt-3 flex items-center justify-between text-[11px] text-blue-950 font-bold">
            <span>Click any ComLab segment to filter table</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              100% Synced
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OverviewView;










