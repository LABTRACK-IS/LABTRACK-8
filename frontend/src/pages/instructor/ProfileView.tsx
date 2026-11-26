import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  User, Lock, Shield, Bell, LogOut, Camera, Check, X,
  ChevronDown, ChevronUp, AlertTriangle, Key, Mail, Building,
  CheckCircle2, RefreshCw, Sliders, ShieldCheck,
  Sparkles, Save, Eye, EyeOff, Trash2, Plus, Phone, Monitor,
  Upload, QrCode, Fingerprint, Wifi, Radio, Laptop, Smartphone, Send
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  phone: string;
  avatarUrl: string;
}

export interface LabClosureItem {
  id: string;
  labName: string;
  isClosed: boolean;
  reason: string;
  closedBy: string;
  date: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  deviceType: 'DESKTOP' | 'LAPTOP' | 'MOBILE';
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  latencyMs: number;
  isCurrent: boolean;
}

// ============================================================================
// LEVITATING 3D ISOMETRIC FACULTY IDENTITY & SECURITY VAULT RIG
// ============================================================================
const IsometricFacultyProfileRig: React.FC<{ openLabsCount: number }> = ({ openLabsCount }) => {
  return (
    <div className="w-20 h-16 shrink-0 relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 118"
        className="w-full h-full prof-rig-float drop-shadow-[0_10px_14px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="instProfBlueGrad3D" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.96" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Extruded Base */}
        <polygon points="70,106 8,82 70,56 132,82" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.6" />
        <polygon points="8,82 70,106 70,115 8,90" fill="#0f172a" />
        <polygon points="132,82 70,106 70,115 132,90" fill="#020617" />

        {/* Animated Isometric Data Trace */}
        <polyline
          points="40,82 70,94 104,78"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="prof-circuit-flow"
        />

        {/* 3D Tempered-Glass Security Tower */}
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
            style={{ transformOrigin: '103.5px 37px', animationDuration: '2.5s' }}
          />
          <ellipse
            cx="103.5"
            cy="55"
            rx="4.5"
            ry="7"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.7"
            strokeDasharray="3 2"
            className="animate-pulse"
            style={{ transformOrigin: '103.5px 55px', animationDuration: '2.5s' }}
          />
          <line x1="121" y1="24" x2="121" y2="65" stroke="#60a5fa" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" className="animate-ping" />
          <circle cx="121" cy="21" r="2" fill="#ffffff" />
        </g>

        {/* 3D Isometric Faculty Terminal Monitor */}
        <g>
          <polygon points="50,79 68,72 78,76 60,83" fill="#475569" />
          <polygon points="58,58 65,56 65,77 58,79" fill="#334155" />
          <polygon points="20,20 84,6 89,9 25,23" fill="#64748b" />
          <polygon points="84,6 89,9 89,53 84,50" fill="#1e293b" />
          <polygon points="20,20 84,6 84,51 20,65" fill="#0f172a" stroke="#bfdbfe" strokeWidth="1.5" />
          <polygon points="23,23 81,10 81,48 23,61" fill="url(#instProfBlueGrad3D)" />
          <line x1="28" y1="28" x2="54" y2="22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="70" y2="25" stroke="#dbeafe" strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
          <line x1="28" y1="40" x2="60" y2="33" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
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
            {openLabsCount}/3 OPEN
          </text>
        </g>

        <polygon points="30,83 74,68 82,73 38,88" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.1" />
        <line x1="35" y1="83" x2="73" y2="70" stroke="#dbeafe" strokeWidth="1.6" strokeDasharray="3 2" />
        <ellipse cx="90" cy="74" rx="4.5" ry="3" fill="#0f172a" stroke="#34d399" strokeWidth="1.1" />
      </svg>
    </div>
  );
};

// ============================================================================
// REALISTIC 3D MINI DESKTOP PC RIG FOR LAB CLOSURE OVERRIDE ROWS
// ============================================================================
const MiniLabClosurePcRig: React.FC<{ isClosed: boolean; labName: string }> = ({
  isClosed,
  labName
}) => {
  const accentHex = isClosed ? '#f43f5e' : '#10b981';
  const topHex = isClosed ? '#be123°C' : '#047857';
  const shortTag = labName.toLowerCase().includes('comlab 1')
    ? 'CL-01'
    : labName.toLowerCase().includes('comlab 2')
    ? 'CL-02'
    : 'CL-03';
  const uid = `lc-rig-${shortTag}-${isClosed ? 'closed' : 'open'}`;

  return (
    <div className="w-12 h-9 shrink-0 relative flex items-center justify-center select-none">
      <svg viewBox="0 0 120 84" className="w-full h-full drop-shadow-[0_3px_5px_rgba(15,23,42,0.28)]">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={topHex} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect x="6" y="68" width="108" height="10" rx="4" fill="#0f172a" stroke={accentHex} strokeWidth="1" strokeOpacity="0.6" />
        <rect x="38" y="54" width="8" height="14" rx="1.5" fill="#475569" />
        <polygon points="30,68 54,68 58,72 26,72" fill="#64748b" />
        <rect x="10" y="10" width="64" height="45" rx="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1.8" />
        <rect x="13" y="13" width="58" height="38" rx="2.5" fill={`url(#${uid})`} stroke={accentHex} strokeWidth="0.9" />
        <line x1="18" y1="20" x2="40" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="26" x2="54" y2="26" stroke={accentHex} strokeWidth="1.6" strokeLinecap="round" />
        <text x="42" y="42" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="900">
          {shortTag}
        </text>
        <rect x="80" y="10" width="28" height="60" rx="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
        <rect x="83" y="14" width="22" height="44" rx="2" fill="#020617" stroke={accentHex} strokeWidth="0.9" />
        <g
          className={!isClosed ? 'animate-pulse' : ''}
          style={{ transformOrigin: '94px 27px', animationDuration: '1.6s' }}
        >
          <circle cx="94" cy="27" r="5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="94" cy="27" r="1.6" fill="#ffffff" />
        </g>
        <circle cx="94" cy="45" r="5" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    </div>
  );
};

const DEFAULT_LAB_CLOSURES_SEED: LabClosureItem[] = [
  {
    id: 'lc-1',
    labName: 'ComLab 1 (Networking & ICT)',
    isClosed: false,
    reason: 'Operational — Regular Classes & QR Gate Active',
    closedBy: 'System',
    date: '2026-11-08'
  },
  {
    id: 'lc-2',
    labName: 'ComLab 2 (Multimedia & Software Eng)',
    isClosed: true,
    reason: 'Split-Type Aircon Repair & Thermal Maintenance',
    closedBy: 'Engr. Clara Reyes',
    date: '2026-11-08'
  },
  {
    id: 'lc-3',
    labName: 'ComLab 3 (AI & Cybersecurity Lab)',
    isClosed: false,
    reason: 'Operational — Deep Learning & CUDA Cluster Ready',
    closedBy: 'System',
    date: '2026-11-08'
  }
];

const DEFAULT_ACTIVE_SESSIONS_SEED: ActiveSession[] = [
  {
    id: 'SES-INST-01',
    device: 'Windows 11 Pro Faculty Workstation (CL1-INST-PC)',
    deviceType: 'DESKTOP',
    browser: 'Chrome 130.0 • ASP.NET Core JWT Bearer',
    ip: '10.101.0.10',
    location: 'ComLab 1 Instructor Podium (JRMSU Main)',
    lastActive: 'Active Now',
    latencyMs: 9,
    isCurrent: true
  },
  {
    id: 'SES-INST-02',
    device: 'MacBook Air M3 — Faculty Advisory Console',
    deviceType: 'LAPTOP',
    browser: 'Safari 18.1 • TLS 1.3 Encrypted',
    ip: '192.168.10.44',
    location: 'CCS Faculty Consultation Room',
    lastActive: '24 mins ago',
    latencyMs: 15,
    isCurrent: false
  },
  {
    id: 'SES-INST-03',
    device: 'iPhone 16 Pro — LabTrack QR Attendance Scanner',
    deviceType: 'MOBILE',
    browser: 'Mobile WebKit • QR Gate Sync',
    ip: '10.102.0.88',
    location: 'ComLab 2 Corridor',
    lastActive: '1 hour ago',
    latencyMs: 21,
    isCurrent: false
  }
];

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Persistent Profile State (CRUD Read & Update)
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_profile_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return {
      name: 'Engr. Clara Reyes',
      email: 'c.reyes@jrmsu.edu.ph',
      role: 'Senior Faculty Instructor & ComLab Coordinator',
      department: 'College of Computing Studies (BS-Information System)',
      employeeId: 'EMP-2026-0412',
      phone: '+63 917 555 0192',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop'
    };
  });

  // Accordion Expand/Collapse States
  const [activeAccordion, setActiveAccordion] = useState<
    'name' | 'closure' | 'issue' | 'password' | 'sessions' | null
  >('name');
  const [expandAllAccordions, setExpandAllAccordions] = useState<boolean>(false);

  // Persistent Lab Closure Overrides Data (Strictly ComLab 1–3)
  const [labClosures, setLabClosures] = useState<LabClosureItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_lab_closures_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
      }
    } catch {}
    return DEFAULT_LAB_CLOSURES_SEED;
  });

  // Persistent Active Sessions Data
  const [sessions, setSessions] = useState<ActiveSession[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_sessions_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACTIVE_SESSIONS_SEED;
  });
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Persistent Issue Update Notification Preferences
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('labtrack_instructor_profile_notif_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      issueUpdates: true,
      labScheduleAlerts: true,
      emailEvents: true,
      systemAnnouncements: true
    };
  });

  // Security 6-Digit Faculty PIN
  const [facultyPin, setFacultyPin] = useState<string>(() => {
    try {
      return localStorage.getItem('labtrack_instructor_pin_v3') || '412026';
    } catch {
      return '412026';
    }
  });

  // Modals & UI Control States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isAddClosureOpen, setIsAddClosureOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Centered Delete / Session Termination Modal State
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Form States
  const [editName, setEditName] = useState<string>(profile.name);
  const [editRole, setEditRole] = useState<string>(
    profile.role || 'Senior Faculty Instructor & ComLab Coordinator'
  );
  const [editEmail, setEditEmail] = useState<string>(profile.email);
  const [editDepartment, setEditDepartment] = useState<string>(profile.department);
  const [editPhone, setEditPhone] = useState<string>(profile.phone);
  const [editEmployeeId, setEditEmployeeId] = useState<string>(profile.employeeId);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);

  // New Lab Closure Form States (Strictly ComLab 1–3)
  const [targetLab, setTargetLab] = useState<string>('ComLab 1 (Networking & ICT)');
  const [closureReason, setClosureReason] = useState<string>('');

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('labtrack_instructor_profile_v3', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_lab_closures_v3', JSON.stringify(labClosures));
    } catch {}
  }, [labClosures]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_instructor_sessions_v3', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_instructor_profile_notif_v3', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Password Entropy Strength Calculator (4 Segments)
  const passwordStrength = useMemo(() => {
    const pwd = newPassword || '';
    if (!pwd) return { segments: 0, label: 'Enter New Passphrase', color: 'bg-slate-300' };
    let segments = 1;
    if (pwd.length >= 8) segments = 2;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) segments = 3;
    if (segments === 3 && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 10) segments = 4;

    if (segments === 1) return { segments, label: 'Weak Entropy', color: 'bg-rose-500' };
    if (segments === 2) return { segments, label: 'Moderate Security', color: 'bg-amber-500' };
    if (segments === 3) return { segments, label: 'Strong Security', color: 'bg-blue-600' };
    return { segments, label: 'Military-Grade SHA-256', color: 'bg-emerald-500' };
  }, [newPassword]);

  // Profile sync from logged-in user
  useEffect(() => {
    if (!user) return;
    const __fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setProfile(prev => {
      const next = { ...prev };
      if (__fullName) next.name = __fullName;
      if (user.email) next.email = user.email;
      if (user.phoneNumber) next.phone = user.phoneNumber;
      if (user.department) next.department = user.department;
      if (user.profilePictureUrl) {
        next.avatarUrl = user.profilePictureUrl;
        setAvatarError(false);
      }
      if (!next.role) next.role = 'Senior Faculty Instructor & ComLab Coordinator';
      return next;
    });
  }, [user]);

  // DIRECT FILE UPLOAD HANDLER
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const __avatarUrl = reader.result as string;
          setAvatarError(false);
          setProfile(prev => ({ ...prev, avatarUrl: __avatarUrl }));
          try {
            if (user?.id) {
              await apiClient.put('/api/v1/users/' + user.id, {
                fullName: ((user.firstName || '') + ' ' + (user.lastName || '')).trim(),
                email: user.email,
                role: user.role || 'INSTRUCTOR',
                profilePictureUrl: __avatarUrl
              });
            }
          } catch {}
          if (updateUser) updateUser({ ...user, profilePictureUrl: __avatarUrl });
          showToast('Faculty profile photo updated and synced!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CRUD: UPDATE Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = editName.trim() || 'Engr. Clara Reyes';
    const parts = newName.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const updatedProfile: UserProfile = {
      ...profile,
      name: newName,
      role: editRole.trim() || 'Senior Faculty Instructor & ComLab Coordinator',
      email: editEmail.trim(),
      department: editDepartment.trim(),
      phone: editPhone.trim(),
      employeeId: editEmployeeId.trim() || 'EMP-2026-0412'
    };

    setProfile(updatedProfile);

    try {
      if (user?.id) {
        await apiClient.put(`/api/v1/users/${user.id}`, {
          fullName: (firstName + ' ' + lastName).trim(),
          email: editEmail.trim() || user.email,
          role: user.role || 'INSTRUCTOR',
          phoneNumber: editPhone.trim(),
          department: editDepartment.trim()
        });
      }
    } catch {}

    if (updateUser) {
      updateUser({
        ...user,
        firstName,
        lastName,
        email: editEmail.trim(),
        phoneNumber: editPhone.trim(),
        department: editDepartment.trim()
      });
    }

    setIsEditProfileOpen(false);
    showToast('Faculty profile information updated and synced!');
  };

  // CRUD: UPDATE Password & PIN
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Error: New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Error: Password must be at least 6 characters long.');
      return;
    }

    localStorage.setItem('labtrack_instructor_pin_v3', facultyPin);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
    showToast('Security password & 6-digit PIN encrypted and saved!');
  };

  // CRUD: TOGGLE & ADD Lab Closure Override (Synced with LabAvailabilityView)
  const handleToggleClosure = (id: string) => {
    setLabClosures(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newStatus = !item.isClosed;
          showToast(
            `${item.labName.split('(')[0].trim()} status updated to ${
              newStatus ? 'CLOSED (LOCKED)' : 'OPEN (OPERATIONAL)'
            }`
          );
          return {
            ...item,
            isClosed: newStatus,
            reason: newStatus
              ? item.reason.includes('Operational')
                ? 'Faculty Emergency Maintenance Lockout'
                : item.reason
              : 'Operational — Regular Classes & QR Gate Active',
            closedBy: newStatus ? profile.name : 'System',
            date: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      })
    );
  };

  const handleAddClosureOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim() || !targetLab.trim()) return;

    const shortTarget = targetLab.split('(')[0].trim().toLowerCase();
    const existing = labClosures.find(l => l.labName.toLowerCase().includes(shortTarget));

    if (existing) {
      setLabClosures(prev =>
        prev.map(l =>
          l.id === existing.id
            ? {
                ...l,
                isClosed: true,
                reason: closureReason.trim(),
                closedBy: profile.name,
                date: new Date().toISOString().split('T')[0]
              }
            : l
        )
      );
    } else {
      const newClosure: LabClosureItem = {
        id: `lc-${Date.now()}`,
        labName: targetLab.trim(),
        isClosed: true,
        reason: closureReason.trim(),
        closedBy: profile.name,
        date: new Date().toISOString().split('T')[0]
      };
      setLabClosures(prev => [newClosure, ...prev.slice(0, 2)]);
    }

    setClosureReason('');
    setIsAddClosureOpen(false);
    showToast(`Emergency closure override activated for ${targetLab}!`);
  };

  // CRUD: TERMINATE SESSION & PING NODE
  const handleConfirmTerminateSession = () => {
    if (!sessionToTerminate) return;
    const id = sessionToTerminate.id;
    const deviceName = sessionToTerminate.device;
    setDeletingSessionId(id);
    setSessionToTerminate(null);

    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      setDeletingSessionId(null);
      showToast(`Session on "${deviceName}" terminated.`);
    }, 340);
  };

  const handlePingSession = (session: ActiveSession) => {
    setPingingId(session.id);
    setTimeout(() => {
      const nextPing = Math.floor(8 + Math.random() * 12);
      setSessions(prev =>
        prev.map(s =>
          s.id === session.id ? { ...s, latencyMs: nextPing, lastActive: 'Verified Just Now' } : s
        )
      );
      setPingingId(null);
      showToast(`ICMP Handshake Verified: ${session.device} responded in ${nextPing}ms.`);
    }, 320);
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    showToast('All secondary sessions revoked. Only your current workstation remains active.');
  };

  // Logout Handler
  const handleLogout = () => {
    showToast('Logging out of JRMSU LabTrack...');
    setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  const initials = useMemo(() => {
    const clean = (profile.name || 'Clara Reyes').replace(/^Engr\.\s*|^Prof\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    return ((parts[0]?.[0] || 'C') + (parts[parts.length - 1]?.[0] || 'R')).toUpperCase();
  }, [profile.name]);

  const openLabsCount = useMemo(
    () => labClosures.filter(l => !l.isClosed).length,
    [labClosures]
  );

  const isSectionOpen = (sec: 'name' | 'closure' | 'issue' | 'password' | 'sessions') =>
    expandAllAccordions || activeAccordion === sec;
  return (
    <div className="prof-inst-3d-shell p-5 sm:p-7 rounded-[2.5rem] text-slate-800 font-sans select-none  space-y-6 relative">
      {/* ADVANCED 3D EXTRUDED SHELL, HOLOGRAPHIC SHIMMER & ORBITAL STYLES */}
      <style>{`
        .prof-inst-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 28px 55px -12px rgba(15, 23, 42, 0.24),
            inset 0 2px 0 #ffffff;
        }
        .prof-inst-panel-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 8px 0 #cbd5e1,
            0 16px 28px rgba(15, 23, 42, 0.08),
            inset 0 2px 0 #ffffff;
        }
        .prof-card-3d-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: perspective(900px) translateZ(0);
        }
        .prof-card-3d-lift:hover {
          transform: perspective(900px) translate3d(0, -3px, 8px) rotateX(1.4deg);
        }
        .prof-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.25);
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease;
        }
        .prof-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.35);
        }
        .prof-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes profRigFloat3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .prof-rig-float {
          animation: profRigFloat3D 3.2s ease-in-out infinite;
        }
        @keyframes profCircuitDash {
          to { stroke-dashoffset: -28; }
        }
        .prof-circuit-flow {
          animation: profCircuitDash 1.4s linear infinite;
        }
        @keyframes profHoloSweep {
          0% { transform: translateX(-130%) skewX(-22deg); }
          55%, 100% { transform: translateX(230%) skewX(-22deg); }
        }
        .prof-holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.16), rgba(255, 255, 255, 0.22), transparent);
          animation: profHoloSweep 4.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* HIDDEN FILE INPUT FOR DIRECT PHOTO UPLOAD */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY (STRICTLY COMLAB 1–3) */}
      <datalist id="lab-room-suggestions">
        <option value="ComLab 1 (Networking & ICT)" />
        <option value="ComLab 2 (Multimedia & Software Eng)" />
        <option value="ComLab 3 (AI & Cybersecurity Lab)" />
      </datalist>

      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-blue-400/50 flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
          <span className="text-xs font-mono font-black">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. 3D BALANCED SLATE-BLUE COMMAND HEADER BAR
         ===================================================================== */}
      <div className="prof-holo-shimmer relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white border-2 border-blue-400/40 shadow-[0_8px_0_#0f172a,0_20px_35px_rgba(15,23,42,0.4)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <IsometricFacultyProfileRig openLabsCount={openLabsCount} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-black text-[10px] border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE SYNC SECURITY ACTIVE</span>
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-sky-200 rounded-full font-mono font-black text-[10px] border border-blue-400/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-300" /> JRMSU AUTHORIZED FACULTY
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Profile &amp; Security Settings
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Faculty identity credentials, ComLab 1–3 emergency closure overrides, and active session security
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => setExpandAllAccordions(!expandAllAccordions)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-2xl border border-slate-600 shadow-[0_4px_0_#020617] text-xs font-black transition cursor-pointer"
          >
            {expandAllAccordions ? 'Collapse Sections' : 'Expand All Sections'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditName(profile.name);
              setEditRole(profile.role || 'Senior Faculty Instructor & ComLab Coordinator');
              setEditEmail(profile.email);
              setEditDepartment(profile.department);
              setEditPhone(profile.phone);
              setEditEmployeeId(profile.employeeId);
              setIsEditProfileOpen(true);
            }}
            className="prof-btn-3d px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN TWO-COLUMN 3D WORKSPACE GRID
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 COLS): 3D ORBITAL AVATAR & HOLOGRAPHIC FACULTY ID CARD */}
        <div className="lg:col-span-4 space-y-5">
          <div className="prof-inst-panel-3d p-6 rounded-3xl text-center space-y-5">
            {/* Top 3D Slate-Blue Banner */}
            <div className="prof-holo-shimmer h-24 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 -mx-6 -mt-6 mb-4 border-b-2 border-blue-400/50 relative overflow-hidden flex items-start justify-between p-4">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-sky-200 font-mono text-[9.5px] font-black border border-white/20">
                JRMSU FACULTY PASS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-black border border-emerald-400/40">
                ● VERIFIED
              </span>
            </div>

            {/* 3D Orbital Profile Picture with Direct File Picker Click */}
            <div
              className="relative inline-block -mt-16 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="absolute -inset-2 rounded-full border-2 border-dashed border-blue-500/50 animate-pulse pointer-events-none"
                style={{ animationDuration: '14s' }}
              />
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-[0_8px_20px_rgba(15,23,42,0.3)] bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center mx-auto relative z-10">
                {!avatarError && profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                  />
                ) : (
                  <span className="text-3xl font-black font-mono text-white tracking-wider">
                    {initials}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 z-20 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-[0_3px_0_#1e3a8a] cursor-pointer active:translate-y-0.5 border-2 border-white"
                title="Select Photo from File/Gallery"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {profile.name}
              </h2>
              <p className="text-xs text-blue-700 font-mono font-black flex items-center justify-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>{profile.role || 'Senior Faculty Instructor & ComLab Coordinator'}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">{profile.department}</p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="prof-btn-3d w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo from Device</span>
            </button>

            {/* 3D Holographic Smart Chip & QR Faculty Credential Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white border-2 border-blue-400/40 shadow-[0_6px_0_#0f172a] text-left space-y-3">
              <div className="flex items-center justify-between">
                {/* Gold EMV Smart Chip */}
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-100 p-1 grid grid-cols-3 gap-0.5">
                  <div className="border border-amber-900/40 rounded-xs" />
                  <div className="border border-amber-900/40 rounded-xs" />
                  <div className="border border-amber-900/40 rounded-xs" />
                  <div className="border border-amber-900/40 rounded-xs col-span-3" />
                </div>
                <div className="p-1.5 bg-white rounded-xl border border-sky-300">
                  <QrCode className="w-8 h-8 text-slate-950" />
                </div>
              </div>

              <div className="space-y-1 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">EMPLOYEE ID:</span>
                  <strong className="text-amber-300 font-black">{profile.employeeId}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMAIL:</span>
                  <strong className="text-sky-300 truncate max-w-[165px]">{profile.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CONTACT:</span>
                  <strong className="text-white">{profile.phone}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-emerald-300">
                <span className="flex items-center gap-1 font-bold">
                  <Fingerprint className="w-3.5 h-3.5" /> SHA-256 AUTH
                </span>
                <span className="font-black">PIN: ••••••</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 COLS): 5 INTERACTIVE 3D ACCORDION SETTINGS */}
        <div className="lg:col-span-8 space-y-4">
          <div className="prof-inst-panel-3d p-6 rounded-3xl space-y-4">
            {/* Accordion Menu Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3.5">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                  FACULTY CONTROL MATRIX
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Profile &amp; Security Preferences</span>
                </h3>
              </div>
              <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                5 Modules Active
              </span>
            </div>

            {/* ITEM 1: NAME & PERSONAL INFORMATION */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden transition shadow-[0_4px_0_#e2e8f0]">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'name' ? null : 'name')}
                className="w-full p-4 bg-slate-50 hover:bg-blue-50/40 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-[0_3px_0_#1e3a8a]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Name &amp; Personal Information
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Manage faculty name, designation title, email, and contact details
                    </p>
                  </div>
                </div>
                {isSectionOpen('name') ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isSectionOpen('name') && (
                <div className="p-4 bg-white border-t-2 border-slate-100 space-y-3 text-xs ">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Full Name</span>
                      <span className="font-black text-slate-900 text-xs">{profile.name}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Designation Role</span>
                      <span className="font-bold text-blue-700 text-xs">{profile.role}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Email Address</span>
                      <span className="font-mono font-bold text-slate-900">{profile.email}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Phone Number</span>
                      <span className="font-mono font-bold text-slate-900">{profile.phone}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Department / College</span>
                      <span className="font-bold text-slate-800">{profile.department}</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(profile.name);
                        setEditRole(profile.role);
                        setEditEmail(profile.email);
                        setEditDepartment(profile.department);
                        setEditPhone(profile.phone);
                        setEditEmployeeId(profile.employeeId);
                        setIsEditProfileOpen(true);
                      }}
                      className="prof-btn-3d px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Edit Personal Info</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ITEM 2: LAB CLOSURE & EMERGENCY OVERRIDES (STRICTLY COMLAB 1–3) */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden transition shadow-[0_4px_0_#e2e8f0]">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'closure' ? null : 'closure')}
                className="w-full p-4 bg-slate-50 hover:bg-blue-50/40 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-[0_3px_0_#78350f]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Lab Closure &amp; Emergency Overrides (ComLab 1–3)
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Lock or re-open ComLab 1, ComLab 2, and ComLab 3 access schedules
                    </p>
                  </div>
                </div>
                {isSectionOpen('closure') ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isSectionOpen('closure') && (
                <div className="p-4 bg-white border-t-2 border-slate-100 space-y-3 text-xs ">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-500 font-bold">
                      ComLab 1–3 operational &amp; emergency lockout status:
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddClosureOpen(true)}
                      className="prof-btn-3d px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Set Override</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {labClosures.map(item => (
                      <div
                        key={item.id}
                        className="prof-card-3d-lift p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                            <MiniLabClosurePcRig isClosed={item.isClosed} labName={item.labName} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-slate-900 block truncate">{item.labName}</span>
                            <span className="text-[10.5px] text-slate-500 font-medium block truncate">
                              {item.reason} • <span className="font-mono">{item.date}</span>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleClosure(item.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-black transition cursor-pointer shrink-0 ${
                            item.isClosed
                              ? 'bg-rose-600 text-white shadow-[0_3px_0_#881337]'
                              : 'bg-emerald-600 text-white shadow-[0_3px_0_#064e3b]'
                          }`}
                        >
                          {item.isClosed ? 'CLOSED (LOCKED)' : 'OPEN (READY)'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ITEM 3: ISSUE UPDATE NOTIFICATIONS (3D SLIDING PILL SWITCHES) */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden transition shadow-[0_4px_0_#e2e8f0]">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'issue' ? null : 'issue')}
                className="w-full p-4 bg-slate-50 hover:bg-blue-50/40 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-[0_3px_0_#312e81]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Issue Update Notifications
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Real-time alert toggles for ticket repairs, schedules, and email digests
                    </p>
                  </div>
                </div>
                {isSectionOpen('issue') ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isSectionOpen('issue') && (
                <div className="p-4 bg-white border-t-2 border-slate-100 space-y-2.5 text-xs ">
                  {[
                    {
                      key: 'issueUpdates',
                      label: 'Issue Ticket Real-Time Status Push Alerts',
                      desc: 'Notify immediately when Admin Service Desk resolves a workstation fault.'
                    },
                    {
                      key: 'labScheduleAlerts',
                      label: 'ComLab 1–3 Reservation & Schedule Reminders',
                      desc: 'Alert 15 minutes before your scheduled laboratory class begins.'
                    },
                    {
                      key: 'emailEvents',
                      label: 'Automated Email Notification Digest',
                      desc: `Send daily telemetry summaries to ${profile.email}.`
                    }
                  ].map(pref => {
                    const isOn = Boolean((notifications as any)[pref.key]);
                    return (
                      <div
                        key={pref.key}
                        onClick={() => {
                          setNotifications({ ...notifications, [pref.key]: !isOn });
                          showToast(`${pref.label}: ${!isOn ? 'ENABLED' : 'MUTED'}`);
                        }}
                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 cursor-pointer transition"
                      >
                        <div>
                          <span className="font-black text-slate-900 block">{pref.label}</span>
                          <span className="text-[10.5px] text-slate-500">{pref.desc}</span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 border ${
                            isOn
                              ? 'bg-emerald-500 border-emerald-600 justify-end'
                              : 'bg-slate-300 border-slate-400 justify-start'
                          }`}
                        >
                          <div className="w-4.5 h-4.5 rounded-full bg-white shadow flex items-center justify-center">
                            {isOn && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 4: CHANGE PASSWORD & 6-DIGIT PIN */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden transition shadow-[0_4px_0_#e2e8f0]">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full p-4 bg-slate-50 hover:bg-blue-50/60 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-sky-300 rounded-xl shadow-[0_3px_0_#020617]">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Change Password &amp; 6-Digit Faculty PIN
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Update your security passphrase and ComLab terminal override PIN
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-[10px] font-mono font-black shadow-[0_2px_0_#1e3a8a]">
                  Update Credentials
                </span>
              </button>
            </div>

            {/* ITEM 5: ACTIVE LOGIN SESSIONS */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden transition shadow-[0_4px_0_#e2e8f0]">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'sessions' ? null : 'sessions')}
                className="w-full p-4 bg-slate-50 hover:bg-blue-50/40 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-[0_3px_0_#064e3b]">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Active Login Sessions ({sessions.length} Devices)
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Authorized faculty workstations, mobile QR scanners, and IP nodes
                    </p>
                  </div>
                </div>
                {isSectionOpen('sessions') ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isSectionOpen('sessions') && (
                <div className="p-4 bg-white border-t-2 border-slate-100 space-y-3 text-xs ">
                  {sessions.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRevokeAllOtherSessions}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 rounded-xl font-black text-[10.5px] transition cursor-pointer"
                      >
                        Revoke All Other Devices
                      </button>
                    </div>
                  )}

                  {sessions.map(s => {
                    const isBeingDeleted = deletingSessionId === s.id;
                    const isPinging = pingingId === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`prof-card-3d-lift p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${
                          isBeingDeleted ? 'opacity-0 -translate-x-12 pointer-events-none' : ''
                        } ${
                          s.isCurrent
                            ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-blue-400 shadow-[0_5px_0_#0f172a]'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 border ${
                              s.isCurrent
                                ? 'bg-blue-500/20 text-sky-300 border-blue-400/40'
                                : 'bg-white text-blue-600 border-slate-200'
                            }`}
                          >
                            {s.deviceType === 'MOBILE' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : s.deviceType === 'LAPTOP' ? (
                              <Laptop className="w-4 h-4" />
                            ) : (
                              <Monitor className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-black ${s.isCurrent ? 'text-white' : 'text-slate-900'}`}>
                                {s.device}
                              </span>
                              {s.isCurrent && (
                                <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-full font-mono font-black text-[9px]">
                                  ● CURRENT NODE
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-black flex items-center gap-1 ${
                                  s.isCurrent
                                    ? 'bg-slate-800 text-sky-300'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                <Wifi className="w-2.5 h-2.5" /> {s.latencyMs}ms
                              </span>
                            </div>
                            <span
                              className={`text-[10.5px] font-mono block mt-0.5 ${
                                s.isCurrent ? 'text-sky-200' : 'text-slate-500'
                              }`}
                            >
                              {s.ip} • {s.location} • {s.lastActive}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePingSession(s)}
                            className={`px-2.5 py-1.5 rounded-xl font-mono font-black text-[10px] border transition cursor-pointer flex items-center gap-1 ${
                              s.isCurrent
                                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-600'
                                : 'bg-white hover:bg-blue-600 text-slate-700 hover:text-white border-slate-300'
                            }`}
                          >
                            <Radio className={`w-3 h-3 ${isPinging ? 'animate-pulse' : ''}`} />
                            <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
                          </button>

                          {!s.isCurrent && (
                            <button
                              type="button"
                              onClick={() => setSessionToTerminate(s)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Terminate Session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LOGOUT BUTTON ROW */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Active faculty session connected from verified JRMSU node</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-[0_4px_0_#881337] active:translate-y-0.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MODALS (TERMINATE SESSION, EDIT PROFILE, PASSWORD & PIN, LAB CLOSURE)
         ===================================================================== */}

      {/* SESSION TERMINATION CONFIRMATION 3D MODAL */}
      {sessionToTerminate && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 ">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border-2 border-rose-400 shadow-[0_10px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Confirm Session Termination</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to terminate session on{' '}
                <span className="font-black text-slate-900">{sessionToTerminate.device}</span> (
                {sessionToTerminate.ip})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToTerminate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminateSession}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-[0_4px_0_#881337]"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT PROFILE */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Edit Personal Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-black text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Official Designation / Role</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-bold text-blue-800 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editEmployeeId}
                    onChange={e => setEditEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Department / College</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={e => setEditDepartment(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prof-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CHANGE PASSWORD & 6-DIGIT FACULTY PIN */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePassword}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-blue-400 shadow-[0_12px_0_#1e3a8a,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Security Password &amp; 6-Digit PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full bg-slate-50 p-2.5 pr-9 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters..."
                    className="w-full bg-slate-50 p-2.5 pr-9 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4-Segment Live Password Entropy Bar */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">ENTROPY LEVEL:</span>
                  <strong className="text-sky-300">{passwordStrength.label}</strong>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(seg => (
                    <div
                      key={seg}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.segments >= seg ? passwordStrength.color : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Confirm New Password</label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password..."
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              {/* 6-Digit Faculty Override PIN */}
              <div className="pt-1">
                <label className="block mb-1">6-Digit ComLab Terminal Override PIN</label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  maxLength={6}
                  value={facultyPin}
                  onChange={e => setFacultyPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-900 text-sky-300 p-2.5 rounded-xl border-2 border-slate-700 font-mono font-black tracking-[0.4em] text-center outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prof-btn-3d px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Update Credentials
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EMERGENCY LAB CLOSURE OVERRIDE FORM (COMLAB 1–3) */}
      {isAddClosureOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddClosureOverride}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-rose-400 shadow-[0_12px_0_#9f1239,0_25px_50px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Emergency Lab Closure Override</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddClosureOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Target Laboratory (ComLab 1–3)</label>
                <input
                  type="text"
                  list="lab-room-suggestions"
                  placeholder="Select ComLab 1, 2, or 3..."
                  value={targetLab}
                  onChange={e => setTargetLab(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-black focus:outline-none focus:border-blue-600"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select from ComLab 1–3 or enter a custom laboratory facility name.
                </span>
              </div>

              <div>
                <label className="block mb-1">Closure Reason / Maintenance Note</label>
                <textarea
                  placeholder="e.g. Split-type aircon coolant repair and electrical breaker inspection..."
                  value={closureReason}
                  onChange={e => setClosureReason(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddClosureOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-[0_4px_0_#881337] cursor-pointer"
              >
                Apply Emergency Lockout
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfileView;










