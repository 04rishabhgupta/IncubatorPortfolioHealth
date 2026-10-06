'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { AppNotification } from '@/types';
import {
  Bell,
  Search,
  Plus,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Sparkles,
  X,
  ChevronDown,
  LogOut,
  ExternalLink,
  Building2,
  LayoutDashboard,
  HeartPulse,
  Network,
  Menu,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StartupUploadModal } from '@/components/portfolio/StartupUploadModal';
import { users } from '@/data/seed/users';

export function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    login,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    startups,
    submissions,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING_REVIEW').length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifs =
    notifFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  // Search results
  const searchResults = searchQuery.trim()
    ? startups.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.oneLiner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    setNotifOpen(false);
    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else if (n.startupId) {
      router.push(`/startups/${n.startupId}`);
    }
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'RED_FLAG':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'MENTOR_MATCH':
      case 'MENTOR_RESPONSE':
        return <Users className="h-4 w-4 text-emerald-600" />;
      case 'MENTOR_REQUEST':
        return <Sparkles className="h-4 w-4 text-blue-600" />;
      case 'DATA_REQUEST':
        return <FileText className="h-4 w-4 text-amber-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRoleLabel = () => {
    if (currentUser.role === 'ADMIN') return 'Portfolio Director (Admin)';
    if (currentUser.role === 'INVESTMENT_MANAGER') return 'Portfolio Head';
    return 'Portfolio Manager';
  };

  // Nav Items configured per role
  const navItems = isAdmin
    ? [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Portfolio', href: '/portfolio', icon: Building2 },
        { label: 'Assessments', href: '/assessments', icon: HeartPulse },
        { label: 'Mentor Connect', href: '/mentor-connect', icon: Network },
        { label: 'Users & Roles', href: '/admin/users', icon: Users },
      ]
    : [
        { label: 'Portfolio', href: '/portfolio', icon: Building2 },
        { label: 'Assessments', href: '/assessments', icon: HeartPulse },
        { label: 'Mentor Connect', href: '/mentor-connect', icon: Network },
        {
          label: 'Submissions',
          href: '/submissions',
          icon: FileText,
          badge: pendingSubmissionsCount,
        },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-2xs">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 gap-4 w-full">
          {/* Left: Brand Logo & Folio OS Navigation Links */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            {/* Brand Logo & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href={isAdmin ? '/admin' : '/portfolio'} className="flex items-center gap-2.5 shrink-0">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs tracking-tight shrink-0">
                  FO
                </div>
                <div className="hidden sm:block text-left shrink-0">
                  <span className="font-extrabold text-base text-zinc-900 tracking-tight leading-none block whitespace-nowrap">
                    Folio OS
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium tracking-tight block mt-0.5 whitespace-nowrap">
                    Enterprise Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Folio OS Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Notifications, Add Startup, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick search input (compact, reduced width) */}
            <div ref={searchRef} className="relative hidden md:block w-32 lg:w-36 xl:w-44 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full pl-8 pr-10 py-1.5 text-xs bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-zinc-400"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-4 select-none items-center gap-0.5 rounded border border-zinc-300 bg-white px-1 font-mono text-[9px] font-semibold text-zinc-500 sm:flex">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Search dropdown results */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute top-full mt-1.5 left-0 w-80 bg-white rounded-xl shadow-xl border border-[#E4E4E7] py-2 z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Startups ({searchResults.length})
                  </div>
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        router.push(`/startups/${s.id}`);
                        setSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="px-3 py-2 hover:bg-[#F4F4F5] cursor-pointer flex items-center justify-between border-b last:border-0 border-gray-100 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-gray-900 truncate">{s.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{s.oneLiner}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[9px] text-gray-600 bg-gray-50">
                          {s.sector}
                        </Badge>
                        <Badge
                          className={`text-[9px] ${
                            s.investibility?.grade === 'A+' || s.investibility?.grade === 'A'
                              ? 'bg-green-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {s.investibility ? `Grade ${s.investibility.grade}` : `TRL ${s.trl}`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Startup button */}
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 text-xs font-semibold h-8 px-3 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Startup</span>
            </Button>

            {/* Notification Center */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-[#F4F4F5] border border-[#E4E4E7] transition-colors focus:outline-none"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E4E4E7] py-0 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="px-4 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div className="flex border-b border-gray-100 px-3 pt-2 gap-4 text-xs font-medium text-gray-500">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`pb-2 border-b-2 transition-colors ${
                        notifFilter === 'all'
                          ? 'border-blue-600 text-blue-600 font-bold'
                          : 'border-transparent hover:text-gray-900'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      className={`pb-2 border-b-2 transition-colors ${
                        notifFilter === 'unread'
                          ? 'border-blue-600 text-blue-600 font-bold'
                          : 'border-transparent hover:text-gray-900'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {filteredNotifs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No {notifFilter === 'unread' ? 'unread' : ''} notifications
                      </div>
                    ) : (
                      filteredNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 hover:bg-[#F4F4F5] cursor-pointer transition-colors flex items-start gap-3 ${
                            !n.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="mt-0.5 p-1 rounded-full bg-white border border-gray-200 shadow-xs shrink-0">
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-semibold ${
                                  !n.read ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                              <span>
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {n.actionUrl && (
                                <span className="text-blue-600 font-medium flex items-center gap-0.5 hover:underline">
                                  View <ExternalLink className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors focus:outline-none shrink-0"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                  {currentUser.label.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-900 truncate max-w-[120px]">
                    {currentUser.label}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">{getRoleLabel()}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E4E4E7] py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{currentUser.label}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    <Badge variant="outline" className="mt-1.5 text-[10px] border-blue-600 text-blue-600 bg-blue-50">
                      {currentUser.role.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Role Switcher for Seamless Admin / Manager / Associate testing */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Switch Role (Demo Mode)
                    </span>
                    <div className="space-y-1">
                      {users.slice(0, 3).map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            login(u);
                            setUserMenuOpen(false);
                            if (u.role === 'ADMIN') router.push('/admin');
                            else router.push('/portfolio');
                          }}
                          className={`w-full text-left text-xs px-2 py-1 rounded-md flex items-center justify-between transition-colors ${
                            currentUser.id === u.id
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="truncate">{u.label}</span>
                          {currentUser.id === u.id && <UserCheck className="h-3 w-3 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/portfolio"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#F4F4F5]"
                    >
                      <Building2 className="h-3.5 w-3.5 text-gray-500" />
                      Portfolio Overview
                    </Link>
                    <Link
                      href="/mentor-connect"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#F4F4F5]"
                    >
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                      Mentor Connect
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        router.push('/login');
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                      Switch Account / Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E4E4E7] bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="bg-red-600 text-white text-[10px]">{item.badge}</Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Startup Upload & Ingestion Modal */}
      {uploadModalOpen && (
        <StartupUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          defaultManagerId={currentUser.role === 'INVESTMENT_MANAGER' ? currentUser.id : undefined}
          defaultAssociateId={currentUser.role === 'INVESTMENT_ASSOCIATE' ? currentUser.id : undefined}
        />
      )}
    </>
  );
}
