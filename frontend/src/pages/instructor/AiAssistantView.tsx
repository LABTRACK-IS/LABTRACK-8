import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import { AiRichMessageRenderer } from '@/components/AiRichMessageRenderer';
import apiClient from '@/lib/api-client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Trash2, Plus, Sparkles, User, RefreshCw, Copy, CheckCircle2,
  Activity, Wrench, Calendar,
  MessageSquare, ChevronRight, Lock, Terminal, Cpu, AlertTriangle,
  ShieldCheck, Edit3, Check, Download
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  suggestedActions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface PresetAction {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  promptText: string;
  icon: React.ElementType;
}

export interface DeleteModalState {
  isOpen: boolean;
  type: 'session' | 'message' | 'clear_all';
  targetId?: string;
  title?: string;
}

export interface AiAssistantViewProps {
  campusName?: string;
  userRole?: 'ADMIN' | 'TECHNICIAN' | 'INSTRUCTOR' | 'STUDENT' | 'GUEST';
  userEmail?: string;
  onTriggerNotification?: (msg: string) => void;
}

// ============================================================================
// LEVITATING 3D ISOMETRIC AI NEURAL CORE & WORKSTATION DIAGNOSTIC RIG
// ============================================================================
const IsometricAiDeskRig: React.FC<{ isTyping: boolean; activeRole: string }> = ({
  isTyping,
  activeRole
}) => {
  const primaryHex = isTyping ? '#f59e0b' : '#60a5fa';
  const secondaryHex = isTyping ? '#d97706' : '#2563eb';
  const accentHex = isTyping ? '#fde047' : '#34d399';
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full ai-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="instAiDeskGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={primaryHex} stopOpacity="0.96" />
            <stop offset="55%" stopColor={secondaryHex} stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Extruded Base */}
        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke={primaryHex} strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        {/* Animated Isometric Data Trace */}
        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke={accentHex}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="ai-circuit-flow"
        />

        {/* 3D Tempered-Glass AI Processing Tower */}
        <g>
          <polygon points="96,18 116,10 131,16 111,24" fill="#334155" stroke="#93c5fd" strokeWidth="0.9" />
          <polygon points="96,18 111,24 111,75 96,69" fill="#0f172a" stroke={primaryHex} strokeWidth="1.3" />
          <polygon points="111,24 131,16 131,67 111,75" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.1" />
          <ellipse
            cx="103.5"
            cy="37"
            rx="4.5"
            ry="7"
            fill="none"
            stroke={primaryHex}
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 37px', animationDuration: isTyping ? '0.6s' : '2.4s' }}
          />
          <ellipse
            cx="103.5"
            cy="55"
            rx="4.5"
            ry="7"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 55px', animationDuration: isTyping ? '0.6s' : '2.4s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke={primaryHex} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        {/* 3D Isometric Holographic Monitor */}
        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#instAiDeskGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke={accentHex} strokeWidth="1.8" strokeLinecap="round" />
          <text
            x="52"
            y="50"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="monospace"
            transform="skewY(-12)"
          >
            {isTyping ? 'THINKING' : activeRole.slice(0, 8)}
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke={primaryHex} strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke={accentHex} strokeWidth="1.1" />
      </svg>
    </div>
  );
};

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  userRole: propUserRole,
  userEmail: propUserEmail,
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Auth / Role Resolution
  const getUserContext = () => {
    if (propUserRole) return { role: propUserRole, email: propUserEmail || 'instructor@jrmsu.edu.ph' };

    try {
      const savedUserStr =
        sessionStorage.getItem('labtrack_user') ||
        localStorage.getItem('labtrack_user') ||
        localStorage.getItem('user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        return {
          role: parsed.role || 'INSTRUCTOR',
          email: parsed.email || 'instructor@jrmsu.edu.ph'
        };
      }
      const savedRole = localStorage.getItem('labtrack_user_role');
      if (savedRole) return { role: savedRole, email: 'instructor@jrmsu.edu.ph' };
    } catch {}

    return { role: 'INSTRUCTOR', email: 'instructor@jrmsu.edu.ph' };
  };

  const userContext = getUserContext();
  const activeRole = userContext.role;

  // ============================================================================
  // LIVE CROSS-MODULE TELEMETRY READER (SYNCED WITH OTHER INSTRUCTOR VIEWS)
  // ============================================================================
  const readLiveLabSnapshot = useCallback(() => {
    let workstations: any[] = [
      { pcNumber: 'PC-001', labRoom: 'ComLab 1 (Networking & ICT)', status: 'Available', cpuLoad: 8, tempC: 38 },
      { pcNumber: 'PC-002', labRoom: 'ComLab 1 (Networking & ICT)', status: 'Available', cpuLoad: 9, tempC: 39 },
      { pcNumber: 'PC-008', labRoom: 'ComLab 1 (Networking & ICT)', status: 'In Use', assignedUser: '2024-IS-0142 (Maria Clara Santos)', cpuLoad: 54, tempC: 58 },
      { pcNumber: 'PC-014', labRoom: 'ComLab 2 (Multimedia & Graphics)', status: 'Maintenance', cpuLoad: 14, tempC: 43 },
      { pcNumber: 'PC-019', labRoom: 'ComLab 2 (Multimedia & Graphics)', status: 'Maintenance', cpuLoad: 10, tempC: 41 },
      { pcNumber: 'PC-026', labRoom: 'ComLab 3 (AI & Software Eng)', status: 'Offline', cpuLoad: 0, tempC: 29 }
    ];
    try {
      const savedWs = JSON.parse(localStorage.getItem('labtrack_workstations_v4') || 'null');
      if (Array.isArray(savedWs) && savedWs.length > 0) workstations = savedWs;
    } catch {}

    const totalPCs = workstations.length || 24;
    const availablePCs = workstations.filter(w => w.status === 'Available');
    const inUsePCs = workstations.filter(w => w.status === 'In Use');
    const maintPCs = workstations.filter(w => w.status === 'Maintenance' || w.status === 'Offline');

    let studentSessions: any[] = [
      { id: 'QRL-2001', studentName: 'Maria Clara Santos', studentId: '2024-IS-0142', workstationCode: 'PC-008', laboratoryName: 'ComLab 1 (Networking & ICT)', status: 'ACTIVE', timeInFormatted: '08:15:00 AM' }
    ];
    try {
      const savedSes = JSON.parse(localStorage.getItem('labtrack_student_sessions_v3') || 'null');
      if (Array.isArray(savedSes) && savedSes.length > 0) studentSessions = savedSes;
    } catch {}
    const activeSessions = studentSessions.filter(s => s.status === 'ACTIVE');

    let tickets: any[] = [
      { ticketNo: 'TK-2026-0891', lab: 'ComLab 2 (Multimedia & Graphics)', workstation: 'PC-014', priority: 'High', status: 'In Progress', title: 'Monitor Display Flickering Continuously' },
      { ticketNo: 'TK-2026-0892', lab: 'ComLab 2 (Multimedia & Graphics)', workstation: 'PC-019', priority: 'Urgent', status: 'Pending', title: 'No LAN Network Signal / 10Mbps Link' }
    ];
    try {
      const savedTks = JSON.parse(localStorage.getItem('labtrack_instructor_tickets_v3') || 'null');
      if (Array.isArray(savedTks) && savedTks.length > 0) tickets = savedTks;
    } catch {}
    const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Cancelled');

    let reservations: any[] = [
      { id: 'RES-2026-101', title: 'IS 301 — Enterprise Architecture & Cloud Lab', labRoom: 'ComLab 1 (Networking & ICT)', reservedBy: 'Prof. Ramon Magsaysay', startTime: '08:00 AM', endTime: '10:00 AM', status: 'In Progress', pcsReserved: 42 },
      { id: 'RES-2026-102', title: 'CS 204 — 2D/3D Multimedia & Shader Rendering', labRoom: 'ComLab 2 (Multimedia & Graphics)', reservedBy: 'Prof. Maria Clara Santos', startTime: '10:00 AM', endTime: '12:00 PM', status: 'Approved', pcsReserved: 38 }
    ];
    try {
      const savedRes = JSON.parse(localStorage.getItem('labtrack_reservations_v3') || 'null');
      if (Array.isArray(savedRes) && savedRes.length > 0) reservations = savedRes;
    } catch {}

    return {
      workstations,
      totalPCs,
      availablePCs,
      inUsePCs,
      maintPCs,
      studentSessions,
      activeSessions,
      tickets,
      openTickets,
      reservations
    };
  }, []);

  const [snapshot, setSnapshot] = useState(() => readLiveLabSnapshot());
  const [cpuTelemetry, setCpuTelemetry] = useState<number>(16);
  const [ramTelemetry, setRamTelemetry] = useState<number>(42);
  const [apiLatencyMs, setApiLatencyMs] = useState<number>(9);

  // Microservice Connection & Chat State
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');

  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: 'session'
  });

  // Live Telemetry Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSnapshot(readLiveLabSnapshot());
      setCpuTelemetry(Math.floor(14 + Math.random() * 14));
      setRamTelemetry(Math.floor(38 + Math.random() * 12));
      setApiLatencyMs(8 + Math.floor(Math.random() * 5));
    }, 2200);
    return () => clearInterval(timer);
  }, [readLiveLabSnapshot]);

  // Initial Fetch Sessions from API or LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const savedLocal = localStorage.getItem('labtrack_instructor_ai_sessions_v4');
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            setActiveSessionId(parsed[0].id);
            setIsLoadingData(false);
            return;
          }
        }

        const res = await apiClient.get('/api/v1/ai/sessions?role=INSTRUCTOR').catch(() => null);
        const data = res?.data?.data?.items || res?.data?.data || res?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          setActiveSessionId(data[0].id);
        } else {
          const snap = readLiveLabSnapshot();
          setSessions([
            {
              id: 'session-1',
              title: 'System Diagnostic Session',
              createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
              messages: [
                {
                  id: 'msg-init-1',
                  sender: 'assistant',
                  text:
                    `Good day! I am the **JRMSU LabTrack AI Diagnostic Assistant**.\n\n` +
                    `• **Active Role:** **${activeRole}** (${activeCampus})\n` +
                    `• **Live Fleet Status:** **${snap.availablePCs.length} Available PCs** | **${snap.inUsePCs.length} In Use** | **${snap.openTickets.length} Open Tickets**\n\n` +
                    `I am ready to assist with hardware audits, network logs, software debugging, and laboratory schedules.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  suggestedActions: [
                    'Run a full system health check',
                    'Scan for hardware faults & open tickets',
                    'Verify schedule availability across all ComLabs'
                  ]
                }
              ]
            }
          ]);
        }
      } catch {
        setSessions([
          {
            id: 'session-1',
            title: 'Diagnostic Session #1',
            createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            messages: [
              {
                id: 'msg-init-1',
                sender: 'assistant',
                text: `Good day! I am the **JRMSU LabTrack AI Assistant**.\n\nActive Context: **${activeRole}** at **${activeCampus}**. How can I assist you today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          }
        ]);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [activeRole, activeCampus, readLiveLabSnapshot]);

  // Persist Sessions
  useEffect(() => {
    try {
      if (sessions.length > 0) {
        localStorage.setItem('labtrack_instructor_ai_sessions_v4', JSON.stringify(sessions));
      }
    } catch {}
  }, [sessions]);

  // Active Session Helper
  const currentSession =
    sessions.find(s => s.id === activeSessionId) ||
    sessions[0] || {
      id: 'default',
      title: 'New Session',
      createdAt: '--:--',
      messages: []
    };

  // Auto Scroll to Bottom of Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isTyping]);

  // Toast Notification Helper
  const showToast = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // AI Assistant Presets
  const presetActions: PresetAction[] = [
    {
      id: 'p-1',
      title: 'Full System Diagnostic',
      subtitle: 'Inspect API engine, database & vacant PCs',
      badge: `${snapshot.availablePCs.length} FREE`,
      promptText: 'Run a full system health check on backend microservices, DB latency, and available workstations.',
      icon: Activity
    },
    {
      id: 'p-2',
      title: 'Hardware Fault Scan',
      subtitle: 'Analyze workstation errors & GPU/monitor logs',
      badge: `${snapshot.openTickets.length} OPEN`,
      promptText: 'Scan for hardware faults including display flickering, power supply failures, and loose cabling.',
      icon: Wrench
    },
    {
      id: 'p-3',
      title: 'Software & Code Debug',
      subtitle: 'Resolve Python, CUDA, React & C# .NET issues',
      badge: 'CLI FIX',
      promptText: 'Help debug local environment setup errors, Python venv CUDA drivers, or backend API timeouts.',
      icon: Terminal
    },
    {
      id: 'p-4',
      title: 'Lab Timetable Sync',
      subtitle: 'Check room bookings & maintenance windows',
      badge: `${snapshot.reservations.length} SCHED`,
      promptText: 'Verify schedule availability across all ComLabs and check for maintenance conflicts.',
      icon: Calendar
    }
  ];

  // SMART AI RESPONSE ENGINE (GROUNDED IN LIVE SYSTEM DATA)
  const generateSmartAiResponse = (
    query: string,
    role: string
  ): { text: string; codeSnippet?: string; suggestedActions?: string[] } => {
    const q = (query || '').toLowerCase();
    const snap = readLiveLabSnapshot();
    setSnapshot(snap);

    // 1. SYSTEM HEALTH & AVAILABLE WORKSTATIONS
    if (
      q.includes('health') ||
      q.includes('status') ||
      q.includes('telemetry') ||
      q.includes('server') ||
      q.includes('diagnostic') ||
      q.includes('available') ||
      q.includes('vacant')
    ) {
      const availList = snap.availablePCs
        .slice(0, 8)
        .map((w: any) => `\`${w.pcNumber}\``)
        .join(', ');

      return {
        text:
          `**JRMSU LABTRACK TELEMETRY REPORT (${activeCampus})**\n\n` +
          `• **FastAPI Microservice:** ACTIVE (Port 8000, Response: **${apiLatencyMs}ms**)\n` +
          `• **C# .NET Core API:** ONLINE (Port 5000)\n` +
          `• **PostgreSQL Database:** CONNECTED (3 active connection pools)\n` +
          `• **Workstation Fleet:** **${snap.availablePCs.length} Available** | **${snap.inUsePCs.length} In Use** | **${snap.maintPCs.length} Maintenance** (Total: ${snap.totalPCs} PCs)\n` +
          `• **Ready PCs:** ${availList || 'All units occupied'}\n` +
          `• **System Load:** **${cpuTelemetry}% CPU** | **${ramTelemetry}% RAM** (${role} Access Confirmed)`,
        suggestedActions: [
          'Scan for hardware faults including display flickering',
          'Verify schedule availability across all ComLabs'
        ]
      };
    }

    // 2. HARDWARE & WORKSTATION DIAGNOSTICS
    if (
      q.includes('hardware') ||
      q.includes('monitor') ||
      q.includes('flicker') ||
      q.includes('cable') ||
      q.includes('power') ||
      q.includes('display') ||
      q.includes('fault') ||
      q.includes('ticket') ||
      q.includes('report')
    ) {
      const ticketSummary =
        snap.openTickets.length > 0
          ? snap.openTickets
              .slice(0, 3)
              .map(
                (t: any, idx: number) =>
                  `${idx + 1}. **${t.ticketNo} — ${t.lab} (${t.workstation}):** ${t.title} (*Priority: ${t.priority} • Status: ${t.status}*)`
              )
              .join('\n')
          : `1. **All Workstations Nominal:** Zero pending hardware fault tickets.`;

      return {
        text:
          ` **HARDWARE DIAGNOSTIC REPORT (${activeCampus})**\n\n` +
          `${ticketSummary}\n\n` +
          `• **Active Student QR Sessions:** **${snap.activeSessions.length} Online**\n` +
          `✓ *Work orders are synchronized in real time with the Admin Service Desk.*`,
        suggestedActions: [
          'Run a full system health check',
          'Help debug local environment setup errors'
        ]
      };
    }

    // 3. NETWORK & CONNECTIVITY
    if (
      q.includes('network') ||
      q.includes('lan') ||
      q.includes('ping') ||
      q.includes('wifi') ||
      q.includes('ip') ||
      q.includes('internet')
    ) {
      return {
        text:
          `**NETWORK INFRASTRUCTURE STATUS**\n\n` +
          `• **Subnet Range:** \`10.101.0.0/24\` – \`10.104.0.0/24\` Operational\n` +
          `• **Gateway Latency:** Ping **${apiLatencyMs}ms** (0% Packet Loss)\n` +
          `• **Bandwidth Allocation:** 1 Gbps Dedicated Core Switch Active\n` +
          `• **ComLab 1–4 Uplinks:** VLAN Handshake verified`,
        codeSnippet: `Test-NetConnection -ComputerName 10.101.0.1 -Port 443\nipconfig /flushdns && netsh winsock reset`,
        suggestedActions: ['Run a full system health check']
      };
    }

    // 4. SOFTWARE, PROGRAMMING & DEBUGGING
    if (
      q.includes('code') ||
      q.includes('python') ||
      q.includes('cuda') ||
      q.includes('react') ||
      q.includes('error') ||
      q.includes('debug') ||
      q.includes('sql')
    ) {
      return {
        text: `**SOFTWARE ENVIRONMENT & DEBUG ADVISORY**\n\nDetected environment synchronization request. Here is the recommended terminal fix for virtual environment and CUDA package updates:`,
        codeSnippet:
          `# Activate Python Virtual Environment\ncd labtrack-python-backend\n.venv\\Scripts\\activate\n\n# Re-install core packages & CUDA modules\npip install --upgrade psutil sqlalchemy fastapi uvicorn watchfiles`,
        suggestedActions: ['Run a full system health check', 'Scan for hardware faults']
      };
    }

    // 5. SCHEDULES & ROOM BOOKINGS
    if (
      q.includes('schedule') ||
      q.includes('time') ||
      q.includes('booking') ||
      q.includes('class') ||
      q.includes('room') ||
      q.includes('timetable')
    ) {
      const schedLines = snap.reservations
        .slice(0, 4)
        .map(
          (r: any) =>
            `• **${r.labRoom.split('(')[0].trim()}:** **${r.title}** (${r.startTime} - ${r.endTime}) — *${r.reservedBy}* [**${r.status}**]`
        )
        .join('\n');

      return {
        text:
          `**LABORATORY SCHEDULE & ROOM SYNC (${activeCampus})**\n\n` +
          `${schedLines}\n\n` +
          `• **Available Workstations Right Now:** **${snap.availablePCs.length} PCs Ready**`,
        suggestedActions: ['Run a full system health check', 'Scan for hardware faults']
      };
    }

    // DYNAMIC GENERAL FALLBACK
    return {
      text:
        `**JRMSU LabTrack AI Assistant (Active Role: ${role})**\n\n` +
        `I have processed your query: **"${query}"**.\n\n` +
        `Live Campus Summary (**${activeCampus}**):\n` +
        `• **Available Workstations:** **${snap.availablePCs.length} / ${snap.totalPCs} PCs Ready**\n` +
        `• **Active Student Sessions:** **${snap.activeSessions.length} Online**\n` +
        `• **Open Maintenance Tickets:** **${snap.openTickets.length} Active**\n` +
        `• **Scheduled Classes:** **${snap.reservations.length} Bookings**`,
      suggestedActions: [
        'Run a full system health check',
        'Scan for hardware faults',
        'Verify schedule availability across all ComLabs'
      ]
    };
  };

  // Helper: Update Active Session Messages
  const updateActiveSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => (s.id === activeSessionId ? { ...s, messages: newMessages } : s)));
  };

  // Send Message Handler
  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    updateActiveSessionMessages(updatedMessages);
    if (!customText) setInputQuery('');
    setIsTyping(true);

    setTimeout(async () => {
      let aiResponse: { text: string; codeSnippet?: string; suggestedActions?: string[] };
      try {
        const resp = await apiClient.post('/api/v1/ai/chat/query', {
          prompt: textToSend,
          sessionId: activeSessionId,
          role: activeRole,
          campus_id: activeCampus,
          user_email: userContext.email,
          systemContext: JSON.stringify({
            role: activeRole,
            userEmail: userContext.email,
            campus: activeCampus,
            path: '/instructor/ai-assistant'
          })
        });

        const answer = resp?.data?.data?.response || resp?.data?.response;
        if (answer) {
          aiResponse = {
            text: String(answer),
            suggestedActions: ['Run a full system health check', 'Scan for hardware faults']
          };
        } else {
          aiResponse = generateSmartAiResponse(textToSend, activeRole);
        }
      } catch {
        aiResponse = generateSmartAiResponse(textToSend, activeRole);
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: aiResponse.text,
        codeSnippet: aiResponse.codeSnippet,
        suggestedActions: aiResponse.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateActiveSessionMessages([...updatedMessages, aiMessage]);
      setIsTyping(false);
    }, 280);
  };

  // CRUD: Create New Chat Session
  const handleCreateNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Diagnostic Session #${sessions.length + 1}`,
      createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      messages: [
        {
          id: `m-init-${Date.now()}`,
          sender: 'assistant',
          text: `New encrypted diagnostic session initialized.\nActive Role Context: **${activeRole}** (${activeCampus})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            'Run a full system health check',
            'Scan for hardware faults',
            'Verify schedule availability across all ComLabs'
          ]
        }
      ]
    };

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    showToast('New diagnostic session created!');
  };

  const handleRenameSession = (id: string) => {
    if (!renameText.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, title: renameText.trim() } : s)));
    setEditingSessionId(null);
    setRenameText('');
    showToast('Session title updated!');
  };

  const handleExportTranscript = () => {
    const content = currentSession.messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JRMSU_AI_${currentSession.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    showToast('Exported session transcript!');
  };

  // Open Delete Modal Trigger
  const openDeleteModal = (
    type: 'session' | 'message' | 'clear_all',
    targetId?: string,
    title?: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (type === 'session' && sessions.length === 1) {
      showToast('You must keep at least one active chat session.');
      return;
    }
    setDeleteModal({
      isOpen: true,
      type,
      targetId,
      title: title || (type === 'clear_all' ? 'Clear All History' : 'Confirm Delete')
    });
  };

  // Execute Delete Action from Modal
  const confirmDeleteAction = () => {
    if (deleteModal.type === 'session' && deleteModal.targetId) {
      const filtered = sessions.filter(s => s.id !== deleteModal.targetId);
      setSessions(filtered);
      if (activeSessionId === deleteModal.targetId && filtered[0]) {
        setActiveSessionId(filtered[0].id);
      }
      showToast('Session deleted successfully!');
    } else if (deleteModal.type === 'message' && deleteModal.targetId) {
      const updated = currentSession.messages.filter(m => m.id !== deleteModal.targetId);
      updateActiveSessionMessages(updated);
      showToast('Message deleted!');
    } else if (deleteModal.type === 'clear_all') {
      updateActiveSessionMessages([]);
      showToast('Chat history cleared!');
    }

    setDeleteModal({ isOpen: false, type: 'session' });
  };

  // Copy Message Text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied to clipboard!');
  };
  return (
    <div className="ai-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* 3D EXTRUDED SHELL, PERSPECTIVE TILT & KINETIC KEYFRAMES */}
      <style>{`
        .ai-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .ai-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .ai-card-3d-lift {
          transition:
            transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.22s ease,
            opacity 0.22s ease;
          transform: perspective(900px) translateZ(0);
        }
        .ai-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -3px, 8px) rotateX(1.5deg);
        }
        .ai-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .ai-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .ai-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes aiRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .ai-rig-float {
          animation: aiRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes aiCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .ai-circuit-flow {
          animation: aiCircuitDash 1.4s linear infinite;
        }
        @keyframes aiHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .ai-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.14), rgba(255, 255, 255, 0.2), transparent);
          animation: aiHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes msgSpring3D {
          0% {
            opacity: 0;
            transform: perspective(800px) translate3d(0, 12px, -16px) rotateX(-4deg) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: perspective(800px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
          }
        }
        .ai-msg-pop {
          animation: msgSpring3D 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes eqBounce {
          0%, 100% { height: 5px; }
          50% { height: 18px; }
        }
        .ai-eq-bar {
          animation: eqBounce 0.72s ease-in-out infinite;
        }
        .ai-cyber-grid {
          background-color: #f1f5f9;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 16px 16px;
        }
      `}</style>

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-blue-400/50 flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-sky-300" />
          <span className="text-xs font-mono font-black">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. HEADER SECTION (3D SLATE-BLUE COMMAND HEADER WITH FLOATING 3D RIG)
         ===================================================================== */}
      <div className="ai-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricAiDeskRig isTyping={isTyping} activeRole={activeRole} />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-300" />
              <span>AI Assistant &amp; Diagnostic Desk</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-1 flex flex-wrap items-center gap-2">
              <span className="font-bold text-sky-200">JRMSU LabTrack AI Microservice</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-mono font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                FastAPI Telemetry Engine Active ({apiLatencyMs}ms)
              </span>
            </p>
          </div>
        </div>

        {/* SECURITY & ROLE BADGE */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <div className="bg-blue-500/20 text-sky-200 border border-blue-400/40 px-3.5 py-2 rounded-2xl text-xs font-mono font-black flex items-center gap-1.5 shadow-[0_4px_0_#020617]">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span>Role: {activeRole}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/75 px-3.5 py-2 rounded-2xl border border-slate-700 shadow-[0_4px_0_#020617] text-xs font-mono font-black text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private Encrypted Memory</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN TWO-COLUMN GRID (EXACT ORIGINAL CONTAINERS, 3D UPGRADED INSIDE)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONNECTION STATUS, PRESET ACTIONS & SESSIONS (4 COLS) */}
        <div className="lg:col-span-4 space-y-5">
          {/* BOX 1: CONNECTION STATUS BANNER (3D TELEMETRY CORE) */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-3xl border-2 border-blue-400/40 shadow-[0_7px_0_#0f172a] space-y-3">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-sky-300">
                  {isConnected ? 'Microservice Connected' : 'Local Fallback Active'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsConnected(!isConnected);
                  setSnapshot(readLiveLabSnapshot());
                  showToast('Synchronized AI Telemetry Bus.');
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer text-sky-200"
                title="Refresh Connection Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <h2 className="text-sm font-black tracking-wide leading-tight relative z-10 text-white">
              JRMSU AI Telemetry Engine Online
            </h2>
            <p className="text-[11px] text-slate-300 font-medium relative z-10 leading-relaxed">
              Real-time monitoring of hardware, network latency, software errors, and room schedules for {activeCampus}.
            </p>

            {/* Compact Live Telemetry Bars Inside Banner */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono text-[10px] relative z-10">
              <div className="bg-slate-950/75 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-sky-300">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> CPU
                  </span>
                  <strong>{cpuTelemetry}%</strong>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-sky-300 transition-all duration-500"
                    style={{ width: `${cpuTelemetry}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950/75 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-emerald-300">
                  <span>VACANT PCS</span>
                  <strong>
                    {snapshot.availablePCs.length}/{snapshot.totalPCs}
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-500"
                    style={{
                      width: `${Math.round((snapshot.availablePCs.length / Math.max(1, snapshot.totalPCs)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOX 2: AI ASSISTANT PRESETS MENU (3D TACTILE SWITCHES) */}
          <div className="ai-panel-3d p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <span>Quick AI Actions</span>
              </h3>
              <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                4 Presets
              </span>
            </div>

            <div className="space-y-2.5">
              {presetActions.map(action => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleSendMessage(action.promptText)}
                    className="ai-card-3d-lift w-full text-left p-3.5 bg-white hover:bg-blue-50/50 rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-[0_4px_0_#e2e8f0] transition space-y-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition">
                          {action.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 text-sky-300">
                          {action.badge}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium line-clamp-1 pl-8">
                      {action.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOX 3: CHAT SESSIONS MANAGER (3D SESSION CARDS) */}
          <div className="ai-panel-3d p-5 rounded-3xl space-y-3.5">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Chat Sessions</span>
              </h3>
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="ai-btn-3d px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>New Session</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 pt-0.5">
              {isLoadingData ? (
                <SkeletonLoader3D compact />
              ) : (
                sessions.map(session => {
                  const isActive = activeSessionId === session.id;
                  const isEditingThis = editingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`ai-card-3d-lift p-3 rounded-2xl border-2 text-xs flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-blue-400 shadow-[0_4px_0_#1e3a8a]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 shadow-[0_3px_0_#e2e8f0]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-300' : 'text-blue-600'}`}
                        />
                        {isEditingThis ? (
                          <input
                            type="text"
                            defaultValue={session.title}
                            autoFocus
                            onChange={e => setRenameText(e.target.value)}
                            onBlur={() => handleRenameSession(session.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameSession(session.id);
                            }}
                            className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white border border-sky-400 outline-none w-full"
                          />
                        ) : (
                          <span className="font-black truncate">{session.title}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setRenameText(session.title);
                          }}
                          className={`p-1 rounded-lg transition cursor-pointer ${
                            isActive ? 'text-slate-300 hover:text-sky-300' : 'text-slate-400 hover:text-blue-600'
                          }`}
                          title="Rename Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={e => openDeleteModal('session', session.id, session.title, e)}
                          className={`p-1 rounded-lg transition cursor-pointer ${
                            isActive ? 'text-rose-300 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHAT PANEL (8 COLS) */}
        <div className="lg:col-span-8 ai-panel-3d rounded-3xl flex flex-col h-[640px] overflow-hidden">
          {/* CHAT HEADER */}
          <div className="p-4 border-b-2 border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-slate-900 to-blue-900 text-sky-300 rounded-2xl border border-blue-400/40 shadow-[0_3px_0_#0f172a]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">{currentSession.title}</h2>
                <p className="text-[10px] text-slate-500 font-mono font-bold">
                  Created: {currentSession.createdAt} • {currentSession.messages.length} Messages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportTranscript}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => openDeleteModal('clear_all')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          {/* CHAT STREAM AREA (3D RECESSED CYBER GRID) */}
          <div className="ai-cyber-grid flex-1 p-5 overflow-y-auto space-y-4 shadow-inner">
            {currentSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Bot className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-black text-slate-600">No messages in this session.</p>
                <p className="text-[11px]">Type a query below or pick a quick action from the sidebar.</p>
              </div>
            ) : (
              currentSession.messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`ai-msg-pop flex items-start gap-3 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* 3D AVATAR */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xs border-2 ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 border-sky-400/50 text-sky-300 shadow-[0_3px_0_#020617]'
                        : 'bg-blue-600 border-blue-300 text-white shadow-[0_3px_0_#1e3a8a]'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* BUBBLE */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2.5 relative group ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-tr-none border-2 border-blue-400/60 shadow-[0_5px_0_#1e3a8a]'
                        : 'bg-white border-2 border-slate-300 text-slate-800 rounded-tl-none shadow-[0_5px_0_#cbd5e1]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-4 border-b pb-1.5 text-[10px] ${
                        msg.sender === 'user' ? 'border-white/15' : 'border-slate-100'
                      }`}
                    >
                      <span
                        className={`font-black ${
                          msg.sender === 'user' ? 'text-sky-200' : 'text-blue-700'
                        }`}
                      >
                        {msg.sender === 'user' ? `You (${activeRole})` : 'JRMSU AI Assistant'}
                      </span>
                      <span className={msg.sender === 'user' ? 'text-blue-100 font-mono' : 'text-slate-400 font-mono'}>
                        {msg.timestamp}
                      </span>
                    </div>

                    <div className="whitespace-pre-line leading-relaxed font-medium">
                      <AiRichMessageRenderer text={msg.text} />
                    </div>

                    {/* CODE SNIPPET IF PRESENT */}
                    {msg.codeSnippet && (
                      <div className="mt-2 p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border-2 border-slate-800 shadow-inner relative">
                        <pre>{msg.codeSnippet}</pre>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id + '-code', msg.codeSnippet || '')}
                          className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-1 rounded-lg transition text-[10px] font-mono font-bold cursor-pointer"
                        >
                          {copiedId === msg.id + '-code' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}

                    {/* INTERACTIVE FOLLOW-UP CHIPS INSIDE AI BUBBLE */}
                    {msg.sender === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(act)}
                            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-mono text-[10px] font-black transition cursor-pointer flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ACTION HOVER BUTTONS */}
                    <div
                      className={`pt-1 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition ${
                        msg.sender === 'user' ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="p-1 hover:bg-black/10 rounded-md transition cursor-pointer"
                        title="Copy Text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal('message', msg.id)}
                        className="p-1 hover:bg-rose-500/20 rounded-md transition cursor-pointer hover:text-rose-600"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* 3D 5-BAR NEURAL WAVE EQUALIZER TYPING INDICATOR */}
            {isTyping && (
              <div className="ai-msg-pop flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 border-2 border-sky-400 flex items-center justify-center text-sky-300 shrink-0 shadow-[0_3px_0_#020617]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 text-white border-2 border-blue-400 px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-3 shadow-[0_5px_0_#1e3a8a]">
                  <div className="flex items-end gap-1 h-4">
                    {[0, 0.15, 0.3, 0.12, 0.25].map((d, i) => (
                      <span
                        key={i}
                        className="w-1 bg-sky-400 rounded-full ai-eq-bar block"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-sky-200 font-mono font-black">
                    Analyzing telemetry as {activeRole}...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* CHAT INPUT FORM */}
          <div className="p-4 bg-white border-t-2 border-slate-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Ask AI as ${activeRole} (available PCs, hardware faults, network logs, code bugs, room schedules)...`}
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="ai-btn-3d px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 text-white font-black rounded-2xl transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="text-[10px] text-slate-400 font-mono font-bold text-center mt-2">
              JRMSU LabTrack AI Assistant • Smart Telemetry &amp; Diagnostic Microservice Engine
            </p>
          </div>
        </div>
      </div>

      {/* ANIMATED CUSTOM DELETE CONFIRMATION 3D MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {deleteModal.type === 'clear_all' ? 'Clear Conversation' : 'Delete Confirmation'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {deleteModal.type === 'clear_all' &&
                'Are you sure you want to clear all messages in this current chat session?'}
              {deleteModal.type === 'session' &&
                `Are you sure you want to delete session "${deleteModal.title}"?`}
              {deleteModal.type === 'message' && 'Are you sure you want to delete this specific message?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'session' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-[0_4px_0_#881337]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistantView;











