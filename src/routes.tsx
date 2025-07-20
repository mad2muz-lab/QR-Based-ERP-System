import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {
  Dashboard,
  QRScanner,
  RegistrationForm,
  MapView,
  AdminPanel,
  DatabaseConnectionTest,
  LoadingSpinner,
  LazyComponentErrorBoundary
} from './components/common/LazyComponents';
import DepartmentsPage from './components/pages/DepartmentsPage';
import { User } from './types';
import LoginForm from './components/auth/LoginForm';

interface AppRoutesProps {
  currentUser: User | null;
}

export const AppRoutes = ({ currentUser }: AppRoutesProps): RouteObject[] => [
  {
    path: '/',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
          <Dashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/scan',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading QR Scanner..." />}>
          <QRScanner />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/register',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Registration Form..." />}>
          <RegistrationForm currentUser={currentUser || undefined} />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/departments',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Departments..." />}>
          <DepartmentsPage />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },

  {
    path: '/map',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Map View..." />}>
          <MapView />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/admin',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Admin Panel..." />}>
          <AdminPanel currentUser={currentUser || undefined} />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/database-test',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Database Test..." />}>
          <DatabaseConnectionTest />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Login..." />}>
          <LoginForm onLogin={() => {}} />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
];