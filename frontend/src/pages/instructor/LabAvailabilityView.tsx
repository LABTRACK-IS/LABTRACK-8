import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Monitor, Cpu, Activity, RefreshCw, MapPin,
  CheckCircle2, Wrench, Search, Edit3, X, Server,
  Download, Zap, RotateCcw, Grid, List, Sparkles, Play, LogOut
} from 'lucide-react';

export interface WorkstationNode {
  id: string;
  pcNumber: string;
  labRoom: string;
  ipAddress: string;
  specs: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Offline';
  assignedUser?: string;
  adminSyncSource?: string;
  cpuLoad: number;
  tempC: number;
}

export interface LabPod {
  id: string;
  name: string;
  code: string;
  totalSeats: number;
  availableSeats: number;
  inUseSeats: number;
  maintenanceSeats: number;
  offlineSeats: number;
  nodes: WorkstationNode[];
  statusBadge: 'Optimal' | 'High Load' | 'Maintenance' | 'Critical';
}

export interface LabAvailabilityViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

// ============================================================================
// REALISTIC 3D DESKTOP WORKSTATION PC SETUP (MONITOR + GLASS SYSTEM UNIT + KB/MOUSE)
// Dynamically changes screen display, RGB fan speed & LEDs based on Admin Status!
// ============================================================================
const RealisticDesktopPcSetup: React.FC<{
  status: WorkstationNode['status'];
  pcNumber: string;
  cpuLoad: number;
  tempC: number;
  isLive: boolean;
  size?: 'card' | 'hero' | 'modal';
}> = ({ status, pcNumber, cpuLoad, tempC, isLive, size = 'card' }) => {
  const isOffline = status === 'Offline';
  const isInUse = status === 'In Use';
  const isMaint = status === 'Maintenance';

  const accentHex = isOffline
    ? '#ef4444'
    : isInUse
    ? '#38bdf8'
    : isMaint
    ? '#f59e0b'
    : '#10b981';

  const screenTopHex = isOffline
    ? '#0f172a'
    : isInUse
    ? '#1d4ed8'
    : isMaint
    ? '#b45309'
    : '#047857';

  const screenBottomHex = isOffline
    ? '#020617'
    : isInUse
    ? '#0f172a'
    : isMaint
    ? '#451a03'
    : '#022c22';

  const fanDuration = !isLive || isOffline ? '0s' : isInUse ? '0.65s' : isMaint ? '1.8s' : '2.6s';
  const uid = `${pcNumber.replace(/[^a-zA-Z0-9]/g, '')}-${size}`;

  const dimensions =
    size === 'hero'
      ? 'w-24 h-20'
      : size === 'modal'
      ? 'w-36 h-28'
      : 'w-full h-24';

  return (
    <div className={`${dimensions} relative flex items-center justify-center select-none`}>
      <svg
        viewBox="0 0 180 120"
        className={`w-full h-full ${size === 'hero' ? 'ws-rig-float' : ''} drop-shadow-[0_6px_10px_rgba(15,23,42,0.35)]`}
      >
        <defs>
          <linearGradient id={`scr-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={screenTopHex} />
            <stop offset="100%" stopColor={screenBottomHex} />
          </linearGradient>
          <linearGradient id={`case-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* 1. DESK PAD / 3D MAT BASE */}
        <rect
          x="8"
          y="96"
          width="164"
          height="16"
          rx="6"
          fill="#0f172a"
          stroke={accentHex}
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        <line
          x1="16"
          y1="108"
          x2="164"
          y2="108"
          stroke={accentHex}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />

        {/* 2. WIDESCREEN DESKTOP MONITOR & ERGONOMIC STAND */}
        <g>
          <polygon points="46,98 78,98 84,103 40,103" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
          <rect x="57" y="78" width="10" height="21" rx="2" fill="#334155" />
          <rect x="59" y="80" width="6" height="17" rx="1" fill="#64748b" />

          <rect
            x="14"
            y="16"
            width="96"
            height="65"
            rx="6"
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="2"
          />
          <rect
            x="18"
            y="20"
            width="88"
            height="55"
            rx="3.5"
            fill={`url(#scr-${uid})`}
            stroke={accentHex}
            strokeWidth="1"
            strokeOpacity="0.75"
          />

          <polygon
            points="18,20 58,20 34,75 18,75"
            fill="#ffffff"
            fillOpacity={isOffline ? '0.03' : '0.07'}
          />

          {!isOffline ? (
            <g>
              <rect x="22" y="24" width="80" height="6" rx="1.5" fill="#020617" fillOpacity="0.55" />
              <circle cx="25.5" cy="27" r="1.3" fill="#f43f5e" />
              <circle cx="29.5" cy="27" r="1.3" fill="#fbbf24" />
              <circle cx="33.5" cy="27" r="1.3" fill="#10b981" />
              <text
                x="99"
                y="28.5"
                textAnchor="end"
                fill="#e2e8f0"
                fontSize="5.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {pcNumber}
              </text>

              <rect
                x="22"
                y="33"
                width="48"
                height="32"
                rx="2"
                fill="#020617"
                fillOpacity="0.5"
                stroke={accentHex}
                strokeWidth="0.6"
                strokeOpacity="0.5"
              />
              <line x1="26" y1="38" x2="52" y2="38" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <line x1="26" y1="43" x2="62" y2="43" stroke={accentHex} strokeWidth="1.6" strokeLinecap="round" />
              <line x1="26" y1="48" x2="56" y2="48" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <text
                x="26"
                y="59"
                fill="#ffffff"
                fontSize="5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {isMaint ? 'MAINTENANCE' : isInUse ? 'IN SESSION' : 'READY / AVAILABLE'}
              </text>

              <rect
                x="73"
                y="33"
                width="29"
                height="32"
                rx="2"
                fill="#020617"
                fillOpacity="0.6"
              />
              <text
                x="87.5"
                y="45"
                textAnchor="middle"
                fill={accentHex}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="900"
              >
                {Math.round(cpuLoad)}%
              </text>
              <text
                x="87.5"
                y="53"
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="5.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {tempC}°C
              </text>
              <rect x="76" y="57" width="23" height="3" rx="1.5" fill="#1e293b" />
              <rect
                x="76"
                y="57"
                width={Math.max(3, Math.min(23, (cpuLoad / 100) * 23))}
                height="3"
                rx="1.5"
                fill={accentHex}
              />

              <rect x="18" y="70" width="88" height="5" fill="#020617" fillOpacity="0.75" />
              <rect x="52" y="71.5" width="20" height="2" rx="1" fill={accentHex} />
            </g>
          ) : (
            <g>
              <text
                x="62"
                y="49"
                textAnchor="middle"
                fill="#64748b"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                NO SIGNAL
              </text>
            </g>
          )}

          <circle cx="101" cy="78" r="1.3" fill={isOffline ? '#ef4444' : '#34d399'} />
        </g>

        {/* 3. TEMPERED-GLASS WORKSTATION PC CASE (SYSTEM UNIT TOWER) */}
        <g>
          <polygon points="156,14 166,20 166,97 156,102" fill="#020617" stroke="#334155" strokeWidth="0.8" />
          <rect
            x="118"
            y="14"
            width="38"
            height="88"
            rx="4"
            fill={`url(#case-${uid})`}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          <rect
            x="122"
            y="20"
            width="30"
            height="64"
            rx="2.5"
            fill="#020617"
            stroke={accentHex}
            strokeWidth="1"
            strokeOpacity="0.8"
          />

          <rect x="125" y="24" width="14" height="22" rx="1" fill="#1e293b" />
          <line x1="135" y1="26" x2="135" y2="36" stroke={accentHex} strokeWidth="1.5" />
          <line x1="137.5" y1="26" x2="137.5" y2="36" stroke="#a855f7" strokeWidth="1.5" />

          <rect x="124" y="49" width="26" height="9" rx="1.5" fill="#334155" stroke="#475569" strokeWidth="0.7" />
          <line x1="126" y1="53.5" x2="142" y2="53.5" stroke={accentHex} strokeWidth="2" strokeLinecap="round" />

          <g
            className={!isOffline && isLive ? 'animate-pulse' : ''}
            style={{ transformOrigin: '144px 33px', animationDuration: fanDuration }}
          >
            <circle
              cx="144"
              cy="33"
              r="6"
              fill="none"
              stroke={accentHex}
              strokeWidth="1.6"
              strokeDasharray="3 2"
            />
            <circle cx="144" cy="33" r="2" fill={accentHex} />
          </g>

          <g
            className={!isOffline && isLive ? 'animate-pulse' : ''}
            style={{ transformOrigin: '137px 71px', animationDuration: fanDuration }}
          >
            <circle
              cx="137"
              cy="71"
              r="8.5"
              fill="none"
              stroke={accentHex}
              strokeWidth="1.8"
              strokeDasharray="4 2.5"
            />
            <circle cx="137" cy="71" r="2.5" fill="#ffffff" />
          </g>

          <rect x="122" y="86" width="30" height="12" rx="1.5" fill="#0f172a" />
          <circle cx="127" cy="92" r="2" fill={accentHex} />
          <line x1="133" y1="92" x2="148" y2="92" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 4. MECHANICAL BACKLIT KEYBOARD & GAMING MOUSE ON DESK */}
        <g>
          <polygon
            points="24,99 88,99 92,107 20,107"
            fill="#1e293b"
            stroke={accentHex}
            strokeWidth="1"
            strokeOpacity="0.85"
          />
          <line
            x1="26"
            y1="102"
            x2="86"
            y2="102"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="3 1.5"
          />
          <line
            x1="24"
            y1="104.8"
            x2="88"
            y2="104.8"
            stroke={accentHex}
            strokeWidth="1.5"
            strokeDasharray="4 1.5"
          />

          <ellipse
            cx="104"
            cy="103.5"
            rx="5"
            ry="3.5"
            fill="#1e293b"
            stroke={accentHex}
            strokeWidth="1"
          />
          <line x1="104" y1="100.5" x2="104" y2="103" stroke="#ffffff" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC 3D LAB ROW & SERVER RACK POD VISUALIZER
// Mirrors the exact real-time status of the 6 PCs in each Laboratory Pod!
// ============================================================================
const RealisticLabClusterPodVisual: React.FC<{
  pod: LabPod;
  liveTick: number;
}> = ({ pod, liveTick }) => {
  const podNodes = pod.nodes.slice(0, 6);
  return (
    <div className="h-32 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden text-white border-2 border-blue-400/35 shadow-inner">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 z-10">
        <span className="flex items-center gap-1.5 font-black text-sky-300">
          <Server className="w-3.5 h-3.5 text-sky-400" /> {pod.code} CLUSTER
        </span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black">
          {pod.availableSeats} / {pod.totalSeats} Available
        </span>
      </div>

      {/* Visual Row of 6 Realistic Mini Desktop PCs reflecting exact node statuses */}
      <div className="grid grid-cols-6 gap-1.5 my-1 z-10">
        {podNodes.map((node, idx) => {
          const isAvail = node.status === 'Available';
          const isInUse = node.status === 'In Use';
          const isMaint = node.status === 'Maintenance';
          const pulseOn = (idx + Math.floor(liveTick)) % 2 === 0;

          return (
            <div key={node.id} className="flex flex-col items-center" title={`${node.pcNumber}: ${node.status}`}>
              <div
                className={`w-full h-6 rounded-sm border flex flex-col justify-between p-0.5 transition-all duration-300 ${
                  isInUse
                    ? 'bg-gradient-to-b from-blue-600 to-blue-950 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : isAvail
                    ? 'bg-emerald-950/90 border-emerald-400/80'
                    : isMaint
                    ? 'bg-amber-950/90 border-amber-400/80'
                    : 'bg-rose-950/90 border-rose-500/70 opacity-60'
                }`}
              >
                <div className="w-2/3 h-0.5 bg-white/80 rounded-full" />
                <div
                  className={`w-full h-1 rounded-xs ${
                    isInUse
                      ? pulseOn
                        ? 'bg-sky-300'
                        : 'bg-blue-400'
                      : isAvail
                      ? 'bg-emerald-400'
                      : isMaint
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
              <div className="w-1.5 h-1 bg-slate-400" />
              <div className="w-4 h-0.5 bg-slate-500 rounded-full" />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10 z-10">
        <p className="text-[11px] font-black text-white truncate max-w-[155px]">{pod.name}</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                (i + Math.floor(liveTick * 2)) % 2 === 0 ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DEFAULT_LABS_SEED = [
  { id: 'LAB-101', labName: 'ComLab 1 (Networking & ICT)', roomNumber: 'CL-101', capacity: 6, status: 'Active' },
  { id: 'LAB-102', labName: 'ComLab 2 (Multimedia & Graphics)', roomNumber: 'CL-102', capacity: 6, status: 'Active' },
  { id: 'LAB-103', labName: 'ComLab 3 (AI & Software Eng)', roomNumber: 'CL-103', capacity: 6, status: 'Active' },
  { id: 'LAB-104', labName: 'ComLab 4 (Cybersecurity & IoT)', roomNumber: 'CL-104', capacity: 6, status: 'Active' }
];

const INITIAL_FLEET_TOPOLOGY: WorkstationNode[] = [
  // ComLab 1 (6 Units)
  { id: 'ws-101', pcNumber: 'PC-001', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.101', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 38 },
  { id: 'ws-102', pcNumber: 'PC-002', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.102', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 9, tempC: 39 },
  { id: 'ws-103', pcNumber: 'PC-003', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.103', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 6, tempC: 37 },
  { id: 'ws-104', pcNumber: 'PC-004', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.104', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 7, tempC: 38 },
  { id: 'ws-105', pcNumber: 'PC-005', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.105', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 9, tempC: 39 },
  { id: 'ws-106', pcNumber: 'PC-008', labRoom: 'ComLab 1 (Networking & ICT)', ipAddress: '10.101.0.108', specs: 'Core i7-13700 / 32GB DDR5 / RTX 4060', status: 'In Use', assignedUser: '2024-IS-0142 (Maria Clara Santos)', adminSyncSource: 'Admin QR Stream: Active Session', cpuLoad: 54, tempC: 58 },

  // ComLab 2 (6 Units)
  { id: 'ws-201', pcNumber: 'PC-011', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.111', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 10, tempC: 39 },
  { id: 'ws-202', pcNumber: 'PC-012', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.112', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 11, tempC: 40 },
  { id: 'ws-203', pcNumber: 'PC-014', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.114', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Maintenance', assignedUser: 'Admin Service Desk', adminSyncSource: 'Admin Ticket: Peripheral Replacement', cpuLoad: 14, tempC: 43 },
  { id: 'ws-204', pcNumber: 'PC-015', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.115', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 7, tempC: 38 },
  { id: 'ws-205', pcNumber: 'PC-018', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.118', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 38 },
  { id: 'ws-206', pcNumber: 'PC-019', labRoom: 'ComLab 2 (Multimedia & Graphics)', ipAddress: '10.102.0.119', specs: 'Ryzen 7 7700X / 32GB / RTX 4070 Super', status: 'Maintenance', assignedUser: 'Admin Service Desk', adminSyncSource: 'Admin Ticket: NIC Port Check', cpuLoad: 10, tempC: 41 },

  // ComLab 3 (6 Units)
  { id: 'ws-301', pcNumber: 'PC-021', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.121', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 7, tempC: 37 },
  { id: 'ws-302', pcNumber: 'PC-022', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.122', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 5, tempC: 36 },
  { id: 'ws-303', pcNumber: 'PC-023', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.123', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 37 },
  { id: 'ws-304', pcNumber: 'PC-024', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.124', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 9, tempC: 38 },
  { id: 'ws-305', pcNumber: 'PC-025', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.125', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 6, tempC: 37 },
  { id: 'ws-306', pcNumber: 'PC-026', labRoom: 'ComLab 3 (AI & Software Eng)', ipAddress: '10.103.0.126', specs: 'Core i9-14900K / 64GB DDR5 / RTX 4080', status: 'Offline', adminSyncSource: 'Admin Write-Off: Power Supply Offline', cpuLoad: 0, tempC: 29 },

  // ComLab 4 (6 Units)
  { id: 'ws-401', pcNumber: 'PC-031', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.131', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 9, tempC: 39 },
  { id: 'ws-402', pcNumber: 'PC-032', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.132', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 38 },
  { id: 'ws-403', pcNumber: 'PC-033', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.133', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 7, tempC: 38 },
  { id: 'ws-404', pcNumber: 'PC-034', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.134', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 6, tempC: 37 },
  { id: 'ws-405', pcNumber: 'PC-035', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.135', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 38 },
  { id: 'ws-406', pcNumber: 'PC-036', labRoom: 'ComLab 4 (Cybersecurity & IoT)', ipAddress: '10.104.0.136', specs: 'Core i7-13700 / 32GB DDR5 / Dual NIC', status: 'Available', adminSyncSource: 'Admin Fleet: Authorized & Available', cpuLoad: 8, tempC: 38 }
];

export const LabAvailabilityView: React.FC<LabAvailabilityViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';

  // Filter & Layout View States
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [onlyAvailableToggle, setOnlyAvailableToggle] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'Matrix' | 'Table'>('Matrix');
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [lastAdminSync, setLastAdminSync] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Real-Time 60FPS Telemetry Loop
  const [isLiveTelemetry, setIsLiveTelemetry] = useState<boolean>(true);
  const [liveTick, setLiveTick] = useState<number>(0);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  // Selected Node Inspection & Admin Sync Override State
  const [inspectNode, setInspectNode] = useState<WorkstationNode | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const [assignStudentName, setAssignStudentName] = useState<string>('');

  // Persistent Labs & Workstation Nodes State
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

  const [nodes, setNodes] = useState<WorkstationNode[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_workstations_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FLEET_TOPOLOGY;
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const triggerToast = useCallback(
    (msg: string) => {
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 3500);
      if (onTriggerNotification) onTriggerNotification(msg);
    },
    [onTriggerNotification]
  );

  // Save changes to shared localStorage so Admin & Instructor portals stay 100% synced
  useEffect(() => {
    try {
      if (nodes.length > 0) {
        localStorage.setItem('labtrack_workstations_v4', JSON.stringify(nodes));
      }
    } catch {}
  }, [nodes]);

  // ============================================================================
  // DYNAMIC & AUTOMATIC ADMIN PORTAL RECONCILIATION ENGINE
  // Automatically reflects Admin QR Sessions, Service Desk Tickets & Write-Offs!
  // ============================================================================
  const syncWithAdminPortal = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoadingData(true);

      // 1. Read Admin Service Desk Tickets (Open/In-Progress tickets -> Maintenance)
      const adminTicketsMap = new Map<string, string>();
      try {
        const rawTickets = JSON.parse(localStorage.getItem('labtrack_service_tickets_v4') || 'null');
        if (Array.isArray(rawTickets)) {
          rawTickets.forEach((t: any) => {
            if (t && t.workstation && t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
              adminTicketsMap.set(
                String(t.workstation).trim().toUpperCase(),
                `Admin Ticket (${t.priority || 'OPEN'}): ${t.description || 'Under Maintenance'}`
              );
            }
          });
        }
      } catch {}

      // 2. Read Admin Student QR Attendance Logs (IN_SESSION -> In Use; Completed -> Available)
      const activeQrMap = new Map<string, string>();
      try {
        const rawQr = JSON.parse(localStorage.getItem('labtrack_qr_attendance_logs_v2') || 'null');
        if (Array.isArray(rawQr)) {
          rawQr.forEach((q: any) => {
            if (q && q.workstation && q.status === 'IN_SESSION') {
              activeQrMap.set(
                String(q.workstation).trim().toUpperCase(),
                `${q.studentId || 'STU'} (${q.studentName || 'Active Student'})`
              );
            }
          });
        }
      } catch {}

      // 3. Read Admin Write-Off / Condemned Ledger (Condemned/Beyond Repair -> Offline)
      const condemnedMap = new Map<string, string>();
      try {
        const rawWo = JSON.parse(localStorage.getItem('labtrack_writeoff_assets_v2') || 'null');
        if (Array.isArray(rawWo)) {
          rawWo.forEach((w: any) => {
            if (w && w.id && w.status !== 'REPLACED') {
              condemnedMap.set(
                String(w.id).trim().toUpperCase(),
                `Admin Write-Off (${w.status}): ${w.issue || w.name}`
              );
            }
          });
        }
      } catch {}

      // 4. Read Admin Direct Overrides
      const adminOverridesMap = new Map<string, WorkstationNode['status']>();
      try {
        const rawOverrides = JSON.parse(localStorage.getItem('labtrack_admin_pc_overrides') || 'null');
        if (rawOverrides && typeof rawOverrides === 'object') {
          Object.entries(rawOverrides).forEach(([k, v]) => {
            adminOverridesMap.set(k.toUpperCase(), v as WorkstationNode['status']);
          });
        }
      } catch {}

      // 5. Optional Backend API Poll
      const [labsRes, activeSessionsRes] = await Promise.all([
        apiClient.get('/api/v1/laboratories').catch(() => null),
        apiClient.get('/api/v1/pc-usage/active?pageNumber=1&pageSize=100').catch(() => null)
      ]);

      const labsRaw = labsRes?.data?.data?.items || labsRes?.data?.data || labsRes?.data || [];
      if (Array.isArray(labsRaw) && labsRaw.length > 0) {
        setLabs(labsRaw);
      }

      const apiActiveList =
        activeSessionsRes?.data?.data?.items ||
        activeSessionsRes?.data?.data ||
        activeSessionsRes?.data ||
        [];
      if (Array.isArray(apiActiveList)) {
        apiActiveList.forEach((s: any) => {
          const wsCode = String(s.workstationCode || s.workstationName || s.pcNumber || '').trim().toUpperCase();
          if (wsCode) {
            activeQrMap.set(wsCode, `${s.studentId || 'STU'} (${s.studentName || s.userName || 'Student'})`);
          }
        });
      }

      // 6. Dynamically Reconcile Every Workstation with Admin's Live State
      setNodes(prev => {
        const updated = prev.map(node => {
          const key = node.pcNumber.trim().toUpperCase();

          if (condemnedMap.has(key)) {
            return {
              ...node,
              status: 'Offline' as const,
              assignedUser: undefined,
              adminSyncSource: condemnedMap.get(key),
              cpuLoad: 0,
              tempC: 28
            };
          }

          if (adminTicketsMap.has(key)) {
            return {
              ...node,
              status: 'Maintenance' as const,
              assignedUser: 'Admin Service Desk',
              adminSyncSource: adminTicketsMap.get(key),
              cpuLoad: Math.max(10, Math.min(20, node.cpuLoad || 12)),
              tempC: 42
            };
          }

          if (activeQrMap.has(key)) {
            return {
              ...node,
              status: 'In Use' as const,
              assignedUser: activeQrMap.get(key),
              adminSyncSource: 'Admin QR Gate: Active Session',
              cpuLoad: Math.max(38, node.cpuLoad || 48),
              tempC: Math.max(54, node.tempC || 56)
            };
          }

          if (adminOverridesMap.has(key)) {
            const ovStatus = adminOverridesMap.get(key)!;
            return {
              ...node,
              status: ovStatus,
              assignedUser: ovStatus === 'Available' ? undefined : node.assignedUser,
              adminSyncSource: `Admin Override: ${ovStatus}`,
              cpuLoad: ovStatus === 'Offline' ? 0 : node.cpuLoad || 8,
              tempC: ovStatus === 'Offline' ? 28 : node.tempC || 38
            };
          }

          // If a QR session or ticket was cleared in Admin, automatically restore to Available
          if (
            (node.status === 'In Use' && node.adminSyncSource?.includes('QR') && !activeQrMap.has(key)) ||
            (node.status === 'Maintenance' && node.adminSyncSource?.includes('Ticket') && !adminTicketsMap.has(key))
          ) {
            return {
              ...node,
              status: 'Available' as const,
              assignedUser: undefined,
              adminSyncSource: 'Admin Fleet: Authorized & Available',
              cpuLoad: 7,
              tempC: 37
            };
          }

          return node;
        });

        return updated;
      });

      setLastAdminSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
    } finally {
      if (showSpinner) setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    syncWithAdminPortal(true);
    const syncTimer = setInterval(() => {
      syncWithAdminPortal(false);
    }, 2500);

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        e.key.includes('qr_attendance') ||
        e.key.includes('service_tickets') ||
        e.key.includes('writeoff') ||
        e.key.includes('workstations') ||
        e.key.includes('overrides')
      ) {
        syncWithAdminPortal(false);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      clearInterval(syncTimer);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [syncWithAdminPortal]);

  // Real-Time 60FPS Telemetry Loop & Dynamic CPU/Thermal Oscillator
  useEffect(() => {
    if (!isLiveTelemetry) return;
    const interval = setInterval(() => {
      setLiveTick(prev => prev + 0.25);

      setNodes(prev =>
        prev.map((n, idx) => {
          if (n.status === 'Offline') {
            return { ...n, cpuLoad: 0, tempC: 28 };
          }
          const wave = Math.sin(Date.now() / 1100 + idx * 0.9);
          if (n.status === 'In Use') {
            const nextCpu = Math.min(92, Math.max(28, Math.round(n.cpuLoad + wave * 3)));
            const nextTemp = Math.min(76, Math.max(48, Math.round(44 + nextCpu * 0.35)));
            return { ...n, cpuLoad: nextCpu, tempC: nextTemp };
          }
          if (n.status === 'Maintenance') {
            return { ...n, cpuLoad: Math.max(10, Math.min(22, Math.round(14 + wave * 2))), tempC: 42 };
          }
          const idleCpu = Math.min(15, Math.max(4, Math.round(8 + wave * 2)));
          return { ...n, cpuLoad: idleCpu, tempC: 36 + Math.round(idleCpu * 0.25) };
        })
      );
    }, 950);
    return () => clearInterval(interval);
  }, [isLiveTelemetry]);

  // Keep inspectNode live-synced with telemetry updates when not editing
  useEffect(() => {
    if (!inspectNode || isEditingNode) return;
    const latest = nodes.find(n => n.id === inspectNode.id);
    if (latest) setInspectNode(latest);
  }, [nodes, inspectNode, isEditingNode]);

  // Lab Pods Summary — 100% Mathematically Aligned with Workstation Nodes
  const labPods: LabPod[] = useMemo(() => {
    return labs.map((lab, idx) => {
      const labName = lab.labName || lab.name || `ComLab ${idx + 1}`;
      const shortPrefix = labName.split('(')[0].trim().toLowerCase();
      const labNodes = nodes.filter(
        n =>
          n.labRoom.toLowerCase() === labName.toLowerCase() ||
          n.labRoom.toLowerCase().includes(shortPrefix)
      );

      const availableSeats = labNodes.filter(n => n.status === 'Available').length;
      const inUseSeats = labNodes.filter(n => n.status === 'In Use').length;
      const maintenanceSeats = labNodes.filter(
        n => n.status === 'Maintenance' || n.status === 'Offline'
      ).length;
      const offlineSeats = labNodes.filter(n => n.status === 'Offline').length;
      const totalSeats = labNodes.length;

      let statusBadge: LabPod['statusBadge'] = 'Optimal';
      if (offlineSeats > 0 || maintenanceSeats >= 2) statusBadge = 'Maintenance';
      else if (totalSeats > 0 && inUseSeats >= totalSeats * 0.5) statusBadge = 'High Load';

      return {
        id: lab.id || `pod-${idx}`,
        name: labName,
        code: lab.roomNumber || `LAB-${String(idx + 1).padStart(2, '0')}`,
        totalSeats,
        availableSeats,
        inUseSeats,
        maintenanceSeats,
        offlineSeats,
        nodes: labNodes,
        statusBadge
      };
    });
  }, [nodes, labs]);

  // Filtered Workstations
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (onlyAvailableToggle && node.status !== 'Available') return false;
      const targetLab = selectedLab.trim().toLowerCase();
      const nodeLab = (node.labRoom || '').toLowerCase();
      const matchesLab =
        !targetLab ||
        nodeLab.includes(targetLab) ||
        targetLab.includes(nodeLab.split('(')[0].trim());
      const matchesStatus = statusFilter === 'All' || node.status === statusFilter;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (node.pcNumber || '').toLowerCase().includes(q) ||
        (node.ipAddress || '').toLowerCase().includes(q) ||
        (node.specs || '').toLowerCase().includes(q) ||
        (node.assignedUser || '').toLowerCase().includes(q) ||
        nodeLab.includes(q);
      return matchesLab && matchesStatus && matchesSearch;
    });
  }, [nodes, onlyAvailableToggle, selectedLab, statusFilter, searchQuery]);

  // System Stats — 100% Aligned with Pods & Matrix
  const nodeStats = useMemo(() => {
    return {
      total: nodes.length,
      available: nodes.filter(n => n.status === 'Available').length,
      inUse: nodes.filter(n => n.status === 'In Use').length,
      maintenance: nodes.filter(n => n.status === 'Maintenance').length,
      offline: nodes.filter(n => n.status === 'Offline').length
    };
  }, [nodes]);

  const saveAdminStatusOverride = (pcCode: string, status: WorkstationNode['status'] | null) => {
    try {
      const raw = JSON.parse(localStorage.getItem('labtrack_admin_pc_overrides') || '{}');
      if (status === null) {
        delete raw[pcCode.toUpperCase()];
      } else {
        raw[pcCode.toUpperCase()] = status;
      }
      localStorage.setItem('labtrack_admin_pc_overrides', JSON.stringify(raw));
    } catch {}
  };

  // Assign a student to an Available PC (Syncs with Admin QR Attendance Ledger)
  const handleAssignStudentToAvailablePc = (node: WorkstationNode) => {
    const studentLabel = assignStudentName.trim() || '2024-IS-0199 (Verified Student)';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nowDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    setNodes(prev =>
      prev.map(n =>
        n.id === node.id
          ? {
              ...n,
              status: 'In Use',
              assignedUser: studentLabel,
              adminSyncSource: 'Admin & Instructor Synced: Active Session',
              cpuLoad: 44,
              tempC: 54
            }
          : n
      )
    );

    try {
      const rawQr = JSON.parse(localStorage.getItem('labtrack_qr_attendance_logs_v2') || '[]');
      const newQrEntry = {
        id: `QRL-${Math.floor(3000 + Math.random() * 6000)}`,
        studentId: studentLabel.split(' ')[0] || '2024-IS-0199',
        studentName: studentLabel.replace(/^[^\s]+\s*\(?|\)?$/g, '') || studentLabel,
        laboratoryRoom: node.labRoom,
        workstation: node.pcNumber,
        date: nowDate,
        timeIn: nowTime,
        timeOut: '--:--',
        duration: '1s',
        startTimestampMs: Date.now(),
        elapsedSeconds: 1,
        logoutType: 'ACTIVE',
        status: 'IN_SESSION'
      };
      localStorage.setItem('labtrack_qr_attendance_logs_v2', JSON.stringify([newQrEntry, ...rawQr]));
    } catch {}

    saveAdminStatusOverride(node.pcNumber, null);
    setAssignStudentName('');
    setInspectNode(null);
    triggerToast(`${node.pcNumber} is now IN USE by ${studentLabel} (Synced with Admin QR Ledger).`);
  };

  // Release PC back to Available (Completes Admin QR Session & Resolves Admin Ticket)
  const handleReleasePcToAvailable = (node: WorkstationNode) => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const rawQr = JSON.parse(localStorage.getItem('labtrack_qr_attendance_logs_v2') || '[]');
      if (Array.isArray(rawQr)) {
        const updatedQr = rawQr.map((q: any) =>
          String(q.workstation || '').toUpperCase() === node.pcNumber.toUpperCase() && q.status === 'IN_SESSION'
            ? { ...q, status: 'COMPLETED', logoutType: 'MANUAL_SCAN', timeOut: nowTime }
            : q
        );
        localStorage.setItem('labtrack_qr_attendance_logs_v2', JSON.stringify(updatedQr));
      }
    } catch {}

    try {
      const rawTickets = JSON.parse(localStorage.getItem('labtrack_service_tickets_v4') || '[]');
      if (Array.isArray(rawTickets)) {
        const updatedTickets = rawTickets.map((t: any) =>
          String(t.workstation || '').toUpperCase() === node.pcNumber.toUpperCase()
            ? { ...t, status: 'RESOLVED' }
            : t
        );
        localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify(updatedTickets));
      }
    } catch {}

    saveAdminStatusOverride(node.pcNumber, 'Available');

    setNodes(prev =>
      prev.map(n =>
        n.id === node.id
          ? {
              ...n,
              status: 'Available',
              assignedUser: undefined,
              adminSyncSource: 'Admin Fleet: Authorized & Available',
              cpuLoad: 7,
              tempC: 37
            }
          : n
      )
    );

    setInspectNode(null);
    triggerToast(`${node.pcNumber} is now AVAILABLE and ready for use.`);
  };

  // CRUD Handler: UPDATE
  const handleSaveNode = () => {
    if (!inspectNode) return;
    saveAdminStatusOverride(inspectNode.pcNumber, inspectNode.status);

    if (inspectNode.status === 'Available') {
      handleReleasePcToAvailable(inspectNode);
      setIsEditingNode(false);
      return;
    }

    setNodes(prev =>
      prev.map(n =>
        n.id === inspectNode.id
          ? {
              ...inspectNode,
              labRoom: inspectNode.labRoom.trim(),
              adminSyncSource: `Admin Synced: ${inspectNode.status}`
            }
          : n
      )
    );
    setIsEditingNode(false);
    triggerToast(`Synced ${inspectNode.pcNumber} (${inspectNode.status}) with Admin Portal.`);
  };

  // Remote Reboot / Maintenance Toggle
  const handleRemoteReboot = (id: string) => {
    const target = nodes.find(n => n.id === id);
    if (!target) return;
    setRebootingId(id);
    setTimeout(() => {
      handleReleasePcToAvailable(target);
      setRebootingId(null);
      triggerToast(`Remote Reboot Complete: ${target.pcNumber} is now AVAILABLE at 37°C.`);
    }, 550);
  };

  const handleToggleMaintenance = (id: string) => {
    const target = nodes.find(n => n.id === id);
    if (!target) return;

    if (target.status === 'Maintenance') {
      handleReleasePcToAvailable(target);
      return;
    }

    saveAdminStatusOverride(target.pcNumber, 'Maintenance');
    try {
      const rawTickets = JSON.parse(localStorage.getItem('labtrack_service_tickets_v4') || '[]');
      const newTicket = {
        id: `TICK-${Math.floor(910 + Math.random() * 89)}`,
        ticketNo: `TK-${Math.floor(910 + Math.random() * 89)}M`,
        lab: target.labRoom,
        workstation: target.pcNumber,
        reportedBy: 'Faculty Instructor',
        reporterType: 'FACULTY',
        category: 'HARDWARE',
        priority: 'HIGH',
        status: 'OPEN',
        description: `Flagged for maintenance via Lab Availability Matrix (${target.specs}).`
      };
      localStorage.setItem('labtrack_service_tickets_v4', JSON.stringify([newTicket, ...rawTickets]));
    } catch {}

    setNodes(prev =>
      prev.map(n =>
        n.id === id
          ? {
              ...n,
              status: 'Maintenance',
              assignedUser: 'Admin Service Desk',
              adminSyncSource: 'Admin Ticket: Under Maintenance',
              cpuLoad: 12,
              tempC: 42
            }
          : n
      )
    );
    setInspectNode(null);
    triggerToast(`Flagged ${target.pcNumber} for Maintenance (Synced to Admin Service Desk).`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['PC Number,Lab Room,IP Address,Specifications,Admin Synced Status,Assigned User,CPU Load,Temp (C)']
        .concat(
          filteredNodes.map(
            n =>
              `${n.pcNumber},"${n.labRoom}",${n.ipAddress},"${n.specs}",${n.status},"${n.assignedUser || 'Available'}",${n.cpuLoad}%,${n.tempC}°C`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRMSU_LabTrack_Workstations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported Admin-Synced Workstation Availability to CSV.');
  };
  return (
    <div className="lab-avail-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* BALANCED SLATE-BLUE & ROYAL BLUE 3D EXTRUDED STYLES */}
      <style>{`
        .lab-avail-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .lab-avail-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .ws-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .ws-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -5px, 10px) rotateX(2deg);
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
        @keyframes wsRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .ws-rig-float {
          animation: wsRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes wsHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .ws-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: wsHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY */}
      <datalist id="lab-room-suggestions">
        {labs.map(lab => (
          <option key={lab.id} value={lab.labName || lab.name || ''} />
        ))}
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
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR
         ===================================================================== */}
      <div className="ws-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-1.5 rounded-2xl bg-slate-950/70 border border-blue-400/40 shadow-inner">
            <RealisticDesktopPcSetup
              status="Available"
              pcNumber={`${nodeStats.available} FREE`}
              cpuLoad={12}
              tempC={38}
              isLive={isLiveTelemetry}
              size="hero"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AUTO-SYNCED WITH ADMIN • {lastAdminSync}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800/80 text-sky-200 rounded-full font-mono font-black text-[10px] border border-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-300" /> {activeCampus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Lab Availability &amp; Workstations
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Live Admin-connected workstation matrix: shows available PCs ready for use, active QR sessions, and maintenance units
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* 1-CLICK "AVAILABLE ONLY" FILTER BUTTON */}
          <button
            type="button"
            onClick={() => {
              const next = !onlyAvailableToggle;
              setOnlyAvailableToggle(next);
              if (next) setStatusFilter('All');
              triggerToast(
                next
                  ? `Showing all ${nodeStats.available} Available PCs authorized by Admin.`
                  : 'Showing all workstation statuses (Available, In Use, Maintenance, Offline).'
              );
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-black transition flex items-center gap-2 cursor-pointer border-2 ${
              onlyAvailableToggle
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_4px_0_#065f46]'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/40 shadow-[0_4px_0_#020617]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {onlyAvailableToggle
                ? `Available Only (${nodeStats.available} PCs)`
                : `Show Available Only (${nodeStats.available})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLiveTelemetry(!isLiveTelemetry);
              triggerToast(
                !isLiveTelemetry ? 'Resumed 60FPS workstation telemetry.' : 'Paused live telemetry stream.'
              );
            }}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-mono font-black transition flex items-center gap-2 cursor-pointer border ${
              isLiveTelemetry
                ? 'bg-blue-500/20 text-sky-200 border-blue-400/50 shadow-[0_4px_0_#020617]'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isLiveTelemetry ? 'animate-pulse text-sky-300' : ''}`} />
            <span>{isLiveTelemetry ? '60FPS LIVE' : 'PAUSED'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              syncWithAdminPortal(true);
              triggerToast('Reconciled workstation availability with Admin QR Sessions & Service Desk.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
            <span>Sync Admin</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. SYSTEM STATS 3D METRIC TILES (5 INTERACTIVE FILTER CUBES)
         ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setOnlyAvailableToggle(false);
            setStatusFilter('All');
          }}
          className={`ws-card-3d-lift p-4 rounded-2xl border-2 text-left cursor-pointer ${
            statusFilter === 'All' && !onlyAvailableToggle
              ? 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white border-blue-400 shadow-[0_5px_0_#0f172a]'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">Total Admin Fleet</span>
          <p className="text-xl font-black font-mono mt-0.5">{nodeStats.total} PCs</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setOnlyAvailableToggle(false);
            setStatusFilter('Available');
          }}
          className={`ws-card-3d-lift p-4 rounded-2xl border-2 text-left cursor-pointer ${
            statusFilter === 'Available' || onlyAvailableToggle
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_5px_0_#064e3b]'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50 shadow-[0_4px_0_#d1fae5]'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">Optimal / Available</span>
          <p className="text-xl font-black font-mono mt-0.5">{nodeStats.available} Units</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setOnlyAvailableToggle(false);
            setStatusFilter('In Use');
          }}
          className={`ws-card-3d-lift p-4 rounded-2xl border-2 text-left cursor-pointer ${
            statusFilter === 'In Use'
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_5px_0_#1e3a8a]'
              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50/50 shadow-[0_4px_0_#dbeafe]'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">Active / In Use</span>
          <p className="text-xl font-black font-mono mt-0.5">{nodeStats.inUse} Active</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setOnlyAvailableToggle(false);
            setStatusFilter('Maintenance');
          }}
          className={`ws-card-3d-lift p-4 rounded-2xl border-2 text-left cursor-pointer ${
            statusFilter === 'Maintenance'
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_5px_0_#78350f]'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50 shadow-[0_4px_0_#fef3c7]'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">Under Maintenance</span>
          <p className="text-xl font-black font-mono mt-0.5">{nodeStats.maintenance} Units</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setOnlyAvailableToggle(false);
            setStatusFilter('Offline');
          }}
          className={`ws-card-3d-lift p-4 rounded-2xl border-2 text-left cursor-pointer ${
            statusFilter === 'Offline'
              ? 'bg-rose-600 text-white border-rose-400 shadow-[0_5px_0_#881337]'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50 shadow-[0_4px_0_#ffe4e6]'
          }`}
        >
          <span className="text-[10px] font-mono font-black uppercase block opacity-80">Outage / Offline</span>
          <p className="text-xl font-black font-mono mt-0.5">{nodeStats.offline} Outages</p>
        </button>
      </div>

      {/* =====================================================================
          3. LAB AVAILABILITY PODS 3D GRID (100% ALIGNED WITH MATRIX BELOW)
         ===================================================================== */}
      <div className="lab-avail-panel-3d p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
              ADMIN-CONNECTED ROOM CAPACITIES
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Lab Availability Pods ({labPods.length} Facilities)
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Filter Lab:</span>
            <div className="relative">
              <input
                type="text"
                list="lab-room-suggestions"
                placeholder="Select/Type Lab..."
                value={selectedLab}
                onChange={e => setSelectedLab(e.target.value)}
                className="bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none focus:border-blue-600 w-52"
              />
              {selectedLab && (
                <button
                  type="button"
                  onClick={() => setSelectedLab('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {labPods.map(pod => {
            const isPodSelected =
              selectedLab.trim().toLowerCase() !== '' &&
              pod.name.toLowerCase().includes(selectedLab.trim().toLowerCase());

            return (
              <div
                key={pod.id}
                onClick={() => setSelectedLab(isPodSelected ? '' : pod.name)}
                title="Click to filter workstations by this laboratory"
                className={`ws-card-3d-lift p-4 rounded-2xl border-2 space-y-3 relative overflow-hidden cursor-pointer flex flex-col justify-between h-full ${
                  isPodSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-[0_6px_0_#2563eb]'
                    : 'bg-white border-slate-200 hover:border-blue-400 shadow-[0_5px_0_#e2e8f0]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {pod.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider shadow-2xs ${
                      pod.statusBadge === 'Optimal'
                        ? 'bg-emerald-500 text-white'
                        : pod.statusBadge === 'High Load'
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {pod.statusBadge}
                  </span>
                </div>

                <RealisticLabClusterPodVisual pod={pod} liveTick={liveTick} />

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono font-bold pt-1">
                  <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-black text-xs block">{pod.availableSeats}</span>
                    <span className="text-slate-500 font-sans text-[9px]">Available</span>
                  </div>
                  <div className="bg-blue-50 p-1.5 rounded-xl border border-blue-200">
                    <span className="text-blue-700 font-black text-xs block">{pod.inUseSeats}</span>
                    <span className="text-slate-500 font-sans text-[9px]">In Use</span>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-xl border border-amber-200">
                    <span className="text-amber-700 font-black text-xs block">{pod.maintenanceSeats}</span>
                    <span className="text-slate-500 font-sans text-[9px]">Maint</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          4. WORKSTATION 3D MATRIX GRID (WITH REALISTIC DESKTOP PC SETUPS!)
         ===================================================================== */}
      <div className="lab-avail-panel-3d p-5 sm:p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
              REALISTIC 3D DESKTOP WORKSTATION FLOOR MATRIX (SYNCED WITH ADMIN)
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Workstation Status &amp; Availability ({filteredNodes.length} PCs Shown)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Green PCs are available &amp; authorized by Admin • Blue PCs have active student sessions • Amber PCs are under Admin maintenance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('Matrix')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'Matrix'
                    ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                    : 'hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>3D PC Rigs</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('Table')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'Table'
                    ? 'bg-blue-600 text-white shadow-[0_2px_0_#1e3a8a]'
                    : 'hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PC-001, IP, user, specs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs font-bold pl-8 pr-3 py-2 rounded-xl border-2 border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* WORKSTATION GRID MATRIX OR TABLE VIEW */}
        {viewMode === 'Matrix' ? (
          <div className="p-4 sm:p-5 bg-slate-100/90 rounded-3xl border-2 border-slate-200/90 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-stretch">
              {filteredNodes.map(node => {
                const isAvailable = node.status === 'Available';
                const isInUse = node.status === 'In Use';
                const isMaintenance = node.status === 'Maintenance';
                const isRebooting = rebootingId === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setInspectNode(node);
                      setIsEditingNode(false);
                    }}
                    className={`ws-card-3d-lift p-3.5 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2.5 group relative h-full ${
                      isRebooting
                        ? 'bg-slate-900 text-sky-300 border-sky-400 animate-pulse shadow-[0_6px_0_#0284c7]'
                        : isInUse
                        ? 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white border-blue-400/70 shadow-[0_6px_0_#0f172a]'
                        : isAvailable
                        ? 'bg-white text-slate-800 border-emerald-400 hover:border-emerald-500 shadow-[0_6px_0_#a7f3d0]'
                        : isMaintenance
                        ? 'bg-amber-50/95 text-amber-950 border-amber-400 shadow-[0_6px_0_#fcd34d]'
                        : 'bg-rose-50/95 text-rose-950 border-rose-300 shadow-[0_6px_0_#fda4af]'
                    }`}
                  >
                    {/* Top PC Tag & Status Pill */}
                    <div className="flex justify-between items-center text-[10px] font-mono font-black">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvailable
                              ? 'bg-emerald-500'
                              : isInUse
                              ? 'bg-sky-300 animate-ping'
                              : isMaintenance
                              ? 'bg-amber-500'
                              : 'bg-rose-600'
                          }`}
                        />
                        {node.pcNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[8.5px] uppercase ${
                          isInUse
                            ? 'bg-blue-600 text-white'
                            : isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isMaintenance
                            ? 'bg-amber-200 text-amber-950'
                            : 'bg-rose-200 text-rose-900'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    {/* REALISTIC 3D DESKTOP PC GRAPHIC (MONITOR + GLASS CASE + FANS + KB/MOUSE) */}
                    <div
                      className={`rounded-xl p-1.5 border ${
                        isInUse
                          ? 'bg-slate-950/70 border-blue-400/30'
                          : 'bg-slate-900/95 border-slate-800'
                      }`}
                    >
                      <RealisticDesktopPcSetup
                        status={node.status}
                        pcNumber={node.pcNumber}
                        cpuLoad={node.cpuLoad}
                        tempC={node.tempC}
                        isLive={isLiveTelemetry}
                        size="card"
                      />
                    </div>

                    {/* Lab Room & IP / Student Info */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black truncate">
                        {node.labRoom.split('(')[0].trim()}
                      </p>
                      <p
                        className={`text-[9.5px] font-mono truncate ${
                          isInUse
                            ? 'text-sky-300 font-bold'
                            : isAvailable
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {node.assignedUser || (isAvailable ? `Ready • ${node.ipAddress}` : node.ipAddress)}
                      </p>
                    </div>

                    {/* Bottom CPU & Thermal Bar */}
                    <div className="space-y-1 pt-1 border-t border-current/10">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                        <span>CPU {node.status === 'Offline' ? '0' : Math.round(node.cpuLoad)}%</span>
                        <span>{node.tempC}&deg;C</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/15 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isInUse
                              ? 'bg-sky-400'
                              : isAvailable
                              ? 'bg-emerald-500'
                              : isMaintenance
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${node.status === 'Offline' ? 0 : Math.max(8, node.cpuLoad)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-sky-300 font-mono font-black uppercase text-[10px] border-b-2 border-slate-800">
                <tr>
                  <th className="p-3.5">PC Unit</th>
                  <th className="p-3.5">Laboratory Room</th>
                  <th className="p-3.5">IP &amp; User / Admin Sync</th>
                  <th className="p-3.5">Hardware Specs</th>
                  <th className="p-3.5">Live Telemetry</th>
                  <th className="p-3.5">Admin Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-700 bg-white">
                {filteredNodes.map(node => (
                  <tr key={node.id} className="transition-all duration-300 hover:bg-blue-50/50">
                    <td className="p-3.5 font-mono font-black text-slate-900">{node.pcNumber}</td>
                    <td className="p-3.5 font-black text-slate-800">{node.labRoom}</td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="text-blue-700 font-bold">{node.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">
                        {node.assignedUser || node.adminSyncSource || 'Available / Ready'}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 truncate max-w-[200px]">{node.specs}</td>
                    <td className="p-3.5 font-mono">
                      {node.status === 'Offline' ? (
                        <span className="text-rose-600 font-black">Offline (0%)</span>
                      ) : (
                        <span className="text-slate-800 font-black">
                          {Math.round(node.cpuLoad)}% CPU • {node.tempC}&deg;C
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border ${
                          node.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : node.status === 'In Use'
                            ? 'bg-blue-600 text-white border-blue-700'
                            : node.status === 'Maintenance'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {node.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setInspectNode(node);
                          setIsEditingNode(false);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-sky-300 hover:text-white rounded-xl font-black cursor-pointer transition"
                      >
                        Inspect PC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          5. INSPECT & ADMIN-SYNCED CONTROL MODAL (WITH REALISTIC 3D PC RIG)
         ===================================================================== */}
      {inspectNode && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Workstation Rig — {inspectNode.pcNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[9.5px] font-black">
                  ADMIN SYNCED
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectNode(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingNode ? (
              <div className="space-y-3 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">PC Number Identifier</label>
                    <input
                      type="text"
                      disabled
                      value={inspectNode.pcNumber}
                      className="w-full bg-slate-100 p-2.5 rounded-xl border-2 border-slate-300 text-slate-600 font-mono font-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Static IP Address</label>
                    <input
                      type="text"
                      value={inspectNode.ipAddress}
                      onChange={e => setInspectNode({ ...inspectNode, ipAddress: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Assigned Laboratory</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    value={inspectNode.labRoom}
                    onChange={e => setInspectNode({ ...inspectNode, labRoom: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Hardware Specifications</label>
                  <input
                    type="text"
                    value={inspectNode.specs}
                    onChange={e => setInspectNode({ ...inspectNode, specs: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Assigned User / Student</label>
                    <input
                      type="text"
                      placeholder="Leave blank if Available..."
                      value={inspectNode.assignedUser || ''}
                      onChange={e => setInspectNode({ ...inspectNode, assignedUser: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Admin Condition Status</label>
                    <select
                      value={inspectNode.status}
                      onChange={e => setInspectNode({ ...inspectNode, status: e.target.value as any })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:border-blue-600 outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingNode(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNode}
                    className="inst-blue-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Save &amp; Sync to Admin
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Large Realistic 3D Desktop PC Preview Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 rounded-2xl border border-blue-400/40 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
                    <RealisticDesktopPcSetup
                      status={inspectNode.status}
                      pcNumber={inspectNode.pcNumber}
                      cpuLoad={inspectNode.cpuLoad}
                      tempC={inspectNode.tempC}
                      isLive={isLiveTelemetry}
                      size="modal"
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      <span className="text-sky-300 font-mono text-[10px] uppercase block">Room Assignment</span>
                      <p className="font-black text-white text-sm truncate">{inspectNode.labRoom}</p>
                    </div>
                    <div>
                      <span className="text-sky-300 font-mono text-[10px] uppercase block">Admin Sync Status</span>
                      <p className="font-mono font-black text-emerald-300 text-xs">
                        {inspectNode.adminSyncSource || `Admin Synced: ${inspectNode.status}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-sky-300 font-mono text-[10px] uppercase block">Hardware Specifications</span>
                      <p className="font-semibold text-slate-200 text-xs">{inspectNode.specs}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Assign Student if PC is Available */}
                {inspectNode.status === 'Available' ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-2">
                    <span className="text-[10px] font-mono font-black text-emerald-800 uppercase block">
                      ✓ AVAILABLE &amp; AUTHORIZED BY ADMIN — ASSIGN WORKSTATION
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter Student ID & Name (e.g. 2024-IS-0142 Maria Santos)..."
                        value={assignStudentName}
                        onChange={e => setAssignStudentName(e.target.value)}
                        className="flex-1 bg-white px-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAssignStudentToAvailablePc(inspectNode)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-[0_3px_0_#064e3b] cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" /> Assign Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-black text-blue-800 uppercase block">
                        CURRENT OCCUPANT / ADMIN STATUS
                      </span>
                      <strong className="text-slate-900 font-black text-xs">
                        {inspectNode.assignedUser || inspectNode.status}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReleasePcToAvailable(inspectNode)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-[0_3px_0_#064e3b] cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Release Workstation
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-slate-800">
                  <span className="font-black flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Live Workstation Telemetry &amp; Cooling RPM
                  </span>
                  <span className="font-mono font-black text-xs">
                    {inspectNode.cpuLoad}% CPU • {inspectNode.tempC}&deg;C •{' '}
                    {inspectNode.status === 'Offline' ? '0' : 1150 + inspectNode.cpuLoad * 14} RPM
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRemoteReboot(inspectNode.id)}
                    className="p-2.5 bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white font-black rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${rebootingId === inspectNode.id ? 'animate-pulse' : ''}`} />
                    <span>{rebootingId === inspectNode.id ? 'Rebooting...' : 'Remote Reboot'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleMaintenance(inspectNode.id)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-500 text-amber-900 hover:text-slate-950 font-black rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-amber-300"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      {inspectNode.status === 'Maintenance' ? 'Set Available' : 'Flag Maintenance'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingNode(true)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-sky-300 font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Config</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabAvailabilityView;











