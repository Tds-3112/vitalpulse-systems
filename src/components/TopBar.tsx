import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, LogOut, X, AlertTriangle, Droplets, HeartHandshake, Users, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/src/lib/utils';

// ========================
// Types
// ========================
interface TopBarProps {
  title?: string;
  onNavigate?: (tab: string) => void;
  allowedTabs?: string[];
}

interface SearchResult {
  id: string;
  type: 'donor' | 'inventory' | 'request' | 'donation' | 'setting';
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tab: string;
}

interface Notification {
  id: string;
  type: 'emergency' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ========================
// Static search catalog — items the search bar can navigate to
// ========================
const SEARCH_CATALOG: SearchResult[] = [
  { id: 's-dashboard', type: 'setting', label: 'Dashboard', sublabel: 'View live analytics telemetry', icon: <Package className="w-4 h-4 text-secondary" />, tab: 'dashboard' },
  { id: 's-inventory', type: 'inventory', label: 'Inventory Matrix', sublabel: 'Blood stock levels and capacity', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-donors', type: 'donor', label: 'Donor Registry', sublabel: 'Manage registered blood donors', icon: <Users className="w-4 h-4 text-secondary" />, tab: 'donors' },
  { id: 's-requests', type: 'request', label: 'Operational Queue', sublabel: 'Hospital requisition requests', icon: <AlertTriangle className="w-4 h-4 text-primary" />, tab: 'requests' },
  { id: 's-donations', type: 'donation', label: 'Donation Lifecycle', sublabel: 'Track blood donations end-to-end', icon: <HeartHandshake className="w-4 h-4 text-tertiary" />, tab: 'donations' },
  { id: 's-settings', type: 'setting', label: 'System Configuration', sublabel: 'Security, notifications, data backup', icon: <Package className="w-4 h-4 text-slate-500" />, tab: 'settings' },
  // Blood group shortcuts
  { id: 's-apos', type: 'inventory', label: 'A+ Blood Group', sublabel: 'View A+ inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-aneg', type: 'inventory', label: 'A- Blood Group', sublabel: 'View A- inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-bpos', type: 'inventory', label: 'B+ Blood Group', sublabel: 'View B+ inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-bneg', type: 'inventory', label: 'B- Blood Group', sublabel: 'View B- inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-opos', type: 'inventory', label: 'O+ Blood Group', sublabel: 'View O+ inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-oneg', type: 'inventory', label: 'O- Blood Group', sublabel: 'View O- universal donor stock', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-abpos', type: 'inventory', label: 'AB+ Blood Group', sublabel: 'View AB+ inventory status', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  { id: 's-abneg', type: 'inventory', label: 'AB- Blood Group', sublabel: 'View AB- rare blood stock', icon: <Droplets className="w-4 h-4 text-primary" />, tab: 'inventory' },
  // Feature shortcuts
  { id: 's-emergency', type: 'request', label: 'Emergency Requests', sublabel: 'View active emergency requisitions', icon: <AlertTriangle className="w-4 h-4 text-error" />, tab: 'requests' },
  { id: 's-new-donation', type: 'donation', label: 'Record New Donation', sublabel: 'Log a new blood intake', icon: <HeartHandshake className="w-4 h-4 text-tertiary" />, tab: 'donations' },
  { id: 's-security', type: 'setting', label: 'Security Settings', sublabel: '2FA, session timeout, RBAC', icon: <Package className="w-4 h-4 text-slate-500" />, tab: 'settings' },
  { id: 's-notifications-cfg', type: 'setting', label: 'Notification Settings', sublabel: 'Configure alert rules', icon: <Bell className="w-4 h-4 text-slate-500" />, tab: 'settings' },
];

// ========================
// Generate live notifications from system state
// ========================
const generateNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: 'n-1',
      type: 'emergency',
      title: 'Emergency Protocol Active',
      message: 'Review pending emergency requests in the Operations queue.',
      time: formatTimeAgo(new Date(now.getTime() - 5 * 60000)),
      read: false,
    },
    {
      id: 'n-2',
      type: 'critical',
      title: 'Critical Stock Warning',
      message: 'One or more blood groups have dropped below the 10% safety threshold.',
      time: formatTimeAgo(new Date(now.getTime() - 22 * 60000)),
      read: false,
    },
    {
      id: 'n-3',
      type: 'success',
      title: 'Donation Completed',
      message: 'A new blood donation has been processed and added to inventory.',
      time: formatTimeAgo(new Date(now.getTime() - 45 * 60000)),
      read: true,
    },
    {
      id: 'n-4',
      type: 'info',
      title: 'System Backup Successful',
      message: 'Automated daily backup ran without errors.',
      time: formatTimeAgo(new Date(now.getTime() - 2 * 3600000)),
      read: true,
    },
    {
      id: 'n-5',
      type: 'info',
      title: 'New Donor Registered',
      message: 'A new donor has self-registered on the platform.',
      time: formatTimeAgo(new Date(now.getTime() - 5 * 3600000)),
      read: true,
    },
  ];
};

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ========================
// TopBar Component
// ========================
const TopBar: React.FC<TopBarProps> = ({ title = "VitalPulse Systems", onNavigate, allowedTabs }) => {
  const { user, logout } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(generateNotifications);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ---- Search Logic ----
  const filteredCatalog = allowedTabs 
    ? SEARCH_CATALOG.filter(item => allowedTabs.includes(item.tab))
    : SEARCH_CATALOG;

  const searchResults: SearchResult[] = searchQuery.trim().length > 0
    ? filteredCatalog.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sublabel.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSearchSelect = useCallback((result: SearchResult) => {
    onNavigate?.(result.tab);
    setSearchQuery('');
    setSearchFocused(false);
    inputRef.current?.blur();
  }, [onNavigate]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSearchSelect(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ---- Notification Logic ----
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ---- Helpers ----
  const getRoleBadge = () => {
    if (!user) return null;
    const colors: Record<string, string> = {
      admin: 'bg-primary/10 text-primary',
      donor: 'bg-tertiary/10 text-tertiary',
      hospital: 'bg-secondary/10 text-secondary',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${colors[user.role] || ''}`}>
        {user.role}
      </span>
    );
  };

  const getInitials = () => {
    if (!user) return '??';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'critical': return <Droplets className="w-4 h-4 text-primary" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-tertiary" />;
      default: return <Clock className="w-4 h-4 text-secondary" />;
    }
  };

  const getNotifBorder = (type: Notification['type']) => {
    switch (type) {
      case 'emergency': return 'border-l-error';
      case 'critical': return 'border-l-primary';
      case 'success': return 'border-l-tertiary';
      default: return 'border-l-secondary';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center w-full px-4 sm:px-6 md:px-8 h-16 bg-surface/80 backdrop-blur-md gap-3 md:gap-6 border-b border-surface-container-high/30">
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-lg md:text-xl font-extrabold tracking-tight text-primary font-headline hidden md:block whitespace-nowrap">{title}</span>
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="flex-1 max-w-xl" ref={searchRef}>
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-secondary transition-colors z-10" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search records, donors, blood groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-10 py-2 bg-surface-container-low border-none rounded-xl text-sm w-full focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-surface-container-high/40 overflow-hidden z-50 animate-[slideDown_150ms_ease]">
              {searchResults.length > 0 ? (
                <div className="py-1 max-h-80 overflow-y-auto">
                  <p className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
                  </p>
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        selectedIndex === index ? "bg-secondary/5" : "hover:bg-surface-container-low"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{result.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{result.sublabel}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{result.type}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">No results found</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching for "donors", "inventory", or a blood group</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">

        {/* ===== NOTIFICATION BELL ===== */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-2 rounded-lg transition-colors group shrink-0",
              showNotifications ? "bg-surface-container-low text-secondary" : "text-slate-600 hover:bg-surface-container-low"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full ring-2 ring-surface flex items-center justify-center animate-pulse">
                <span className="text-[8px] font-black text-white leading-none">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-surface-container-high/40 overflow-hidden z-50 animate-[slideDown_150ms_ease]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high/30">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{unreadCount} unread alert{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-secondary uppercase tracking-wider hover:text-secondary/80 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "flex items-start gap-3 px-5 py-3.5 border-l-[3px] cursor-pointer transition-all group/item hover:bg-surface-container-low/50",
                        getNotifBorder(notif.type),
                        !notif.read ? "bg-secondary/[0.03]" : ""
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-xs font-bold text-on-surface truncate", !notif.read && "font-extrabold")}>{notif.title}</p>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">{notif.time}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded transition-all shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-surface-container-high/30 bg-surface-container-low/30">
                  <button
                    onClick={() => { onNavigate?.('settings'); setShowNotifications(false); }}
                    className="text-[10px] font-bold text-secondary uppercase tracking-wider hover:text-secondary/80 transition-colors"
                  >
                    Notification Settings →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== USER PROFILE ===== */}
        <div className="flex items-center gap-2 md:gap-3 pl-2 sm:pl-4 md:pl-6 border-l border-surface-container-high/50 shrink-0">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-on-surface">{user?.name || 'User'}</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              {getRoleBadge()}
            </div>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs md:text-sm shadow-sm ring-2 ring-surface-container-high shrink-0 cursor-default">
            {getInitials()}
          </div>
          <button
            onClick={logout}
            className="p-1.5 md:p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dropdown animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default TopBar;
