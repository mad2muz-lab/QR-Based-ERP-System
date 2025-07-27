import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import {
  Dashboard,
  QRScanner,
  RegistrationForm,
  MapView,
  AdminPanel,
  DatabaseConnectionTest,
  LoadingSpinner,
  LazyComponentErrorBoundary,
  DirectMaintenanceForm
} from './components/common/LazyComponents';
import DepartmentsPage from './components/pages/DepartmentsPage';
import MaintenancePage from './components/maintenance/MaintenancePage';
import InventoryPage from './components/inventory/InventoryPage';
import InventoryRequestDetail from './components/inventory/InventoryRequestDetail';
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
  {
    path: '/maintenance',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Maintenance Page..." />}>
          <MaintenancePage />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/maintenance/corrective/new',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Corrective Maintenance Form..." />}>
          <DirectMaintenanceForm />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/inventory',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Inventory Page..." />}>
          <InventoryPage />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/inventory/requests/:requestId',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Request Details..." />}>
          <InventoryRequestDetail />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
];