import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
  QrCode, Printer, Search, Sparkles, ExternalLink,
  Trash2, Edit3, RefreshCw, X, Scan, Settings2,
  Monitor, Layers, ShieldCheck, Volume2, VolumeX,
  Wifi, CheckCircle2, Copy, Check
} from 'lucide-react';

export interface QrNodeItem {
  id: string;
  lab: string;
  pcRange: string;
  customTitle: string;
  targetUrl: string;
  createdAt: string;
  schedule?: string;
}

export interface QrManagementViewProps {
  campusName?: string;
  workstations?: Array<{ id: string; lab: string; ip: string; status: string }>;
  onTriggerNotification?: (msg: string) => void;
}

export interface QrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campuses?: Array<{ id: string; name: string }>;
}

const DEFAULT_POSTER_TITLE = 'JRMSU LabTrack Student Access & Workstation Portal';
const DEFAULT_POSTER_SUBTITLE =
  'Official Smart Laboratory Digital Attendance, Seat Assignment & Real-Time Session Monitoring';

// ============================================================================
// SINGLETON WEB AUDIO SYNTHESIZER (ZERO MEMORY LEAK & ZERO UI LAG)
// ============================================================================
let sharedAudioCtx: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playQrSoundEffect = (
  type: 'generate_start' | 'generate_done' | 'print' | 'click' | 'delete',
  enabled = true
) => {
  if (!enabled) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      wave: OscillatorType = 'sine',
      gainVal = 0.1
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === 'generate_start') {
      playTone(480, now, 0.12, 'sine', 0.07);
      playTone(640, now + 0.1, 0.14, 'sine', 0.08);
    } else if (type === 'generate_done') {
      playTone(523.25, now, 0.11, 'triangle', 0.12);
      playTone(659.25, now + 0.09, 0.11, 'triangle', 0.12);
      playTone(783.99, now + 0.18, 0.13, 'triangle', 0.12);
      playTone(1046.5, now + 0.28, 0.26, 'sine', 0.14);
    } else if (type === 'print') {
      playTone(523.25, now, 0.08, 'sine', 0.09);
      playTone(783.99, now + 0.08, 0.18, 'triangle', 0.12);
    } else if (type === 'delete') {
      playTone(320, now, 0.12, 'sawtooth', 0.07);
      playTone(220, now + 0.1, 0.18, 'sawtooth', 0.07);
    } else if (type === 'click') {
      playTone(760, now, 0.035, 'sine', 0.04);
    }
  } catch {}
};

// ============================================================================
// ZERO-FREEZE HIDDEN IFRAME PRINT ENGINE
// - No bottom footer strip
// - Hides ComLab, PC Range & Schedule pills
// - Displays enhanced title & subtitle at the top
// ============================================================================
const executeInstantCleanPrint = (
  cards: Array<{
    title: string;
    subtitle?: string;
    qrUrl: string;
  }>,
  docTitle: string
) => {
  const logoUrl = `${window.location.origin}/assets/images/jrmsu.jpg`;

  const cardsHtml = cards
    .map(
      (c) => `
      <div class="qr-print-card">
        <div class="header-group">
          <img src="${logoUrl}" alt="JRMSU" class="uni-logo" onerror="this.style.display='none'" />
          <div class="uni-header">JOSE RIZAL MEMORIAL STATE UNIVERSITY</div>
          <div class="scan-banner">SCAN HERE</div>
        </div>
        <div class="white-info-box">
          <div class="poster-title">${c.title}</div>
          <div class="poster-subtitle">${c.subtitle || DEFAULT_POSTER_SUBTITLE}</div>
        </div>
        <div class="qr-frame">
          <img src="${c.qrUrl}" alt="JRMSU QR Code" />
        </div>
      </div>
    `
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docTitle}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: #ffffff;
        color: #0f172a;
      }
      .print-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        width: 100%;
        max-width: 190mm;
        margin: 0 auto;
      }
      .qr-print-card {
        background: linear-gradient(180deg, #0b2545 0%, #134074 55%, #0b2545 100%);
        color: #ffffff;
        border: 3px solid #1e3a8a;
        border-radius: 22px;
        padding: 18px 14px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        min-height: 112mm;
      }
      .header-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
      }
      .uni-logo {
        width: 42px;
        height: 42px;
        object-fit: contain;
        border-radius: 9999px;
        margin-bottom: 2px;
      }
      .uni-header {
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: #fbbf24;
        text-transform: uppercase;
      }
      .scan-banner {
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0.05em;
        color: #ffffff;
        margin: 2px 0 4px;
      }
      .white-info-box {
        background: #ffffff;
        color: #0b2545;
        border-radius: 14px;
        padding: 10px 12px;
        width: 100%;
        border: 2px solid #38bdf8;
        margin: 6px 0;
      }
      .poster-title {
        font-size: 11.5px;
        font-weight: 900;
        line-height: 1.3;
        color: #0b2545;
      }
      .poster-subtitle {
        font-size: 9px;
        font-weight: 700;
        line-height: 1.35;
        color: #1e3a8a;
        margin-top: 4px;
      }
      .qr-frame {
        background: #ffffff;
        padding: 12px;
        border-radius: 18px;
        margin: 6px 0 2px;
        border: 2px solid #38bdf8;
      }
      .qr-frame img {
        width: 158px;
        height: 158px;
        object-fit: contain;
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="print-grid">${cardsHtml}</div>
  </body>
</html>`;

  const existingFrame = document.getElementById('labtrack-hidden-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'labtrack-hidden-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) return;
  frameDoc.open();
  frameDoc.write(htmlContent);
  frameDoc.close();

  const triggerPrintWhenReady = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {}
  };

  const imgs = Array.from(frameDoc.images);
  if (imgs.length === 0) {
    setTimeout(triggerPrintWhenReady, 150);
  } else {
    let loaded = 0;
    let printed = false;
    const checkDone = () => {
      loaded += 1;
      if (!printed && loaded >= imgs.length) {
        printed = true;
        setTimeout(triggerPrintWhenReady, 120);
      }
    };
    imgs.forEach((img) => {
      if (img.complete) checkDone();
      else {
        img.onload = checkDone;
        img.onerror = checkDone;
      }
    });
    setTimeout(() => {
      if (!printed) {
        printed = true;
        triggerPrintWhenReady();
      }
    }, 900);
  }
};

export const QrManagementView: React.FC<QrManagementViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-Detected LAN / Public Origin for Mobile Phone QR Scanning
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:3000';
  });
  const [customHostInput, setCustomHostInput] = useState<string>('');
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          setResolvedBaseUrl(window.location.origin);
          setCustomHostInput(window.location.origin);
          return;
        }
        const res = await apiClient.get('/api/v1/system/network').catch(() => null);
        const data = (res as any)?.data?.data || (res as any)?.data || {};
        const publicUrl = data?.publicUrl;
        const primaryIp = data?.primaryIp || (Array.isArray(data?.ipAddresses) ? data.ipAddresses[0] : null);
        if (publicUrl) {
          setResolvedBaseUrl(publicUrl);
          setCustomHostInput(publicUrl);
          return;
        }
        if (primaryIp && primaryIp !== '127.0.0.1') {
          const port = window.location.port || '3000';
          const detected = `${window.location.protocol}//${primaryIp}:${port}`;
          setResolvedBaseUrl(detected);
          setCustomHostInput(detected);
        } else {
          setResolvedBaseUrl(window.location.origin);
          setCustomHostInput(window.location.origin);
        }
      } catch {
        setResolvedBaseUrl(window.location.origin);
        setCustomHostInput(window.location.origin);
      }
    })();
  }, []);

  const getBaseUrl = useCallback((): string => {
    if (resolvedBaseUrl && resolvedBaseUrl.trim()) {
      return resolvedBaseUrl.trim().replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:3000';
  }, [resolvedBaseUrl]);

  const parseCapacityFromRange = (range: string): number => {
    if (!range) return 40;
    const matches = range.match(/(\d+)/g);
    if (matches && matches.length > 0) {
      const last = matches[matches.length - 1];
      const num = parseInt(last, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return 40;
  };

  // Builds a guaranteed working Student Portal URL (/student?lab=...&capacity=...&schedule=...)
  const buildStudentPortalUrl = useCallback(
    (labName: string, schedule = '', capacity = 40, pcNode = ''): string => {
      const base = getBaseUrl();
      const params = new URLSearchParams();
      params.set('lab', labName.trim());
      if (pcNode.trim()) params.set('pc', pcNode.trim());
      params.set('capacity', String(capacity));
      if (schedule.trim()) params.set('schedule', schedule.trim());
      return `${base}/student?${params.toString()}`;
    },
    [getBaseUrl]
  );

  // Normalizes any saved QR URL so it always points to the active host + /student route
  const normalizeStudentUrl = useCallback(
    (rawUrl: string, fallbackLab = 'ComLab 1 (ICT)', fallbackSched = '', fallbackCap = 40): string => {
      if (!rawUrl || !rawUrl.includes('/student')) {
        return buildStudentPortalUrl(fallbackLab, fallbackSched, fallbackCap);
      }
      let url = String(rawUrl).trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
      }
      try {
        const u = new URL(url);
        const base = new URL(getBaseUrl());
        u.protocol = base.protocol;
        u.host = base.host;
        if (!u.pathname.startsWith('/student')) {
          u.pathname = '/student';
        }
        return u.toString();
      } catch {
        return buildStudentPortalUrl(fallbackLab, fallbackSched, fallbackCap);
      }
    },
    [getBaseUrl, buildStudentPortalUrl]
  );

  // MASTER LAB QR POSTERS STATE
  const [qrNodes, setQrNodes] = useState<QrNodeItem[]>([]);

  useEffect(() => {
    const STORAGE_KEY = 'labtrack_qr_nodes';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.map((n: any) => {
            const cap = parseCapacityFromRange(n.pcRange || 'PC-001 to PC-040');
            return {
              ...n,
              targetUrl: normalizeStudentUrl(n.targetUrl, n.lab || 'ComLab 1 (ICT)', n.schedule || '', cap)
            };
          });
          setQrNodes(validated);
          return;
        }
      } catch {}
    }

    const defaults: QrNodeItem[] = [
      {
        id: 'QR-LAB-001',
        lab: 'ComLab 1 (ICT)',
        pcRange: 'PC-001 to PC-040',
        customTitle: DEFAULT_POSTER_TITLE,
        targetUrl: buildStudentPortalUrl('ComLab 1 (ICT)', 'MWF 08:00 - 10:00 AM', 40),
        createdAt: new Date().toLocaleDateString(),
        schedule: 'MWF 08:00 - 10:00 AM'
      },
      {
        id: 'QR-LAB-002',
        lab: 'ComLab 2 (Multimedia)',
        pcRange: 'PC-001 to PC-035',
        customTitle: DEFAULT_POSTER_TITLE,
        targetUrl: buildStudentPortalUrl('ComLab 2 (Multimedia)', 'TTH 10:00 - 12:00 PM', 35),
        createdAt: new Date().toLocaleDateString(),
        schedule: 'TTH 10:00 - 12:00 PM'
      },
      {
        id: 'QR-LAB-003',
        lab: 'ComLab 3 (Engineering)',
        pcRange: 'PC-001 to PC-030',
        customTitle: DEFAULT_POSTER_TITLE,
        targetUrl: buildStudentPortalUrl('ComLab 3 (Engineering)', 'MWF 01:00 - 03:00 PM', 30),
        createdAt: new Date().toLocaleDateString(),
        schedule: 'MWF 01:00 - 03:00 PM'
      }
    ];
    setQrNodes(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, [buildStudentPortalUrl, normalizeStudentUrl]);

  useEffect(() => {
    if (qrNodes.length > 0) {
      localStorage.setItem('labtrack_qr_nodes', JSON.stringify(qrNodes));
    }
  }, [qrNodes]);

  // Master QR Form State
  const [newLab, setNewLab] = useState('ComLab 1 (ICT)');
  const [newPcRange, setNewPcRange] = useState('PC-001 to PC-040');
  const [newSchedule, setNewSchedule] = useState('MWF 08:00 - 10:00 AM');
  const [newCustomTitle, setNewCustomTitle] = useState(DEFAULT_POSTER_TITLE);
  const [newCustomUrl, setNewCustomUrl] = useState('');

  // Edit & Delete Modal States
  const [editingNode, setEditingNode] = useState<QrNodeItem | null>(null);
  const [editLab, setEditLab] = useState('');
  const [editPcRange, setEditPcRange] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editCustomTitle, setEditCustomTitle] = useState('');
  const [deletingNode, setDeletingNode] = useState<QrNodeItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // 60FPS BUTTER-SMOOTH GENERATION ENGINE (ZERO LAG)
  const handleCreateQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLab.trim()) return;

    const isDuplicate = qrNodes.some(
      node =>
        node.lab.trim().toLowerCase() === newLab.trim().toLowerCase() &&
        (node.schedule || '').trim().toLowerCase() === newSchedule.trim().toLowerCase()
    );

    if (isDuplicate) {
      playQrSoundEffect('delete', soundEnabled);
      onTriggerNotification(`Duplicate QR detected for ${newLab} (${newSchedule}).`);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    playQrSoundEffect('generate_start', soundEnabled);

    const durationMs = 680;
    const startTime = performance.now();

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setGenerationProgress(pct);

      if (elapsed < durationMs) {
        requestAnimationFrame(animateStep);
      } else {
        playQrSoundEffect('generate_done', soundEnabled);
        const capacity = parseCapacityFromRange(newPcRange);
        const computedUrl = newCustomUrl.trim()
          ? normalizeStudentUrl(newCustomUrl.trim(), newLab.trim(), newSchedule, capacity)
          : buildStudentPortalUrl(newLab.trim(), newSchedule, capacity);

        const newNode: QrNodeItem = {
          id: `QR-LAB-${String(qrNodes.length + 1).padStart(3, '0')}`,
          lab: newLab.trim(),
          pcRange: newPcRange.trim() || 'PC-001 to PC-040',
          schedule: newSchedule.trim() || 'General Access',
          customTitle: newCustomTitle.trim() || DEFAULT_POSTER_TITLE,
          targetUrl: computedUrl,
          createdAt: new Date().toLocaleDateString()
        };

        setQrNodes(prev => [newNode, ...prev]);
        onTriggerNotification(`Generated Master QR Poster for ${newNode.lab}.`);
        setNewCustomUrl('');
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
        }, 100);
      }
    };

    requestAnimationFrame(animateStep);
  };

  const executeDelete = () => {
    if (!deletingNode) return;
    playQrSoundEffect('delete', soundEnabled);
    setQrNodes(prev => prev.filter(item => item.id !== deletingNode.id));
    onTriggerNotification(`Removed QR Poster for ${deletingNode.lab}.`);
    setDeletingNode(null);
  };

  const handleOpenEditModal = (node: QrNodeItem) => {
    playQrSoundEffect('click', soundEnabled);
    setEditingNode(node);
    setEditLab(node.lab);
    setEditPcRange(node.pcRange);
    setEditSchedule(node.schedule || '');
    setEditCustomTitle(node.customTitle || DEFAULT_POSTER_TITLE);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    playQrSoundEffect('generate_done', soundEnabled);
    setQrNodes(prev =>
      prev.map(item => {
        if (item.id === editingNode.id) {
          const cap = parseCapacityFromRange(editPcRange);
          const newUrl = buildStudentPortalUrl(editLab.trim(), editSchedule.trim(), cap);
          return {
            ...item,
            lab: editLab.trim(),
            pcRange: editPcRange.trim(),
            schedule: editSchedule.trim(),
            customTitle: editCustomTitle.trim() || DEFAULT_POSTER_TITLE,
            targetUrl: newUrl
          };
        }
        return item;
      })
    );

    onTriggerNotification(`Updated QR Poster details for ${editLab}.`);
    setEditingNode(null);
  };

  const filteredNodes = useMemo(() => {
    return qrNodes.filter(node => {
      const q = (searchQuery || '').toLowerCase();
      return (
        !q ||
        (node.lab || '').toLowerCase().includes(q) ||
        (node.pcRange || '').toLowerCase().includes(q) ||
        (node.customTitle || '').toLowerCase().includes(q) ||
        (node.schedule || '').toLowerCase().includes(q)
      );
    });
  }, [qrNodes, searchQuery]);

  // Instant Zero-Freeze Print Handlers (No footer strip & hides ComLab/PC/Schedule pills)
  const handlePrintSinglePoster = (node: QrNodeItem) => {
    playQrSoundEffect('print', soundEnabled);
    const cleanLink = normalizeStudentUrl(node.targetUrl, node.lab, node.schedule, parseCapacityFromRange(node.pcRange));
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cleanLink)}&margin=8`;
    executeInstantCleanPrint(
      [
        {
          title: node.customTitle || DEFAULT_POSTER_TITLE,
          subtitle: DEFAULT_POSTER_SUBTITLE,
          qrUrl: qrSrc
        }
      ],
      `JRMSU Master QR Poster - ${node.lab}`
    );
  };

  const handlePrintAllMasterPosters = () => {
    playQrSoundEffect('print', soundEnabled);
    const cards = filteredNodes.map(node => {
      const cleanLink = normalizeStudentUrl(node.targetUrl, node.lab, node.schedule, parseCapacityFromRange(node.pcRange));
      return {
        title: node.customTitle || DEFAULT_POSTER_TITLE,
        subtitle: DEFAULT_POSTER_SUBTITLE,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cleanLink)}&margin=8`
      };
    });
    executeInstantCleanPrint(cards, 'JRMSU Master Laboratory QR Posters');
  };

  const handleCopyStudentLink = (id: string, url: string) => {
    playQrSoundEffect('click', soundEnabled);
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    onTriggerNotification('Copied direct Student Portal link to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="qr-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-7  font-sans select-none">
      <style>{`
        .qr-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 10px 0 #94a3b8,
            0 22px 45px -10px rgba(15, 23, 42, 0.25),
            inset 0 2px 0 #ffffff;
        }
        .poster-3d-card {
          background: linear-gradient(165deg, #0b2545 0%, #134074 52%, #07192f 100%);
          border: 3px solid #38bdf8;
          box-shadow:
            0 10px 0 #0f172a,
            0 20px 38px -8px rgba(11, 37, 69, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
        }
        .poster-3d-card:hover {
          transform: translate3d(0, -6px, 0);
          box-shadow:
            0 14px 0 #0f172a,
            0 28px 45px -8px rgba(6, 182, 212, 0.4);
        }
        .btn-3d-action {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-3d-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .btn-3d-action:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes smooth-laser-scan {
          0% { transform: translateY(0px); }
          50% { transform: translateY(88px); }
          100% { transform: translateY(0px); }
        }
        .smooth-laser-line {
          will-change: transform;
          animation: smooth-laser-scan 0.95s ease-in-out infinite;
        }
      `}</style>

      {/* DATALIST FOR COMLAB 1-3 */}
      <datalist id="qr-lab-options">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
      </datalist>

      {/* =====================================================================
          1. OBSIDIAN COMMAND HEADER WITH AUDIO TOGGLE & NETWORK ORIGIN BAR
         ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(2,6,23,0.45)] space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-[0_5px_0_#1e3a8a,0_0_25px_rgba(56,189,248,0.55)]">
              <QrCode className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Master Laboratory QR Studio
                </h3>
                <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono font-black rounded-full">
                  â— DIRECT STUDENT PORTAL ROUTING
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Zero-Lag Instant A4 Poster Printer &amp; Direct Student Workstation Check-In • {campusName}
              </p>
            </div>
          </div>

          {/* Audio Toggle + Print All Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-mono font-black border transition cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Generator & Printer Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAllMasterPosters}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_4px_0_#064e3b] active:translate-y-0.5 cursor-pointer flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print All Posters ({filteredNodes.length})</span>
            </button>
          </div>
        </div>

        {/* Live Student Scanner Endpoint Bar */}
        <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono font-bold text-cyan-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Student Scanner Host Origin:</span>
            </span>
            {isEditingHost ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customHostInput}
                  onChange={(e) => setCustomHostInput(e.target.value)}
                  placeholder="http://192.168.1.10:3000"
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-cyan-400 text-white font-mono text-xs outline-none w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customHostInput.trim()) {
                      setResolvedBaseUrl(customHostInput.trim().replace(/\/+$/, ''));
                      onTriggerNotification(`Updated QR Scanner Host Origin to ${customHostInput.trim()}`);
                    }
                    setIsEditingHost(false);
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold">
                  {getBaseUrl()}/student
                </code>
                <button
                  type="button"
                  onClick={() => setIsEditingHost(true)}
                  className="text-[11px] font-bold text-cyan-300 hover:underline cursor-pointer"
                >
                  Change IP / Host
                </button>
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant Print Mode — No extra tab to close &amp; zero system lag</span>
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. MASTER LABORATORY QR POSTER GENERATOR & GALLERY
         ===================================================================== */}
      <div className="space-y-6">
        <form
          onSubmit={handleCreateQr}
          className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-300 shadow-[0_7px_0_#cbd5e1] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Generate Master Laboratory QR Poster</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Auto-routes to /student?lab=...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Assigned Laboratory</label>
              <input
                type="text"
                list="qr-lab-options"
                value={newLab}
                onChange={(e) => setNewLab(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-blue-800 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Workstation Range</label>
              <input
                type="text"
                value={newPcRange}
                onChange={(e) => setNewPcRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Schedule (Days/Time)</label>
              <input
                type="text"
                value={newSchedule}
                onChange={(e) => setNewSchedule(e.target.value)}
                placeholder="MWF 08:00 - 10:00 AM"
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Custom Poster Title</label>
              <input
                type="text"
                value={newCustomTitle}
                onChange={(e) => setNewCustomTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Optional Override URL</label>
              <input
                type="text"
                value={newCustomUrl}
                onChange={(e) => setNewCustomUrl(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-700 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Laboratory Name, Workstation Range, or Schedule..."
                className="pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="btn-3d-action px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-pulse" /> : <Scan className="w-4 h-4" />}
              <span>{isGenerating ? 'Encoding Master QR...' : 'Generate Lab QR Poster'}</span>
            </button>
          </div>
        </form>

        {/* Master QR Posters 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNodes.map(node => {
            const capacity = parseCapacityFromRange(node.pcRange);
            const cleanStudentUrl = normalizeStudentUrl(node.targetUrl, node.lab, node.schedule, capacity);
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(cleanStudentUrl)}&margin=8`;

            return (
              <div
                key={node.id}
                className="poster-3d-card text-white p-5 rounded-3xl relative flex flex-col items-center justify-between min-h-[430px] max-w-[330px] text-center overflow-hidden group mx-auto w-full"
              >
                {/* Top Edit & Delete Floating Controls */}
                <div className="w-full flex items-center justify-between z-10 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono font-black text-cyan-300">
                    {node.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(node)}
                      className="p-1.5 bg-white/15 hover:bg-white/30 text-white rounded-xl border border-white/25 transition cursor-pointer"
                      title="Edit Poster"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingNode(node)}
                      className="p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl transition cursor-pointer"
                      title="Delete Poster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* University Header & Official Logo */}
                <div className="space-y-1 flex flex-col items-center">
                  <img
                    src="/assets/images/jrmsu.jpg"
                    alt="JRMSU Logo"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-11 h-11 object-contain mb-0.5 drop-shadow-md rounded-full"
                  />
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                    Jose Rizal Memorial State University
                  </h4>
                  <h2 className="text-xl font-black tracking-tight text-white uppercase drop-shadow">
                    SCAN HERE
                  </h2>
                </div>

                {/* White Metadata Box (Enhanced Title + Formal Subtitle; Pills hidden on print) */}
                <div className="w-full bg-white text-[#0b2545] py-2.5 px-3 rounded-2xl shadow-md border-2 border-cyan-300 my-2">
                  <h5 className="font-black text-[11px] leading-snug tracking-tight text-[#0b2545]">
                    {node.customTitle || DEFAULT_POSTER_TITLE}
                  </h5>
                  <p className="text-[9px] font-bold text-blue-800/90 leading-tight mt-1">
                    {DEFAULT_POSTER_SUBTITLE}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-center gap-1.5 flex-wrap print:hidden">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-lg text-[10px] font-black">
                      {node.lab}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-mono font-bold">
                      {node.pcRange} ({capacity} PCs)
                    </span>
                    {node.schedule && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-bold">
                        {node.schedule}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scannable QR Code Frame */}
                <div className="p-2.5 bg-white rounded-2xl shadow-[0_6px_0_#0284c7] border-2 border-cyan-300 my-1 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={qrImageUrl}
                    alt={`Master QR Code for ${node.lab}`}
                    className="w-36 h-36 object-contain rounded-lg mx-auto"
                  />
                </div>

                {/* Bottom Link & Action Buttons (Screen Only) */}
                <div className="w-full pt-2.5 border-t border-white/20 space-y-2 mt-1">
                  <div className="flex items-center justify-between gap-1 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-cyan-500/30 text-[9.5px] font-mono text-emerald-300">
                    <span className="truncate">{cleanStudentUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyStudentLink(node.id, cleanStudentUrl)}
                      className="text-cyan-300 hover:text-white shrink-0 cursor-pointer"
                      title="Copy Student Portal URL"
                    >
                      {copiedId === node.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handlePrintSinglePoster(node)}
                      className="py-2 px-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_3px_0_#065f46] active:translate-y-0.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Poster
                    </button>

                    <a
                      href={cleanStudentUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => playQrSoundEffect('click', soundEnabled)}
                      className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-[0_3px_0_#78350f] active:translate-y-0.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Student Page
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          3. 60FPS SMOOTH QR ENCODING OVERLAY
         ===================================================================== */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-150 border-2 border-blue-400">
            <div className="w-28 h-28 bg-slate-900 rounded-2xl mx-auto relative overflow-hidden flex items-center justify-center border-4 border-cyan-400/50">
              <QrCode className="w-16 h-16 text-cyan-400/40" />
              <div className="absolute top-2 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] smooth-laser-line" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">Encoding Master Laboratory QR Code</h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Linking Workstations &amp; Student Portal Route ({generationProgress}%)...
              </p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-none"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. EDIT QR POSTER MODAL
         ===================================================================== */}
      {editingNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-blue-400">
            <div className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight">Edit QR Poster</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Update laboratory details &amp; student portal link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-blue-500" /> Assigned Laboratory
                </label>
                <input
                  type="text"
                  list="qr-lab-options"
                  value={editLab}
                  onChange={(e) => setEditLab(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-blue-800 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Workstation Range
                  </label>
                  <input
                    type="text"
                    value={editPcRange}
                    onChange={(e) => setEditPcRange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Schedule
                  </label>
                  <input
                    type="text"
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-500" /> Custom Poster Title
                </label>
                <textarea
                  value={editCustomTitle}
                  onChange={(e) => setEditCustomTitle(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-600 resize-none"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" /> Target Student Portal URL (Auto-Synced)
                </label>
                <input
                  type="text"
                  value={buildStudentPortalUrl(editLab || 'ComLab 1', editSchedule, parseCapacityFromRange(editPcRange))}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-[10px] text-emerald-700 font-bold outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2.5 justify-end border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-action px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. DELETE CONFIRMATION MODAL
         ===================================================================== */}
      {deletingNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] max-w-sm w-full p-6 text-center space-y-5 border-2 border-rose-400">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Delete QR Poster?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to remove the Master QR Poster for{' '}
                <strong className="text-slate-900">{deletingNode.lab}</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeletingNode(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTED MODAL COMPATIBILITY WRAPPER (INSTANT PRINT & NO FOOTER STRIP)
// ============================================================================
export const QrGeneratorModal: React.FC<QrGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [lab, setLab] = useState('ComLab 1 (ICT)');
  const [count, setCount] = useState(6);
  const [baseUrl, setBaseUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/system/network').catch(() => null);
        const data = (res as any)?.data?.data || (res as any)?.data;
        const port = window.location.port || '3000';
        if (active && data?.primaryIp && data.primaryIp !== '127.0.0.1') {
          setBaseUrl(`${window.location.protocol}//${data.primaryIp}:${port}`);
          return;
        }
      } catch {}
      if (active && typeof window !== 'undefined') {
        setBaseUrl(window.location.origin);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const safeCount = Math.max(1, Math.min(24, Number(count) || 1));
  const generatedNodes = Array.from({ length: safeCount }, (_, i) => {
    const node = `PC-${String(i + 1).padStart(3, '0')}`;
    const url = `${baseUrl}/student?lab=${encodeURIComponent(lab.trim())}&pc=${encodeURIComponent(node)}&capacity=${safeCount}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&margin=8`;
    return { node, url, qrSrc };
  });
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 relative">
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] max-w-3xl w-full space-y-5 border-2 border-blue-400 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-slate-900 text-base">Official JRMSU QR Poster Printer</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-bold">
          <div>
            <label className="block text-slate-700 mb-1">Target Laboratory</label>
            <select
              value={lab}
              onChange={(e) => {
                playQrSoundEffect('click', true);
                setLab(e.target.value);
              }}
              className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl outline-none font-bold"
            >
              <option value="ComLab 1 (ICT)">ComLab 1 (ICT)</option>
              <option value="ComLab 2 (Multimedia)">ComLab 2 (Multimedia)</option>
              <option value="ComLab 3 (Engineering)">ComLab 3 (Engineering)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1">Number of Posters</label>
            <input
              type="number"
              min={1}
              max={24}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-slate-50 border-2 border-slate-300 p-2.5 rounded-xl font-mono text-xs outline-none"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {generatedNodes.map(({ node, qrSrc }) => (
            <div
              key={node}
              className="bg-[#0b2545] text-white p-4 rounded-2xl border-2 border-cyan-400 shadow-[0_6px_0_#0f172a] flex flex-col items-center text-center space-y-2"
            >
              <span className="text-[9px] font-extrabold uppercase text-amber-300">
                Jose Rizal Memorial State University
              </span>
              <strong className="text-xs font-black uppercase tracking-wider">SCAN HERE</strong>
              <div className="bg-white/95 text-[#0b2545] py-1.5 px-2.5 rounded-xl w-full">
                <div className="font-black text-[10px]">{DEFAULT_POSTER_TITLE}</div>
                <div className="font-bold text-[8.5px] text-blue-800 mt-0.5">{DEFAULT_POSTER_SUBTITLE}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-cyan-300">
                <img src={qrSrc} alt={node} className="w-24 h-24 object-contain" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-black rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              playQrSoundEffect('print', true);
              executeInstantCleanPrint(
                generatedNodes.map(g => ({
                  title: DEFAULT_POSTER_TITLE,
                  subtitle: DEFAULT_POSTER_SUBTITLE,
                  qrUrl: g.qrSrc
                })),
                'JRMSU Official QR Posters'
              );
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-[0_4px_0_#1e3a8a] flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print All ({safeCount} Posters)
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrManagementView;










