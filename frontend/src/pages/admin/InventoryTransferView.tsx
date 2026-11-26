import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowRightLeft, Plus, Search, CheckCircle2, Clock,
  RefreshCw, X, Check, Truck, Trash2, Edit3,
  Sparkles, History, ChevronRight, Printer, Download,
  PieChart, BarChart3, AlertTriangle, Calendar, Send
} from 'lucide-react';

interface InventoryTransferViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface TransferLog {
  timestamp: string;
  action: string;
  actor: string;
}

export interface TransferRecord {
  id: string;
  dbId?: string;
  assetTag: string;
  assetName: string;
  category: string;
  sourceLab: string;
  targetLab: string;
  date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  remarks: string;
  logs: TransferLog[];
}

// ============================================================================
// ISOMETRIC 3D HARDWARE & LOGISTICS CRATE ILLUSTRATION
// ============================================================================
const IsometricTransferRig: React.FC<{
  status: TransferRecord['status'];
  category: string;
  tag: string;
}> = ({ status, category, tag }) => {
  const isCompleted = status === 'COMPLETED';
  const isTransit = status === 'IN_TRANSIT';
  const isRejected = status === 'REJECTED';

  const primaryHex = isCompleted
    ? '#10b981'
    : isTransit
    ? '#f59e0b'
    : isRejected
    ? '#ef4444'
    : '#38bdf8';

  const secondaryHex = isCompleted
    ? '#059669'
    : isTransit
    ? '#d97706'
    : isRejected
    ? '#dc2626'
    : '#2563eb';

  const isWorkstationOrDisplay =
    (category || '').toLowerCase().includes('workstation') ||
    (category || '').toLowerCase().includes('display');
  return (
    <div className="w-20 h-16 shrink-0">
      <svg viewBox="0 0 130 105" className="w-full h-full drop-shadow-[0_8px_10px_rgba(15,23,42,0.4)]">
        {/* 3D Isometric Pallet Base */}
        <polygon points="65,98 12,76 65,54 118,76" fill="#1e293b" stroke={primaryHex} strokeWidth="1.2" />
        <polygon points="12,76 65,98 65,104 12,82" fill="#0f172a" />
        <polygon points="118,76 65,98 65,104 118,82" fill="#020617" />

        {isWorkstationOrDisplay ? (
          <>
            {/* 3D Isometric CPU Tower */}
            <polygon points="88,20 104,13 116,18 100,25" fill="#334155" />
            <polygon points="88,20 100,25 100,68 88,63" fill="#020617" stroke={primaryHex} strokeWidth="1.1" />
            <polygon points="100,25 116,18 116,61 100,68" fill="#0f172a" stroke="#475569" strokeWidth="0.9" />
            <circle
              cx="94"
              cy="38"
              r="4"
              fill="none"
              stroke={primaryHex}
              strokeWidth="1.4"
              strokeDasharray="3 2"
              className={isTransit ? 'animate-pulse' : ''}
              style={{ transformOrigin: '94px 38px', animationDuration: '3s' }}
            />
            <circle
              cx="94"
              cy="52"
              r="4"
              fill="none"
              stroke={primaryHex}
              strokeWidth="1.4"
              strokeDasharray="3 2"
              className={isTransit ? 'animate-pulse' : ''}
              style={{ transformOrigin: '94px 52px', animationDuration: '3s' }}
            />

            {/* 3D Isometric Monitor */}
            <polygon points="48,72 62,66 70,70 56,76" fill="#475569" />
            <polygon points="55,54 60,52 60,70 55,72" fill="#334155" />
            <polygon points="20,22 76,9 76,49 20,62" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.4" />
            <polygon points="23,25 73,13 73,46 23,58" fill={secondaryHex} fillOpacity="0.45" />
            <text
              x="48"
              y="44"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="900"
              fontFamily="monospace"
              transform="skewY(-12)"
            >
              {tag}
            </text>
          </>
        ) : (
          <>
            {/* 3D Isometric Armored Hardware Cargo Cube */}
            <polygon points="65,14 24,32 65,50 106,32" fill="#334155" stroke={primaryHex} strokeWidth="1.2" />
            <polygon points="24,32 65,50 65,86 24,68" fill="#0f172a" stroke={primaryHex} strokeWidth="1.2" />
            <polygon points="106,32 65,50 65,86 106,68" fill="#020617" stroke="#475569" strokeWidth="1.2" />
            <line x1="44" y1="23" x2="85" y2="41" stroke={primaryHex} strokeWidth="2" />
            <text
              x="45"
              y="64"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8"
              fontWeight="900"
              fontFamily="monospace"
              transform="skewY(22)"
            >
              {tag}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

const DEFAULT_TRANSFER_SEED: TransferRecord[] = [
  {
    id: 'TRF-2026-001',
    assetTag: 'PC-014',
    assetName: 'Core i7-13700 Workstation Rig',
    category: 'Workstation Node',
    sourceLab: 'ComLab 1',
    targetLab: 'ComLab 2',
    date: '2026-10-28',
    priority: 'HIGH',
    status: 'IN_TRANSIT',
    remarks: 'Relocating high-memory node for Software Engineering laboratory examination.',
    logs: [
      { timestamp: '10/28/2026, 08:15 AM', action: 'Transfer Order Created', actor: 'System' },
      { timestamp: '10/28/2026, 09:30 AM', action: 'Asset Dispatched & In Transit', actor: 'System' }
    ]
  },
  {
    id: 'TRF-2026-002',
    assetTag: 'MON-209',
    assetName: '27" IPS 144Hz Display Monitor',
    category: 'Display & Monitors',
    sourceLab: 'Central Storage Depot',
    targetLab: 'ComLab 3',
    date: '2026-10-27',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    remarks: 'Replacement display for multimedia rendering station PC-05.',
    logs: [
      { timestamp: '10/27/2026, 01:10 PM', action: 'Transfer Order Created', actor: 'System' },
      { timestamp: '10/27/2026, 02:00 PM', action: 'Asset Dispatched & In Transit', actor: 'System' },
      { timestamp: '10/27/2026, 03:45 PM', action: 'Delivery Confirmed at Destination', actor: 'System' }
    ]
  },
  {
    id: 'TRF-2026-003',
    assetTag: 'RAM-312',
    assetName: 'Kingston Fury 32GB DDR5 Kit (2x16GB)',
    category: 'Memory & Components',
    sourceLab: 'ComLab 2',
    targetLab: 'ComLab 1',
    date: '2026-10-28',
    priority: 'HIGH',
    status: 'PENDING',
    remarks: 'Memory upgrade for virtualization and Docker cluster nodes in ComLab 1.',
    logs: [
      { timestamp: '10/28/2026, 10:20 AM', action: 'Transfer Order Created', actor: 'System' }
    ]
  },
  {
    id: 'TRF-2026-004',
    assetTag: 'NET-104',
    assetName: 'Cisco Catalyst 24-Port Managed Switch',
    category: 'Networking Equipment',
    sourceLab: 'Central Storage Depot',
    targetLab: 'ComLab 1',
    date: '2026-10-25',
    priority: 'LOW',
    status: 'COMPLETED',
    remarks: 'VLAN 101 rack switch redundancy deployment.',
    logs: [
      { timestamp: '10/25/2026, 09:00 AM', action: 'Transfer Order Created', actor: 'System' },
      { timestamp: '10/25/2026, 11:30 AM', action: 'Delivery Confirmed at Destination', actor: 'System' }
    ]
  }
];

export const InventoryTransferView: React.FC<InventoryTransferViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  // SEARCH & FILTER DYNAMIC STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('ALL');

  // MODAL STATES FOR INTERACTIVE CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferRecord | null>(null);
  const [deletingTransferId, setDeletingTransferId] = useState<string | null>(null);
  const [inspectModalTransfer, setInspectModalTransfer] = useState<TransferRecord | null>(null);
  const [newTrackingNote, setNewTrackingNote] = useState('');

  // REAL DYNAMIC REACT STATE FOR TRANSFERS WITH LOCALSTORAGE PERSISTENCE
  const [transfers, setTransfers] = useState<TransferRecord[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_inventory_transfers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TRANSFER_SEED;
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // EDITABLE KPI METRICS STATE
  const [isEditingKpis, setIsEditingKpis] = useState(false);
  const [kpiMetrics, setKpiMetrics] = useState([
    { metric: 'Transfer Fulfillment Rate', current: '98.2%', past: '95.4%', change: '+2.8%' },
    { metric: 'Average Delivery Speed', current: '1.4 Hours', past: '2.8 Hours', change: '-1.4 Hrs' },
    { metric: 'Hardware Verification Rate', current: '100.0%', past: '99.1%', change: '+0.9%' }
  ]);

  useEffect(() => {
    try {
      if (transfers.length > 0) {
        localStorage.setItem('labtrack_inventory_transfers', JSON.stringify(transfers));
      }
    } catch {}
  }, [transfers]);

  // Keep inspectModalTransfer in sync whenever transfers array changes
  useEffect(() => {
    if (inspectModalTransfer) {
      const updated = transfers.find(t => t.id === inspectModalTransfer.id);
      if (updated) setInspectModalTransfer(updated);
    }
  }, [transfers]);

  // Safe Backend Sync
  const syncTransfersFromApi = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await apiClient.get('/api/v1/assets').catch(() => null);
      const rawData = res?.data?.data?.items || res?.data?.data || res?.data || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        const normalized: TransferRecord[] = rawData.slice(0, 12).map((item: any, idx: number) => {
          const validStatus: TransferRecord['status'] =
            ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'].includes(String(item.status || '').toUpperCase())
              ? (String(item.status).toUpperCase() as TransferRecord['status'])
              : idx % 3 === 0
              ? 'IN_TRANSIT'
              : idx % 2 === 0
              ? 'COMPLETED'
              : 'PENDING';

          const labs = ['ComLab 1', 'ComLab 2', 'ComLab 3', 'Central Storage Depot'];
          const src = item.sourceLab || labs[idx % 4];
          const tgt = item.targetLab || labs[(idx + 1) % 3];

          return {
            id: item.id && String(item.id).startsWith('TRF-') ? item.id : `TRF-2026-00${idx + 1}`,
            dbId: item.id,
            assetTag: item.assetTag || item.code || `PC-00${idx + 1}`,
            assetName: item.assetName || item.name || `Workstation Unit #${idx + 1}`,
            category: item.category || 'Workstation Node',
            sourceLab: src,
            targetLab: tgt,
            date: item.date || new Date().toISOString().split('T')[0],
            priority: ['HIGH', 'MEDIUM', 'LOW'].includes(String(item.priority || '').toUpperCase())
              ? (String(item.priority).toUpperCase() as TransferRecord['priority'])
              : 'MEDIUM',
            status: validStatus,
            remarks: item.remarks || 'Inter-laboratory hardware routing and deployment.',
            logs:
              Array.isArray(item.logs) && item.logs.length > 0
                ? item.logs
                : [{ timestamp: new Date().toLocaleString('en-US', { hour12: true }), action: 'Synced from Asset Ledger', actor: 'System' }]
          };
        });
        setTransfers(normalized);
      }
    } catch {
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // FORM INPUT BINDINGS (CLEANED: NO REQUESTED BY / APPROVED BY)
  const [formData, setFormData] = useState({
    assetTag: '',
    assetName: '',
    category: 'Workstation Node',
    sourceLab: 'ComLab 1',
    targetLab: 'ComLab 2',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    status: 'PENDING' as 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const notify = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  const resetForm = () => {
    setFormData({
      assetTag: '',
      assetName: '',
      category: 'Workstation Node',
      sourceLab: 'ComLab 1',
      targetLab: 'ComLab 2',
      priority: 'MEDIUM',
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0],
      remarks: ''
    });
  };

  // 1. CREATE OPERATION
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag.trim() || !formData.assetName.trim()) return;

    const nowStr = new Date().toLocaleString('en-US', { hour12: true });
    const nextNum = String(transfers.length + 1).padStart(3, '0');
    const newEntry: TransferRecord = {
      id: `TRF-2026-${nextNum}`,
      assetTag: formData.assetTag.toUpperCase().trim(),
      assetName: formData.assetName.trim(),
      category: formData.category.trim(),
      sourceLab: formData.sourceLab.trim(),
      targetLab: formData.targetLab.trim(),
      date: formData.date || new Date().toISOString().split('T')[0],
      priority: formData.priority,
      status: formData.status,
      remarks: formData.remarks.trim() || 'Inter-laboratory asset relocation order.',
      logs: [
        {
          timestamp: nowStr,
          action: `Transfer Order Created (${formData.status.replace('_', ' ')})`,
          actor: 'System'
        }
      ]
    };

    setTransfers(prev => [newEntry, ...prev]);
    setIsCreateModalOpen(false);
    resetForm();
    notify(`Transfer Order ${newEntry.id} (${newEntry.assetTag}) created as ${newEntry.status.replace('_', ' ')}!`);
  };

  // 2. OPEN & SUBMIT EDIT OPERATION (WORKS FOR IN_TRANSIT, PENDING, COMPLETED & REJECTED)
  const openEditModal = (record: TransferRecord) => {
    setEditingTransfer(record);
    setFormData({
      assetTag: record.assetTag || '',
      assetName: record.assetName || '',
      category: record.category || 'Workstation Node',
      sourceLab: record.sourceLab || 'ComLab 1',
      targetLab: record.targetLab || 'ComLab 2',
      priority: record.priority || 'MEDIUM',
      status: record.status || 'IN_TRANSIT',
      date: record.date || new Date().toISOString().split('T')[0],
      remarks: record.remarks || ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;

    const nowStr = new Date().toLocaleString('en-US', { hour12: true });

    setTransfers(prev =>
      prev.map(t => {
        if (t.id === editingTransfer.id) {
          const existingLogs = Array.isArray(t.logs) ? t.logs : [];
          const statusChanged = t.status !== formData.status;
          const routeChanged = t.sourceLab !== formData.sourceLab || t.targetLab !== formData.targetLab;

          let logSummary = 'Transfer Order Details Edited';
          if (statusChanged && routeChanged) {
            logSummary = `Edited Status to ${formData.status.replace('_', ' ')} & Route (${formData.sourceLab} → ${formData.targetLab})`;
          } else if (statusChanged) {
            logSummary = `Status Changed from ${t.status.replace('_', ' ')} to ${formData.status.replace('_', ' ')}`;
          } else if (routeChanged) {
            logSummary = `Route Updated: ${formData.sourceLab} → ${formData.targetLab}`;
          }

          return {
            ...t,
            assetTag: formData.assetTag.toUpperCase().trim(),
            assetName: formData.assetName.trim(),
            category: formData.category.trim(),
            sourceLab: formData.sourceLab.trim(),
            targetLab: formData.targetLab.trim(),
            priority: formData.priority,
            status: formData.status,
            date: formData.date,
            remarks: formData.remarks.trim(),
            logs: [
              ...existingLogs,
              {
                timestamp: nowStr,
                action: logSummary,
                actor: 'System'
              }
            ]
          };
        }
        return t;
      })
    );

    notify(`Transfer Order ${editingTransfer.id} (${formData.status.replace('_', ' ')}) updated successfully!`);
    setEditingTransfer(null);
    resetForm();
  };

  // 3. DELETE OPERATION
  const handleDeleteConfirm = () => {
    if (!deletingTransferId) return;
    setTransfers(prev => prev.filter(t => t.id !== deletingTransferId));
    if (inspectModalTransfer?.id === deletingTransferId) {
      setInspectModalTransfer(null);
    }
    notify(`Transfer Order ${deletingTransferId} removed from inventory ledger.`);
    setDeletingTransferId(null);
  };

  // 4. QUICK STATUS TRANSITION (WORKS ANYTIME, INCLUDING REVERTING OR UPDATING IN_TRANSIT)
  const handleUpdateStatus = (id: string, newStatus: 'COMPLETED' | 'IN_TRANSIT' | 'REJECTED' | 'PENDING') => {
    const nowStr = new Date().toLocaleString('en-US', { hour12: true });

    setTransfers(prev =>
      prev.map(t => {
        if (t.id === id) {
          let actionMsg = `Status set to ${newStatus.replace('_', ' ')}`;
          if (newStatus === 'IN_TRANSIT') actionMsg = `Asset Dispatched from ${t.sourceLab} (In Transit to ${t.targetLab})`;
          if (newStatus === 'COMPLETED') actionMsg = `Delivery Confirmed at ${t.targetLab}`;
          if (newStatus === 'REJECTED') actionMsg = 'Transfer Request Rejected';
          if (newStatus === 'PENDING') actionMsg = 'Transfer Order Set to Pending Queue';

          const existingLogs = Array.isArray(t.logs) ? t.logs : [];
          return {
            ...t,
            status: newStatus,
            logs: [...existingLogs, { timestamp: nowStr, action: actionMsg, actor: 'System' }]
          };
        }
        return t;
      })
    );

    notify(`Transfer ${id} status updated to ${newStatus.replace('_', ' ')}.`);
  };

  // 5. ADD CUSTOM IN-TRANSIT CHECKPOINT / TRACKING LOG NOTE
  const handleAddTrackingNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectModalTransfer || !newTrackingNote.trim()) return;

    const nowStr = new Date().toLocaleString('en-US', { hour12: true });
    const noteText = newTrackingNote.trim();

    setTransfers(prev =>
      prev.map(t => {
        if (t.id === inspectModalTransfer.id) {
          const existingLogs = Array.isArray(t.logs) ? t.logs : [];
          return {
            ...t,
            remarks: noteText,
            logs: [...existingLogs, { timestamp: nowStr, action: `Tracking Update: ${noteText}`, actor: 'System' }]
          };
        }
        return t;
      })
    );

    setNewTrackingNote('');
    notify(`Added tracking update to ${inspectModalTransfer.id}.`);
  };

  // 6. CSV EXPORTER
  const handleExportCsv = () => {
    const rows = [
      ['Transfer ID', 'Asset Tag', 'Asset Name', 'Category', 'Source Lab', 'Target Lab', 'Priority', 'Status', 'Date', 'Remarks'],
      ...transfers.map(t => [
        t.id,
        `"${t.assetTag}"`,
        `"${t.assetName}"`,
        `"${t.category}"`,
        `"${t.sourceLab}"`,
        `"${t.targetLab}"`,
        t.priority,
        t.status,
        t.date,
        `"${t.remarks || ''}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `JRMSU_Inventory_Transfers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported Inventory Transfer Ledger to CSV.');
  };

  // DYNAMIC COMPUTED METRICS
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (t.assetTag || '').toLowerCase().includes(q) ||
        (t.assetName || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.sourceLab || '').toLowerCase().includes(q) ||
        (t.targetLab || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesHub =
        selectedHubFilter === 'ALL' ||
        (t.sourceLab || '').toLowerCase().includes(selectedHubFilter.toLowerCase()) ||
        (t.targetLab || '').toLowerCase().includes(selectedHubFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesCategory && matchesHub;
    });
  }, [transfers, searchQuery, statusFilter, categoryFilter, selectedHubFilter]);

  const totalOrdersToShip = transfers.filter(t => t.status === 'PENDING').length;
  const overdueShipments = transfers.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;

  // DYNAMIC CATEGORY PERCENTAGES
  const categoryStats = useMemo(() => {
    const total = Math.max(1, transfers.length);
    const wsCount = transfers.filter(t => t.category.toLowerCase().includes('workstation')).length;
    const memCount = transfers.filter(t => t.category.toLowerCase().includes('memory') || t.category.toLowerCase().includes('component')).length;
    const dispCount = transfers.filter(t => t.category.toLowerCase().includes('display') || t.category.toLowerCase().includes('monitor')).length;
    const netCount = Math.max(0, transfers.length - (wsCount + memCount + dispCount));

    const p1 = Math.round((wsCount / total) * 100);
    const p2 = Math.round((memCount / total) * 100);
    const p3 = Math.round((dispCount / total) * 100);
    const p4 = Math.max(0, 100 - (p1 + p2 + p3));

    return { wsCount, memCount, dispCount, netCount, p1, p2, p3, p4 };
  }, [transfers]);
  return (
    <div className="transfer-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7  font-sans select-none relative">
      {/* 3D EXTRUDED DEPTH & TACTILE KEYCAP CSS */}
      <style>{`
        .transfer-3d-shell {
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
        @keyframes cargo-flow {
          0% { stroke-dashoffset: 28; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-cargo-stream {
          stroke-dasharray: 6 4;
          animation: cargo-flow 0.85s linear infinite;
        }
      `}</style>

      {/* DUAL MODE DATALISTS FOR CATEGORY AND LABORATORIES */}
      <datalist id="trf-lab-options">
        <option value="ComLab 1" />
        <option value="ComLab 2" />
        <option value="ComLab 3" />
        <option value="Central Storage Depot" />
        <option value="Maintenance Bay" />
        <option value="Server Room" />
      </datalist>

      <datalist id="trf-category-options">
        <option value="Workstation Node" />
        <option value="Memory & Components" />
        <option value="Display & Monitors" />
        <option value="Networking Equipment" />
        <option value="Peripherals & Accessories" />
      </datalist>

      {/* =====================================================================
          1. OBSIDIAN COMMAND HEADER BANNER
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-[0_5px_0_#1e3a8a,0_0_25px_rgba(56,189,248,0.5)]">
            <ArrowRightLeft className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Inventory Transfer &amp; Logistics Routing
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-black uppercase">
                {campusName}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Full editable in-transit hardware dispatch, ComLab 1–3 routing pipeline, and real-time delivery audit ledger
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              syncTransfersFromApi();
              notify('Synchronized transfer orders with campus asset ledger.');
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-pulse' : ''}`} />
            <span>Sync Ledger</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black text-xs rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_5px_0_#1e3a8a,0_10px_20px_rgba(6,182,212,0.35)] active:translate-y-0.5 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Request New Transfer</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 EXTRUDED KPI CUBES
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 text-white border-2 border-amber-300/60 shadow-[0_8px_0_#78350f,0_16px_30px_rgba(245,158,11,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-100 block">
              ORDERS TO SHIP
            </span>
            <p className="text-3xl font-black text-white mt-0.5">{totalOrdersToShip} Pending</p>
            <span className="text-[11px] text-amber-100 font-bold">Click to Filter Pending</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Clock className="w-6 h-6 text-yellow-200" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-2 border-blue-400/50 shadow-[0_8px_0_#1e3a8a,0_16px_30px_rgba(37,99,235,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 block">
              ACTIVE IN TRANSIT
            </span>
            <p className="text-3xl font-black text-white mt-0.5">{inTransitCount} Moving</p>
            <span className="text-[11px] text-blue-200 font-bold">Click to View / Edit In-Transit</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <Truck className="w-6 h-6 text-cyan-300 animate-bounce" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('ALL')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-950 text-white border-2 border-rose-400/50 shadow-[0_8px_0_#881337,0_16px_30px_rgba(225,29,72,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-200 block">
              HIGH PRIORITY ALERTS
            </span>
            <p className="text-3xl font-black text-white mt-0.5">{overdueShipments} Urgent</p>
            <span className="text-[11px] text-rose-200 font-bold">Immediate Action Needed</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-rose-200" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className="card-3d-lift p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-2 border-emerald-400/50 shadow-[0_8px_0_#064e3b,0_16px_30px_rgba(16,185,129,0.28)] flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200 block">
              COMPLETED DELIVERIES
            </span>
            <p className="text-3xl font-black text-white mt-0.5">{completedCount} Verified</p>
            <span className="text-[11px] text-emerald-200 font-bold">100% Hardware Audited</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 shadow-inner">
            <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ANALYTICS BOARD: ISOMETRIC LOGISTICS PIPELINE + DONUT VAULT
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT (7 COLS): INTERACTIVE ISOMETRIC LOGISTICS PIPELINE + EDITABLE KPI TABLE */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-5 flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-3.5">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase tracking-wider block">
                INTER-LABORATORY ROUTING TOPOLOGY
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Live Campus Logistics Pipeline (Click a Hub to Filter)
              </h3>
            </div>
            {selectedHubFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedHubFilter('ALL')}
                className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer shadow-[0_3px_0_#1e3a8a]"
              >
                Hub: {selectedHubFilter} ✕
              </button>
            )}
          </div>

          {/* Interactive Isometric Logistics SVG Map */}
          <div className="h-52 bg-slate-950 rounded-2xl border-2 border-slate-800 p-3 relative overflow-hidden flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 620 190" className="w-full h-full">
              <path d="M 105 95 L 265 45" stroke="#1e293b" strokeWidth="4" />
              <path d="M 105 95 L 265 45" stroke="#38bdf8" strokeWidth="2.2" className="animate-cargo-stream" />

              <path d="M 105 95 L 265 145" stroke="#1e293b" strokeWidth="4" />
              <path d="M 105 95 L 265 145" stroke="#f59e0b" strokeWidth="2.2" className="animate-cargo-stream" />

              <path d="M 265 45 L 485 95" stroke="#1e293b" strokeWidth="4" />
              <path d="M 265 45 L 485 95" stroke="#10b981" strokeWidth="2.2" className="animate-cargo-stream" />

              <path d="M 265 145 L 485 95" stroke="#1e293b" strokeWidth="4" />
              <path d="M 265 145 L 485 95" stroke="#38bdf8" strokeWidth="2.2" className="animate-cargo-stream" />

              {/* Hub 1: Central Storage Depot */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedHubFilter(selectedHubFilter === 'Depot' ? 'ALL' : 'Depot')}
              >
                <polygon points="105,60 55,82 105,104 155,82" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <polygon points="55,82 105,104 105,120 55,98" fill="#0f172a" />
                <polygon points="155,82 105,104 105,120 155,98" fill="#020617" />
                <text x="105" y="84" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="monospace">
                  CENTRAL DEPOT
                </text>
                <text x="105" y="136" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Supply Hub
                </text>
              </g>

              {/* Hub 2: ComLab 1 */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedHubFilter(selectedHubFilter === 'ComLab 1' ? 'ALL' : 'ComLab 1')}
              >
                <polygon points="265,14 215,34 265,54 315,34" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <polygon points="215,34 265,54 265,68 215,48" fill="#064e3b" />
                <polygon points="315,34 265,54 265,68 315,48" fill="#022c22" />
                <text x="265" y="37" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
                  COMLAB 1
                </text>
                <text x="265" y="82" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  VLAN 101
                </text>
              </g>

              {/* Hub 3: ComLab 2 */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedHubFilter(selectedHubFilter === 'ComLab 2' ? 'ALL' : 'ComLab 2')}
              >
                <polygon points="265,114 215,134 265,154 315,134" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                <polygon points="215,134 265,154 265,168 215,148" fill="#78350f" />
                <polygon points="315,134 265,154 265,168 315,148" fill="#451a03" />
                <text x="265" y="137" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
                  COMLAB 2
                </text>
                <text x="265" y="182" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  VLAN 102
                </text>
              </g>

              {/* Hub 4: ComLab 3 */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedHubFilter(selectedHubFilter === 'ComLab 3' ? 'ALL' : 'ComLab 3')}
              >
                <polygon points="485,60 435,82 485,104 535,82" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <polygon points="435,82 485,104 485,120 435,98" fill="#1e3a8a" />
                <polygon points="535,82 485,104 485,120 535,98" fill="#172554" />
                <text x="485" y="84" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
                  COMLAB 3
                </text>
                <text x="485" y="136" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  VLAN 103
                </text>
              </g>
            </svg>
          </div>

          {/* Monthly Logistics Performance Table (With Editable Mode) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>KPIs — Monthly Logistics Performance</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (isEditingKpis) notify('Saved Monthly Logistics KPI benchmarks.');
                  setIsEditingKpis(!isEditingKpis);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-slate-200"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingKpis ? 'Save KPIs' : 'Edit KPIs'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-900 text-cyan-300 font-mono font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Metric</th>
                    <th className="p-3">This Month</th>
                    <th className="p-3">Past Month</th>
                    <th className="p-3 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                  {kpiMetrics.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/50">
                      <td className="p-2.5 font-black text-slate-900">{row.metric}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">
                        {isEditingKpis ? (
                          <input
                            type="text"
                            value={row.current}
                            onChange={(e) => {
                              const next = [...kpiMetrics];
                              next[rIdx].current = e.target.value;
                              setKpiMetrics(next);
                            }}
                            className="w-24 px-2 py-1 border border-blue-400 rounded-lg text-xs font-mono bg-blue-50/40"
                          />
                        ) : (
                          row.current
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">
                        {isEditingKpis ? (
                          <input
                            type="text"
                            value={row.past}
                            onChange={(e) => {
                              const next = [...kpiMetrics];
                              next[rIdx].past = e.target.value;
                              setKpiMetrics(next);
                            }}
                            className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
                          />
                        ) : (
                          row.past
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-600">
                        {isEditingKpis ? (
                          <input
                            type="text"
                            value={row.change}
                            onChange={(e) => {
                              const next = [...kpiMetrics];
                              next[rIdx].change = e.target.value;
                              setKpiMetrics(next);
                            }}
                            className="w-20 px-2 py-1 border border-emerald-400 rounded-lg text-xs font-mono text-right"
                          />
                        ) : (
                          row.change
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT (5 COLS): OBSIDIAN DARK VAULT CATEGORY DISTRIBUTION */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl border-2 border-slate-700 shadow-[0_8px_0_#0f172a,0_18px_35px_rgba(15,23,42,0.35)] flex flex-col justify-between space-y-5">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <span>Inventory Category Distribution</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-300 font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30">
                ASSET CLASSES
              </span>
            </div>

            {/* Dynamic Multi-Segment SVG Donut Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-5">
              <div className="w-36 h-36 relative shrink-0">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#38bdf8"
                    strokeWidth="4.2"
                    strokeDasharray={`${categoryStats.p1} ${Math.max(0, 100 - categoryStats.p1)}`}
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="4.2"
                    strokeDasharray={`${categoryStats.p2} ${Math.max(0, 100 - categoryStats.p2)}`}
                    strokeDashoffset={`-${categoryStats.p1}`}
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="4.2"
                    strokeDasharray={`${categoryStats.p3} ${Math.max(0, 100 - categoryStats.p3)}`}
                    strokeDashoffset={`-${categoryStats.p1 + categoryStats.p2}`}
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="4.2"
                    strokeDasharray={`${categoryStats.p4} ${Math.max(0, 100 - categoryStats.p4)}`}
                    strokeDashoffset={`-${categoryStats.p1 + categoryStats.p2 + categoryStats.p3}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">TOTAL</span>
                  <span className="text-2xl font-black text-white font-mono leading-none my-0.5">
                    {transfers.length}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 font-bold">Orders</span>
                </div>
              </div>

              {/* Interactive Category Legends */}
              <div className="space-y-2.5 text-xs font-mono w-full">
                {[
                  { label: 'Workstation Node', pct: categoryStats.p1, count: categoryStats.wsCount, dot: 'bg-sky-400' },
                  { label: 'Memory & Components', pct: categoryStats.p2, count: categoryStats.memCount, dot: 'bg-emerald-400' },
                  { label: 'Display & Monitors', pct: categoryStats.p3, count: categoryStats.dispCount, dot: 'bg-amber-400' },
                  { label: 'Networking Equipment', pct: categoryStats.p4, count: categoryStats.netCount, dot: 'bg-purple-400' }
                ].map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCategoryFilter(categoryFilter === cat.label ? 'ALL' : cat.label)}
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      categoryFilter === cat.label
                        ? 'bg-blue-950 border-cyan-400 text-white'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.dot} shrink-0`} />
                      <span className="font-bold truncate">{cat.label}</span>
                    </span>
                    <strong className="text-cyan-300 shrink-0 ml-2">
                      {cat.count} ({cat.pct}%)
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-950/60 rounded-2xl border border-cyan-500/30 text-cyan-100 space-y-1 text-xs">
            <span className="font-black flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-4 h-4 text-amber-400" /> Full In-Transit &amp; Route Editing Enabled
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              You can edit any transfer order—including active In-Transit shipments—by clicking the Edit button, selecting a new status from the dropdown, or clicking any step on the progress bar.
            </p>
          </div>
        </div>

      </div>

      {/* =====================================================================
          4. ACTIVE TRANSFER ORDERS & ROUTING DECK (FULL INLINE & MODAL EDITING)
         ===================================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-cyan-400 rounded-2xl shadow-[0_4px_0_#1e3a8a]">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Active Transfer Orders &amp; Routing Queue ({filteredTransfers.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Edit any Pending, In-Transit, or Completed order, change routes, or click any step to update status
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(selectedHubFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedHubFilter('ALL');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black cursor-pointer"
              >
                Reset Active Filters ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="btn-3d-bevel px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Request New Transfer
            </button>
          </div>
        </div>

        {/* SEARCH & TACTILE KEYCAP STATUS TABS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border-2 border-slate-300 text-xs w-full lg:w-96 shadow-inner focus-within:border-blue-600 focus-within:bg-white">
            <Search className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="text"
              placeholder="Search Transfer ID, Asset Tag, Name, or ComLab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full font-bold text-slate-900 placeholder-slate-400"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-cyan-300 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-[0_3px_0_#cbd5e1]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* EXTRUDED TRANSFER ORDER CARDS */}
        <div className="space-y-4">
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((item) => {
              const stepProgress =
                item.status === 'COMPLETED' ? 3 : item.status === 'IN_TRANSIT' ? 2 : item.status === 'PENDING' ? 1 : 0;

              return (
                <div
                  key={item.id}
                  className="card-3d-lift p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl border-2 border-slate-700 hover:border-cyan-400 shadow-[0_7px_0_#0f172a,0_15px_30px_rgba(15,23,42,0.22)] flex flex-col xl:flex-row xl:items-center justify-between gap-4 group"
                >
                  {/* LEFT: ISOMETRIC 3D HARDWARE RIG + ROUTE METADATA */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <IsometricTransferRig status={item.status} category={item.category} tag={item.assetTag} />

                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-white text-sm sm:text-base truncate">{item.assetName}</h4>
                        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/20 font-black px-2.5 py-0.5 rounded-lg border border-cyan-400/40">
                          {item.id}
                        </span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/40 font-mono font-black">
                          {item.assetTag}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-500 text-white'
                              : item.priority === 'MEDIUM'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.priority} PRIORITY
                        </span>
                        {item.status === 'IN_TRANSIT' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-[9px] font-mono font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> IN TRANSIT
                          </span>
                        )}
                      </div>

                      {/* Source -> Target Route Pills (Click to Open Edit Modal) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Click to edit Source / Target Lab"
                          className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-600 text-slate-200 font-bold cursor-pointer transition"
                        >
                          FROM: {item.sourceLab}
                        </button>
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Click to edit Source / Target Lab"
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 rounded-xl border border-cyan-400/50 text-cyan-300 font-black cursor-pointer transition"
                        >
                          TO: {item.targetLab}
                        </button>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] text-slate-300">{item.category}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400">{item.date}</span>
                      </div>

                      {/* CLICKABLE 3-Step Visual Logistics Pipeline (Click any stage to change status!) */}
                      <div className="flex items-center gap-2 pt-0.5 max-w-md">
                        {[
                          { step: 1, lbl: '1. Pending', targetStatus: 'PENDING' as const },
                          { step: 2, lbl: '2. In Transit', targetStatus: 'IN_TRANSIT' as const },
                          { step: 3, lbl: '3. Delivered', targetStatus: 'COMPLETED' as const }
                        ].map((s) => {
                          const active = stepProgress >= s.step;
                          return (
                            <button
                              key={s.step}
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, s.targetStatus)}
                              title={`Click to set status to ${s.targetStatus.replace('_', ' ')}`}
                              className="flex-1 text-left space-y-1 cursor-pointer group/step"
                            >
                              <div
                                className={`h-2 rounded-full transition-all duration-300 group-hover/step:scale-y-125 ${
                                  item.status === 'REJECTED'
                                    ? 'bg-rose-600'
                                    : active
                                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                }`}
                              />
                              <span
                                className={`text-[9px] font-mono block ${
                                  active ? 'text-cyan-300 font-bold' : 'text-slate-500 group-hover/step:text-slate-300'
                                }`}
                              >
                                {s.lbl}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: DIRECT STATUS DROPDOWN + EDIT BUTTON + LOGISTICS ACTIONS */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end xl:self-center">
                    {/* Direct Status Switcher Dropdown (Works even when In Transit!) */}
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-black border cursor-pointer outline-none shadow-[0_3px_0_rgba(0,0,0,0.4)] ${
                        item.status === 'IN_TRANSIT'
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : item.status === 'COMPLETED'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-800 text-cyan-300 border-slate-600'
                      }`}
                      title="Change Status Directly"
                    >
                      <option value="PENDING" className="bg-slate-900 text-white">PENDING</option>
                      <option value="IN_TRANSIT" className="bg-slate-900 text-amber-300">IN TRANSIT</option>
                      <option value="COMPLETED" className="bg-slate-900 text-emerald-300">COMPLETED</option>
                      <option value="REJECTED" className="bg-slate-900 text-rose-300">REJECTED</option>
                    </select>

                    {/* Clear Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-blue-600 text-cyan-300 hover:text-white rounded-xl font-black text-xs transition cursor-pointer border border-slate-600 shadow-[0_3px_0_#020617] active:translate-y-0.5 flex items-center gap-1.5"
                      title="Edit Full Transfer Order Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingTransferId(item.id)}
                      className="p-2 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition cursor-pointer border border-rose-500/40 shadow-[0_3px_0_#4c0519] active:translate-y-0.5"
                      title="Delete Transfer Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {item.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item.id, 'IN_TRANSIT')}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_0_#78350f] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch
                      </button>
                    )}

                    {item.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_0_#064e3b] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Confirm Arrival
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectModalTransfer(item)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_0_#1e3a8a] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Status</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-slate-400 font-bold bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
              No transfer records match the current filter or search query.
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODALS (CREATE, EDIT WITHOUT REQUESTED/APPROVED BY, DELETE, & TIMELINE)
         ===================================================================== */}

      {/* MODAL 1: CREATE TRANSFER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200 border-2 border-blue-400">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" /> Request New Asset Transfer
              </h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs text-slate-800 font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Asset Tag / ID</label>
                  <input
                    type="text"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="e.g. PC-008"
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Asset Category (Select / Type)</label>
                  <input
                    type="text"
                    list="trf-category-options"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Select or type category..."
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Asset Description / Name</label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  placeholder="e.g. Workstation PC Core i7 32GB RAM"
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Source Laboratory</label>
                  <input
                    type="text"
                    list="trf-lab-options"
                    value={formData.sourceLab}
                    onChange={(e) => setFormData({ ...formData, sourceLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Target Destination</label>
                  <input
                    type="text"
                    list="trf-lab-options"
                    value={formData.targetLab}
                    onChange={(e) => setFormData({ ...formData, targetLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block mb-1 text-slate-700">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold cursor-pointer"
                  >
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Transfer Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2 rounded-xl outline-none focus:border-blue-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Remarks</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Reason for transferring..."
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl cursor-pointer"
                >
                  Submit Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TRANSFER MODAL (NO REQUESTED BY / APPROVED BY) */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200 border-2 border-blue-400 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" /> Edit Transfer Order ({editingTransfer.id})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Modify status (Pending / In Transit / Completed), route, asset specs, and remarks
                </p>
              </div>
              <button type="button" onClick={() => setEditingTransfer(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs text-slate-800 font-bold">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block mb-1 text-slate-700">Asset Tag</label>
                  <input
                    type="text"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-mono font-black outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Transfer Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-blue-50 text-blue-900 border-2 border-blue-400 p-2.5 rounded-xl outline-none focus:border-blue-600 font-black cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold cursor-pointer"
                  >
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Asset Category</label>
                  <input
                    type="text"
                    list="trf-category-options"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Transfer Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl font-mono outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Asset Description / Name</label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Source Laboratory (From)</label>
                  <input
                    type="text"
                    list="trf-lab-options"
                    value={formData.sourceLab}
                    onChange={(e) => setFormData({ ...formData, sourceLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">Target Destination (To)</label>
                  <input
                    type="text"
                    list="trf-lab-options"
                    value={formData.targetLab}
                    onChange={(e) => setFormData({ ...formData, targetLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">In-Transit Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border-2 border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-bevel w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-2xl cursor-pointer"
                >
                  Save All Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingTransferId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full space-y-4 text-center animate-in zoom-in-95 duration-200 border-2 border-rose-400">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Confirm Delete</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete transfer order <strong className="font-mono text-slate-900">{deletingTransferId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTransferId(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#881337] cursor-pointer hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW TIMELINE, ADD IN-TRANSIT CHECKPOINT & QUICK EDIT */}
      {inspectModalTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 border-2 border-blue-400 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> Transfer Timeline &amp; Gate Pass
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectModalTransfer;
                    setInspectModalTransfer(null);
                    openEditModal(target);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-black flex items-center gap-1 cursor-pointer transition border border-blue-200"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Order
                </button>
                <button type="button" onClick={() => setInspectModalTransfer(null)} className="cursor-pointer text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 flex items-center gap-4">
              <IsometricTransferRig
                status={inspectModalTransfer.status}
                category={inspectModalTransfer.category}
                tag={inspectModalTransfer.assetTag}
              />
              <div className="space-y-1.5 text-xs min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 font-mono font-black text-cyan-300">
                  <span>{inspectModalTransfer.id}</span>
                  <span className="text-amber-300">{inspectModalTransfer.assetTag}</span>
                </div>
                <p className="font-black text-white text-sm truncate">{inspectModalTransfer.assetName}</p>
                <p className="text-[11px] text-slate-300">
                  {inspectModalTransfer.sourceLab} → <strong className="text-emerald-300">{inspectModalTransfer.targetLab}</strong>
                </p>

                {/* Direct Status Selector inside Inspector */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Status:</span>
                  <select
                    value={inspectModalTransfer.status}
                    onChange={(e) => handleUpdateStatus(inspectModalTransfer.id, e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-cyan-400/50 text-cyan-300 font-mono font-black text-[10px] outline-none cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Remarks &amp; Notes</span>
              <p className="text-slate-700 font-semibold">{inspectModalTransfer.remarks}</p>
            </div>

            {/* Add In-Transit Checkpoint / Tracking Note Form */}
            <form onSubmit={handleAddTrackingNote} className="flex items-center gap-2">
              <input
                type="text"
                value={newTrackingNote}
                onChange={(e) => setNewTrackingNote(e.target.value)}
                placeholder="Add In-Transit checkpoint or status note..."
                className="flex-1 bg-slate-50 border-2 border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1 shrink-0 shadow-[0_3px_0_#1e3a8a]"
              >
                <Send className="w-3.5 h-3.5" /> Log
              </button>
            </form>

            <div className="space-y-2 text-xs">
              <h4 className="font-black text-slate-800 uppercase text-[11px]">Chain of Custody Audit Log</h4>
              <div className="space-y-2.5 border-l-2 border-blue-400 pl-3.5 ml-1.5 max-h-40 overflow-y-auto">
                {(Array.isArray(inspectModalTransfer.logs) ? inspectModalTransfer.logs : []).map((log, i) => (
                  <div key={i} className="relative space-y-0.5">
                    <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                    <p className="font-extrabold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {log.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-2.5 rounded-2xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Print Gate Pass
              </button>
              <button
                type="button"
                onClick={() => setInspectModalTransfer(null)}
                className="w-1/2 bg-slate-900 text-white font-black py-2.5 rounded-2xl text-xs shadow-[0_4px_0_#020617] cursor-pointer hover:bg-slate-800 transition"
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

export default InventoryTransferView;











