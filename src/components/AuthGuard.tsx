'use client';

import { useStore } from '@/store';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isPublic = pathname === '/login' || pathname?.startsWith('/founder/');
    if (!currentUser && !isPublic) {
      router.replace('/login');
    }
  }, [currentUser, pathname, router, mounted]);

  if (!mounted) return null; // Avoid hydration mismatch on first render

  return <>{children}</>;
}
