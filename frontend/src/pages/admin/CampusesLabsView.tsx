import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Building, Globe, Layers, Thermometer, Zap, Search, X,
  Radio, Plus, Edit3, Trash2, ShieldAlert, MapPin, Info,
  Monitor, Cpu, Activity, CheckCircle2, Sparkles, Server
} from 'lucide-react';

export interface LabInfo {
  id: string;
  name: string;
  pcCount: number;
  location: string;
  ipRange: string;
  switchTag: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  temp?: string;
  powerKw?: string;
}

interface CampusesLabsViewProps {
  selectedCampus: string;
  campusInfo?: any;
  triggerNotification?: (msg: string) => void;
  onUpdateCampusLabs?: (campusName: string, updatedLabs: LabInfo[]) => void;
}

const defaultJrmsuCampusDatabase: Record<string, {
  fullName: string;
  locationAddress: string;
  gpsCoords: string;
  labs: LabInfo[];
}> = {
  'Dapitan Main Campus': {
    fullName: 'JRMSU Dapitan Main Campus',
    locationAddress: 'CCS Computer Laboratory Complex, JRMSU Main Campus, Dapitan City, Zamboanga del Norte',
    gpsCoords: '8.6564° N, 123.4228° E',
    labs: [
      { id: 'DAP-LAB-1', name: 'ComLab 1 (College of Computing)', pcCount: 40, location: '2nd Floor', ipRange: '10.101.0.1 - 40', switchTag: 'SW-DAP-01', status: 'OPERATIONAL', temp: '21.5°C', powerKw: '3.5' },
      { id: 'DAP-LAB-2', name: 'ComLab 2 (Multimedia Lab)', pcCount: 35, location: '3rd Floor', ipRange: '10.102.0.1 - 35', switchTag: 'SW-DAP-02', status: 'OPERATIONAL', temp: '21.5°C', powerKw: '3.5' },
      { id: 'DAP-LAB-3', name: 'ComLab 3 (General Lab)', pcCount: 30, location: 'Ground Floor', ipRange: '10.103.0.1 - 30', switchTag: 'SW-DAP-03', status: 'OPERATIONAL', temp: '22.0°C', powerKw: '3.2' }
    ]
  },
  'Dapitan Campus': {
    fullName: 'JRMSU Dapitan Main Campus',
    locationAddress: 'CCS Computer Laboratory Complex, JRMSU Main Campus, Dapitan City, Zamboanga del Norte',
    gpsCoords: '8.6564° N, 123.4228° E',
    labs: [
      { id: 'DAP-LAB-1', name: 'ComLab 1 (College of Computing)', pcCount: 40, location: '2nd Floor', ipRange: '10.101.0.1 - 40', switchTag: 'SW-DAP-01', status: 'OPERATIONAL', temp: '21.5°C', powerKw: '3.5' },
      { id: 'DAP-LAB-2', name: 'ComLab 2 (Multimedia Lab)', pcCount: 35, location: '3rd Floor', ipRange: '10.102.0.1 - 35', switchTag: 'SW-DAP-02', status: 'OPERATIONAL', temp: '21.5°C', powerKw: '3.5' },
      { id: 'DAP-LAB-3', name: 'ComLab 3 (General Lab)', pcCount: 30, location: 'Ground Floor', ipRange: '10.103.0.1 - 30', switchTag: 'SW-DAP-03', status: 'OPERATIONAL', temp: '22.0°C', powerKw: '3.2' }
    ]
  }
};

// ============================================================================
// REALISTIC 3D DESKTOP COMPUTER WORKSTATION COMPONENT (MONITOR + TOWER + KB)
// ============================================================================
const RealisticDesktopRigCard: React.FC<{
  pcCode: string;
  ipAddress: string;
  labStatus: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  index: number;
  onClick?: () => void;
}> = ({ pcCode, ipAddress, labStatus, index, onClick }) => {
  const isMaint = labStatus === 'UNDER_MAINTENANCE';
  const isOffline = labStatus === 'OUT_OF_ORDER';
  const accentHex = isMaint ? '#f59e0b' : isOffline ? '#ef4444' : index % 3 === 0 ? '#22d3ee' : '#10b981';
  const screenTopHex = isMaint ? '#78350f' : isOffline ? '#7f1d1d' : '#0284c7';
  const screenBotHex = isMaint ? '#451a03' : isOffline ? '#450a0a' : '#0f172a';
  const rigGradId = `rig-scr-${pcCode.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-2.5 border transition-all duration-300 cursor-pointer select-none ${
        isMaint
          ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
          : isOffline
          ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-400'
          : 'bg-slate-900/95 border-slate-700/80 hover:border-cyan-400'
      }`}
    >
      <div className="flex items-center justify-between text-[9px] font-mono mb-1">
        <span className="font-black text-white px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
          {pcCode}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentHex, boxShadow: `0 0 8px ${accentHex}` }}
        />
      </div>

      {/* Detailed Desktop Computer SVG: Ultrawide Monitor + Stand + Tempered Glass Tower + Keyboard + Mouse */}
      <div className="w-full aspect-[4/3] flex items-center justify-center">
        <svg viewBox="0 0 180 125" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`rig-scr-${pcCode}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={screenTopHex} />
              <stop offset="100%" stopColor={screenBotHex} />
            </linearGradient>
          </defs>

          {/* Desk Surface Glow */}
          <ellipse cx="90" cy="116" rx="76" ry="6" fill={accentHex} fillOpacity="0.14" />

          {/* 1. CPU System Unit Tower (Right) */}
          <g>
            <rect x="130" y="18" width="34" height="78" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <polygon points="164,18 172,13 172,90 164,96" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="134" y="23" width="26" height="50" rx="2.5" fill="#020617" stroke={accentHex} strokeWidth="1" />
            {/* Dual RGB Cooling Fans inside Tower */}
            <circle cx="147" cy="36" r="7.5" fill="none" stroke={accentHex} strokeWidth="1.6" strokeDasharray="4 3" />
            <circle cx="147" cy="36" r="2.2" fill={accentHex} />
            <circle cx="147" cy="57" r="7.5" fill="none" stroke={accentHex} strokeWidth="1.6" strokeDasharray="4 3" />
            <circle cx="147" cy="57" r="2.2" fill={accentHex} />
            {/* Power LED & USB Front I/O */}
            <circle cx="147" cy="83" r="2.5" fill={accentHex} />
            <rect x="138" y="89" width="7" height="2" rx="1" fill="#38bdf8" />
            <rect x="149" y="89" width="7" height="2" rx="1" fill="#64748b" />
          </g>

          {/* 2. Widescreen Monitor + Neck + V-Base Stand (Left/Center) */}
          <g>
            <rect x="64" y="80" width="12" height="15" rx="1.5" fill="#334155" />
            <polygon points="44,95 96,95 102,100 38,100" fill="#475569" />
            <rect x="12" y="14" width="110" height="68" rx="5.5" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
            <rect x="16" y="18" width="102" height="58" rx="3.5" fill={`url(#rig-scr-${pcCode})`} />
            {/* OS Top Bar */}
            <rect x="18" y="20" width="98" height="5.5" rx="1.5" fill="#020617" fillOpacity="0.65" />
            <circle cx="22" cy="22.7" r="1.3" fill="#f43f5e" />
            <circle cx="26" cy="22.7" r="1.3" fill="#f59e0b" />
            <circle cx="30" cy="22.7" r="1.3" fill="#10b981" />
            {/* Screen Code Telemetry Lines */}
            <rect x="22" y="30" width="38" height="3.2" rx="1.5" fill={accentHex} />
            <rect x="22" y="36" width="58" height="2.5" rx="1.2" fill="#e2e8f0" fillOpacity="0.7" />
            <rect x="22" y="41" width="46" height="2.5" rx="1.2" fill="#94a3b8" fillOpacity="0.7" />
            <text x="67" y="64" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
              {pcCode}
            </text>
            <circle cx="67" cy="79" r="1.3" fill={accentHex} />
          </g>

          {/* 3. Mechanical Keyboard & Optical Mouse */}
          <g>
            <polygon points="24,104 102,104 108,115 18,115" fill="#1e293b" stroke={accentHex} strokeWidth="1" />
            <line x1="26" y1="107.5" x2="98" y2="107.5" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="4 2" />
            <line x1="24" y1="111" x2="100" y2="111" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="4 2" />
            <ellipse cx="120" cy="110" rx="5.5" ry="8" fill="#1e293b" stroke={accentHex} strokeWidth="1" />
          </g>
        </svg>
      </div>

      <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
        <span className="truncate">{ipAddress}</span>
        <span className="text-cyan-400 font-bold">1Gbps</span>
      </div>
    </div>
  );
};

export const CampusesLabsView: React.FC<CampusesLabsViewProps> = ({
  selectedCampus,
  campusInfo,
  triggerNotification = () => {},
  onUpdateCampusLabs
}) => {
  const [showNodeLines, setShowNodeLines] = useState(true);
  const [showHvacOverlay, setShowHvacOverlay] = useState(true);
  const [showPowerGrid, setShowPowerGrid] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('ALL');

  const [campusDb, setCampusDb] = useState(defaultJrmsuCampusDatabase);
  const initialLabs = defaultJrmsuCampusDatabase['Dapitan Main Campus']?.labs || [];
  const [localLabs, setLocalLabs] = useState<LabInfo[]>(initialLabs);
  const [focusedLabId, setFocusedLabId] = useState<string>(initialLabs[0]?.id || '');

  const getNormalizedCampusKey = useCallback((targetCampus: string) => {
    if (campusDb[targetCampus]) return targetCampus;
    const match = Object.keys(campusDb).find(
      key => (key || '').toLowerCase().includes((targetCampus || '').toLowerCase()) || (targetCampus || '').toLowerCase().includes((key || '').toLowerCase())
    );
    return match || 'Dapitan Main Campus';
  }, [campusDb]);

  const activeCampusKey = getNormalizedCampusKey(selectedCampus);

  useEffect(() => {
    if (campusInfo?.labs && Array.isArray(campusInfo.labs) && campusInfo.labs.length > 0) {
      setLocalLabs(campusInfo.labs);
      if (!focusedLabId && campusInfo.labs[0]) setFocusedLabId(campusInfo.labs[0].id);
    } else {
      const existing = campusDb[activeCampusKey]?.labs || [];
      setLocalLabs(existing);
      if (!focusedLabId && existing[0]) setFocusedLabId(existing[0].id);
    }
  }, [selectedCampus, campusInfo?.labs, activeCampusKey]);

  useEffect(() => {
    apiClient.get('/api/v1/laboratories')
      .then((res: any) => {
        const data = res.data?.data?.items || res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LabInfo[] = data.slice(0, 6).map((l: any, idx: number) => ({
            id: l.id || `DAP-LAB-${idx + 1}`,
            name: l.labName || l.name || `ComLab ${idx + 1}`,
            pcCount: l.capacity || 35,
            location: [l.building, l.roomNumber].filter(Boolean).join(' ') || 'Academic Building',
            ipRange: l.ipRange || `10.10${idx + 1}.0.1 - ${l.capacity || 35}`,
            switchTag: l.switchTag || `SW-DAP-0${idx + 1}`,
            status: l.isActive === false ? 'UNDER_MAINTENANCE' : 'OPERATIONAL',
            temp: `${(21.2 + idx * 0.3).toFixed(1)}°C`,
            powerKw: `${(3.4 + idx * 0.2).toFixed(1)}`
          }));

          setLocalLabs(mapped);
          if (mapped[0]) setFocusedLabId(mapped[0].id);
          setCampusDb(prev => ({
            ...prev,
            [activeCampusKey]: { ...prev[activeCampusKey], labs: mapped }
          }));
        }
      })
      .catch(() => {});
  }, [activeCampusKey]);

  const activeCampusMeta = campusDb[activeCampusKey] || {
    fullName: 'JRMSU Dapitan Main Campus',
    locationAddress: 'CCS Computer Laboratory Complex, JRMSU Main Campus, Dapitan City',
    gpsCoords: '8.6564° N, 123.4228° E',
    labs: localLabs
  };

  const [selectedLabModal, setSelectedLabModal] = useState<LabInfo | null>(null);
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabInfo | null>(null);
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);

  // Form States
  const [formLabId, setFormLabId] = useState('');
  const [formLabName, setFormLabName] = useState('');
  const [formPcCount, setFormPcCount] = useState<number>(30);
  const [formLocation, setFormLocation] = useState('');
  const [formIpRange, setFormIpRange] = useState('');
  const [formSwitchTag, setFormSwitchTag] = useState('');
  const [formStatus, setFormStatus] = useState<'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('OPERATIONAL');

  const filteredLabs = localLabs.filter(lab => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = (lab.name || '').toLowerCase().includes(query) ||
                          (lab.id || '').toLowerCase().includes(query) ||
                          (lab.location || '').toLowerCase().includes(query) ||
                          (lab.switchTag || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || lab.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetFormFields = () => {
    setFormLabId('');
    setFormLabName('');
    setFormPcCount(30);
    setFormLocation('');
    setFormIpRange('');
    setFormSwitchTag('');
    setFormStatus('OPERATIONAL');
  };

  const commitStateUpdates = (updatedList: LabInfo[]) => {
    setLocalLabs(updatedList);
    setCampusDb(prev => ({
      ...prev,
      [activeCampusKey]: {
        ...(prev[activeCampusKey] || {
          fullName: 'JRMSU Dapitan Main Campus',
          locationAddress: 'CCS Computer Laboratory Complex, Dapitan City',
          gpsCoords: '8.6564° N, 123.4228° E'
        }),
        labs: updatedList
      }
    }));

    if (onUpdateCampusLabs) {
      onUpdateCampusLabs(selectedCampus, updatedList);
    }
  };

  const handleAdjustLabPcCount = (labId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = localLabs.map(l => {
      if (l.id === labId) {
        const nextCount = Math.max(1, Math.min(120, (Number(l.pcCount) || 1) + delta));
        return { ...l, pcCount: nextCount };
      }
      return l;
    });
    commitStateUpdates(updated);
    const target = updated.find(l => l.id === labId);
    if (target) {
      triggerNotification(`Updated ${target.name} capacity to ${target.pcCount} Desktop PCs.`);
    }
  };

  // Dynamic Topology Coordinates for Wide High-Resolution SVG (680x310)
  const getLabNodeX = (index: number, total: number) => {
    if (total <= 1) return 340;
    const startX = 115;
    const endX = 565;
    return Math.round(startX + (index * (endX - startX)) / (total - 1));
  };

  // Dynamic Floor Plan Room Coordinates (680x310)
  const getFloorPlanBoxCoords = (index: number, total: number) => {
    const cols = total <= 2 ? Math.max(1, total) : 3;
    const rows = Math.max(1, Math.ceil(total / cols));

    const containerW = 640;
    const containerH = 265;
    const startX = 20;
    const startY = 18;
    const gapX = 16;
    const gapY = 14;

    const boxW = (containerW - (cols - 1) * gapX) / cols;
    const boxH = (containerH - (rows - 1) * gapY) / rows;

    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: startX + col * (boxW + gapX),
      y: startY + row * (boxH + gapY),
      width: boxW,
      height: boxH
    };
  };

  // 1. ADD LABORATORY
  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = formLabId.trim().toUpperCase();
    const newName = formLabName.trim();

    if (!newId || !newName) {
      triggerNotification('Please specify a valid Room ID and Name.');
      return;
    }

    if (localLabs.some(l => l.id === newId)) {
      triggerNotification(`Laboratory ID "${newId}" already exists!`);
      return;
    }

    const newLab: LabInfo = {
      id: newId,
      name: newName,
      pcCount: Number(formPcCount) || 30,
      location: formLocation.trim() || 'Academic Building',
      ipRange: formIpRange.trim() || `10.10${localLabs.length + 1}.0.1 - 30`,
      switchTag: formSwitchTag.trim().toUpperCase() || `SW-DAP-0${localLabs.length + 1}`,
      status: formStatus,
      temp: '21.5°C',
      powerKw: '3.5'
    };

    const updated = [...localLabs, newLab];
    commitStateUpdates(updated);
    setFocusedLabId(newLab.id);
    setIsAddLabOpen(false);
    resetFormFields();
    triggerNotification(`Added new laboratory "${newLab.name}" (${newLab.id}).`);
  };

  const handleOpenEditModal = (lab: LabInfo) => {
    setEditingLab(lab);
    setFormLabId(lab.id);
    setFormLabName(lab.name);
    setFormPcCount(lab.pcCount);
    setFormLocation(lab.location);
    setFormIpRange(lab.ipRange);
    setFormSwitchTag(lab.switchTag);
    setFormStatus(lab.status);
  };

  // 2. EDIT LABORATORY
  const handleUpdateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab) return;

    const newId = formLabId.trim().toUpperCase();
    const newName = formLabName.trim();

    if (!newId || !newName) {
      triggerNotification('Room ID and Name cannot be empty.');
      return;
    }

    if (newId !== editingLab.id && localLabs.some(l => l.id === newId)) {
      triggerNotification(`Laboratory ID "${newId}" already exists!`);
      return;
    }

    const updatedList = localLabs.map(lab => {
      if (lab.id === editingLab.id) {
        return {
          ...lab,
          id: newId,
          name: newName,
          pcCount: Number(formPcCount) || lab.pcCount,
          location: formLocation.trim() || lab.location,
          ipRange: formIpRange.trim() || lab.ipRange,
          switchTag: formSwitchTag.trim().toUpperCase() || lab.switchTag,
          status: formStatus
        };
      }
      return lab;
    });

    commitStateUpdates(updatedList);

    if (selectedLabModal?.id === editingLab.id) {
      const activeObj = updatedList.find(l => l.id === newId);
      if (activeObj) setSelectedLabModal(activeObj);
    }

    setEditingLab(null);
    resetFormFields();
    triggerNotification(`Successfully updated "${newName}".`);
  };

  // 3. DELETE LABORATORY
  const handleDeleteLabConfirm = () => {
    if (!deletingLabId) return;

    const updatedList = localLabs.filter(l => l.id !== deletingLabId);
    commitStateUpdates(updatedList);

    if (selectedLabModal?.id === deletingLabId) {
      setSelectedLabModal(null);
    }
    if (focusedLabId === deletingLabId && updatedList[0]) {
      setFocusedLabId(updatedList[0].id);
    }

    triggerNotification(`Laboratory ${deletingLabId} deleted.`);
    setDeletingLabId(null);
  };

  const activeFocusedLab = localLabs.find(l => l.id === focusedLabId) || localLabs[0] || null;
  return (
    <div className="space-y-6  select-none relative">
      <style>{`
        @keyframes packet-stream {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-packet-line {
          stroke-dasharray: 5 4;
          animation: packet-stream 0.9s linear infinite;
        }
      `}</style>

      {/* WRAPPER CARD */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Campuses &amp; Labs Topology</span>
                <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                  SCOPE: {selectedCampus}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="font-extrabold text-slate-800">{activeCampusMeta.fullName}</span>
                <span className="text-slate-300">•</span>
                <span>{activeCampusMeta.locationAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetFormFields();
                setFormLabId(`DAP-LAB-${localLabs.length + 1}`);
                setFormLabName(`ComLab ${localLabs.length + 1}`);
                setFormIpRange(`10.10${localLabs.length + 1}.0.1 - 35`);
                setFormSwitchTag(`SW-DAP-0${localLabs.length + 1}`);
                setIsAddLabOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Laboratory
            </button>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shadow-inner">
              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showNodeLines ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-500'}`}>
                <Radio className={`w-3.5 h-3.5 ${showNodeLines ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                <span>Node Lines</span>
                <input type="checkbox" checked={showNodeLines} onChange={(e) => setShowNodeLines(e.target.checked)} className="sr-only" />
              </label>

              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showHvacOverlay ? 'bg-white text-cyan-700 shadow-xs border border-cyan-200' : 'text-slate-500'}`}>
                <Thermometer className={`w-3.5 h-3.5 ${showHvacOverlay ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span>HVAC Overlay</span>
                <input type="checkbox" checked={showHvacOverlay} onChange={(e) => setShowHvacOverlay(e.target.checked)} className="sr-only" />
              </label>

              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showPowerGrid ? 'bg-white text-amber-700 shadow-xs border border-amber-200' : 'text-slate-500'}`}>
                <Zap className={`w-3.5 h-3.5 ${showPowerGrid ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Power Grid</span>
                <input type="checkbox" checked={showPowerGrid} onChange={(e) => setShowPowerGrid(e.target.checked)} className="sr-only" />
              </label>
            </div>
          </div>
        </div>

        {/* ===================================================================
            1. DYNAMIC TOPOLOGY GRAPHS (REAL DESKTOP COMPUTERS IN SVG)
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CORE GATEWAY TOPOLOGY GRAPH WITH REAL MINIATURE DESKTOP COMPUTERS */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
              <span className="font-extrabold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Core Gateway &amp; Desktop Workstation Topology</span>
              </span>
              <span className="font-mono text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                10Gbps Fiber Trunk
              </span>
            </div>

            <div className="h-80 bg-slate-950/90 rounded-2xl border border-slate-800/90 p-2 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 680 310" fill="none">
                
                {/* AC Main Power Bus */}
                {showPowerGrid && (
                  <g>
                    <path d="M 20 296 L 660 296" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                    <text x="26" y="290" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                       AC UPS Bus (220V 60Hz Redundant Rail)
                    </text>
                  </g>
                )}

                {/* Fiber Uplink Line: Main Gateway -> Core L3 Switch */}
                {showNodeLines && (
                  <>
                    <path d="M 110 34 L 340 34" stroke="#1e293b" strokeWidth="4" />
                    <path d="M 110 34 L 340 34" stroke="#38bdf8" strokeWidth="2.2" className="animate-packet-line" />
                  </>
                )}

                {/* Main Gateway Node */}
                <g className="cursor-pointer">
                  <rect x="74" y="18" width="72" height="32" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx="88" cy="34" r="4" fill="#38bdf8" className="animate-ping" />
                  <circle cx="88" cy="34" r="4" fill="#38bdf8" />
                  <text x="116" y="32" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">GATEWAY</text>
                  <text x="116" y="42" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontFamily="monospace">10.100.0.1</text>
                </g>

                {/* Core Switch A Node */}
                <g className="cursor-pointer">
                  <rect x="285" y="16" width="110" height="36" rx="9" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                  <circle cx="300" cy="34" r="4.5" fill="#10b981" />
                  <text x="346" y="31" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">CORE L3 SWITCH</text>
                  <text x="346" y="43" textAnchor="middle" fill="#34d399" fontSize="7.5" fontFamily="monospace">JRMSU DAPITAN</text>
                </g>

                {/* LAB SWITCHES + REAL DESKTOP COMPUTER CLUSTERS (MONITOR + STAND + KEYBOARD + CPU TOWER) */}
                {localLabs.map((lab, idx) => {
                  const nodeX = getLabNodeX(idx, localLabs.length);
                  const nodeY = 98;
                  const cleanLabTitle = lab.name.split('(')[0].trim() || lab.id;
                  const labIp = (lab.ipRange || '10.101.0.1').split('-')[0].trim();
                  const totalPcs = Math.max(1, Math.min(48, Number(lab.pcCount) || 15));

                  const isMaint = lab.status === 'UNDER_MAINTENANCE';
                  const isOut = lab.status === 'OUT_OF_ORDER';
                  const accentColor = isMaint ? '#f59e0b' : isOut ? '#ef4444' : '#10b981';
                  const screenGlowColor = isMaint ? '#fbbf24' : isOut ? '#f87171' : '#38bdf8';

                  const clusterSpan = Math.min(185, Math.max(90, Math.floor(580 / Math.max(1, localLabs.length)) - 16));
                  const cols = Math.min(6, Math.max(4, Math.ceil(Math.sqrt(totalPcs * 1.15))));
                  const rows = Math.ceil(totalPcs / cols);
                  const cellW = clusterSpan / cols;
                  const cellH = Math.min(22, Math.max(13, 138 / Math.max(1, rows)));
                  const pcStartX = Math.max(14, Math.min(666 - clusterSpan, nodeX - clusterSpan / 2));
                  const pcStartY = 142;

                  return (
                    <g
                      key={lab.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        setFocusedLabId(lab.id);
                        setSelectedLabModal(lab);
                      }}
                    >
                      {/* Trunk Line from Core Switch to Lab Switch */}
                      {showNodeLines && (
                        <>
                          <path
                            d={`M 340 52 L ${nodeX} ${nodeY - 12}`}
                            stroke="#1e293b"
                            strokeWidth="3"
                          />
                          <path
                            d={`M 340 52 L ${nodeX} ${nodeY - 12}`}
                            stroke={isMaint ? '#f59e0b' : '#38bdf8'}
                            strokeWidth="1.8"
                            className="animate-packet-line"
                          />
                        </>
                      )}

                      {/* Horizontal Patch Bus Bar for Lab PCs */}
                      {showNodeLines && (
                        <>
                          <line x1={nodeX} y1={nodeY + 12} x2={nodeX} y2={pcStartY - 8} stroke="#22d3ee" strokeWidth="1.6" opacity="0.85" />
                          <line
                            x1={pcStartX + cellW / 2}
                            y1={pcStartY - 8}
                            x2={pcStartX + clusterSpan - cellW / 2}
                            y2={pcStartY - 8}
                            stroke="#22d3ee"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        </>
                      )}

                      {/* RENDER EVERY WORKSTATION AS A REAL MINIATURE DESKTOP COMPUTER (MONITOR + STAND + TOWER + KEYBOARD) */}
                      {Array.from({ length: totalPcs }).map((_, pIdx) => {
                        const c = pIdx % cols;
                        const r = Math.floor(pIdx / cols);
                        const px = pcStartX + c * cellW + cellW / 2;
                        const py = pcStartY + r * cellH;

                        const monW = Math.max(9, Math.min(15, cellW * 0.56));
                        const monH = Math.max(6.5, Math.min(10, cellH * 0.52));
                        const monX = px - monW / 2 - 2;
                        const monY = py;
                        const towW = Math.max(3.2, monW * 0.28);
                        const towH = monH + 2.5;
                        const towX = monX + monW + 1.4;
                        const towY = monY - 0.5;

                        return (
                          <g key={`${lab.id}-pc-${pIdx}`}>
                            {/* Vertical Patch Cable Drop */}
                            {showNodeLines && r === 0 && (
                              <line x1={px} y1={pcStartY - 8} x2={px} y2={monY} stroke="#22d3ee" strokeWidth="0.8" opacity="0.65" />
                            )}

                            {/* Monitor Outer Bezel */}
                            <rect
                              x={monX}
                              y={monY}
                              width={monW}
                              height={monH}
                              rx="1.4"
                              fill="#0f172a"
                              stroke={accentColor}
                              strokeWidth="1"
                            />
                            {/* Illuminated Monitor Display Screen */}
                            <rect
                              x={monX + 1.2}
                              y={monY + 1.2}
                              width={Math.max(2, monW - 2.4)}
                              height={Math.max(2, monH - 2.6)}
                              rx="0.8"
                              fill={screenGlowColor}
                              fillOpacity="0.38"
                            />
                            {/* Monitor Neck & Stand Base */}
                            <line
                              x1={monX + monW / 2}
                              y1={monY + monH}
                              x2={monX + monW / 2}
                              y2={monY + monH + 2}
                              stroke="#94a3b8"
                              strokeWidth="1.2"
                            />
                            <line
                              x1={monX + monW * 0.22}
                              y1={monY + monH + 2}
                              x2={monX + monW * 0.78}
                              y2={monY + monH + 2}
                              stroke="#cbd5e1"
                              strokeWidth="1.2"
                            />
                            {/* Keyboard Deck in Front */}
                            <rect
                              x={monX + 1}
                              y={monY + monH + 2.8}
                              width={monW - 2}
                              height="1.5"
                              rx="0.5"
                              fill="#38bdf8"
                              fillOpacity="0.7"
                            />
                            {/* CPU System Unit Tower Beside Monitor */}
                            <rect
                              x={towX}
                              y={towY}
                              width={towW}
                              height={towH}
                              rx="0.8"
                              fill="#1e293b"
                              stroke={accentColor}
                              strokeWidth="0.8"
                            />
                            {/* Power LED on CPU Tower */}
                            <circle
                              cx={towX + towW / 2}
                              cy={towY + 2}
                              r="0.8"
                              fill={screenGlowColor}
                            />
                          </g>
                        );
                      })}

                      {/* HVAC Thermal Halo */}
                      {showHvacOverlay && (
                        <circle
                          cx={nodeX}
                          cy={nodeY}
                          r="18"
                          fill={isMaint ? '#f59e0b' : '#06b6d4'}
                          opacity="0.16"
                          className="animate-ping"
                        />
                      )}

                      {/* Lab Switch Rack Pill */}
                      <rect
                        x={nodeX - 46}
                        y={nodeY - 12}
                        width="92"
                        height="24"
                        rx="7"
                        fill="#0f172a"
                        stroke={accentColor}
                        strokeWidth="1.8"
                      />
                      <circle cx={nodeX - 35} cy={nodeY} r="3.5" fill={accentColor} />
                      <text x={nodeX + 4} y={nodeY - 1.5} textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">
                        {cleanLabTitle}
                      </text>
                      <text x={nodeX + 4} y={nodeY + 7.5} textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                        {`${lab.pcCount} PCs • ${labIp}`}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                Active Scope: <span className="text-emerald-400 font-bold">{selectedCampus}</span>
              </div>
            </div>
          </div>

          {/* FLOOR PLAN WORKSTATION LAYOUT WITH MINIATURE COMPUTER DESKS */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
              <span className="font-extrabold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Architectural Floor Plan &amp; Workstation Desks</span>
              </span>
              <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {localLabs.length} Rooms Active
              </span>
            </div>

            <div className="h-80 bg-slate-950/90 rounded-2xl border border-slate-800/90 p-2 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 680 310" fill="none">
                {localLabs.length > 0 ? (
                  localLabs.map((lab, idx) => {
                    const { x, y, width, height } = getFloorPlanBoxCoords(idx, localLabs.length);
                    const isMaint = lab.status === 'UNDER_MAINTENANCE';
                    const isOutOfOrder = lab.status === 'OUT_OF_ORDER';
                    const titleText = lab.name.split('(')[0].trim() || lab.id;
                    const strokeHex = isMaint ? '#f59e0b' : isOutOfOrder ? '#ef4444' : '#38bdf8';

                    // Render rows of miniature computers inside each room floor plan
                    const previewPcs = Math.min(18, Math.max(6, Number(lab.pcCount) || 12));
                    const deskCols = 6;
                    const deskRows = Math.ceil(previewPcs / deskCols);
                    const padX = 14;
                    const padTop = 52;
                    const usableW = Math.max(60, width - padX * 2);
                    const usableH = Math.max(40, height - padTop - 28);
                    const dCellW = usableW / deskCols;
                    const dCellH = usableH / Math.max(1, deskRows);

                    return (
                      <g
                        key={lab.id}
                        className="cursor-pointer hover:opacity-95 transition"
                        onClick={() => {
                          setFocusedLabId(lab.id);
                          setSelectedLabModal(lab);
                        }}
                      >
                        {/* Room Outer Wall */}
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx="12"
                          fill="#0f172a"
                          stroke={strokeHex}
                          strokeWidth="2.2"
                        />

                        {/* HVAC Climate Overlay */}
                        {showHvacOverlay && (
                          <rect
                            x={x + 4}
                            y={y + 4}
                            width={width - 8}
                            height={height - 8}
                            rx="9"
                            fill={isMaint ? '#f59e0b' : '#06b6d4'}
                            opacity="0.07"
                          />
                        )}

                        {/* Room Header Bar */}
                        <rect
                          x={x + 6}
                          y={y + 6}
                          width={width - 12}
                          height="36"
                          rx="8"
                          fill="#020617"
                          stroke="#1e293b"
                          strokeWidth="1"
                        />
                        <text x={x + 16} y={y + 22} fill="#ffffff" fontSize="11.5" fontWeight="900">
                          {titleText}
                        </text>
                        <text x={x + 16} y={y + 34} fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                          {`${lab.pcCount} Workstations • ${lab.location}`}
                        </text>

                        {/* Miniature Computer Desks Inside Room Floor Plan */}
                        {Array.from({ length: previewPcs }).map((_, dIdx) => {
                          const dc = dIdx % deskCols;
                          const dr = Math.floor(dIdx / deskCols);
                          const dx = x + padX + dc * dCellW + dCellW / 2;
                          const dy = y + padTop + dr * dCellH + dCellH / 2;

                          return (
                            <g key={`${lab.id}-fp-pc-${dIdx}`}>
                              {/* Monitor Screen */}
                              <rect
                                x={dx - 7}
                                y={dy - 6}
                                width="11"
                                height="7.5"
                                rx="1.2"
                                fill="#020617"
                                stroke={strokeHex}
                                strokeWidth="1"
                              />
                              <rect
                                x={dx - 5.8}
                                y={dy - 4.8}
                                width="8.6"
                                height="5"
                                rx="0.6"
                                fill={strokeHex}
                                fillOpacity="0.4"
                              />
                              {/* Stand & Keyboard */}
                              <rect x={dx - 5} y={dy + 2.5} width="7" height="1.5" rx="0.5" fill="#94a3b8" />
                              {/* Mini CPU Tower */}
                              <rect
                                x={dx + 5.2}
                                y={dy - 6}
                                width="3.5"
                                height="9"
                                rx="0.8"
                                fill="#1e293b"
                                stroke={strokeHex}
                                strokeWidth="0.8"
                              />
                            </g>
                          );
                        })}

                        {/* Power Bus Line Across Room */}
                        {showPowerGrid && (
                          <line
                            x1={x + 10}
                            y1={y + height - 22}
                            x2={x + width - 10}
                            y2={y + height - 22}
                            stroke="#f59e0b"
                            strokeWidth="1.2"
                            strokeDasharray="4 3"
                            opacity="0.75"
                          />
                        )}

                        {/* Bottom Telemetry Status Strip */}
                        <text
                          x={x + 14}
                          y={y + height - 8}
                          fill={isMaint ? '#fbbf24' : '#34d399'}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isMaint ? ' MAINTENANCE' : `„ HVAC ${lab.temp || '21.5°C'}`}
                        </text>
                        <text
                          x={x + width - 14}
                          y={y + height - 8}
                          textAnchor="end"
                          fill="#fbbf24"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {` ${lab.powerKw || '3.5'} kW`}
                        </text>
                      </g>
                    );
                  })
                ) : (
                  <text x="340" y="155" textAnchor="middle" fill="#64748b" fontSize="13">
                    No active rooms registered for {selectedCampus}
                  </text>
                )}
              </svg>

              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                Click any room to inspect or adjust workstation fleet
              </div>
            </div>
          </div>

        </div>

        {/* ===================================================================
            2. INTERACTIVE 3D DESKTOP COMPUTER WORKSTATION FLEET VISUALIZER
           =================================================================== */}
        {activeFocusedLab && (
          <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LIVE 3D DESKTOP WORKSTATION FLEET // REAL COMPUTER NODES</span>
                </div>
                <h4 className="text-lg font-black text-white flex items-center gap-2.5 flex-wrap">
                  <span>{activeFocusedLab.name}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {activeFocusedLab.pcCount} Desktop Computers Connected
                  </span>
                </h4>
              </div>

              {/* Room Switcher Pills + Quick Capacity Adjusters */}
              <div className="flex flex-wrap items-center gap-2">
                {localLabs.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setFocusedLabId(l.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeFocusedLab.id === l.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {l.name.split('(')[0].trim()} ({l.pcCount} PCs)
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => handleAdjustLabPcCount(activeFocusedLab.id, -1, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-black cursor-pointer transition"
                  >
                    -1 PC
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAdjustLabPcCount(activeFocusedLab.id, 1, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-black cursor-pointer transition"
                  >
                    +1 PC
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAdjustLabPcCount(activeFocusedLab.id, 5, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-xs font-black cursor-pointer transition"
                  >
                    +5 PCs
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Realistic 3D Desktop Computers (Monitor + RGB CPU Tower + Keyboard + Mouse) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-80 overflow-y-auto pr-1">
              {Array.from({ length: Math.max(1, Math.min(60, Number(activeFocusedLab.pcCount) || 1)) }).map((_, idx) => {
                const pcCode = `PC-${String(idx + 1).padStart(2, '0')}`;
                const baseIpPrefix = (activeFocusedLab.ipRange || '10.101.0.1').split('.').slice(0, 3).join('.') || '10.101.0';
                const pcIp = `${baseIpPrefix}.${101 + idx}`;
                return (
                  <RealisticDesktopRigCard
                    key={`${activeFocusedLab.id}-rig-${idx}`}
                    pcCode={pcCode}
                    ipAddress={pcIp}
                    labStatus={activeFocusedLab.status}
                    index={idx}
                    onClick={() => setSelectedLabModal(activeFocusedLab)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            3. LABORATORY INVENTORY & LEDGER TABLE
           =================================================================== */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Laboratory Inventory &amp; Ledger</h4>
              <span className="text-xs text-slate-400 font-medium">Manage rooms, subnets, and switch tags for {selectedCampus}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-[11px] font-bold border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  All ({localLabs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('OPERATIONAL')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'OPERATIONAL' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Operational
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNDER_MAINTENANCE')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'UNDER_MAINTENANCE' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Maintenance
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Room, ID, or Switch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-56 font-medium shadow-xs bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Campus Node &amp; Room</th>
                  <th className="p-3.5">Switch Tag / Subnet Scope</th>
                  <th className="p-3.5">Capacity / Online</th>
                  <th className="p-3.5">HVAC / Power</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {filteredLabs.length > 0 ? (
                  filteredLabs.map((lab) => {
                    const activeCount = Math.round(lab.pcCount * 0.95);
                    return (
                      <tr
                        key={lab.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                        onClick={() => {
                          setFocusedLabId(lab.id);
                          setSelectedLabModal(lab);
                        }}
                      >
                        <td className="p-3.5 font-bold text-slate-900 font-sans">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <span>{lab.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">{lab.id} • {lab.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-sans text-slate-600">
                          <div className="text-[11px] font-bold text-slate-800">{lab.switchTag}</div>
                          <div className="text-[10px] text-slate-400">{lab.ipRange}</div>
                        </td>
                        <td className="p-3.5 font-sans" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900">{lab.pcCount} PCs</span>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustLabPcCount(lab.id, -1, e)}
                              className="w-5 h-5 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black text-xs flex items-center justify-center border border-slate-200 cursor-pointer"
                              title="Remove 1 PC"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustLabPcCount(lab.id, 1, e)}
                              className="w-5 h-5 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-black text-xs flex items-center justify-center border border-blue-200 cursor-pointer"
                              title="Add 1 PC to this Lab"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustLabPcCount(lab.id, 5, e)}
                              className="px-1.5 h-5 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-black text-[10px] flex items-center justify-center border border-emerald-200 cursor-pointer"
                              title="Add 5 PCs to this Lab"
                            >
                              +5 PC
                            </button>
                          </div>
                          <div className="text-emerald-600 text-[10px] font-bold mt-0.5">{activeCount} Online &amp; Connected</div>
                        </td>
                        <td className="p-3.5 font-sans text-slate-600">
                          <span className="text-cyan-600 font-bold">{lab.temp || '21.5°C'}</span> | <span className="text-amber-600 font-bold">{lab.powerKw || '3.5'} kW</span>
                        </td>
                        <td className="p-3.5">
                          {lab.status === 'OPERATIONAL' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                              Operational
                            </span>
                          )}
                          {lab.status === 'UNDER_MAINTENANCE' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                              Maintenance
                            </span>
                          )}
                          {lab.status === 'OUT_OF_ORDER' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">
                              Out of Order
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedLabModal(lab)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition cursor-pointer active:scale-95"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(lab)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer active:scale-95"
                              title="Edit Laboratory"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingLabId(lab.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer active:scale-95"
                              title="Delete Laboratory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No laboratories found matching criteria for {selectedCampus}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD LABORATORY */}
      {isAddLabOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Add New Laboratory</span>
              </h3>
              <button type="button" onClick={() => { setIsAddLabOpen(false); resetFormFields(); }} className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratory Room Tag / ID</label>
                <input
                  type="text"
                  value={formLabId}
                  onChange={(e) => setFormLabId(e.target.value)}
                  placeholder="e.g. DAP-LAB-4"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Room Name</label>
                <input
                  type="text"
                  value={formLabName}
                  onChange={(e) => setFormLabName(e.target.value)}
                  placeholder="e.g. ComLab 4 (AI Systems)"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PC Capacity Seats</label>
                  <input
                    type="number"
                    value={formPcCount}
                    onChange={(e) => setFormPcCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Building / Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. 2nd Floor"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Subnet Range</label>
                  <input
                    type="text"
                    value={formIpRange}
                    onChange={(e) => setFormIpRange(e.target.value)}
                    placeholder="e.g. 10.104.0.1 - 35"
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Switch Port Tag</label>
                  <input
                    type="text"
                    value={formSwitchTag}
                    onChange={(e) => setFormSwitchTag(e.target.value)}
                    placeholder="e.g. SW-DAP-04"
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddLabOpen(false); resetFormFields(); }}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Save Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT LABORATORY METADATA */}
      {editingLab && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Laboratory Metadata</span>
              </h3>
              <button type="button" onClick={() => { setEditingLab(null); resetFormFields(); }} className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateLab} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratory Room Tag / ID</label>
                <input
                  type="text"
                  value={formLabId}
                  onChange={(e) => setFormLabId(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Room Name</label>
                <input
                  type="text"
                  value={formLabName}
                  onChange={(e) => setFormLabName(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PC Capacity Seats</label>
                  <input
                    type="number"
                    value={formPcCount}
                    onChange={(e) => setFormPcCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Building / Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Subnet Range</label>
                  <input
                    type="text"
                    value={formIpRange}
                    onChange={(e) => setFormIpRange(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Switch Port Tag</label>
                  <input
                    type="text"
                    value={formSwitchTag}
                    onChange={(e) => setFormSwitchTag(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingLab(null); resetFormFields(); }}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingLabId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Delete Room {deletingLabId}?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete this laboratory? All associated topology and telemetry data will be permanently removed from inventory.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLabId(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLabConfirm}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer transition active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ROOM TOPOLOGY INSPECTOR WITH 3D DESKTOP COMPUTERS */}
      {selectedLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-2xl w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedLabModal.name}</h3>
                  <span className="text-xs text-slate-400 font-sans">{selectedLabModal.id} • {selectedLabModal.location}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block">Switch Port Tag</span>
                  <span className="font-extrabold font-sans text-blue-600 text-sm">{selectedLabModal.switchTag || ' - '}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block">Subnet Range</span>
                  <span className="font-extrabold font-sans text-slate-800 text-sm">{selectedLabModal.ipRange || ' - '}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-sans">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                  <span>ENVIRONMENTAL TELEMETRY &amp; DESKTOP NODES</span>
                  <span className="text-emerald-400 font-bold">LIVE FEED ({selectedLabModal.pcCount} PCs)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">HVAC Temp</span>
                    <strong className="text-cyan-400 text-xs">{selectedLabModal.temp || '21.5°C'}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">UPS Load</span>
                    <strong className="text-amber-400 text-xs">{selectedLabModal.powerKw || '3.5'} kW</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Battery Health</span>
                    <strong className="text-emerald-400 text-xs">100% Nominal</strong>
                  </div>
                </div>

                {/* Miniature 3D Computer Fleet Preview inside Inspector */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pt-1 pr-1">
                  {Array.from({ length: Math.min(24, Number(selectedLabModal.pcCount) || 12) }).map((_, i) => (
                    <RealisticDesktopRigCard
                      key={`modal-pc-${i}`}
                      pcCode={`PC-${String(i + 1).padStart(2, '0')}`}
                      ipAddress={`10.101.0.${101 + i}`}
                      labStatus={selectedLabModal.status}
                      index={i}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/60 flex items-start gap-2.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  All {selectedLabModal.pcCount} desktop computer workstations in this room are actively monitored via the JRMSU LabTrack daemon under <strong className="font-bold">{selectedCampus}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLabModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition cursor-pointer active:scale-95"
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

export default CampusesLabsView;










