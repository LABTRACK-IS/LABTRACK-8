import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Check, CheckCheck, Trash2, AlertTriangle, Wrench,
  Calendar, ShieldCheck, Sparkles, ExternalLink, RefreshCw, X
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  targetTab?: string;
}

interface YouTubeNotificationBellProps {
  isAdmin: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const YouTubeNotificationBell: React.FC<YouTubeNotificationBellProps> = ({
  isAdmin,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, issuesRes, maintRes] = await Promise.allSettled([
        apiClient.get('/api/v1/notifications?pageNumber=1&pageSize=25'),
        apiClient.get('/api/v1/problem-reports?pageNumber=1&pageSize=8'),
        apiClient.get('/api/v1/maintenance/records'),
      ]);

      const merged: NotificationItem[] = [];

      if (notifRes.status === 'fulfilled') {
        const rawList =
          notifRes.value.data?.data?.items ||
          notifRes.value.data?.data ||
          [];
        if (Array.isArray(rawList)) {
          rawList.forEach((n: any) => {
            merged.push({
              id: String(n.id),
              title: String(n.title || 'System Notification'),
              message: String(n.message || ''),
              type: String(n.type || 'Info'),
              isRead: Boolean(n.isRead),
              createdAt: n.createdAt || n.createdAtUtc || new Date().toISOString(),
              targetTab:
                String(n.title || '').toLowerCase().includes('maintenance')
                  ? isAdmin ? 'maintenance' : 'lab_availability'
                  : isAdmin ? 'notifications' : 'notifications',
            });
          });
        }
      }

      if (issuesRes.status === 'fulfilled') {
        const issueItems =
          issuesRes.value.data?.data?.items ||
          issuesRes.value.data?.data ||
          [];
        if (Array.isArray(issueItems)) {
          issueItems.slice(0, 5).forEach((iss: any) => {
            const exists = merged.some((m) => m.id === `iss-${iss.id}`);
            if (!exists) {
              merged.push({
                id: `iss-${iss.id}`,
                title: `Issue Report: ${iss.workstationNumber || 'Workstation'} (${iss.category || 'Hardware'})`,
                message: `${iss.title || iss.description || 'New hardware issue submitted'} — Reported by ${iss.reportedByName || 'Student'}`,
                type: iss.status === 'Resolved' ? 'Info' : 'Alert',
                isRead: iss.status === 'Resolved',
                createdAt: iss.reportedAt || new Date().toISOString(),
                targetTab: isAdmin ? 'issues' : 'my_requests',
              });
            }
          });
        }
      }

      if (maintRes.status === 'fulfilled') {
        const maintItems = maintRes.value.data?.data || [];
        if (Array.isArray(maintItems)) {
          maintItems.slice(0, 4).forEach((m: any) => {
            merged.push({
              id: `mnt-${m.id}`,
              title: `Maintenance ${m.status}: ${m.lab || 'Workstation'}`,
              message: `${m.title || 'Preventive Maintenance'} (${m.category || 'Hardware'})`,
              type: 'Warning',
              isRead: m.status === 'COMPLETED',
              createdAt: m.createdAtUtc || new Date().toISOString(),
              targetTab: isAdmin ? 'maintenance' : 'lab_availability',
            });
          });
        }
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(merged);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 15000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((i) => !i.isRead).length;
  const displayedItems = filterMode === 'unread' ? items.filter((i) => !i.isRead) : items;

  const handleMarkAsRead = async (item: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x)));
    if (!item.id.startsWith('iss-') && !item.id.startsWith('mnt-')) {
      try {
        await apiClient.patch(`/api/v1/notifications/${item.id}/read`);
      } catch {}
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try {
      await apiClient.post('/api/v1/notifications/read-all');
    } catch {}
  };

  const handleDeleteNotification = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    if (!item.id.startsWith('iss-') && !item.id.startsWith('mnt-')) {
      try {
        await apiClient.delete(`/api/v1/notifications/${item.id}`);
      } catch {}
    }
  };

  const formatTimeAgo = (iso: string) => {
    const diffSec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('alert') || t.includes('error'))
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (t.includes('warn') || t.includes('maint'))
      return <Wrench className="w-4 h-4 text-amber-400" />;
    if (t.includes('sched') || t.includes('reserv'))
      return <Calendar className="w-4 h-4 text-cyan-400" />;
    return <Sparkles className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* YOUTUBE-STYLE BELL BUTTON */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications"
        className="relative p-2.5 text-slate-200 hover:text-white bg-white/5 hover:bg-white/15 rounded-full border border-white/10 transition-all cursor-pointer active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-rose-600 rounded-full border-2 border-slate-950 text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* YOUTUBE-STYLE FLOATING GLASS DROPDOWN */}
      {isOpen && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-13 w-[calc(100vw-1.5rem)] sm:w-[420px] max-h-[80vh] rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-[9999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-[10px] font-bold text-slate-200 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
              <button
                type="button"
                onClick={fetchNotifications}
                title="Refresh"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-pulse text-cyan-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* YouTube Filter Pills: All | Unread */}
          <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1 rounded-full text-xs font-black transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-3.5 py-1 rounded-full text-xs font-black transition cursor-pointer ${
                  filterMode === 'unread'
                    ? 'bg-white text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateTab('notifications');
              }}
              className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Center</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Notification Stream List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[390px]">
            {displayedItems.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No notifications in this view</p>
                <p className="text-[11px] text-slate-500">
                  Real-time alerts for workstation maintenance, QR sessions, and problem reports appear here.
                </p>
              </div>
            ) : (
              displayedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleMarkAsRead(item);
                    setIsOpen(false);
                    if (item.targetTab) onNavigateTab(item.targetTab);
                  }}
                  className={`px-4 py-3.5 flex items-start gap-3.5 hover:bg-slate-900/90 transition cursor-pointer group ${
                    !item.isRead ? 'bg-blue-950/25' : ''
                  }`}
                >
                  {/* Unread Blue Dot (YouTube style) */}
                  <div className="pt-3 shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        !item.isRead ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'bg-transparent'
                      }`}
                    />
                  </div>

                  {/* Category Avatar Icon */}
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!item.isRead ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] font-mono text-cyan-400/90 block mt-1">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item, e)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg hover:bg-blue-600/30 text-cyan-400 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(item, e)}
                      title="Remove notification"
                      className="p-1.5 rounded-lg hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeNotificationBell;


