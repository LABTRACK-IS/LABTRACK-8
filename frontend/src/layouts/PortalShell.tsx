import { YouTubeNotificationBell } from '@/components/YouTubeNotificationBell';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard, Wrench, QrCode, Calendar, ShieldCheck, LogOut,
  Menu, Bell, Tv, DollarSign, Settings, ChevronDown,
  Building, Layers, AlertTriangle, ArrowRightLeft, Users,
  Sparkles, History, Download, Clock
} from 'lucide-react';

import AdminDashboardView from '@/pages/admin/AdminDashboardView';
import { InstructorDashboardView } from '@/pages/instructor/InstructorDashboardView';

interface PortalShellProps {
  userRole?: 'ADMIN_TECHNICIAN' | 'INSTRUCTOR';
  userName?: string;
  campusName?: string;
  onLogout?: () => void;
}

interface HubGroup {
  id: string;
  label: string;
  badge?: string;
  icon: any;
  defaultTab: string;
  subTabs: Array<{ id: string; label: string; icon: any }>;
}

export const PortalShell: React.FC<PortalShellProps> = ({
  userRole = 'ADMIN_TECHNICIAN',
  onLogout = () => console.log('Logout executed')
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const isFirstTabRenderRef = useRef(true);
  useLayoutEffect(() => {
    if (isFirstTabRenderRef.current) {
      isFirstTabRenderRef.current = false;
      return;
    }
    (window as any).__ltTriggerPortalSkeleton?.(1250);
  }, [activeTab]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { user } = useAuth();
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Admin'
    : 'Admin';
  const profilePictureUrl = user?.profilePictureUrl;
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const userCampus = 'Dapitan Main Campus';
  const isAdmin = userRole === 'ADMIN_TECHNICIAN';

  // CONSOLIDATED 7 CLEAN 3D ADMIN HUBS (Easy on the eyes, zero clutter, 100% features preserved)
  const adminHubGroups: HubGroup[] = [
    {
      id: 'hub_overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      defaultTab: 'overview',
      subTabs: [{ id: 'overview', label: 'Live Command Overview', icon: LayoutDashboard }],
    },
    {
      id: 'hub_topology',
      label: 'Campuses & Lab Topology',
      badge: 'Graph',
      icon: Building,
      defaultTab: 'campuses_labs',
      subTabs: [{ id: 'campuses_labs', label: 'Core Gateway & PC Topology', icon: Building }],
    },
    {
      id: 'hub_assets_maint',
      label: 'Workstations & Maintenance',
      badge: '4-in-1',
      icon: Tv,
      defaultTab: 'maintenance',
      subTabs: [
        { id: 'maintenance', label: 'Preventive Maintenance', icon: Wrench },
        { id: 'inventory_transfers', label: 'Inventory & Transfers', icon: ArrowRightLeft },
        { id: 'qr_management', label: 'QR Code Studio', icon: QrCode },
      ],
    },
    {
      id: 'hub_operations',
      label: 'Service Desk & Sessions',
      badge: 'Live',
      icon: AlertTriangle,
      defaultTab: 'issues',
      subTabs: [
        { id: 'issues', label: 'Issues & Student Photo Reports', icon: AlertTriangle },
        { id: 'users', label: 'Users & Role Access', icon: Users },
      ],
    },
    {
      id: 'hub_reports_audits',
      label: 'Analytics, Finance & Audits',
      icon: Download,
      defaultTab: 'analytics',
      subTabs: [
        { id: 'analytics', label: 'Usage Analytics', icon: Download },
        { id: 'audit_logs', label: 'Security Audit Logs', icon: History },
      ],
    },
    {
      id: 'hub_ai',
      label: 'LabTrack AI Assistant',
      badge: 'AI',
      icon: Sparkles,
      defaultTab: 'ai_assistant',
      subTabs: [{ id: 'ai_assistant', label: 'AI Diagnostic & Media Core', icon: Sparkles }],
    },
    {
      id: 'hub_settings',
      label: 'Alerts & Account Settings',
      icon: Settings,
      defaultTab: 'profile',
      subTabs: [
        { id: 'profile', label: 'Profile & Security', icon: Settings },
        { id: 'notifications', label: 'Notifications Center', icon: Bell },
      ],
    },
  ];

  // CONSOLIDATED 6 CLEAN INSTRUCTOR HUBS
  const instructorHubGroups: HubGroup[] = [
    {
      id: 'inst_overview',
      label: 'Faculty Overview',
      icon: LayoutDashboard,
      defaultTab: 'overview',
      subTabs: [{ id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard }],
    },
    {
      id: 'inst_labs',
      label: 'Labs & Room Schedule',
      badge: '2-in-1',
      icon: Calendar,
      defaultTab: 'reservations',
      subTabs: [
        { id: 'reservations', label: 'Reservations & Calendar', icon: Calendar },
        { id: 'lab_availability', label: 'Live Lab Availability', icon: Tv },
      ],
    },
    {
      id: 'inst_sessions',
      label: 'Student PC Sessions',
      badge: 'Live',
      icon: Users,
      defaultTab: 'student_sessions',
      subTabs: [{ id: 'student_sessions', label: 'Active Student Workstations', icon: Users }],
    },
    {
      id: 'inst_service',
      label: 'Problem Reports & Requests',
      icon: AlertTriangle,
      defaultTab: 'report_problem',
      subTabs: [
        { id: 'report_problem', label: 'Report a Lab Problem', icon: AlertTriangle },
        { id: 'my_requests', label: 'My Submitted Requests', icon: Clock },
      ],
    },
    {
      id: 'inst_ai_analytics',
      label: 'AI Assistant & Analytics',
      badge: 'AI',
      icon: Sparkles,
      defaultTab: 'ai_assistant',
      subTabs: [
        { id: 'ai_assistant', label: 'Faculty AI Assistant', icon: Sparkles },
        { id: 'usage_analytics', label: 'Class Usage Analytics', icon: Download },
      ],
    },
    {
      id: 'inst_settings',
      label: 'Alerts & Profile',
      icon: Settings,
      defaultTab: 'profile',
      subTabs: [
        { id: 'profile', label: 'Profile & Security', icon: Settings },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ],
    },
  ];

  const currentHubs = isAdmin ? adminHubGroups : instructorHubGroups;
  const activeHub =
    currentHubs.find((h) => h.subTabs.some((s) => s.id === activeTab)) || currentHubs[0];

  const { unreadCount } = useNotificationPolling(30000);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 relative">
      {/* CRYSTAL-CLEAR HIGH-RES LABORATORY BACKGROUND WITH BALANCED 3D GLASS OVERLAY */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 brightness-110 contrast-110 saturate-110 transition-transform duration-1000"
        style={{ backgroundImage: "url('/assets/images/sami.jpg')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950/35 via-slate-900/25 to-blue-950/40" />

      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* 3D GLASSMORPHIC SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-50 transition-all duration-300 flex flex-col bg-slate-950/85 backdrop-blur-2xl border-r border-white/15 text-slate-200 shadow-[10px_0_40px_rgba(0,0,0,0.5)] ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 h-16 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-tight">
              {isAdmin ? 'ADMIN COMMAND' : 'FACULTY PORTAL'} <br />
              <span className="text-cyan-400">JRMSU LABTRACK</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {currentHubs.map((hub) => {
            const IconComponent = hub.icon;
            const isHubActive = activeHub.id === hub.id;
            return (
              <div key={hub.id} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab(hub.defaultTab);
                    if (hub.subTabs.length === 1) setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2 transition-all duration-300 cursor-pointer ${
                    isHubActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_8px_25px_rgba(37,99,235,0.45)] -translate-y-0.5 border border-white/25'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <IconComponent className={`w-4 h-4 shrink-0 ${isHubActive ? 'text-white' : 'text-cyan-400'}`} />
                    <span className="truncate">{hub.label}</span>
                  </div>
                  {hub.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 ${
                        isHubActive ? 'bg-slate-950/40 text-cyan-200' : 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {hub.badge}
                    </span>
                  )}
                </button>

                {/* Inline compact sub-links when hub has multiple views */}
                {isHubActive && hub.subTabs.length > 1 && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-cyan-500/40 ml-4 animate-in slide-in-from-top-2 duration-200">
                    {hub.subTabs.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(sub.id);
                            setIsMobileDrawerOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                            isSubActive
                              ? 'bg-white/15 text-cyan-300 border border-cyan-400/30 shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/10 bg-slate-950/60">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900/90 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 block font-bold">
                Campus Node
              </span>
              <span className="text-xs font-black text-white">{userCampus}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full w-full lg:pl-64 relative z-10">
        {/* 3D GLASS TOPBAR */}
        <header className="h-16 flex-shrink-0 bg-slate-950/75 backdrop-blur-2xl border-b border-white/15 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-lg z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl border border-white/15"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-black">
                {activeHub.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <YouTubeNotificationBell isAdmin={isAdmin} onNavigateTab={(t: string) => setActiveTab(t)} />

            <div
              className="flex items-center gap-3 border-l border-white/15 pl-4 cursor-pointer hover:opacity-90 transition"
              onClick={() => setActiveTab('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-black text-xs shadow-md overflow-hidden ring-2 ring-cyan-400/40">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitials || (isAdmin ? 'AD' : 'IN')}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left justify-center">
                <p className="text-sm font-black text-white leading-tight">{displayName}</p>
                <p className="text-[10px] text-cyan-300 font-bold">{isAdmin ? 'Administrator' : 'Instructor'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-300 hidden sm:block" />
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition ml-1 active:scale-95 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* TOP 3D SUB-NAVIGATION SWITCHER PILLS (When active hub has grouped modules like Assets + Maintenance + QR) */}
        {activeHub.subTabs.length > 1 && (
          <div className="px-3 sm:px-6 lg:px-8 pt-4 z-30">
            <div className="p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-white/15 shadow-xl inline-flex flex-wrap items-center gap-1.5">
              {activeHub.subTabs.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                      isSubActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.5)] scale-[1.02]'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="w-full">
            {isAdmin ? (
              <AdminDashboardView
                campusName={userCampus}
                activeTab={activeTab}
                onTabChange={(tab: string) => setActiveTab(tab)}
              />
            ) : (
              <InstructorDashboardView
                instructorName={displayName}
                selectedCampus={userCampus}
                activeTab={activeTab}
                onTabChange={(tab: string) => setActiveTab(tab)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalShell;


