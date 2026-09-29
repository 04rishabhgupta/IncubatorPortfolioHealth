import { redirect } from 'next/navigation';

export default function Home() {
  // Relying on the client-side AuthGuard to redirect unauthenticated users to /login.
  // We can just redirect to /portfolio by default here, and if they are not logged in, AuthGuard intercepts.
  // Wait, AuthGuard works on layout. So layout renders Home, Home redirects to /portfolio, layout intercepts and pushes to /login.
  redirect('/portfolio');
}
