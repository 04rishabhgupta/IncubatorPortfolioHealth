import { User } from '@/types';

export const users: User[] = [
  { id: 'admin', email: 'admin@fitt.demo', role: 'ADMIN', label: 'Admin' },
  { id: 'im1', email: 'im1@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Investment Manager 1' },
  { id: 'im2', email: 'im2@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Investment Manager 2' },
  { id: 'im3', email: 'im3@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'Investment Manager 3' },
  { id: 'ia1', email: 'ia1@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 1', managerId: 'im1' },
  { id: 'ia2', email: 'ia2@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 2', managerId: 'im1' },
  { id: 'ia3', email: 'ia3@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 3', managerId: 'im2' },
  { id: 'ia4', email: 'ia4@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 4', managerId: 'im2' },
  { id: 'ia5', email: 'ia5@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 5', managerId: 'im3' },
  { id: 'ia6', email: 'ia6@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'Investment Associate 6', managerId: 'im3' },
];
