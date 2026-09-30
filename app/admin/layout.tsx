import type {ReactNode} from 'react';
import {getSignedInUser} from '@/lib/auth';
import AdminWorkspace from '@/components/admin-workspace';

export default async function AdminLayout({children}: {children: ReactNode}) {
  const user = await getSignedInUser();
  // Leave redirects (including return_to) to the route's existing auth guard.
  if (!user?.canEdit) return children;
  return <AdminWorkspace access={user.isAdmin ? 'admin' : 'editor'}>{children}</AdminWorkspace>;
}
