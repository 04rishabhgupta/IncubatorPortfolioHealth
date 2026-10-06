import { User } from '@/types';

export const users: User[] = [
  { id: 'admin', email: 'admin@fitt.demo', role: 'ADMIN', label: 'Admin' },
  { id: 'im1', email: 'im1@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Portfolio Head 1' },
  { id: 'im2', email: 'im2@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Portfolio Head 2' },
  { id: 'im3', email: 'im3@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Portfolio Head 3' },
  { id: 'ia1', email: 'ia1@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 1', managerId: 'im1' },
  { id: 'ia2', email: 'ia2@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 2', managerId: 'im1' },
  { id: 'ia3', email: 'ia3@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 3', managerId: 'im2' },
  { id: 'ia4', email: 'ia4@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 4', managerId: 'im2' },
  { id: 'ia5', email: 'ia5@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 5', managerId: 'im3' },
  { id: 'ia6', email: 'ia6@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Portfolio Manager 6', managerId: 'im3' },
];

// Demo-only passwords, one per role. Never ship real credentials in client code.
export const demoPasswords: Record<User['role'], string> = {
  ADMIN: 'admin123',
  INVESTMENT_MANAGER: 'manager123',
  INVESTMENT_ASSOCIATE: 'associate123',
};

/** Matches a user by email or user ID (case-insensitive) and checks the demo password. */
export function authenticate(identifier: string, password: string): User | null {
  const id = identifier.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === id || u.id.toLowerCase() === id);
  if (!user || demoPasswords[user.role] !== password) return null;
  return user;
}
