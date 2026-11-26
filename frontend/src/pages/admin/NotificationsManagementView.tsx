import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, Info, ShieldAlert, Send, Trash2,
  Filter, BarChart3, Plus, X, Clock, Radio, Megaphone, CheckSquare,
  Square, RefreshCw, Search, Sparkles, Eye, Shield,
  FileText, Volume2, VolumeX, Edit, Check
} from 'lucide-react';

export interface NotificationsManagementViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface AlertItem {
  id: string;
  title: string;
  count: string;
  category: string;
  categoryLabel: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS';
  time: string;
  lab: string;
  msg: string;
  isRead: boolean;
}

// ============================================================================
// SINGLETON WEB AUDIO SYNTHESIZER FOR AUDIBLE NOTIFICATION CHIMES
// ============================================================================
let sharedNotifAudioCtx: AudioContext | null = null;

const playNotificationChime = (type: 'dispatch' | 'click' | 'delete', dndActive = false) => {
  if (dndActive || typeof window === 'undefined') return;
  try {
    if (!sharedNotifAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) sharedNotifAudioCtx = new AudioCtx();
    }
    if (!sharedNotifAudioCtx) return;
    if (sharedNotifAudioCtx.state === 'suspended') {
      sharedNotifAudioCtx.resume().catch(() => {});
    }

    const playTone = (freq: number, start: number, dur: number, wave: OscillatorType = 'sine', gainVal = 0.08) => {
      if (!sharedNotifAudioCtx) return;
      const osc = sharedNotifAudioCtx.createOscillator();
      const gain = sharedNotifAudioCtx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(sharedNotifAudioCtx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    const now = sharedNotifAudioCtx.currentTime;
    if (type === 'dispatch') {
      playTone(587.33, now, 0.11, 'triangle', 0.1);
      playTone(880, now + 0.09, 0.22, 'sine', 0.12);
    } else if (type === 'delete') {
      playTone(320, now, 0.09, 'sawtooth', 0.05);
      playTone(210, now + 0.07, 0.14, 'sawtooth', 0.05);
    } else {
      playTone(760, now, 0.03, 'sine', 0.035);
    }
  } catch {}
};

// ============================================================================
// 3D ISOMETRIC TELEMETRY & BROADCAST TOWER RIG ILLUSTRATION
// ============================================================================
const IsometricNotificationRig: React.FC<{
  hasCritical: boolean;
  isDnd: boolean;
  unreadCount: number;
}> = ({ hasCritical, isDnd, unreadCount }) => {
  const primaryHex = hasCritical ? '#f43f5e' : isDnd ? '#f59e0b' : '#38bdf8';
  const secondaryHex = hasCritical ? '#be123°C' : isDnd ? '#d97706' : '#2563eb';
  return (
    <div className="w-16 h-14 shrink-0">
      <svg viewBox="0 0 140 115" className="w-full h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="notifRigGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={primaryHex} stopOpacity="0.95" />
            <stop offset="55%" stopColor={secondaryHex} stopOpacity="0.88" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <polygon points="70,106 10,82 70,58 130,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.4" />
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
            className={!isDnd ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 39px', animationDuration: hasCritical ? '1s' : '2.6s' }}
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
            className={!isDnd ? 'animate-pulse' : ''}
            style={{ transformOrigin: '105px 56px', animationDuration: hasCritical ? '1s' : '2.6s' }}
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
          <polygon points="25,25 81,12 81,49 25,62" fill="url(#notifRigGrad3D)" />
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
            {unreadCount > 0 ? `${unreadCount} NEW` : 'SYNCED'}
          </text>
        </g>

        <polygon points="32,82 74,68 82,73 40,87" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
        <line x1="37" y1="82" x2="73" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={primaryHex} strokeWidth="1" />
      </svg>
    </div>
  );
};

export const NotificationsManagementView: React.FC<NotificationsManagementViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());
  const [barSeries, setBarSeries] = useState([42, 58, 72, 48, 84, 62, 94]);
  const [isDndActive, setIsDndActive] = useState(false);
  const [liveToastAlert, setLiveToastAlert] = useState<string | null>(null);

  // YOUTUBE-STYLE NOTIFICATION BELL DROPDOWN & MULTI-SELECT STATES
  const [isBellDropdownOpen, setIsBellDropdownOpen] = useState(false);
  const [bellTab, setBellTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const bellDropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState({
    documents: true,
    dnd: true,
    hardware: true,
    desktopFleet: true,
    userLog: true,
    security: true,
    network: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS'>('ALL');

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [selectedAlertModal, setSelectedAlertModal] = useState<AlertItem | null>(null);

  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchMsg, setDispatchMsg] = useState('');
  const [dispatchSeverity, setDispatchSeverity] = useState<'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS'>('CRITICAL');
  const [dispatchCategory, setDispatchCategory] = useState<string>('hardware');
  const [dispatchTargetLab, setDispatchTargetLab] = useState('All Labs');

  const getCategoryLabel = (cat: string): string => {
    const c = String(cat || '').toLowerCase();
    if (c.includes('doc') || c.includes('report')) return 'Document & Report Logs';
    if (c.includes('dnd') || c.includes('trap')) return 'Trap / DND Alerts';
    if (c.includes('fleet') || c.includes('desktop')) return 'Desktop Fleet';
    if (c.includes('user') || c.includes('session')) return 'User Session Log';
    if (c.includes('sec') || c.includes('breach')) return 'Security Breaches';
    if (c.includes('net') || c.includes('tele')) return 'Network Telemetry';
    if (c.includes('hard')) return 'Hardware Faults';
    return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'General Alert';
  };

  // Auto-detect category & severity when typing in Dispatch Modal
  const autoDetectBroadcastClassification = (titleText: string, msgText: string) => {
    const combined = `${titleText} ${msgText}`.toLowerCase();
    if (combined.includes('network') || combined.includes('dhcp') || combined.includes('ip') || combined.includes('vlan') || combined.includes('rj45')) {
      setDispatchCategory('network');
    } else if (combined.includes('security') || combined.includes('breach') || combined.includes('unauthorized') || combined.includes('pin')) {
      setDispatchCategory('security');
    } else if (combined.includes('backup') || combined.includes('report') || combined.includes('pdf') || combined.includes('csv') || combined.includes('database')) {
      setDispatchCategory('documents');
    } else if (combined.includes('session') || combined.includes('student') || combined.includes('qr') || combined.includes('login')) {
      setDispatchCategory('userLog');
    } else if (combined.includes('cuda') || combined.includes('driver') || combined.includes('update') || combined.includes('fleet')) {
      setDispatchCategory('desktopFleet');
    } else {
      setDispatchCategory('hardware');
    }

    if (combined.includes('critical') || combined.includes('overheat') || combined.includes('down') || combined.includes('timeout') || combined.includes('breach')) {
      setDispatchSeverity('CRITICAL');
    } else if (combined.includes('warning') || combined.includes('thermal') || combined.includes('slow') || combined.includes('maintenance')) {
      setDispatchSeverity('WARNING');
    } else if (combined.includes('complete') || combined.includes('success') || combined.includes('resolved') || combined.includes('verified')) {
      setDispatchSeverity('SUCCESS');
    }
  };

  const defaultAlerts: AlertItem[] = useMemo(
    () => [
      {
        id: 'ALT-101',
        title: 'DHCP IP Handshake Timeout',
        count: '1,024',
        category: 'network',
        categoryLabel: 'Network Telemetry',
        severity: 'CRITICAL',
        time: '05:15 AM',
        lab: 'ComLab 1 (Networking)',
        msg: 'Loose RJ45 LAN connector detected at WS-03. Automatic diagnostic initiated.',
        isRead: false
      },
      {
        id: 'ALT-102',
        title: 'GPU Thermal Threshold Exceeded',
        count: '450',
        category: 'hardware',
        categoryLabel: 'Hardware Faults',
        severity: 'WARNING',
        time: '05:00 AM',
        lab: 'ComLab 2 (Software Eng)',
        msg: 'Thermal sensor reading reaching 78°C on station PC-202 during rendering session.',
        isRead: false
      },
      {
        id: 'ALT-103',
        title: 'CUDA Driver Synchronization Complete',
        count: '1,200',
        category: 'desktopFleet',
        categoryLabel: 'Desktop Fleet',
        severity: 'INFO',
        time: '04:30 AM',
        lab: 'ComLab 3 (AI Lab)',
        msg: 'Jupyter Notebook CUDA v12.4 kernel updated across 25 workstation nodes.',
        isRead: false
      },
      {
        id: 'ALT-104',
        title: 'PostgreSQL Database Automated Backup',
        count: '3,500',
        category: 'documents',
        categoryLabel: 'Document & Report Logs',
        severity: 'INFO',
        time: '04:00 AM',
        lab: 'JRMSU DB Core',
        msg: 'Daily database backup archive generated successfully with 100% integrity check.',
        isRead: true
      }
    ],
    []
  );

  const [alertsList, setAlertsList] = useState<AlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_notifications_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return defaultAlerts;
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('labtrack_notifications_v4', JSON.stringify(alertsList));
    } catch {}
  }, [alertsList]);

  // Clean up selectedIds if items are removed
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => alertsList.some(a => a.id === id)));
  }, [alertsList]);

  // Close YouTube Bell Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellDropdownRef.current && !bellDropdownRef.current.contains(e.target as Node)) {
        setIsBellDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mapApiToAlertItem = useCallback((item: any, index: number): AlertItem => {
    const rawCat = String(item.category || item.type || 'hardware');
    const catLabel = getCategoryLabel(rawCat);

    const rawSev = String(item.severity || '').toUpperCase();
    let severity: AlertItem['severity'] = 'INFO';
    if (rawSev.includes('CRIT')) severity = 'CRITICAL';
    else if (rawSev.includes('HIGH')) severity = 'HIGH';
    else if (rawSev.includes('WARN') || rawSev.includes('MED')) severity = 'WARNING';
    else if (rawSev.includes('SUCC') || rawSev.includes('OK') || rawSev.includes('DONE') || rawSev.includes('COMPLET'))
      severity = 'SUCCESS';

    return {
      id: item.id || `ALT-${100 + index}`,
      title: item.title || item.notificationTitle || item.subject || 'System Broadcast Alert',
      count: item.count || (item.impactedUnits ? `${item.impactedUnits}` : '1,000'),
      category: rawCat.toLowerCase(),
      categoryLabel: catLabel,
      severity,
      time:
        item.time ||
        (item.createdAtUtc
          ? new Date(item.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recently'),
      lab: item.lab || item.labName || 'All Labs',
      msg: item.msg || item.details || item.message || item.description || 'System telemetry notification event.',
      isRead: !!item.isRead
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await apiClient
        .get('/api/v1/notifications')
        .catch(() => apiClient.get('/api/v1/admin/notifications'))
        .catch(() => null);
      const data = res?.data?.data?.items || res?.data?.data || res?.data || [];
      const itemsArray = Array.isArray(data) ? data : [];

      if (itemsArray.length > 0) {
        setAlertsList(itemsArray.map((item, idx) => mapApiToAlertItem(item, idx)));
      }
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, [mapApiToAlertItem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ticker = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
      setBarSeries(prev => [...prev.slice(1), Math.floor(32 + Math.random() * 64)]);
    }, 1200);

    return () => clearInterval(ticker);
  }, []);

  const triggerToast = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  const toggleCat = (key: keyof typeof categories) => {
    playNotificationChime('click', isDndActive);
    setCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchMsg.trim()) return;

    const catLabel = getCategoryLabel(dispatchCategory);

    const newAlert: AlertItem = {
      id: `ALT-${Math.floor(Math.random() * 899) + 100}`,
      title: dispatchTitle.trim(),
      count: '1,000',
      category: dispatchCategory.toLowerCase(),
      categoryLabel: catLabel,
      severity: dispatchSeverity,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lab: dispatchTargetLab.trim(),
      msg: dispatchMsg.trim(),
      isRead: false
    };

    playNotificationChime('dispatch', isDndActive);
    setAlertsList(prev => [newAlert, ...prev]);
    setIsDispatchModalOpen(false);

    if (!isDndActive) {
      setLiveToastAlert(newAlert.title);
      setTimeout(() => setLiveToastAlert(null), 3500);
    }

    resetFormFields();
    triggerToast(`Broadcast Alert Dispatched: "${newAlert.title}"`);
  };

  const handleOpenEditModal = (alert: AlertItem) => {
    playNotificationChime('click', isDndActive);
    setEditingAlert(alert);
    setDispatchTitle(alert.title);
    setDispatchMsg(alert.msg);
    setDispatchSeverity(alert.severity);
    setDispatchCategory(alert.category);
    setDispatchTargetLab(alert.lab || 'All Labs');
  };

  const handleUpdateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert) return;

    const catLabel = getCategoryLabel(dispatchCategory);

    setAlertsList(prev =>
      prev.map(a => {
        if (a.id === editingAlert.id) {
          return {
            ...a,
            title: dispatchTitle.trim(),
            msg: dispatchMsg.trim(),
            severity: dispatchSeverity,
            category: dispatchCategory.toLowerCase(),
            categoryLabel: catLabel,
            lab: dispatchTargetLab.trim()
          };
        }
        return a;
      })
    );

    playNotificationChime('dispatch', isDndActive);
    setEditingAlert(null);
    resetFormFields();
    triggerToast(`Updated Alert: "${dispatchTitle}"`);
  };

  const handleToggleRead = (id: string) => {
    playNotificationChime('click', isDndActive);
    setAlertsList(prev => prev.map(a => (a.id === id ? { ...a, isRead: !a.isRead } : a)));
  };

  const handleMarkAllRead = () => {
    playNotificationChime('click', isDndActive);
    setAlertsList(prev => prev.map(a => ({ ...a, isRead: true })));
    triggerToast('All notifications marked as read.');
  };

  // ============================================================================
  // ANIMATED SINGLE & BULK DELETE HANDLERS (WITH SMOOTH SLIDE-OUT ANIMATION)
  // ============================================================================
  const animateAndRemoveIds = (idsToRemove: string[], toastMsg: string) => {
    if (idsToRemove.length === 0) return;
    playNotificationChime('delete', isDndActive);
    setRemovingIds(prev => Array.from(new Set([...prev, ...idsToRemove])));

    setTimeout(() => {
      setAlertsList(prev => prev.filter(a => !idsToRemove.includes(a.id)));
      setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
      setRemovingIds(prev => prev.filter(id => !idsToRemove.includes(id)));
      setSelectedAlertModal(null);
      triggerToast(toastMsg);
    }, 240);
  };

  const handleDeleteAlert = (id: string, title: string) => {
    animateAndRemoveIds([id], `Dismissed alert: "${title}"`);
  };

  const handleToggleSelectOne = (id: string) => {
    playNotificationChime('click', isDndActive);
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleToggleSelectAllList = (targetList: AlertItem[]) => {
    playNotificationChime('click', isDndActive);
    const targetIds = targetList.map(a => a.id);
    const allSelected = targetIds.length > 0 && targetIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    animateAndRemoveIds([...selectedIds], `Deleted ${count} selected notification${count > 1 ? 's' : ''}!`);
  };

  const handleMarkSelectedRead = () => {
    if (selectedIds.length === 0) return;
    playNotificationChime('click', isDndActive);
    setAlertsList(prev => prev.map(a => (selectedIds.includes(a.id) ? { ...a, isRead: true } : a)));
    triggerToast(`Marked ${selectedIds.length} selected notification(s) as read.`);
  };

  const handlePurge = () => {
    if (alertsList.length === 0) return;
    animateAndRemoveIds(
      alertsList.map(a => a.id),
      'Notification Desk purged.'
    );
  };

  const resetFormFields = () => {
    setDispatchTitle('');
    setDispatchMsg('');
    setDispatchSeverity('CRITICAL');
    setDispatchCategory('hardware');
    setDispatchTargetLab('All Labs');
  };

  const filteredAlerts = useMemo(() => {
    return alertsList.filter(a => {
      const catLower = (a.category || '').toLowerCase();
      const isKnown =
        catLower.includes('doc') ||
        catLower.includes('dnd') ||
        catLower.includes('hard') ||
        catLower.includes('fleet') ||
        catLower.includes('user') ||
        catLower.includes('sec') ||
        catLower.includes('net');

      const knownMatch =
        (catLower.includes('doc') && categories.documents) ||
        (catLower.includes('dnd') && categories.dnd) ||
        (catLower.includes('hard') && categories.hardware) ||
        (catLower.includes('fleet') && categories.desktopFleet) ||
        (catLower.includes('user') && categories.userLog) ||
        (catLower.includes('sec') && categories.security) ||
        (catLower.includes('net') && categories.network);

      const matchesCategory = isKnown ? knownMatch : true;
      const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.msg || '').toLowerCase().includes(q) ||
        (a.lab || '').toLowerCase().includes(q);

      return matchesCategory && matchesSeverity && matchesSearch;
    });
  }, [alertsList, categories, severityFilter, searchQuery]);

  const bellTrayAlerts = useMemo(() => {
    if (bellTab === 'UNREAD') return alertsList.filter(a => !a.isRead);
    return alertsList;
  }, [alertsList, bellTab]);

  const unreadCount = useMemo(() => alertsList.filter(a => !a.isRead).length, [alertsList]);
  const criticalCount = useMemo(
    () => alertsList.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length,
    [alertsList]
  );
  const notifSuccess = useMemo(() => {
    if (alertsList.length === 0) return 100;
    const readCount = alertsList.filter(a => a.isRead).length;
    return Math.max(75, Math.round((readCount / alertsList.length) * 100));
  }, [alertsList]);

  const isAllFilteredSelected =
    filteredAlerts.length > 0 && filteredAlerts.every(a => selectedIds.includes(a.id));
  const isAllBellTraySelected =
    bellTrayAlerts.length > 0 && bellTrayAlerts.every(a => selectedIds.includes(a.id));
  return (
    <div className="space-y-6 font-sans text-slate-800  relative select-none">
      {/* ADVANCED 3D & SPRING KEYFRAME ANIMATIONS */}
      <style>{`
        .notif-shell-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 10px 0 #94a3b8,
            0 24px 48px -12px rgba(15, 23, 42, 0.25),
            inset 0 2px 0 #ffffff;
        }
        .notif-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow: 0 7px 0 #cbd5e1, 0 14px 24px rgba(15, 23, 42, 0.08);
        }
        .notif-card-3d {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease,
            max-height 0.24s ease;
          transform: translateZ(0);
        }
        .notif-card-3d:hover {
          transform: translate3d(0, -3px, 0) scale(1.01);
        }
        .notif-removing {
          opacity: 0 !important;
          transform: translate3d(45px, 0, 0) scale(0.9) !important;
          pointer-events: none;
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
            transform: translateY(-12px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .yt-tray-spring {
          animation: traySpringIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes laserSweep {
          0% { top: 8%; opacity: 0.25; }
          50% { top: 88%; opacity: 0.75; }
          100% { top: 8%; opacity: 0.25; }
        }
        .telemetry-laser-line {
          animation: laserSweep 3.4s ease-in-out infinite;
        }
      `}</style>

      {liveToastAlert && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all animate-in slide-in-from-top duration-300 border-2 border-cyan-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xs font-black tracking-wide font-mono">
              NEW NOTIFICATION: {liveToastAlert}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLiveToastAlert(null)}
            className="text-[10px] bg-white/20 hover:bg-white/30 font-mono px-2.5 py-0.5 rounded-full font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      <div className="notif-shell-3d p-5 sm:p-7 rounded-[2.5rem] space-y-6">
        {/* ===================================================================
            HEADER BAR (3D OBSIDIAN HEADER + YOUTUBE NOTIFICATION BELL IN TOP)
           =================================================================== */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_7px_0_#0f172a,0_18px_30px_rgba(2,6,23,0.4)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-30">
          <div className="flex items-center gap-3.5">
            <IsometricNotificationRig
              hasCritical={criticalCount > 0}
              isDnd={isDndActive}
              unreadCount={unreadCount}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Notification Desk
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE TELEMETRY</span>
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium block mt-0.5">
                Live Telemetry &amp; Emergency Alert Dispatcher for {activeCampus}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-sans text-xs font-bold">
            {/* ===============================================================
                YOUTUBE-STYLE NOTIFICATION BELL WITH SELECT ALL & BULK DELETE
               =============================================================== */}
            <div className="relative" ref={bellDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  playNotificationChime('click', isDndActive);
                  setIsBellDropdownOpen(!isBellDropdownOpen);
                }}
                className={`relative px-3.5 py-2 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2 ${
                  isBellDropdownOpen
                    ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_25px_rgba(34,211,238,0.65)]'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-cyan-400/50 shadow-[0_4px_0_#020617]'
                }`}
                title="Open YouTube-Style Notification Bell (Select All & Delete)"
              >
                <div className="relative">
                  <Bell
                    className={`w-5 h-5 ${
                      unreadCount > 0 && !isDndActive ? 'yt-bell-ring text-amber-300' : ''
                    }`}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span className="font-mono font-black text-xs">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-mono font-black text-[10px] rounded-full border border-white shadow-md">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* YOUTUBE-STYLE NOTIFICATION POPOVER TRAY */}
              {isBellDropdownOpen && (
                <div className="yt-tray-spring fixed sm:absolute right-3 sm:right-0 top-20 sm:top-14 w-[94vw] sm:w-[440px] bg-slate-900 text-white rounded-3xl border-2 border-cyan-400 shadow-[0_14px_0_#020617,0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                  {/* YouTube Tray Top Bar */}
                  <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-black text-sm tracking-tight text-white">Notifications</h4>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black border border-cyan-400/30">
                        {bellTrayAlerts.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBellTab('ALL')}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black cursor-pointer transition ${
                          bellTab === 'ALL'
                            ? 'bg-cyan-400 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        All ({alertsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBellTab('UNREAD')}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black cursor-pointer transition ${
                          bellTab === 'UNREAD'
                            ? 'bg-cyan-400 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBellDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* SELECT ALL & 1-CLICK BULK DELETE ACTION BAR */}
                  <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-black text-cyan-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllBellTraySelected}
                        onChange={() => handleToggleSelectAllList(bellTrayAlerts)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span>Select All ({bellTrayAlerts.length})</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      {selectedIds.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={handleMarkSelectedRead}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-mono font-black cursor-pointer flex items-center gap-1 transition"
                          >
                            <Check className="w-3 h-3" /> Read ({selectedIds.length})
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-mono font-black shadow-[0_3px_0_#881337] cursor-pointer flex items-center gap-1 transition animate-pulse"
                          >
                            <Trash2 className="w-3 h-3" /> Delete Selected ({selectedIds.length})
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition"
                          >
                            Mark All Read
                          </button>
                          {bellTrayAlerts.length > 0 && (
                            <button
                              type="button"
                              onClick={handlePurge}
                              className="px-2.5 py-1 bg-rose-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-[10px] font-mono font-black cursor-pointer flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete All
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* YouTube-Style Notification Stream Items */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                    {bellTrayAlerts.length > 0 ? (
                      bellTrayAlerts.map(item => {
                        const isChecked = selectedIds.includes(item.id);
                        const isRemoving = removingIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`notif-card-3d px-4 py-3 flex items-start gap-3 transition hover:bg-slate-800/80 ${
                              isRemoving ? 'notif-removing' : ''
                            } ${
                              isChecked
                                ? 'bg-blue-950/70'
                                : !item.isRead
                                ? 'bg-slate-900'
                                : 'bg-slate-950/60 opacity-80'
                            }`}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOne(item.id)}
                              className="mt-2.5 w-4 h-4 accent-cyan-400 rounded cursor-pointer shrink-0"
                            />

                            {/* YouTube Unread Cyan Dot */}
                            <div className="mt-3.5 shrink-0">
                              {!item.isRead ? (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 block shadow-[0_0_8px_#22d3ee]" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-transparent block" />
                              )}
                            </div>

                            {/* 3D Avatar Badge */}
                            <div
                              onClick={() => {
                                setSelectedAlertModal(item);
                                setIsBellDropdownOpen(false);
                              }}
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 cursor-pointer mt-0.5 shadow-md ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-600'
                                  : item.severity === 'WARNING'
                                  ? 'bg-amber-500 text-slate-950'
                                  : item.severity === 'SUCCESS'
                                  ? 'bg-emerald-600'
                                  : 'bg-blue-600'
                              }`}
                            >
                              {item.title.substring(0, 2).toUpperCase()}
                            </div>

                            {/* Notification Text Content */}
                            <div
                              onClick={() => {
                                setSelectedAlertModal(item);
                                setIsBellDropdownOpen(false);
                              }}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <p className="text-xs font-black text-white leading-snug truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                                {item.msg}
                              </p>
                              <span className="text-[10px] font-mono text-cyan-300/80 block mt-1">
                                {item.time} • {item.lab}
                              </span>
                            </div>

                            {/* Quick Single Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAlert(item.id, item.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-xl transition cursor-pointer shrink-0"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center space-y-2 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs font-bold">No notifications in tray.</p>
                      </div>
                    )}
                  </div>

                  {/* Tray Footer */}
                  <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">
                      Selected: <strong className="text-cyan-300">{selectedIds.length}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBellDropdownOpen(false);
                        setIsDispatchModalOpen(true);
                      }}
                      className="text-cyan-300 hover:underline font-black cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Dispatch New Broadcast
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDndActive(!isDndActive);
                triggerToast(isDndActive ? 'Audible notifications enabled.' : 'DND Silent mode enabled.');
              }}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                isDndActive
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_4px_0_#78350f]'
                  : 'bg-slate-900 text-cyan-300 border-slate-700 shadow-[0_4px_0_#020617]'
              }`}
            >
              {isDndActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isDndActive ? 'DND Active' : 'Audible'}</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-[0_4px_0_#020617] flex items-center gap-1.5 cursor-pointer"
              title="Refresh Telemetry Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingData ? 'animate-pulse' : ''}`} />
              <span>Sync</span>
            </button>

            <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-2xl text-cyan-300 font-mono shadow-[0_4px_0_#020617] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{liveClock}</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3-COLUMN WORKSPACE GRID
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COLUMN 1: PRIORITY NOTIFICATIONS (WITH SELECT ALL & BULK DELETE) */}
          <div className="lg:col-span-5 notif-panel-3d p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b-2 border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono">
                    Priority Notifications
                  </h3>
                  <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {filteredAlerts.length} Active
                  </span>
                </div>

                {/* SELECT ALL CHECKBOX & ANIMATED DELETE SELECTED BUTTON */}
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-black text-blue-700 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={() => handleToggleSelectAllList(filteredAlerts)}
                      className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                    />
                    <span>Select All</span>
                  </label>

                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-[10px] rounded-xl shadow-[0_3px_0_#881337] cursor-pointer flex items-center gap-1 animate-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete ({selectedIds.length})</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-blue-600" />
                  <input
                    type="text"
                    placeholder="Filter notifications..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 w-full font-bold bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value as any)}
                  className="col-span-4 text-[11px] border-2 border-slate-300 rounded-xl px-2 py-1.5 font-black outline-none bg-slate-100 text-slate-800 cursor-pointer"
                >
                  <option value="ALL">All Priority</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>

              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map(alert => {
                    const isChecked = selectedIds.includes(alert.id);
                    const isRemoving = removingIds.includes(alert.id);
                    return (
                      <div
                        key={alert.id}
                        className={`notif-card-3d p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between gap-2.5 ${
                          isRemoving ? 'notif-removing' : ''
                        } ${
                          isChecked
                            ? 'bg-blue-50/90 border-blue-500 shadow-[0_4px_0_#93c5fd]'
                            : alert.isRead
                            ? 'bg-slate-50/70 border-slate-200 opacity-75'
                            : 'bg-white border-blue-200 shadow-[0_4px_0_#e2e8f0] hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(alert.id)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                          />

                          <div
                            onClick={() => setSelectedAlertModal(alert)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0 ${
                              alert.category === 'documents'
                                ? 'bg-emerald-600'
                                : alert.severity === 'CRITICAL'
                                ? 'bg-rose-600'
                                : alert.severity === 'WARNING'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-indigo-600'
                            }`}
                          >
                            {alert.category === 'documents' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              alert.title.substring(0, 2).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0 flex-1" onClick={() => setSelectedAlertModal(alert)}>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-slate-900 text-xs truncate">{alert.title}</h4>
                              {!alert.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-bold block truncate">
                              {alert.time} • {alert.lab}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono font-black text-slate-800 text-xs pr-1">
                            {alert.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(alert)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 rounded-lg text-blue-600 hover:text-white transition cursor-pointer"
                            title="Edit Alert"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(alert.id, alert.title)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 rounded-lg text-rose-600 hover:text-white transition cursor-pointer"
                            title="Dismiss"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-500 text-xs font-bold">No matching notifications.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSeverityFilter('ALL');
                        setCategories({
                          documents: true,
                          dnd: true,
                          hardware: true,
                          desktopFleet: true,
                          userLog: true,
                          security: true,
                          network: true
                        });
                        setAlertsList(defaultAlerts);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-500 cursor-pointer"
                    >
                      Reset Filters &amp; Restore
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[10px] rounded-xl border border-slate-300 transition cursor-pointer text-center"
              >
                Mark Read
              </button>
              <button
                type="button"
                onClick={() => handleToggleSelectAllList(filteredAlerts)}
                className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[10px] rounded-xl border border-slate-300 transition cursor-pointer text-center"
              >
                {isAllFilteredSelected ? 'Unselect' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={selectedIds.length > 0 ? handleDeleteSelected : handlePurge}
                className="py-2 px-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-black text-[10px] rounded-xl border border-rose-200 transition cursor-pointer text-center"
              >
                {selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete All'}
              </button>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(true)}
                className="py-2 px-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] rounded-xl shadow-[0_3px_0_#1e3a8a] transition cursor-pointer text-center"
              >
                Broadcast
              </button>
            </div>
          </div>

          {/* COLUMN 2: INCIDENT FREQUENCY (WITH 3D ANIMATED EQUALIZER & LASER SWEEP) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="notif-panel-3d p-5 rounded-3xl space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b-2 border-slate-100 pb-2 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono">
                    Incident Frequency
                  </h3>
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    LIVE PULSE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-sans font-bold block text-[10px]">Peak Release</span>
                    <strong className="text-slate-900 font-black">95 Alerts</strong>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-sans font-bold block text-[10px]">Average</span>
                    <strong className="text-slate-900 font-black">42 / hr</strong>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-sans font-bold block text-[10px]">Document Logs</span>
                    <strong className="text-emerald-600 font-black">100% Synced</strong>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-sans font-bold block text-[10px]">Acknowledge</span>
                    <strong className="text-blue-600 font-black">{notifSuccess}%</strong>
                  </div>
                </div>

                {/* 3D Animated Telemetry Equalizer with Laser Sweep */}
                <div className="h-36 w-full bg-slate-950 rounded-2xl border-2 border-slate-800 p-3.5 flex items-end justify-between gap-2 relative overflow-hidden shadow-inner">
                  <div className="telemetry-laser-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
                  {barSeries.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 z-10">
                      <span className="text-[8.5px] font-mono font-bold text-cyan-300">{h}%</span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          h > 75
                            ? 'bg-gradient-to-t from-rose-600 via-orange-500 to-amber-300 shadow-[0_0_10px_rgba(244,63,94,0.45)]'
                            : 'bg-gradient-to-t from-blue-600 via-cyan-500 to-emerald-300 shadow-[0_0_8px_rgba(56,189,248,0.35)]'
                        }`}
                        style={{ height: `${Math.max(15, h * 0.78)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-black text-xs rounded-2xl border border-slate-700 shadow-[0_4px_0_#020617] transition cursor-pointer flex items-center justify-center gap-2 active:translate-y-0.5"
                >
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Trigger Broadcast</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: CATEGORIES & ACTIONS */}
          <div className="lg:col-span-3 notif-panel-3d p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono">
                  Categories
                </h3>
                <Filter className="w-4 h-4 text-blue-600" />
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.documents}
                    onChange={() => toggleCat('documents')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span className="text-emerald-700 font-black">Document &amp; Report Logs</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.dnd}
                    onChange={() => toggleCat('dnd')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Trap / DND Alerts</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.hardware}
                    onChange={() => toggleCat('hardware')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Hardware Faults</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.desktopFleet}
                    onChange={() => toggleCat('desktopFleet')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Desktop Fleet</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.userLog}
                    onChange={() => toggleCat('userLog')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>User Session Log</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.security}
                    onChange={() => toggleCat('security')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Security Breaches</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={categories.network}
                    onChange={() => toggleCat('network')}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span>Network Telemetry</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#1e3a8a] transition cursor-pointer flex items-center justify-center gap-2 active:translate-y-0.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start Broadcast</span>
              </button>
              <button
                type="button"
                onClick={handlePurge}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-black text-xs rounded-2xl border border-rose-200 transition cursor-pointer text-center"
              >
                Purge Desk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODALS (DISPATCH, EDIT, INSPECT)
         ===================================================================== */}

      {/* DISPATCH MODAL */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" /> Dispatch System Broadcast
              </h3>
              <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-800">Alert Title (Auto-Detects Category &amp; Severity)</label>
                <input
                  type="text"
                  value={dispatchTitle}
                  onChange={e => {
                    const val = e.target.value;
                    setDispatchTitle(val);
                    autoDetectBroadcastClassification(val, dispatchMsg);
                  }}
                  required
                  placeholder="e.g. Scheduled System Maintenance"
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-800">Severity</label>
                  <select
                    value={dispatchSeverity}
                    onChange={e => setDispatchSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none font-black cursor-pointer"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-800">Category (type or select)</label>
                  <input
                    type="text"
                    list="dispatch-category-list"
                    value={dispatchCategory}
                    onChange={e => setDispatchCategory(e.target.value)}
                    placeholder="e.g. hardware, network"
                    required
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                  <datalist id="dispatch-category-list">
                    <option value="documents">Document Log</option>
                    <option value="dnd">Trap / DND</option>
                    <option value="hardware">Hardware</option>
                    <option value="desktopFleet">Desktop Fleet</option>
                    <option value="userLog">User Session</option>
                    <option value="security">Security</option>
                    <option value="network">Network</option>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-slate-800">Message</label>
                <textarea
                  rows={3}
                  value={dispatchMsg}
                  onChange={e => {
                    const val = e.target.value;
                    setDispatchMsg(val);
                    autoDetectBroadcastClassification(dispatchTitle, val);
                  }}
                  required
                  placeholder="Broadcast message content..."
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#1e3a8a] cursor-pointer"
                >
                  Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 bg-slate-100 text-slate-700 font-black py-2.5 rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                <Edit className="w-4 h-4" /> Edit Pending Alert Broadcast
              </h3>
              <button type="button" onClick={() => setEditingAlert(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateAlert} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-800">Alert Title</label>
                <input
                  type="text"
                  value={dispatchTitle}
                  onChange={e => setDispatchTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-800">Severity</label>
                  <select
                    value={dispatchSeverity}
                    onChange={e => setDispatchSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none font-black cursor-pointer"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-800">Category (type or select)</label>
                  <input
                    type="text"
                    list="edit-category-list"
                    value={dispatchCategory}
                    onChange={e => setDispatchCategory(e.target.value)}
                    placeholder="e.g. hardware, network"
                    required
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                  />
                  <datalist id="edit-category-list">
                    <option value="documents">Document Log</option>
                    <option value="dnd">Trap / DND</option>
                    <option value="hardware">Hardware</option>
                    <option value="desktopFleet">Desktop Fleet</option>
                    <option value="userLog">User Session</option>
                    <option value="security">Security</option>
                    <option value="network">Network</option>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-slate-800">Target Lab</label>
                <input
                  type="text"
                  value={dispatchTargetLab}
                  onChange={e => setDispatchTargetLab(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-800">Message Content</label>
                <textarea
                  rows={3}
                  value={dispatchMsg}
                  onChange={e => setDispatchMsg(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#1e3a8a] cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAlert(null)}
                  className="px-4 bg-slate-100 text-slate-700 font-black py-2.5 rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" /> Alert Details
              </h3>
              <button type="button" onClick={() => setSelectedAlertModal(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
              <div>
                <span className="text-slate-400">Title:</span>{' '}
                <strong className="text-slate-900 font-black">{selectedAlertModal.title}</strong>
              </div>
              <div>
                <span className="text-slate-400">Severity:</span>{' '}
                <strong className="text-blue-600 font-mono font-black">{selectedAlertModal.severity}</strong>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <strong className="text-slate-900">{selectedAlertModal.categoryLabel}</strong>
              </div>
              <div>
                <span className="text-slate-400">Target Lab:</span>{' '}
                <strong className="text-slate-900">{selectedAlertModal.lab}</strong>
              </div>
              <div>
                <span className="text-slate-400">Time:</span>{' '}
                <strong className="text-slate-900 font-mono">{selectedAlertModal.time}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="text-slate-400 block mb-1">Message:</span>
                <p className="text-slate-800 font-semibold">{selectedAlertModal.msg}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleRead(selectedAlertModal.id);
                  setSelectedAlertModal(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#1e3a8a] cursor-pointer"
              >
                {selectedAlertModal.isRead ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAlert(selectedAlertModal.id, selectedAlertModal.title)}
                className="px-4 bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManagementView;











