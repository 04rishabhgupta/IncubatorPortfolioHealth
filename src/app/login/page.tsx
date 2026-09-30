'use client';

import { useStore } from '@/store';
import { users } from '@/data/seed/users';
import { useRouter } from 'next/navigation';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Users, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();

  const handleLogin = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      login(user);
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/portfolio');
      }
    }
  };

  const admins = users.filter(u => u.role === 'ADMIN');
  const managers = users.filter(u => u.role === 'INVESTMENT_MANAGER');
  const associates = users.filter(u => u.role === 'INVESTMENT_ASSOCIATE');

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/60 blur-3xl opacity-50 -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 blur-3xl opacity-40 -z-10" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left side: Branding */}
        <div className="space-y-6 md:pr-12 text-center md:text-left">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md mb-2">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tight leading-tight">
            Folio <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">OS</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 font-medium">
            The intelligent portfolio management system for modern startup incubators.
          </p>
          <div className="pt-6 space-y-3.5 hidden md:block">
            <div className="flex items-center gap-3 text-zinc-700 font-medium text-sm">
              <ShieldAlert className="w-5 h-5 text-blue-600" /> AI-powered risk assessment & red flag detection
            </div>
            <div className="flex items-center gap-3 text-zinc-700 font-medium text-sm">
              <Users className="w-5 h-5 text-purple-600" /> Seamless founder & mentor network connection
            </div>
          </div>
        </div>

        {/* Right side: Login Card */}
        <Card className="w-full shadow-2xl border border-[#E4E4E7] bg-white/90 backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-6 pt-8">
            <CardTitle className="text-3xl text-center text-zinc-900 font-extrabold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-center text-sm text-zinc-500 font-medium">
              Select your demo persona to explore Folio OS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Admin / Director</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {admins.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-3 text-sm font-semibold" onClick={() => handleLogin(user.id)}>
                    Sign in as {user.label}
                  </ShinyButton>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Investment Managers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {managers.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-2.5 text-xs font-semibold" onClick={() => handleLogin(user.id)}>
                    {user.label}
                  </ShinyButton>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Investment Associates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {associates.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-2.5 text-xs font-semibold" onClick={() => handleLogin(user.id)}>
                    {user.label}
                  </ShinyButton>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
