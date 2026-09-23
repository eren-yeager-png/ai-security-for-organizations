import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Route Guards
import { RoleGuard } from '../security/RoleGuard';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// App Pages (Shared Employee & Manager, plus Admin)
import { ChatPage } from '../pages/app/ChatPage';
import { DocumentsPage } from '../pages/app/DocumentsPage';
import { ActivityPage } from '../pages/app/ActivityPage';
import { SettingsPage } from '../pages/app/SettingsPage';

// Admin Control Center Pages (Strictly Admin)
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { AdminDocumentsPage } from '../pages/admin/AdminDocumentsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminRolesPage } from '../pages/admin/AdminRolesPage';
import { AdminSecurityPage } from '../pages/admin/AdminSecurityPage';
import { AdminSecurityAlertsPage } from '../pages/admin/AdminSecurityAlertsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminLoginActivityPage } from '../pages/admin/AdminLoginActivityPage';
import { AdminApiActivityPage } from '../pages/admin/AdminApiActivityPage';
import { AdminDataAccessPage } from '../pages/admin/AdminDataAccessPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Error Pages
import { ForbiddenPage } from '../pages/error/ForbiddenPage';
import { NotFoundPage } from '../pages/error/NotFoundPage';

export const router = createBrowserRouter([
  // Root Redirect
  {
    path: '/',
    element: <Navigate to="/app/chat" replace />,
  },

  // Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Shared Application Shell (Employee, Manager, Admin)
  {
    path: '/app',
    element: (
      <RoleGuard allowedRoles={['Employee', 'Manager', 'Admin']}>
        <AppLayout />
      </RoleGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/chat" replace />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'chat/:conversationId',
        element: <ChatPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'activity',
        element: <ActivityPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // Distinct Admin Control Center (Admin Only)
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['Admin']} fallbackUrl="/forbidden">
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/overview" replace />,
      },
      {
        path: 'overview',
        element: <AdminOverviewPage />,
      },
      {
        path: 'documents',
        element: <AdminDocumentsPage />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'roles',
        element: <AdminRolesPage />,
      },
      {
        path: 'security',
        element: <AdminSecurityPage />,
      },
      {
        path: 'security-alerts',
        element: <AdminSecurityAlertsPage />,
      },
      {
        path: 'audit-logs',
        element: <AdminAuditLogsPage />,
      },
      {
        path: 'login-activity',
        element: <AdminLoginActivityPage />,
      },
      {
        path: 'api-activity',
        element: <AdminApiActivityPage />,
      },
      {
        path: 'data-access',
        element: <AdminDataAccessPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
      {
        path: 'settings',
        element: <AdminSettingsPage />,
      },
    ],
  },

  // Error Pages
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
