'use client';

import { useStore } from '@/store';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();

  if (!currentUser) return null; // handled by AuthGuard

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-zinc-900 antialiased">
      <TopNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>
      <footer className="py-4 border-t border-[#E4E4E7] bg-white text-center text-xs text-zinc-400">
        FolioOS Incubator Portfolio Health System • Enterprise Edition
      </footer>
    </div>
  );
}
