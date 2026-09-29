'use client';

import { useStore } from '@/store';
import { users } from '@/data/seed/users';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-black">FolioOS</CardTitle>
          <p className="text-center text-sm text-black/60">Sign in to your demo account</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wider">Admin</h3>
            {admins.map(user => (
              <Button key={user.id} className="w-full justify-start bg-[#1E4133] text-white hover:bg-[#144B3B] hover:bg-[#1E4133] text-white hover:bg-[#144B3B]/90" onClick={() => handleLogin(user.id)}>
                Sign in as {user.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wider">Investment Managers</h3>
            {managers.map(user => (
              <Button key={user.id} variant="outline" className="w-full justify-start" onClick={() => handleLogin(user.id)}>
                Sign in as {user.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wider">Investment Associates</h3>
            {associates.map(user => (
              <Button key={user.id} variant="outline" className="w-full justify-start" onClick={() => handleLogin(user.id)}>
                Sign in as {user.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
