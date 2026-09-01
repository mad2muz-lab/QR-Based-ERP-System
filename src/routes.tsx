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
import InterWarehouseTransfer from './modules/inventory/components/InterWarehouseTransfer';
import GoodsReceipt from './modules/inventory/components/GoodsReceipt';
import TransferHistory from './modules/inventory/components/TransferHistory';
import ReturnToVendor from './modules/inventory/components/ReturnToVendor';
import PickingPacking from './modules/inventory/components/PickingPacking';
import CycleCount from './modules/inventory/components/CycleCount';
import QuarantineMaterial from './modules/inventory/components/QuarantineMaterial';
import BatchLotTracker from './modules/inventory/components/BatchLotTracker';
import ZoneBinTracking from './modules/inventory/components/ZoneBinTracking';
import StockReservation from './modules/inventory/components/StockReservation';
import Settings from './components/pages/Settings';
import InventoryAdjustments from './modules/inventory/components/InventoryAdjustments';
import StockAlerts from './modules/inventory/components/StockAlerts';
import BarcodeLabelGenerator from './modules/inventory/components/BarcodeLabelGenerator';
import InventoryReconciliationReport from './modules/inventory/components/InventoryReconciliationReport';
import InboundOutboundManifest from './modules/inventory/components/InboundOutboundManifest';
import SupplierItemMaster from './modules/inventory/components/SupplierItemMaster';
import InventoryAuditTrail from './modules/inventory/components/InventoryAuditTrail';
import InventoryValuationReport from './modules/inventory/components/InventoryValuationReport';
import ProformaInvoice from './modules/inventory/components/ProformaInvoice';
import ProformaList from './modules/inventory/components/ProformaList';
import ProformaDetails from './modules/inventory/components/ProformaDetails';
import InvoiceForm from './modules/inventory/components/InvoiceForm';
import InvoiceList from './modules/inventory/components/InvoiceList';
import InvoiceDetails from './modules/inventory/components/InvoiceDetails';
import QuotationForm from './modules/inventory/components/QuotationForm';
import QuotationList from './modules/inventory/components/QuotationList';
import PaymentList from './modules/inventory/components/PaymentList';
import ChartOfAccounts from './modules/inventory/components/ChartOfAccounts';
import GeneralLedger from './modules/inventory/components/GeneralLedger';
import ZATCADashboard from './modules/inventory/components/ZATCADashboard';
import ZATCATracking from './modules/inventory/components/ZATCATracking';
import FinancialReports from './modules/inventory/components/FinancialReports';
import CreditDebitNoteForm from './modules/inventory/components/CreditDebitNoteForm';
import AccountsHub from './modules/accounts/AccountsHub';
import InventoryHub from './modules/inventory/components/InventoryHub';

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
          <Suspense fallback={<LoadingSpinner message="Loading Inventory Hub..." />}>
            <InventoryHub />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/transfer',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Transfer Form..." />}>
            <InterWarehouseTransfer />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/goods-receipt',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Goods Receipt..." />}>
            <GoodsReceipt />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/transfer-history',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Transfer History..." />}>
            <TransferHistory />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/return-to-vendor',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Return to Vendor..." />}>
            <ReturnToVendor />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/picking',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Picking/Packing..." />}>
            <PickingPacking />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/cycle-count',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Cycle Count..." />}>
            <CycleCount />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/quarantine',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Quarantine..." />}>
            <QuarantineMaterial />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/batch-lot',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Batch/Lot Tracking..." />}>
            <BatchLotTracker />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/zone-bin',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Zone/Bin Tracking..." />}>
            <ZoneBinTracking />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/reservation',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Stock Reservation..." />}>
            <StockReservation />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/adjustments',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Inventory Adjustments..." />}>
            <InventoryAdjustments />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/alerts',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Stock Alerts..." />}>
            <StockAlerts />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/labels',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Label Generator..." />}>
            <BarcodeLabelGenerator />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/reconciliation',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Reconciliation Report..." />}>
            <InventoryReconciliationReport />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/manifest',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Manifest..." />}>
            <InboundOutboundManifest />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/master',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Item Master..." />}>
            <SupplierItemMaster />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/audit-trail',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Audit Trail..." />}>
            <InventoryAuditTrail />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/valuation',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Valuation Report..." />}>
            <InventoryValuationReport />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/proforma',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Proforma Invoices..." />}>
            <ProformaList />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/proforma/new',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Proforma Form..." />}>
            <ProformaInvoice />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/proforma/:id',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Proforma Details..." />}>
            <ProformaDetails />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/invoices',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Invoices..." />}>
            <InvoiceList />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/invoice/new',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Invoice Form..." />}>
            <InvoiceForm />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/invoice/new/:proformaId',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Invoice Form..." />}>
            <InvoiceForm />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/invoice/:id',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Invoice Details..." />}>
            <InvoiceDetails />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/quotations',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Quotations..." />}>
            <QuotationList />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/quotations/new',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Quotation Form..." />}>
            <QuotationForm />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/inventory/payments',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Payments..." />}>
            <PaymentList />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Accounts..." />}>
            <AccountsHub />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/chart',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Chart of Accounts..." />}>
            <ChartOfAccounts />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/ledger',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading General Ledger..." />}>
            <GeneralLedger />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/zatca',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading ZATCA Dashboard..." />}>
            <ZATCADashboard />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/zatca-tracking',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading ZATCA Tracking..." />}>
            <ZATCATracking />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/reports',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Financial Reports..." />}>
            <FinancialReports />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/accounts/credit-debit-note',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Credit/Debit Note Form..." />}>
            <CreditDebitNoteForm />
          </Suspense>
        </LazyComponentErrorBoundary>
      ),
    },
    {
      path: '/settings',
      element: (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Settings..." />}>
            <Settings />
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