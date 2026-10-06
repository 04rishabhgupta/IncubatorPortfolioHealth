import { AppNotification } from '@/types';

export const seedNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Mentor Match Proposed',
    message: 'Dr. Arun Sharma (Textile Chemical Processing) has been matched for Indigotex Private Limited.',
    type: 'MENTOR_MATCH',
    startupId: 's31',
    startupName: 'Indigotex Private Limited',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35m ago
    read: false,
    actionUrl: '/mentor-connect',
  },
  {
    id: 'notif-2',
    title: 'AI Red Flag Alert',
    message: 'Indigotex Private Limited: Customer concentration alert (Dev Bhoomi represents 93% of order pipeline).',
    type: 'RED_FLAG',
    startupId: 's31',
    startupName: 'Indigotex Private Limited',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    read: false,
    actionUrl: '/startups/s31',
  },
  {
    id: 'notif-3',
    title: 'Monthly Financial MIS Due',
    message: 'Q3 MIS pack and bank balance verification requested from Indigotex leadership.',
    type: 'DATA_REQUEST',
    startupId: 's31',
    startupName: 'Indigotex Private Limited',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6h ago
    read: true,
    actionUrl: '/startups/s31',
  },
  {
    id: 'notif-4',
    title: 'Investibility Analysis Complete',
    message: 'AI Investibility diagnostic evaluated Indigotex Private Limited at 76/100 (Grade A).',
    type: 'STARTUP_UPDATE',
    startupId: 's31',
    startupName: 'Indigotex Private Limited',
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12h ago
    read: true,
    actionUrl: '/startups/s31',
  }
];
