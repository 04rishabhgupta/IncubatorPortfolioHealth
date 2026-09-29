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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E3E7E0] blur-3xl opacity-50 -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BBC3BE] blur-3xl opacity-30 -z-10" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left side: Branding */}
        <div className="space-y-6 md:pr-12 text-center md:text-left">
          <div className="inline-flex items-center justify-center p-3 bg-[#1E4133] rounded-xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-black tracking-tight leading-tight">
            Folio<span className="text-[#1E4133]">OS</span>
          </h1>
          <p className="text-xl text-black/60 font-medium">
            The intelligent portfolio management system for modern startup incubators.
          </p>
          <div className="pt-8 space-y-4 hidden md:block">
            <div className="flex items-center gap-3 text-black/80 font-medium">
              <ShieldAlert className="w-5 h-5 text-[#144B3B]" /> AI-powered risk assessment
            </div>
            <div className="flex items-center gap-3 text-black/80 font-medium">
              <Users className="w-5 h-5 text-[#144B3B]" /> Seamless founder \u0026 mentor connection
            </div>
          </div>
        </div>

        {/* Right side: Login Card */}
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="text-3xl text-center text-black font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-base text-black/60 font-medium">
              Select your demo persona to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-10">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#1E4133] uppercase tracking-wider text-center">Admin / Director</h3>
              <div className="grid grid-cols-1 gap-3">
                {admins.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-4" onClick={() => handleLogin(user.id)}>
                    Sign in as {user.label}
                  </ShinyButton>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#1E4133] uppercase tracking-wider text-center">Investment Managers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {managers.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-3 text-sm" onClick={() => handleLogin(user.id)}>
                    {user.label}
                  </ShinyButton>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#1E4133] uppercase tracking-wider text-center">Investment Associates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {associates.map(user => (
                  <ShinyButton key={user.id} className="w-full flex justify-center py-3 text-sm" onClick={() => handleLogin(user.id)}>
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
