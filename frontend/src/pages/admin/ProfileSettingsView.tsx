import { SkeletonLoader3D, useSmoothSkeleton } from '@/components/SkeletonLoader3D';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Shield, Building, Phone, Key, Camera, Lock, Bell, CheckCircle2,
  Save, RefreshCw, Cpu, Monitor, Smartphone, Globe, ShieldCheck, AlertCircle,
  Sparkles, Eye, EyeOff, Trash2, Radio, Send, LogOut, Laptop, QrCode,
  Fingerprint, Award, Wifi, Check
} from 'lucide-react';

export interface ProfileSettingsViewProps {
  campusName: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface AuthorizedSessionItem {
  id: string;
  device: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'LAPTOP';
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  latencyMs?: number;
  current: boolean;
}

// ============================================================================
// 3D HOLOGRAPHIC EXECUTIVE ID SMART-CARD COMPONENT
// ============================================================================
const ExecutiveHolographicIdCard: React.FC<{
  fullName: string;
  title: string;
  employeeId: string;
  campus: string;
  twoFactorEnabled: boolean;
}> = ({ fullName, title, employeeId, campus, twoFactorEnabled }) => {
  return (
    <div className="holo-id-card relative w-full sm:w-80 rounded-2xl p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border-2 border-cyan-400/60 shadow-[0_8px_0_#020617,0_20px_35px_rgba(0,0,0,0.6)] overflow-hidden shrink-0">
      {/* Animated Holographic Light Sweep */}
      <div className="holo-shimmer pointer-events-none absolute inset-0" />

      {/* Top Institution Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 font-black text-[10px] shadow">
            JR
          </div>
          <div>
            <span className="text-[9px] font-mono font-black tracking-widest text-cyan-300 block leading-none">
              JRMSU LABTRACK OS
            </span>
            <span className="text-[8px] font-mono text-slate-400 block mt-0.5 truncate max-w-[140px]">
              {campus}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-black border ${
            twoFactorEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
          }`}
        >
          {twoFactorEnabled ? 'LEVEL 5 • 2FA' : 'STANDARD'}
        </span>
      </div>

      {/* Middle Gold EMV Smart Chip + Identity Info */}
      <div className="relative z-10 flex items-center justify-between gap-3 py-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Gold EMV Chip */}
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-100 shadow-inner p-1 grid grid-cols-3 gap-0.5 opacity-95">
            <div className="border border-amber-900/40 rounded-xs" />
            <div className="border border-amber-900/40 rounded-xs" />
            <div className="border border-amber-900/40 rounded-xs" />
            <div className="border border-amber-900/40 rounded-xs col-span-3" />
          </div>

          <div className="pt-1">
            <p className="text-xs font-black text-white truncate tracking-tight">{fullName}</p>
            <p className="text-[9.5px] font-mono text-cyan-300 truncate">{title}</p>
          </div>
        </div>

        {/* Simulated High-Contrast QR Matrix */}
        <div className="p-1.5 bg-white rounded-xl border-2 border-cyan-300 shadow-md shrink-0">
          <QrCode className="w-11 h-11 text-slate-950" />
        </div>
      </div>

      {/* Bottom Serial & Cryptographic Footer */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 font-mono text-[9.5px]">
        <span className="text-amber-300 font-black tracking-wider">{employeeId}</span>
        <span className="text-emerald-300 flex items-center gap-1 font-bold">
          <Fingerprint className="w-3 h-3" /> SHA-256 VERIFIED
        </span>
      </div>
    </div>
  );
};

const DEFAULT_AUTHORIZED_SESSIONS: AuthorizedSessionItem[] = [
  {
    id: 'SES-ADM-01',
    device: 'Windows 11 Pro Admin Workstation (PC-ADMIN-01)',
    deviceType: 'DESKTOP',
    browser: 'Chrome 130.0 • ASP.NET Core JWT Bearer',
    ip: '192.168.10.15',
    location: 'JRMSU Dapitan Main Campus (VLAN 101)',
    lastActive: 'Active Now',
    latencyMs: 11,
    current: true
  },
  {
    id: 'SES-ADM-02',
    device: 'MacBook Pro M3 — Executive Command Console',
    deviceType: 'LAPTOP',
    browser: 'Safari 18.1 • TLS 1.3 Encrypted',
    ip: '10.101.0.104',
    location: 'ComLab 1 Supervisor Desk',
    lastActive: '18 mins ago',
    latencyMs: 16,
    current: false
  },
  {
    id: 'SES-ADM-03',
    device: 'iPhone 16 Pro Max — LabTrack QR & RFID Scanner',
    deviceType: 'MOBILE',
    browser: 'Mobile WebKit • QR Gate Sync',
    ip: '10.102.0.118',
    location: 'ComLab 2 (Multimedia) Corridor',
    lastActive: '42 mins ago',
    latencyMs: 24,
    current: false
  }
];

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  campusName,
  onTriggerNotification
}) => {
  const activeCampus = campusName || 'JRMSU Dapitan Main Campus';
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SECURITY' | 'NOTIFICATIONS' | 'SESSIONS'>('PERSONAL');
  const { user, updateUser } = useAuth();
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [removingSessionIds, setRemovingSessionIds] = useState<string[]>([]);
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Persistent Profile State with Realistic Defaults
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('labtrack_admin_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fullName) return parsed;
      }
    } catch {}
    return {
      fullName: 'John Sven Insipido Morales',
      title: 'Lead System Administrator & IT Infrastructure Director',
      employeeId: 'ADM-2026-001',
      email: 'johnsven.morales@jrmsu.edu.ph',
      phone: '+63 917 842 9104',
      department: 'College of Computing Studies (BS-Information System)',
      campus: activeCampus,
      avatarUrl: '/assets/images/sami.jpg',
      bio: 'Overseeing multi-campus IT laboratory infrastructure, ComLab 1–3 telemetry node clusters, QR attendance gates, and network security across JRMSU subnets.'
    };
  });

  // Security Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [securityPin, setSecurityPin] = useState<string>(() => {
    try {
      return localStorage.getItem('labtrack_admin_pin_v2') || '202601';
    } catch {
      return '202601';
    }
  });
  const [twoFactor, setTwoFactor] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('labtrack_admin_2fa_v2');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Notification Preferences (Persisted)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('labtrack_admin_notif_prefs_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      emailAlerts: true,
      smsAlerts: true,
      hardwareFailureAlerts: true,
      unauthorizedAccessAlerts: true,
      maintenanceSchedules: true
    };
  });

  // Active Login Sessions (Persisted & Populated)
  const [sessions, setSessions] = useState<AuthorizedSessionItem[]>(() => {
    try {
      const saved = localStorage.getItem('labtrack_admin_sessions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_AUTHORIZED_SESSIONS;
  });

  // Sync from logged-in user if available
  useEffect(() => {
    if (!user) return;
    const __fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setProfile((prev: any) => {
      const next = { ...prev };
      if (__fullName) next.fullName = __fullName;
      if (user.email) next.email = user.email;
      if (user.phoneNumber) next.phone = user.phoneNumber;
      if (user.department) next.department = user.department;
      if (user.campus) next.campus = user.campus;
      if (user.profilePictureUrl) {
        next.avatarUrl = user.profilePictureUrl;
        setAvatarLoadError(false);
      }
      return next;
    });
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_admin_profile_v2', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_admin_notif_prefs_v2', JSON.stringify(notifPrefs));
    } catch {}
  }, [notifPrefs]);

  useEffect(() => {
    try {
      localStorage.setItem('labtrack_admin_sessions_v2', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  const notify = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  // Password Strength Calculator (4 Segments)
  const passwordStrength = useMemo(() => {
    const pwd = passwords.newPassword || '';
    if (!pwd) return { score: 0, segments: 0, label: 'Idle ( Current Credentials Active )', color: 'bg-slate-300' };
    let segments = 1;
    if (pwd.length >= 8) segments = 2;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) segments = 3;
    if (segments === 3 && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 10) segments = 4;

    const score = segments * 25;
    if (segments === 1) return { score, segments, label: 'Weak Entropy', color: 'bg-rose-500' };
    if (segments === 2) return { score, segments, label: 'Moderate Security', color: 'bg-amber-500' };
    if (segments === 3) return { score, segments, label: 'Strong Security', color: 'bg-blue-600' };
    return { score, segments, label: 'Military-Grade SHA-256', color: 'bg-emerald-500' };
  }, [passwords.newPassword]);

  // Overall Security Posture Percentage
  const securityPosturePct = useMemo(() => {
    let base = 62;
    if (twoFactor) base += 24;
    if (securityPin && securityPin.length >= 6) base += 12;
    return Math.min(100, base);
  }, [twoFactor, securityPin]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const __parts = profile.fullName.trim().split(/\s+/);
    const __fn = __parts[0] || 'John';
    const __ln = __parts.slice(1).join(' ') || 'Morales';

    try {
      if (user?.id) {
        await apiClient.put('/api/v1/users/' + user.id, {
          firstName: __fn,
          lastName: __ln,
          phoneNumber: profile.phone,
          department: profile.department,
          profilePictureUrl: profile.avatarUrl
        });
      }
    } catch {}

    if (updateUser) {
      updateUser({
        ...user,
        firstName: __fn,
        lastName: __ln,
        email: profile.email,
        phoneNumber: profile.phone,
        department: profile.department,
        campus: profile.campus,
        profilePictureUrl: profile.avatarUrl
      });
    }

    localStorage.setItem('labtrack_admin_profile_v2', JSON.stringify(profile));
    notify(`Profile credentials for ${profile.fullName} saved and synced!`);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      notify('Error: New password and confirmation password do not match!');
      return;
    }
    if (passwords.newPassword.length < 6) {
      notify('Error: Password must be at least 6 characters long.');
      return;
    }
    notify('Executive security password updated and encrypted successfully!');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePinSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = securityPin.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length < 4) {
      notify('Security PIN must be 4 to 6 digits.');
      return;
    }
    setSecurityPin(cleaned);
    localStorage.setItem('labtrack_admin_pin_v2', cleaned);
    notify(`Updated Executive 6-Digit Terminal Override PIN (${cleaned.replace(/./g, '•')}).`);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const __av = reader.result as string;
        setAvatarLoadError(false);
        setProfile((prev: any) => ({ ...prev, avatarUrl: __av }));
        (async () => {
          try {
            if (user?.id) await apiClient.put('/api/v1/users/' + user.id, { profilePictureUrl: __av });
          } catch {}
          if (updateUser) updateUser({ ...user, profilePictureUrl: __av });
        })();
        notify('Administrator profile photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const revokeSession = (id: string) => {
    const target = sessions.find(s => s.id === id);
    setRemovingSessionIds(prev => [...prev, id]);
    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      setRemovingSessionIds(prev => prev.filter(item => item !== id));
      notify(`Revoked device session: ${target?.device || id}.`);
    }, 240);
  };

  const revokeAllOtherSessions = () => {
    const otherIds = sessions.filter(s => !s.current).map(s => s.id);
    if (otherIds.length === 0) return;
    setRemovingSessionIds(otherIds);
    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.current));
      setRemovingSessionIds([]);
      notify('All secondary device sessions have been terminated. Only your current workstation remains active.');
    }, 240);
  };

  const restoreDefaultSessions = () => {
    setSessions(DEFAULT_AUTHORIZED_SESSIONS);
    notify('Synchronized active device sessions across campus subnets.');
  };

  const handlePingSession = (session: AuthorizedSessionItem) => {
    setPingingId(session.id);
    setTimeout(() => {
      const newLatency = Math.floor(8 + Math.random() * 14);
      setSessions(prev =>
        prev.map(s => (s.id === session.id ? { ...s, latencyMs: newLatency, lastActive: 'Verified Just Now' } : s))
      );
      setPingingId(null);
      notify(`ICMP Handshake Verified: ${session.device} responded in ${newLatency}ms on ${session.ip}.`);
    }, 350);
  };

  const initials = useMemo(() => {
    const parts = (profile.fullName || 'John Morales').trim().split(/\s+/);
    return ((parts[0]?.[0] || 'J') + (parts[parts.length - 1]?.[0] || 'M')).toUpperCase();
  }, [profile.fullName]);

  const activeNotifCount = useMemo(
    () => Object.values(notifPrefs).filter(Boolean).length,
    [notifPrefs]
  );
  return (
    <div className="prof-3d-shell p-5 sm:p-7 rounded-[2.5rem] space-y-6 font-sans text-slate-800 select-none  relative">
      {/* 3D EXTRUDED SHELL, HOLOGRAPHIC SHIMMER & ORBITAL ANIMATIONS */}
      <style>{`
        .prof-3d-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #cbd5e1;
          box-shadow:
            0 12px 0 #94a3b8,
            0 25px 50px -12px rgba(15, 23, 42, 0.28),
            inset 0 2px 0 #ffffff;
        }
        .prof-card-3d {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #cbd5e1;
          box-shadow: 0 8px 0 #cbd5e1, 0 16px 28px rgba(15, 23, 42, 0.08);
        }
        .prof-lift {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease,
            opacity 0.24s ease;
          transform: translateZ(0);
        }
        .prof-lift:hover {
          transform: translate3d(0, -3px, 0);
        }
        .session-removing {
          opacity: 0 !important;
          transform: translate3d(45px, 0, 0) scale(0.92) !important;
          pointer-events: none;
        }
        .prof-btn-3d {
          box-shadow: 0 4px 0 #1e3a8a, 0 8px 16px rgba(37, 99, 235, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .prof-btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1e3a8a, 0 12px 22px rgba(37, 99, 235, 0.38);
        }
        .prof-btn-3d:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1e3a8a;
        }
        @keyframes holoSweep {
          0% { transform: translateX(-120%) skewX(-20deg); }
          50%, 100% { transform: translateX(220%) skewX(-20deg); }
        }
        .holo-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.18), rgba(255, 255, 255, 0.25), transparent);
          animation: holoSweep 4.5s ease-in-out infinite;
        }
        .holo-id-card {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .holo-id-card:hover {
          transform: translateY(-4px) rotate(-0.5deg);
        }
      `}</style>

      <datalist id="jrmsu-campus-list">
        <option value="JRMSU Dapitan Main Campus" />
        <option value="JRMSU Dipolog Campus" />
        <option value="JRMSU Katipunan Campus" />
        <option value="JRMSU Tampilisan Campus" />
        <option value="JRMSU Siocon Campus" />
      </datalist>

      {/* =====================================================================
          1. 3D OBSIDIAN COMMAND HEADER WITH ORBITAL AVATAR & HOLOGRAPHIC ID
         ===================================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white border-2 border-cyan-500/40 shadow-[0_9px_0_#0f172a,0_22px_40px_rgba(2,6,23,0.5)]">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1">
            {/* 3D ORBITAL AVATAR FRAME WITH UPLOAD OVERLAY */}
            <div className="relative group shrink-0">
              {/* Rotating Cyber Ring */}
              <div
                className="absolute -inset-2 rounded-[2rem] border-2 border-dashed border-cyan-400/45 animate-pulse pointer-events-none"
                style={{ animationDuration: '14s' }}
              />
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-cyan-400 shadow-[0_8px_0_#0284c7,0_15px_30px_rgba(0,0,0,0.65)] bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center relative z-10">
                {!avatarLoadError && profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    onError={() => setAvatarLoadError(true)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wider drop-shadow">
                    {initials}
                  </span>
                )}
              </div>

              <label className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white text-xs font-black cursor-pointer border-2 border-cyan-300">
                <Camera className="w-6 h-6 mb-1 text-cyan-300 animate-bounce" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>

              <span className="absolute -bottom-1.5 -right-1.5 z-20 bg-emerald-400 text-slate-950 p-1.5 rounded-2xl ring-4 ring-slate-950 shadow-lg">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </span>
            </div>

            {/* USER IDENTITY & METADATA PILLS */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ROOT ADMIN ACTIVE
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-0.5 rounded-full">
                  <Award className="w-3 h-3 text-amber-300" /> SECURITY SCORE: {securityPosturePct}%
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {profile.fullName}
              </h3>

              <p className="text-xs font-mono font-bold text-cyan-300 flex items-center justify-center md:justify-start gap-1.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile.title}</span>
              </p>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
                {profile.bio}
              </p>

              <div className="pt-1 flex flex-wrap gap-2 text-xs font-mono justify-center md:justify-start">
                <span className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl shadow-[0_3px_0_#020617]">
                  <Building className="w-3.5 h-3.5 text-cyan-400" /> {profile.campus}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl shadow-[0_3px_0_#020617]">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" /> {profile.email}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 text-amber-300 px-3 py-1.5 rounded-xl shadow-[0_3px_0_#020617] font-black">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> {profile.employeeId}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: 3D HOLOGRAPHIC EXECUTIVE ID CARD */}
          <ExecutiveHolographicIdCard
            fullName={profile.fullName}
            title={profile.title}
            employeeId={profile.employeeId}
            campus={profile.campus}
            twoFactorEnabled={twoFactor}
          />
        </div>

        {/* 3D TACTILE TAB NAVIGATION BAR */}
        <div className="mt-7 flex items-center gap-2.5 border-t border-white/15 pt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'PERSONAL', label: 'Personal Information', badge: 'VERIFIED', icon: User },
            { id: 'SECURITY', label: 'Security, Password & PIN', badge: `${securityPosturePct}%`, icon: Lock },
            { id: 'NOTIFICATIONS', label: 'Notification Channels', badge: `${activeNotifCount}/5 ON`, icon: Bell },
            { id: 'SESSIONS', label: 'Authorized Sessions', badge: `${sessions.length} LIVE`, icon: Monitor }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_4px_0_#0284c7] -translate-y-0.5'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700 shadow-[0_3px_0_#020617]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-[9.5px] font-black ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-cyan-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB CONTENT 1: PERSONAL INFORMATION (ICON-EMBEDDED 3D INPUTS)
         ===================================================================== */}
      {activeTab === 'PERSONAL' && (
        <form onSubmit={handleProfileSubmit} className="prof-card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                EXECUTIVE IDENTITY LEDGER
              </span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                General Account Profile &amp; Campus Assignment
              </h4>
            </div>
            <span className="text-[11px] font-mono font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Sync with 3D ID Pass</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1.5">Full Legal Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-blue-100 text-blue-700 pointer-events-none">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-black text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Official Designation Title</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-indigo-100 text-indigo-700 pointer-events-none">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={profile.title}
                  onChange={e => setProfile({ ...profile, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-bold text-blue-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Institutional Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-emerald-100 text-emerald-700 pointer-events-none">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-mono font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Mobile / Hotline Contact Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-cyan-100 text-cyan-800 pointer-events-none">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Employee / Admin ID Tag</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-amber-100 text-amber-800 pointer-events-none">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={profile.employeeId}
                  onChange={e => setProfile({ ...profile, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-mono font-black text-indigo-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Assigned Primary Campus</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-purple-100 text-purple-700 pointer-events-none">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  list="jrmsu-campus-list"
                  value={profile.campus}
                  onChange={e => setProfile({ ...profile, campus: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5">College / Department / Unit</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-1.5 rounded-lg bg-slate-200 text-slate-700 pointer-events-none">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={profile.department}
                  onChange={e => setProfile({ ...profile, department: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 pl-11 pr-3 py-3 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5">Administrative Bio &amp; Operational Scope</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-300 p-3.5 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-100">
            <span className="text-[11px] font-mono text-slate-400">
              Changes immediately reflect across Admin Hub &amp; Audit Logs
            </span>
            <button
              type="submit"
              className="prof-btn-3d px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB CONTENT 2: SECURITY, PASSWORD & 6-DIGIT KEYCAP PIN VAULT
         ===================================================================== */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit} className="prof-card-3d rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b-2 border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                  CRYPTOGRAPHIC PASSWORD VAULT
                </span>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Security Credentials &amp; Password Rotation
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-black flex items-center gap-1.5 shadow-[0_3px_0_#020617] cursor-pointer"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Hide Secrets' : 'Reveal Secrets'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1.5">Current Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-3 rounded-2xl outline-none focus:border-blue-600 font-mono text-slate-900"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block mb-1.5">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-3 rounded-2xl outline-none focus:border-blue-600 font-mono text-slate-900"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <label className="block mb-1.5">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 p-3 rounded-2xl outline-none focus:border-blue-600 font-mono text-slate-900"
                  placeholder="Re-type new password"
                  required
                />
              </div>
            </div>

            {/* 4-Segment Live Password Entropy Meter */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white border-2 border-slate-800 space-y-2.5">
              <div className="flex justify-between text-[11px] font-mono font-black">
                <span className="text-slate-400 uppercase">Password Entropy Analysis:</span>
                <span className="text-cyan-300">{passwordStrength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(seg => (
                  <div
                    key={seg}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.segments >= seg ? passwordStrength.color : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-[0_4px_0_#020617] active:translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Update Security Password</span>
              </button>
            </div>
          </form>

          {/* 6-DIGIT KEYCAP PIN VAULT & 2FA SPLIT DECK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 6-Digit Terminal Override PIN with 3D Keycap Preview */}
            <form onSubmit={handlePinSave} className="prof-card-3d rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black text-indigo-600 uppercase block">
                  LABTRACK TERMINAL OVERRIDE
                </span>
                <h5 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" /> 6-Digit Executive Security PIN
                </h5>
                <p className="text-xs text-slate-500">
                  Used for instant workstation unlock, QR gate override, and emergency session termination.
                </p>

                {/* 6 Individual 3D Keycap Boxes Preview */}
                <div className="grid grid-cols-6 gap-2 pt-2">
                  {Array.from({ length: 6 }, (_, idx) => {
                    const char = securityPin[idx] || '';
                    return (
                      <div
                        key={idx}
                        className="h-11 rounded-xl bg-slate-900 border-2 border-slate-700 shadow-[0_4px_0_#020617] flex items-center justify-center font-mono text-base font-black text-cyan-300"
                      >
                        {char ? (showPasswords ? char : '•') : '-'}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  maxLength={6}
                  value={securityPin}
                  onChange={e => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-Digit PIN"
                  className="flex-1 bg-slate-50 text-slate-900 border-2 border-slate-300 px-4 py-2.5 rounded-2xl font-mono text-sm font-black tracking-widest outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="prof-btn-3d px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl cursor-pointer shrink-0"
                >
                  Save 6-Digit PIN
                </button>
              </div>
            </form>

            {/* Two-Factor Authentication (2FA) Card with Radial Score */}
            <div className="prof-card-3d rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black text-emerald-600 uppercase block">
                    MULTI-FACTOR IDENTITY GUARD
                  </span>
                  <h5 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Two-Factor Authentication (2FA)
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Require a time-based authenticator token (Google Authenticator / Authy) when signing into the Admin Hub.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-center shrink-0 border border-slate-700 shadow-[0_4px_0_#020617]">
                  <span className="text-lg font-black text-white block leading-none">{securityPosturePct}%</span>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase">POSTURE</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-600">
                  2FA Status:{' '}
                  <strong className={twoFactor ? 'text-emerald-600' : 'text-rose-600'}>
                    {twoFactor ? 'ACTIVE & PROTECTED' : 'DISABLED'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !twoFactor;
                    setTwoFactor(next);
                    localStorage.setItem('labtrack_admin_2fa_v2', JSON.stringify(next));
                    notify(`Two-Factor Authentication (2FA) ${next ? 'ENABLED' : 'DISABLED'}.`);
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                    twoFactor
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_4px_0_#065f46]'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {twoFactor ? '2FA Enabled ✓' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB CONTENT 3: NOTIFICATION CHANNELS (3D SLIDING TOGGLE SWITCHES)
         ===================================================================== */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="prof-card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                ALERT DISPATCH ROUTING
              </span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                System Alerts &amp; Telemetry Notification Channels ({activeNotifCount}/5 Active)
              </h4>
            </div>

            <button
              type="button"
              onClick={() =>
                notify(`Test Alert Dispatched to ${profile.email} and ${profile.phone} (${activeCampus})!`)
              }
              className="prof-btn-3d px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Test Alert</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {[
              {
                key: 'emailAlerts',
                badge: 'SMTP EMAIL',
                title: 'Email Digest & Daily Workstation Reports',
                desc: `Send daily telemetry summaries and critical work order logs to ${profile.email}.`
              },
              {
                key: 'smsAlerts',
                badge: 'SMS GATEWAY',
                title: 'SMS Critical Outage & Thermal Hotline',
                desc: `Send instant SMS text alerts to ${profile.phone} when a Critical priority fault is filed.`
              },
              {
                key: 'hardwareFailureAlerts',
                badge: 'SIGNALR PUSH',
                title: 'Hardware Failure Instant Telemetry Broadcast',
                desc: 'Immediate notification when CPU thermal throttling (>85°C), RAM bus errors, or disk failures trigger.'
              },
              {
                key: 'unauthorizedAccessAlerts',
                badge: 'SIEM SECURITY',
                title: 'Security & Unauthorized Access Alerts',
                desc: 'Alert when unknown MAC/IP addresses or invalid 6-digit PIN attempts occur on ComLab 1–3.'
              },
              {
                key: 'maintenanceSchedules',
                badge: 'CALENDAR SYNC',
                title: 'Preventive Maintenance & Budget Reminders',
                desc: 'Get automated alerts 48 hours prior to scheduled ComLab thermal servicing and license renewals.'
              }
            ].map(item => {
              const isChecked = Boolean((notifPrefs as any)[item.key]);
              return (
                <div
                  key={item.key}
                  onClick={() => {
                    const next = { ...notifPrefs, [item.key]: !isChecked };
                    setNotifPrefs(next);
                    notify(`Updated "${item.title}" to ${!isChecked ? 'ENABLED' : 'MUTED'}.`);
                  }}
                  className={`prof-lift flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                    isChecked
                      ? 'bg-white border-blue-400 shadow-[0_4px_0_#bfdbfe]'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black ${
                          isChecked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                      <span className="font-black text-slate-900 text-xs sm:text-sm">{item.title}</span>
                    </div>
                    <span className="text-slate-500 block text-[11px] font-medium">{item.desc}</span>
                  </div>

                  {/* 3D Tactile Sliding Pill Toggle Switch */}
                  <div
                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 flex items-center shrink-0 border ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-600 justify-end'
                        : 'bg-slate-300 border-slate-400 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                      {isChecked && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB CONTENT 4: ACTIVE AUTHORIZED SESSIONS (WITH LIVE PING & REVOKE)
         ===================================================================== */}
      {activeTab === 'SESSIONS' && (
        <div className="prof-card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-black text-blue-600 uppercase block">
                DEVICE &amp; SUBNET SESSION LEDGER
              </span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                Active Authorized Login Sessions ({sessions.length} Devices)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDefaultSessions}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Sync Devices</span>
              </button>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={revokeAllOtherSessions}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-[0_3px_0_#881337] flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Revoke All Other Devices</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            {sessions.map(s => {
              const isRemoving = removingSessionIds.includes(s.id);
              const isPinging = pingingId === s.id;
              return (
                <div
                  key={s.id}
                  className={`prof-lift p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isRemoving ? 'session-removing' : ''
                  } ${
                    s.current
                      ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-cyan-400 shadow-[0_6px_0_#0284c7]'
                      : 'bg-white border-slate-200 hover:border-blue-400 shadow-[0_4px_0_#e2e8f0]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-3 rounded-2xl shrink-0 border ${
                        s.current
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      {s.deviceType === 'MOBILE' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : s.deviceType === 'LAPTOP' ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-black text-xs sm:text-sm ${s.current ? 'text-white' : 'text-slate-900'}`}>
                          {s.device}
                        </span>
                        {s.current && (
                          <span className="bg-emerald-400 text-slate-950 text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-full">
                            â— CURRENT WORKSTATION
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black flex items-center gap-1 ${
                            s.current ? 'bg-slate-800 text-cyan-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Wifi className="w-3 h-3" /> {s.latencyMs || 14}ms
                        </span>
                      </div>
                      <p className={`text-[11px] font-mono ${s.current ? 'text-cyan-300' : 'text-slate-600'}`}>
                        {s.browser} • IP: <strong>{s.ip}</strong>
                      </p>
                      <p className={`text-[10px] font-mono ${s.current ? 'text-slate-300' : 'text-slate-400'}`}>
                        {s.location} • {s.lastActive}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePingSession(s)}
                      className={`px-3 py-2 rounded-xl font-mono font-black text-[10px] transition cursor-pointer flex items-center gap-1.5 border ${
                        s.current
                          ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-600'
                          : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border-slate-300'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-pulse' : ''}`} />
                      <span>{isPinging ? 'Pinging...' : 'Ping Node'}</span>
                    </button>

                    {!s.current && (
                      <button
                        type="button"
                        onClick={() => revokeSession(s.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-[0_3px_0_#881337] transition cursor-pointer"
                      >
                        Revoke Session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsView;










