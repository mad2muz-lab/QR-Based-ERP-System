import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {
  QRScanner,
  RegistrationForm,
  MapView,
  AdminPanel,
  DatabaseConnectionTest,
  LoadingSpinner,
  LazyComponentErrorBoundary
} from './components/common/LazyComponents';
import SupabaseConnectionTest from './components/SupabaseConnectionTest';
import DebugLogin from './components/DebugLogin';
import DebugDepartments from './components/DebugDepartments';
import DepartmentsPage from './components/pages/DepartmentsPage';
import { User } from './types';
import LoginForm from './components/auth/LoginForm';
import CentralizedInventoryDashboard from './modules/inventory/components/CentralizedInventoryDashboard';
import WorkerActionDashboard from './modules/inventory/components/WorkerActionDashboard';

// AOP Components
const AOPDashboard = React.lazy(() => import('./components/aop/AOPDashboard').then(module => ({ default: module.AOPDashboard })));
const CostCenterManager = React.lazy(() => import('./components/aop/CostCenterManager').then(module => ({ default: module.CostCenterManager })));
const ProjectManager = React.lazy(() => import('./components/aop/ProjectManager').then(module => ({ default: module.ProjectManager })));
const BudgetManager = React.lazy(() => import('./components/aop/BudgetManager').then(module => ({ default: module.BudgetManager })));

// Logistics Components
const LogisticsDashboard = React.lazy(() => import('./components/logistics/LogisticsDashboard'));
const TriggerManager = React.lazy(() => import('./components/logistics/TriggerManager'));
const ResourceMovementDashboard = React.lazy(() => import('./components/logistics/ResourceMovementDashboard'));
const ExecutionDashboard = React.lazy(() => import('./components/logistics/ExecutionDashboard'));

const PredictiveStockingDashboard = React.lazy(() => import('./components/maintenance/PredictiveStockingDashboard'));

// QR Scanner Components
const EnhancedQRScanner = React.lazy(() => import('./components/scanner/EnhancedQRScanner'));

interface AppRoutesProps {
  currentUser: User | null;
}

export const AppRoutes = ({ currentUser }: AppRoutesProps): RouteObject[] => [
   {
    path: '/',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Inventory Dashboard..." />}>
          <CentralizedInventoryDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/worker',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Worker Dashboard..." />}>
          <WorkerActionDashboard />
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
      path: '/inventory',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Inventory Dashboard..." />}>
            <CentralizedInventoryDashboard />
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
    path: '/supabase-test',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Supabase Test..." />}>
          <SupabaseConnectionTest />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/debug-login',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Debug Login..." />}>
          <DebugLogin />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/debug-departments',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Debug Departments..." />}>
          <DebugDepartments />
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
  // AOP Routes
  {
    path: '/aop',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading AOP Dashboard..." />}>
          <AOPDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/aop/cost-centers',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Cost Center Manager..." />}>
          <CostCenterManager />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/aop/projects',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Project Manager..." />}>
          <ProjectManager />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/aop/budgets',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Budget Manager..." />}>
          <BudgetManager />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/logistics',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Logistics Dashboard..." />}>
          <LogisticsDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/logistics/triggers',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Trigger Manager..." />}>
          <TriggerManager />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/logistics/movement',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Resource Movement Dashboard..." />}>
          <ResourceMovementDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/logistics/execution',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Execution Dashboard..." />}>
          <ExecutionDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
  {
    path: '/predictive-stocking',
    element: (
      <LazyComponentErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading Predictive Stocking..." />}>
          <PredictiveStockingDashboard />
        </Suspense>
      </LazyComponentErrorBoundary>
    ),
  },
];