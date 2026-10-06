import { User, Startup } from '@/types';

// Portfolio Managers a given Portfolio Head can assign to their startups.
export function getAssignableAssociates(managerId: string, allUsers: User[]): User[] {
  return allUsers.filter((u) => u.role === 'INVESTMENT_ASSOCIATE' && u.managerId === managerId);
}

// Portfolio Heads an Admin can reassign a startup to.
export function getAssignableManagers(allUsers: User[]): User[] {
  return allUsers.filter((u) => u.role === 'INVESTMENT_MANAGER');
}

export function scopeStartups(user: User, startups: Startup[]): Startup[] {
  if (user.role === 'ADMIN') {
    return startups;
  }
  if (user.role === 'INVESTMENT_MANAGER') {
    return startups.filter((s) => s.managerId === user.id);
  }
  if (user.role === 'INVESTMENT_ASSOCIATE') {
    return startups.filter((s) => s.associateId === user.id);
  }
  return [];
}

export type Action =
  | 'admin_overview'
  | 'view_portfolio'
  | 'view_startup'
  | 'create_startup'
  | 'delete_startup'
  | 'archive_startup'
  | 'reassign_manager'
  | 'assign_associate'
  | 'manage_users'
  | 'edit_startup'
  | 'send_data_request'
  | 'review_submission'
  | 'draft_assessment'
  | 'approve_assessment'
  | 'manage_mentor'
  | 'view_mentor_requests'
  | 'create_mentor_request'
  | 'recommend_mentor'
  | 'confirm_mentor'
  | 'log_mentor_session'
  | 'export_csv'
  | 'view_insights'
  | 'action_insights'
  | 'admin_settings';

export function can(user: User, action: Action, startup?: Startup): boolean {
  switch (action) {
    case 'admin_overview':
    case 'reassign_manager':
    case 'manage_users':
    case 'admin_settings':
      return user.role === 'ADMIN';

    case 'create_startup':
      return user.role === 'ADMIN' || user.role === 'INVESTMENT_MANAGER';

    case 'archive_startup':
    case 'delete_startup':
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') {
        if (!startup) return true;
        return startup.managerId === user.id;
      }
      return false;

    case 'view_portfolio':
      return true;

    case 'view_startup':
      if (!startup) return false;
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      if (user.role === 'INVESTMENT_ASSOCIATE') return startup.associateId === user.id;
      return false;

    case 'assign_associate':
      if (!startup) return false;
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      return false;

    case 'edit_startup':
    case 'send_data_request':
    case 'review_submission':
    case 'create_mentor_request':
    case 'recommend_mentor':
    case 'confirm_mentor':
    case 'log_mentor_session':
    case 'action_insights':
      if (!startup) return false;
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      if (user.role === 'INVESTMENT_ASSOCIATE') return startup.associateId === user.id;
      return false;

    case 'draft_assessment':
      if (!startup) return false;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      if (user.role === 'INVESTMENT_ASSOCIATE') return startup.associateId === user.id;
      return false;

    case 'approve_assessment':
      if (!startup) return false;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      return false;

    case 'manage_mentor':
      return user.role === 'ADMIN' || user.role === 'INVESTMENT_MANAGER';

    case 'view_mentor_requests':
    case 'view_insights':
      if (!startup) return true; // Handled generally if no startup provided
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') return startup.managerId === user.id;
      if (user.role === 'INVESTMENT_ASSOCIATE') return startup.associateId === user.id;
      return false;

    case 'export_csv':
      if (user.role === 'ADMIN') return true;
      if (user.role === 'INVESTMENT_MANAGER') {
        if (!startup) return true;
        return startup.managerId === user.id;
      }
      return false;

    default:
      return false;
  }
}
