'use client';

import { useStore } from '@/store';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, HeartPulse, Network, FileText, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, submissions } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null; // handled by AuthGuard

  const isAdmin = currentUser.role === 'ADMIN';

  // Submissions badge logic
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'PENDING_REVIEW').length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [];
  if (isAdmin) {
    navItems.push(
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'All startups', href: '/portfolio', icon: Users },
      { label: 'Health assessments', href: '/assessments', icon: HeartPulse },
      { label: 'Mentor Connect', href: '/mentor-connect', icon: Network },
      { label: 'Users & assignments', href: '/admin/users', icon: Users },
      { label: 'Settings', href: '/settings', icon: Settings }
    );
  } else {
    navItems.push(
      { label: 'Portfolio', href: '/portfolio', icon: LayoutDashboard },
      { label: 'Health assessments', href: '/assessments', icon: HeartPulse },
      { label: 'Mentor Connect', href: '/mentor-connect', icon: Network },
      { label: 'Founder submissions', href: '/submissions', icon: FileText, badge: pendingSubmissionsCount }
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F6F9]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1E4133] text-white">
        <span className="font-semibold text-lg">FolioOS</span>
        <Button variant="ghost" className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-[#1E4133] text-white flex-shrink-0 flex flex-col`}> 
        <div className="p-4 hidden md:block">
          <h1 className="text-2xl font-bold text-white">FolioOS</h1>
        </div>
        
        <div className="px-4 py-2 border-b border-white/20 mb-4">
          <div className="text-xs text-white/70 uppercase">Signed in as</div>
          <div className="font-medium truncate">{currentUser.label}</div>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                  <item.icon className="mr-3 h-5 w-5 opacity-75" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs py-0.5 px-2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5 opacity-75" />
            Switch account
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
