import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle2,
  XCircle, AlertCircle, Plus, Search, Filter, Trash2, Edit3, X,
  ChevronLeft, ChevronRight, Check, FileText, Activity, ShieldAlert,
  Tag, Layers, Sparkles, Grid, List, RefreshCw, Monitor, Download, Play
} from 'lucide-react';

export interface ReservationItem {
  id: string;
  title: string;
  labRoom: string;
  reservedBy: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
  pcsReserved: number;
}

export interface ReservationsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

// ============================================================================
// LEVITATING 3D ISOMETRIC INSTRUCTOR SCHEDULER RIG (FULL ANIMATED 3D COMPUTER)
// ============================================================================
const IsometricReservationRig: React.FC<{ activeCount: number }> = ({ activeCount }) => {
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full res-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="blueResCoreGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.96" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Extruded Blue Base */}
        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        {/* Animated Isometric Sky-Blue Data Trace */}
        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="res-circuit-flow"
        />

        {/* 3D Tempered-Glass Time-Sync Tower */}
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
            style={{ transformOrigin: '103.5px 37px', animationDuration: '2.6s' }}
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
            style={{ transformOrigin: '103.5px 55px', animationDuration: '2.6s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        {/* 3D Isometric Instructor Timetable Monitor */}
        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#blueResCoreGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
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
            {activeCount} SCHED
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke="#93c5fd" strokeWidth="1.1" />
      </svg>
    </div>
  );
};

const getTodayIsoDate = (): string => new Date().toISOString().split('T')[0];

const getOffsetIsoDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_LABS_SEED = [
  { id: 'LAB-101', labName: 'ComLab 1 (Networking & ICT)', capacity: 45, status: 'Active' },
  { id: 'LAB-102', labName: 'ComLab 2 (Multimedia & Graphics)', capacity: 40, status: 'Active' },
  { id: 'LAB-103', labName: 'ComLab 3 (AI & Software Eng)', capacity: 50, status: 'Active' },
  { id: 'LAB-104', labName: 'ComLab 4 (Cybersecurity & IoT)', capacity: 35, status: 'Active' }
];

const DEFAULT_RESERVATIONS_SEED: ReservationItem[] = [
  {
    id: 'RES-2026-101',
    title: 'IS 301 — Enterprise Architecture & Cloud Lab',
    labRoom: 'ComLab 1 (Networking & ICT)',
    reservedBy: 'Prof. Ramon Magsaysay',
    date: getTodayIsoDate(),
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    purpose: 'Hands-on ASP.NET Core Web API & VLAN Routing Laboratory Session',
    status: 'In Progress',
    pcsReserved: 42
  },
  {
    id: 'RES-2026-102',
    title: 'CS 204 — 2D/3D Multimedia & Shader Rendering',
    labRoom: 'ComLab 2 (Multimedia & Graphics)',
    reservedBy: 'Prof. Maria Clara Santos',
    date: getTodayIsoDate(),
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    purpose: 'GPU-accelerated 3D isometric asset modeling & animation',
    status: 'Approved',
    pcsReserved: 38
  },
  {
    id: 'RES-2026-103',
    title: 'IT 402 — Capstone Prototype Defense Dry-Run',
    labRoom: 'ComLab 3 (AI & Software Eng)',
    reservedBy: 'Engr. Marco Polo Reyes',
    date: getTodayIsoDate(),
    startTime: '01:00 PM',
    endTime: '04:00 PM',
    purpose: 'Full-stack system deployment & QR hardware integration testing',
    status: 'Pending',
    pcsReserved: 45
  },
  {
    id: 'RES-2026-104',
    title: 'IS 202 — Database Management & SQL Tuning',
    labRoom: 'ComLab 4 (Cybersecurity & IoT)',
    reservedBy: 'Prof. Ricardo Dalisay',
    date: getOffsetIsoDate(1),
    startTime: '08:00 AM',
    endTime: '11:00 AM',
    purpose: 'PostgreSQL indexing, backup verification, and transaction isolation lab',
    status: 'Approved',
    pcsReserved: 32
  },
  {
    id: 'RES-2026-105',
    title: 'CS 105 — Data Structures: Stack & Array Lab Exam',
    labRoom: 'ComLab 1 (Networking & ICT)',
    reservedBy: 'Prof. Elena Alcantara',
    date: getOffsetIsoDate(2),
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    purpose: 'Practical Java & TypeScript coding examination on Stack/Array algorithms',
    status: 'Approved',
    pcsReserved: 40
  }
];

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 480;
  const clean = timeStr.trim().toUpperCase();
  const parts = clean.split(/\s+/);
  const [hStr, mStr] = (parts[0] || '08:00').split(':');
  let h = parseInt(hStr, 10) || 8;
  const m = parseInt(mStr, 10) || 0;
  const period = parts[1] || 'AM';
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';

  // Filter & Search States
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'Calendar' | 'Agenda'>('Calendar');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Calendar Month/Year Navigation State
  const [calendarRefDate, setCalendarRefDate] = useState<Date>(() => new Date());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [inspectReservation, setInspectReservation] = useState<ReservationItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Custom Centered Delete Modal State
  const [reservationToDelete, setReservationToDelete] = useState<ReservationItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Input States for Adding Reservation
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLabRoom, setNewLabRoom] = useState<string>('ComLab 1 (Networking & ICT)');
  const [newReservedBy, setNewReservedBy] = useState<string>('Prof. Ramon Magsaysay');
  const [newDate, setNewDate] = useState<string>(getTodayIsoDate());
  const [newStartTime, setNewStartTime] = useState<string>('08:00 AM');
  const [newEndTime, setNewEndTime] = useState<string>('10:00 AM');
  const [newPurpose, setNewPurpose] = useState<string>('CS/IS Hands-on Laboratory Class');
  const [newPcsReserved, setNewPcsReserved] = useState<number>(40);

  // Persistent Labs & Reservations State
  const [labs, setLabs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_labs_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LABS_SEED;
  });

  const [reservations, setReservations] = useState<ReservationItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_reservations_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_RESERVATIONS_SEED;
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const triggerToast = useCallback(
    (msg: string) => {
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 3500);
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      if (labs.length > 0) localStorage.setItem('labtrack_labs_v3', JSON.stringify(labs));
    } catch {}
  }, [labs]);

  useEffect(() => {
    try {
      if (reservations.length > 0) {
        localStorage.setItem('labtrack_reservations_v3', JSON.stringify(reservations));
      }
    } catch {}
  }, [reservations]);

  // Fetch Labs & Reservations from Backend API with Safe Fallbacks
  const fetchAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [labsRes, resvRes] = await Promise.all([
        apiClient.get('/api/v1/laboratories').catch(() => null),
        apiClient.get('/api/v1/reservations').catch(() => null)
      ]);

      const labsData = labsRes?.data?.data?.items || labsRes?.data?.data || labsRes?.data || [];
      if (Array.isArray(labsData) && labsData.length > 0) {
        setLabs(labsData);
      }

      const resvData = resvRes?.data?.data?.items || resvRes?.data?.data || resvRes?.data || [];
      if (Array.isArray(resvData) && resvData.length > 0) {
        const mapped: ReservationItem[] = resvData.map((r: any, idx: number) => ({
          id: r.id ? String(r.id) : `RES-API-${100 + idx}`,
          title: r.title || r.purpose?.split(' - ')[0] || 'Laboratory Class Session',
          labRoom: r.labRoom || r.laboratoryName || r.labName || 'ComLab 1 (Networking & ICT)',
          reservedBy: r.reservedBy || r.instructorName || r.userName || 'Faculty Instructor',
          date: r.date || (r.startTimeUtc ? String(r.startTimeUtc).split('T')[0] : getTodayIsoDate()),
          startTime:
            r.startTime ||
            (r.startTimeUtc
              ? new Date(r.startTimeUtc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '08:00 AM'),
          endTime:
            r.endTime ||
            (r.endTimeUtc
              ? new Date(r.endTimeUtc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '10:00 AM'),
          purpose: r.purpose || 'Scheduled laboratory instruction and workstation utilization.',
          status: r.status || 'Approved',
          pcsReserved: Number(r.pcsReserved) || 35
        }));

        setReservations(prev => {
          const map = new Map<string, ReservationItem>();
          mapped.forEach(item => map.set(item.id, item));
          prev.forEach(localItem => {
            if (!map.has(localItem.id)) map.set(localItem.id, localItem);
          });
          return Array.from(map.values());
        });
      }
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Active Laboratory Tag Filters
  const [labTags, setLabTags] = useState<{ id: string; name: string; active: boolean }[]>([]);

  useEffect(() => {
    if (labs.length > 0) {
      setLabTags(prev =>
        labs.map(lab => {
          const labName = lab.labName || lab.name || 'Unknown Lab';
          const existing = prev.find(t => t.id === lab.id);
          return {
            id: lab.id,
            name: labName,
            active: existing ? existing.active : true
          };
        })
      );
    }
  }, [labs]);

  const toggleTag = (id: string) => {
    setLabTags(prev => prev.map(tag => (tag.id === id ? { ...tag, active: !tag.active } : tag)));
  };

  // Real-Time Conflict Detector for the New Reservation Modal
  const conflictingReservation = useMemo(() => {
    const newStartMins = parseTimeToMinutes(newStartTime);
    const newEndMins = parseTimeToMinutes(newEndTime);
    const targetRoom = newLabRoom.trim().toLowerCase();

    return reservations.find(r => {
      if (r.status === 'Rejected') return false;
      if (r.date !== newDate) return false;
      const roomMatch =
        r.labRoom.trim().toLowerCase() === targetRoom ||
        r.labRoom.toLowerCase().includes(targetRoom) ||
        targetRoom.includes(r.labRoom.toLowerCase());
      if (!roomMatch) return false;

      const rStart = parseTimeToMinutes(r.startTime);
      const rEnd = parseTimeToMinutes(r.endTime);
      return newStartMins < rEnd && newEndMins > rStart;
    });
  }, [reservations, newLabRoom, newDate, newStartTime, newEndTime]);

  // Filtered Reservations List
  const filteredReservations = useMemo(() => {
    const activeTagNames = labTags.filter(t => t.active).map(t => t.name.toLowerCase());

    return reservations.filter(item => {
      const roomLower = (item.labRoom || '').toLowerCase();
      const matchesTag =
        labTags.length === 0 ||
        activeTagNames.some(tagName => roomLower.includes(tagName) || tagName.includes(roomLower));

      const matchesLab =
        !selectedLabFilter.trim() ||
        roomLower.includes((selectedLabFilter || '').toLowerCase().trim());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDate = !selectedDateFilter || item.date === selectedDateFilter;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.reservedBy || '').toLowerCase().includes(q) ||
        roomLower.includes(q) ||
        (item.purpose || '').toLowerCase().includes(q);

      return matchesTag && matchesLab && matchesStatus && matchesSearch && matchesDate;
    });
  }, [reservations, labTags, selectedLabFilter, statusFilter, searchQuery, selectedDateFilter]);

  // CRUD: CREATE
  const parseTimeTo24 = (timeStr: string): string => {
    const parts = timeStr.trim().split(' ');
    const timePart = parts[0];
    const period = (parts[1] || 'AM').toUpperCase();
    const [h, m] = timePart.split(':').map(Number);
    let hour24 = h;
    if (period === 'PM' && h !== 12) hour24 = h + 12;
    if (period === 'AM' && h === 12) hour24 = 0;
    return String(hour24).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ':00';
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReservedBy.trim()) return;

    const startDateTime = newDate + 'T' + parseTimeTo24(newStartTime);
    const endDateTime = newDate + 'T' + parseTimeTo24(newEndTime);

    const matchedLab = labs.find((l: any) => {
      const labName = (l.name || l.labName || l.code || '').toString().trim().toLowerCase();
      const target = newLabRoom.trim().toLowerCase();
      return labName === target || labName.includes(target) || target.includes(labName);
    });
    const matchedLabId = matchedLab?.id || matchedLab?.labId || matchedLab?.Id || null;

    const newItem: ReservationItem = {
      id: `RES-2026-${Math.floor(110 + Math.random() * 880)}`,
      title: newTitle.trim(),
      labRoom: newLabRoom.trim(),
      reservedBy: newReservedBy.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      purpose: newPurpose.trim() || 'Laboratory Class Session',
      status: conflictingReservation ? 'Pending' : 'Approved',
      pcsReserved: Number(newPcsReserved) || 30
    };

    setReservations(prev => [newItem, ...prev]);
    setNewTitle('');
    setIsAddModalOpen(false);
    triggerToast(`Reservation "${newItem.title}" scheduled for ${newItem.labRoom} (${newItem.date})!`);

    if (matchedLabId) {
      try {
        await apiClient.post('/api/v1/reservations', {
          labId: matchedLabId,
          purpose: newItem.title + ' - ' + newItem.purpose,
          startTime: startDateTime,
          endTime: endDateTime
        });
      } catch {}
    }
  };

  // CRUD: UPDATE
  const handleSaveEdit = () => {
    if (!inspectReservation) return;
    setReservations(prev =>
      prev.map(r => (r.id === inspectReservation.id ? inspectReservation : r))
    );
    setIsEditing(false);
    triggerToast(`Updated schedule details for "${inspectReservation.title}".`);
  };

  const handleUpdateStatus = (id: string, newStatus: ReservationItem['status']) => {
    const target = reservations.find(r => r.id === id);
    setReservations(prev => prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)));
    if (inspectReservation?.id === id) {
      setInspectReservation({ ...inspectReservation, status: newStatus });
    }
    triggerToast(`Marked "${target?.title || id}" as ${newStatus}.`);
  };

  // CRUD: DELETE (With Smooth 3D Slide-Out Animation)
  const handleConfirmDelete = () => {
    if (!reservationToDelete) return;
    const id = reservationToDelete.id;
    const title = reservationToDelete.title;
    setDeletingId(id);
    setReservationToDelete(null);

    setTimeout(() => {
      setReservations(prev => prev.filter(r => r.id !== id));
      if (inspectReservation?.id === id) setInspectReservation(null);
      setDeletingId(null);
      triggerToast(`Removed schedule "${title}" from timetable.`);
    }, 320);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Reservation ID', 'Course / Event Title', 'Laboratory Room', 'Instructor / Reserved By', 'Date', 'Start Time', 'End Time', 'PCs Reserved', 'Status', 'Purpose'],
      ...filteredReservations.map(r => [
        r.id,
        `"${r.title}"`,
        `"${r.labRoom}"`,
        `"${r.reservedBy}"`,
        r.date,
        r.startTime,
        r.endTime,
        r.pcsReserved,
        r.status,
        `"${(r.purpose || '').replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_Instructor_Reservations_${getTodayIsoDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported Laboratory Reservations Timetable to CSV.');
  };

  // Interactive Calendar Month Grid Generator
  const calendarMeta = useMemo(() => {
    const year = calendarRefDate.getFullYear();
    const month = calendarRefDate.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthLabel = calendarRefDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const todayIso = getTodayIsoDate();

    const days = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayReservations = filteredReservations.filter(r => r.date === formattedDate);
      return {
        dayNum,
        formattedDate,
        isToday: formattedDate === todayIso,
        count: dayReservations.length,
        items: dayReservations,
        hasReservation: dayReservations.length > 0
      };
    });

    return { year, month, firstDayWeekday, monthLabel, days };
  }, [calendarRefDate, filteredReservations]);

  // Summary Counts
  const inProgressCount = useMemo(
    () => reservations.filter(r => r.status === 'In Progress').length,
    [reservations]
  );
  const approvedCount = useMemo(
    () => reservations.filter(r => r.status === 'Approved').length,
    [reservations]
  );
  const pendingCount = useMemo(
    () => reservations.filter(r => r.status === 'Pending').length,
    [reservations]
  );
  const rejectedCount = useMemo(
    () => reservations.filter(r => r.status === 'Rejected').length,
    [reservations]
  );
  return (
    <div className="inst-blue-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* SOFT-TONED ROYAL & SLATE BLUE 3D EXTRUDED STYLES ("SAKTO LANG NA BLUE") */}
      <style>{`
        .inst-blue-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .inst-blue-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .res-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .res-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -4px, 8px) rotateX(1.5deg);
        }
        .inst-blue-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .inst-blue-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .inst-blue-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes resRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .res-rig-float {
          animation: resRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes resCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .res-circuit-flow {
          animation: resCircuitDash 1.4s linear infinite;
        }
        @keyframes resHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .res-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: resHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY */}
      <datalist id="lab-room-suggestions">
        {labs.map(lab => (
          <option key={lab.id} value={lab.labName || lab.name || ''} />
        ))}
      </datalist>

      <datalist id="time-slot-suggestions">
        <option value="07:30 AM" />
        <option value="08:00 AM" />
        <option value="09:00 AM" />
        <option value="10:00 AM" />
        <option value="11:00 AM" />
        <option value="12:00 PM" />
        <option value="01:00 PM" />
        <option value="02:00 PM" />
        <option value="03:00 PM" />
        <option value="04:00 PM" />
        <option value="05:00 PM" />
      </datalist>

      {/* LIVE TOAST FEEDBACK BANNER */}
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
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR (WITH FLOATING 3D RIG)
         ===================================================================== */}
      <div className="res-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricReservationRig activeCount={reservations.length} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-sky-200 rounded-full font-mono font-black text-[10px] border border-blue-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-300 animate-ping" />
                <span>INSTRUCTOR TIMETABLE SYNC • {currentTime.toLocaleTimeString()}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800/80 text-slate-200 rounded-full font-mono font-black text-[10px] border border-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-300" /> {activeCampus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Lab Reservations &amp; Class Schedules
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Interactive 3D room readiness matrix, conflict-guarded class booking, and workstation seat allocation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* 3D View Mode Switcher */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-2xl border border-slate-700 text-xs font-black shadow-[0_4px_0_#020617]">
            <button
              type="button"
              onClick={() => setActiveViewTab('Calendar')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'Calendar'
                  ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('Agenda')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'Agenda'
                  ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda List ({filteredReservations.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchAllData();
              triggerToast('Synchronized laboratory schedules and room capacities.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>CSV</span>
          </button>

          {/* Add Reservation 3D Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. TWO-COLUMN 3D WORKSPACE LAYOUT (BALANCED SLATE-BLUE PALETTE)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT PANEL: TODAY'S LAB OVERVIEW & 3D SLATE-BLUE ROOM CARDS (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="inst-blue-panel-3d p-5 sm:p-6 rounded-3xl space-y-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3.5">
                <div>
                  <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                    REAL-TIME ROOM TELEMETRY
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Today&apos;s Lab Overview
                  </h2>
                </div>
                <span className="px-3 py-1 bg-slate-900 text-sky-200 rounded-xl text-xs font-mono font-black shadow-[0_3px_0_#0f172a]">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* 3D Soft-Toned Slate-Blue Room Readiness Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {labs.slice(0, 4).map(lab => {
                  const labName = lab.labName || lab.name || 'Unknown Lab';
                  const labCapacity = Number(lab.capacity) || 40;
                  const labStatus = (lab.status || 'Active').toLowerCase();
                  const isActive = labStatus === 'active';

                  const todayStr = getTodayIsoDate();
                  const todayRes = reservations.filter(
                    r =>
                      r.status !== 'Rejected' &&
                      (r.labRoom.toLowerCase().includes(labName.split('(')[0].trim().toLowerCase()) ||
                        labName.toLowerCase().includes(r.labRoom.split('(')[0].trim().toLowerCase())) &&
                      r.date === todayStr
                  );
                  const nextRes = todayRes[0];
                  const seatPct = nextRes
                    ? Math.min(100, Math.round((nextRes.pcsReserved / Math.max(1, labCapacity)) * 100))
                    : 0;

                  return (
                    <div
                      key={lab.id}
                      onClick={() => {
                        setNewLabRoom(labName);
                        setNewPcsReserved(labCapacity);
                        setIsAddModalOpen(true);
                      }}
                      title="Click to book a class in this laboratory"
                      className="res-card-3d-lift bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white p-4 rounded-2xl border-2 border-blue-400/40 hover:border-sky-300 shadow-[0_6px_0_#0f172a] space-y-2.5 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono font-black uppercase text-sky-300 tracking-wider truncate">
                          {labName.split('(')[0].trim()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
                            nextRes?.status === 'In Progress'
                              ? 'bg-sky-400 text-slate-950 animate-pulse'
                              : isActive
                              ? 'bg-blue-500/25 text-sky-200 border border-blue-400/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {nextRes?.status === 'In Progress' ? 'IN SESSION' : isActive ? 'READY' : 'OFFLINE'}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-black text-white truncate">
                          {nextRes ? nextRes.title : 'Available for Booking'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-300 truncate mt-0.5">
                          {nextRes
                            ? `${nextRes.startTime} - ${nextRes.endTime} • ${nextRes.reservedBy}`
                            : 'Click card to reserve slot'}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-slate-700/80">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-300">
                            {nextRes ? `${nextRes.pcsReserved}/${labCapacity} PCs` : `${labCapacity} PCs Ready`}
                          </span>
                          <span className={nextRes ? 'text-sky-300 font-black' : 'text-blue-200 font-black'}>
                            {nextRes ? `${seatPct}% Booked` : 'Open Slot +'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              nextRes ? 'bg-gradient-to-r from-blue-400 to-sky-300' : 'bg-blue-500/40'
                            }`}
                            style={{ width: `${nextRes ? seatPct : 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 Interactive Status KPI Counters */}
            <div className="pt-4 border-t-2 border-slate-100 grid grid-cols-4 gap-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress');
                  setActiveViewTab('Agenda');
                }}
                className={`res-card-3d-lift p-2.5 rounded-2xl border-2 cursor-pointer ${
                  statusFilter === 'In Progress'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-[0_4px_0_#1e3a8a]'
                    : 'bg-blue-50/80 text-blue-900 border-blue-200'
                }`}
              >
                <p className="text-[9.5px] font-mono font-black uppercase">In Session</p>
                <p className="text-lg font-black font-mono">{inProgressCount}</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === 'Approved' ? 'All' : 'Approved');
                  setActiveViewTab('Agenda');
                }}
                className={`res-card-3d-lift p-2.5 rounded-2xl border-2 cursor-pointer ${
                  statusFilter === 'Approved'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-[0_4px_0_#0369a1]'
                    : 'bg-sky-50/80 text-sky-900 border-sky-200'
                }`}
              >
                <p className="text-[9.5px] font-mono font-black uppercase">Approved</p>
                <p className="text-lg font-black font-mono">{approvedCount}</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending');
                  setActiveViewTab('Agenda');
                }}
                className={`res-card-3d-lift p-2.5 rounded-2xl border-2 cursor-pointer ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-[0_4px_0_#78350f]'
                    : 'bg-amber-50/80 text-amber-900 border-amber-200'
                }`}
              >
                <p className="text-[9.5px] font-mono font-black uppercase">Pending</p>
                <p className="text-lg font-black font-mono">{pendingCount}</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === 'Rejected' ? 'All' : 'Rejected');
                  setActiveViewTab('Agenda');
                }}
                className={`res-card-3d-lift p-2.5 rounded-2xl border-2 cursor-pointer ${
                  statusFilter === 'Rejected'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-[0_4px_0_#881337]'
                    : 'bg-rose-50/80 text-rose-900 border-rose-200'
                }`}
              >
                <p className="text-[9.5px] font-mono font-black uppercase">Rejected</p>
                <p className="text-lg font-black font-mono">{rejectedCount}</p>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: 3D CALENDAR GRID & AGENDA SCHEDULER (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inst-blue-panel-3d p-5 sm:p-6 rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Controls & Filters */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                    INTERACTIVE TIMETABLE MATRIX
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Calendar Grid + Agenda Stream
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search course, prof, lab..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-slate-50 pl-8 pr-3 py-2 rounded-xl border-2 border-slate-300 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white w-full sm:w-44"
                    />
                  </div>

                  {/* DUAL INPUT FOR FILTERING LABS */}
                  <div className="relative">
                    <input
                      type="text"
                      list="lab-room-suggestions"
                      placeholder="Filter by Lab..."
                      value={selectedLabFilter}
                      onChange={e => setSelectedLabFilter(e.target.value)}
                      className="bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white w-36"
                    />
                    {selectedLabFilter && (
                      <button
                        type="button"
                        onClick={() => setSelectedLabFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-slate-100 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="In Progress">In Session</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Interactive Room Tags Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider mr-1">
                  Active Rooms:
                </span>
                {labTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-black transition cursor-pointer flex items-center gap-1.5 border ${
                      tag.active
                        ? 'bg-slate-900 text-sky-300 border-blue-400/50 shadow-[0_3px_0_#1e3a8a]'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tag.name.split('(')[0].trim()}</span>
                    {tag.active && <Check className="w-3 h-3 text-sky-300" />}
                  </button>
                ))}
              </div>

              {/* TAB RENDER: CALENDAR MONTHLY GRID OR AGENDA LIST */}
              {activeViewTab === 'Calendar' ? (
                <div className="space-y-3">
                  {/* Month Navigation Bar (Balanced Slate-Blue Theme) */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-4 py-2.5 rounded-2xl border border-blue-400/40 shadow-[0_4px_0_#0f172a]">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarRefDate(
                          new Date(calendarRefDate.getFullYear(), calendarRefDate.getMonth() - 1, 1)
                        )
                      }
                      className="p-1.5 hover:bg-white/10 rounded-xl text-sky-300 cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-sky-300" />
                      <span className="font-mono font-black text-sm tracking-wide">
                        {calendarMeta.monthLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCalendarRefDate(new Date())}
                        className="px-2.5 py-1 bg-blue-500/25 hover:bg-blue-500/35 text-sky-200 border border-blue-400/40 rounded-lg text-[10px] font-mono font-black cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarRefDate(
                            new Date(calendarRefDate.getFullYear(), calendarRefDate.getMonth() + 1, 1)
                          )
                        }
                        className="p-1.5 hover:bg-white/10 rounded-xl text-sky-300 cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* 3D Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: calendarMeta.firstDayWeekday }, (_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="h-16 rounded-xl bg-slate-50/40 border border-dashed border-slate-200/60"
                      />
                    ))}

                    {calendarMeta.days.map(item => (
                      <div
                        key={item.formattedDate}
                        onClick={() => {
                          if (item.hasReservation) {
                            setSelectedDateFilter(
                              selectedDateFilter === item.formattedDate ? null : item.formattedDate
                            );
                            setActiveViewTab('Agenda');
                          } else {
                            setNewDate(item.formattedDate);
                            setIsAddModalOpen(true);
                          }
                        }}
                        title={
                          item.hasReservation
                            ? `${item.count} scheduled class(es) on ${item.formattedDate} — Click to view in Agenda`
                            : `Click to schedule a class on ${item.formattedDate}`
                        }
                        className={`res-card-3d-lift h-16 p-1.5 rounded-xl border-2 transition flex flex-col justify-between cursor-pointer ${
                          item.hasReservation
                            ? 'bg-gradient-to-b from-blue-50/90 to-sky-100/70 border-blue-400 text-blue-950 shadow-[0_3px_0_#93c5fd]'
                            : item.isToday
                            ? 'bg-slate-100 border-blue-500 text-blue-900 shadow-[0_3px_0_#60a5fa]'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-black ${
                              item.isToday
                                ? 'bg-blue-600 text-white px-1.5 py-0.2 rounded-md'
                                : ''
                            }`}
                          >
                            {item.dayNum}
                          </span>
                          {item.hasReservation && (
                            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-md font-mono font-black">
                              {item.count}
                            </span>
                          )}
                        </div>

                        {item.hasReservation ? (
                          <div className="text-[8.5px] font-mono font-bold text-blue-900 truncate bg-white/95 px-1 py-0.5 rounded border border-blue-200">
                            {item.items[0]?.title}
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono text-slate-300 self-end">+ Book</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[390px] overflow-y-auto pr-1">
                  {selectedDateFilter && (
                    <div className="flex justify-between items-center bg-slate-900 text-sky-300 p-3 rounded-2xl border border-blue-400/50 text-xs font-mono">
                      <span>
                        Filtering Timetable by Date: <strong className="text-white">{selectedDateFilter}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDateFilter(null)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-black cursor-pointer"
                      >
                        Show All Dates
                      </button>
                    </div>
                  )}

                  {filteredReservations.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-2">
                      <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-black text-slate-700">No Reservations Found</p>
                      <p className="text-[11px] text-slate-400">
                        Adjust your search parameters or click &quot;New Reservation&quot; to book a class.
                      </p>
                    </div>
                  ) : (
                    filteredReservations.map(res => {
                      const isBeingDeleted = deletingId === res.id;
                      return (
                        <div
                          key={res.id}
                          onClick={() => {
                            if (!isBeingDeleted) {
                              setInspectReservation(res);
                              setIsEditing(false);
                            }
                          }}
                          className={`res-card-3d-lift p-4 bg-white hover:bg-blue-50/40 rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-[0_4px_0_#e2e8f0] transition-all duration-300 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group ${
                            isBeingDeleted ? 'opacity-0 translate-x-12 scale-95 pointer-events-none' : ''
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase shadow-2xs ${
                                  res.status === 'In Progress'
                                    ? 'bg-blue-600 text-white animate-pulse'
                                    : res.status === 'Approved'
                                    ? 'bg-sky-600 text-white'
                                    : res.status === 'Pending'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {res.status}
                              </span>
                              <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition truncate">
                                {res.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 font-semibold">
                              <span className="flex items-center gap-1 text-slate-900 font-black">
                                <MapPin className="w-3.5 h-3.5 text-blue-600" /> {res.labRoom}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-blue-700 font-bold">
                                <CalendarIcon className="w-3 h-3" /> {res.date}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-indigo-700 font-bold">
                                <Clock className="w-3 h-3" /> {res.startTime} - {res.endTime}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" /> {res.reservedBy}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <span className="px-2.5 py-1 bg-slate-900 text-sky-300 rounded-xl text-[10px] font-mono font-black">
                              <Monitor className="w-3 h-3 inline mr-1" />
                              {res.pcsReserved} PCs
                            </span>

                            {res.status !== 'In Progress' && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleUpdateStatus(res.id, 'In Progress');
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl border border-blue-200 transition cursor-pointer"
                                title="Start Class Session Now"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setInspectReservation(res);
                                setIsEditing(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl border border-slate-300 transition cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setReservationToDelete(res);
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Bottom Quick Legend Footer */}
            <div className="pt-3 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
              <span>
                Showing <strong className="text-slate-900">{filteredReservations.length}</strong> of{' '}
                <strong className="text-slate-900">{reservations.length}</strong> total reservations
              </span>
              <span className="text-blue-600 font-bold">
                Tip: Click any date cell on the Calendar Grid to filter or book directly
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MODALS (BALANCED SLATE-BLUE 3D STYLING)
         ===================================================================== */}

      {/* DELETE CONFIRMATION 3D MODAL */}
      {reservationToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Confirm Schedule Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to cancel and remove{' '}
                <span className="font-black text-slate-900">{reservationToDelete.title}</span> (
                {reservationToDelete.labRoom})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservationToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-[0_4px_0_#881337]"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & EDIT RESERVATION 3D MODAL */}
      {inspectReservation && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  {isEditing ? 'Edit Reservation Schedule' : 'Reservation Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectReservation(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1">Reservation Title / Course</label>
                  <input
                    type="text"
                    value={inspectReservation.title}
                    onChange={e =>
                      setInspectReservation({ ...inspectReservation, title: e.target.value })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Assigned Laboratory</label>
                    <input
                      type="text"
                      list="lab-room-suggestions"
                      value={inspectReservation.labRoom}
                      onChange={e =>
                        setInspectReservation({ ...inspectReservation, labRoom: e.target.value })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Reserved By</label>
                    <input
                      type="text"
                      value={inspectReservation.reservedBy}
                      onChange={e =>
                        setInspectReservation({ ...inspectReservation, reservedBy: e.target.value })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Reservation Date</label>
                    <input
                      type="date"
                      value={inspectReservation.date}
                      onChange={e =>
                        setInspectReservation({ ...inspectReservation, date: e.target.value })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-black focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">PCs Reserved</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={inspectReservation.pcsReserved}
                      onChange={e =>
                        setInspectReservation({
                          ...inspectReservation,
                          pcsReserved: Number(e.target.value) || 1
                        })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-black focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Start Time</label>
                    <input
                      type="text"
                      list="time-slot-suggestions"
                      value={inspectReservation.startTime}
                      onChange={e =>
                        setInspectReservation({ ...inspectReservation, startTime: e.target.value })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">End Time</label>
                    <input
                      type="text"
                      list="time-slot-suggestions"
                      value={inspectReservation.endTime}
                      onChange={e =>
                        setInspectReservation({ ...inspectReservation, endTime: e.target.value })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={inspectReservation.status}
                    onChange={e =>
                      setInspectReservation({
                        ...inspectReservation,
                        status: e.target.value as any
                      })
                    }
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:border-blue-600 outline-none"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="inst-blue-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-400/40 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-black text-white text-sm">{inspectReservation.title}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shrink-0 ${
                        inspectReservation.status === 'In Progress'
                          ? 'bg-sky-400 text-slate-950'
                          : inspectReservation.status === 'Approved'
                          ? 'bg-blue-500 text-white'
                          : inspectReservation.status === 'Pending'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {inspectReservation.status}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">{inspectReservation.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-slate-700 font-semibold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Laboratory</span>
                    <span className="font-black text-slate-900">{inspectReservation.labRoom}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Instructor / User</span>
                    <span className="font-black text-slate-900">{inspectReservation.reservedBy}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date &amp; Time</span>
                    <span className="font-mono font-black text-blue-700">
                      {inspectReservation.date} • {inspectReservation.startTime} - {inspectReservation.endTime}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Workstations</span>
                    <span className="font-mono font-black text-indigo-700">
                      {inspectReservation.pcsReserved} PCs Reserved
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(inspectReservation.id, 'In Progress')}
                    className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-[0_3px_0_#1e3a8a] transition cursor-pointer"
                  >
                    Start Class
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(inspectReservation.id, 'Approved')}
                    className="py-2 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-xs shadow-[0_3px_0_#0369a1] transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(inspectReservation.id, 'Rejected')}
                    className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-[0_3px_0_#881337] transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReservationToDelete(inspectReservation)}
                    className="text-rose-600 hover:underline font-black cursor-pointer"
                  >
                    Cancel Reservation
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-slate-900 text-sky-300 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW RESERVATION 3D MODAL (WITH LIVE CONFLICT CHECKER) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddReservation}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Add Laboratory Reservation</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE CONFLICT CHECKER BANNER */}
            <div
              className={`p-3 rounded-2xl border-2 text-xs font-mono flex items-center justify-between ${
                conflictingReservation
                  ? 'bg-amber-950 text-amber-200 border-amber-400'
                  : 'bg-slate-900 text-sky-300 border-blue-400/50'
              }`}
            >
              <div>
                <span className="text-[9.5px] font-black uppercase block">
                  {conflictingReservation
                    ? 'SCHEDULE OVERLAP DETECTED'
                    : '✓ ROOM SLOT AVAILABLE — AUTO-APPROVED'}
                </span>
                <span className="text-[11px] font-bold text-white">
                  {conflictingReservation
                    ? `Overlaps with "${conflictingReservation.title}" (${conflictingReservation.startTime} - ${conflictingReservation.endTime})`
                    : `${newLabRoom.split('(')[0].trim()} is free on ${newDate}`}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Reservation Title / Course Subject</label>
                <input
                  type="text"
                  placeholder="e.g. IS 301 Enterprise Architecture Practical"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Select or type lab..."
                    value={newLabRoom}
                    onChange={e => {
                      const val = e.target.value;
                      setNewLabRoom(val);
                      const matched = labs.find(l =>
                        (l.labName || l.name || '').toLowerCase().includes(val.toLowerCase())
                      );
                      if (matched?.capacity) setNewPcsReserved(Number(matched.capacity));
                    }}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Instructor / Reserved By</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Ramon Magsaysay"
                    value={newReservedBy}
                    onChange={e => setNewReservedBy(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Schedule Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-black focus:border-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">PCs Reserved</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newPcsReserved}
                    onChange={e => setNewPcsReserved(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-black focus:border-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Start Time</label>
                  <input
                    type="text"
                    list="time-slot-suggestions"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1">End Time</label>
                  <input
                    type="text"
                    list="time-slot-suggestions"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Purpose / Laboratory Activity Notes</label>
                <textarea
                  value={newPurpose}
                  onChange={e => setNewPurpose(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 focus:border-blue-600 outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inst-blue-btn-3d px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Submit Reservation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReservationsView;











