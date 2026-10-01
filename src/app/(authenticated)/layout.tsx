'use client';

import { useStore } from '@/store';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { users } from '@/data/seed/users';
import { useEffect } from 'react';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, login } = useStore();

  useEffect(() => {
    if (!currentUser && users.length > 0) {
      login(users[0]);
    }
  }, [currentUser, login]);

  const activeUser = currentUser || users[0];
  if (!activeUser) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-zinc-900 antialiased">
      <TopNavbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-8">
        {children}
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 xl:px-10 border-t border-[#E4E4E7] bg-white text-center text-xs text-zinc-400">
        FolioOS Incubator Portfolio Health System • Enterprise Edition
      </footer>
    </div>
  );
}
