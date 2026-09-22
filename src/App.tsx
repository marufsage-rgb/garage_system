import React, { useState, useEffect } from 'react';
import {
  loadERPData,
  saveERPData,
  resetERPData
} from './mockData';
import {
  ERPState,
  ModuleType,
  SalesOrder,
  PurchaseOrder,
  Product,
  Customer,
  Vendor,
  Transaction,
  Employee,
  WorkOrder,
  OrderStatus,
  PaymentStatus,
  PurchaseStatus,
  WorkOrderStatus,
  ERPNotification,
  UserRole,
  ROLE_PERMISSIONS,
  AuditLog,
  SystemSettings,
  Estimate,
  JobCard,
  JobCardStage,
  NotificationLog,
  SystemUser
} from './types';
import { formatCurrency } from './utils/formatters';

// Core layout components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Module views
import { DashboardView } from './components/DashboardView';
import { JobCardsView } from './components/JobCardsView';
import { EstimatesView } from './components/EstimatesView';
import { SupervisorLiveView } from './components/SupervisorLiveView';
import { WorkshopInventoryView } from './components/WorkshopInventoryView';
import { JobCardPnlView } from './components/JobCardPnlView';
import { SalesView } from './components/SalesView';
import { InventoryView } from './components/InventoryView';
import { PurchasingView } from './components/PurchasingView';
import { FinanceView } from './components/FinanceView';
import { ManufacturingView } from './components/ManufacturingView';
import { HrView } from './components/HrView';
import { PhpSourceViewer } from './components/PhpSourceViewer';
import { SqlConsoleView } from './components/SqlConsoleView';

// Interactive Modals
import { InvoiceModal } from './components/InvoiceModal';
import { CreateSalesOrderModal } from './components/CreateSalesOrderModal';
import { AddProductModal } from './components/AddProductModal';
import { CreatePoModal } from './components/CreatePoModal';
import { RecordExpenseModal } from './components/RecordExpenseModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddVendorModal } from './components/AddVendorModal';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { CreateWoModal } from './components/CreateWoModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BulkImportModal, ImportEntityType } from './components/BulkImportModal';
import { SettingsView } from './components/SettingsView';
import { PublicPortalView } from './components/PublicPortalView';
import { ManagerPortalView } from './components/ManagerPortalView';
import { OperatorPortalView } from './components/OperatorPortalView';

export default function App() {
  const [erpState, setErpState] = useState<ERPState>(loadERPData);
  const [currentModule, setCurrentModule] = useState<ModuleType>('job_cards');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Owner');

  // Modals state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<SalesOrder | null>(null);
  const [isCreateSalesOrderOpen, setIsCreateSalesOrderOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [quickReorderProduct, setQuickReorderProduct] = useState<Product | null>(null);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isCreateWoOpen, setIsCreateWoOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportInitialType, setBulkImportInitialType] = useState<ImportEntityType>('products');

  // Auto-save state to localStorage whenever modified
  useEffect(() => {
    saveERPData(erpState);
  }, [erpState]);

  // RBAC permission enforcement
  useEffect(() => {
    const allowedModules = ROLE_PERMISSIONS[currentUserRole] || [];
    if (!allowedModules.includes(currentModule)) {
      if (currentUserRole === 'Visitor') {
        setCurrentModule('public_portal');
      } else if (currentUserRole === 'Operator') {
        setCurrentModule('operator_portal');
      } else if (currentUserRole === 'Manager') {
        setCurrentModule('manager_portal');
      } else {
        setCurrentModule(allowedModules[0] || 'job_cards');
      }
    }
  }, [currentUserRole, currentModule]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Centralized Audit Logging Dispatcher
  const createAuditEntry = (
    action: string,
    category: AuditLog['category'],
    details: string,
    severity: AuditLog['severity'] = 'info'
  ): AuditLog => {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      category,
      details,
      performedBy: currentUserRole,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity,
    };
  };

  // Handlers for Sales Orders
  const handleCreateSalesOrder = (newOrder: SalesOrder) => {
    // Deduct ordered quantities from inventory
    const updatedProducts = erpState.products.map((p) => {
      const orderedItem = newOrder.items.find((i) => i.productId === p.id);
      if (orderedItem) {
        const newQty = Math.max(0, p.stockQuantity - orderedItem.quantity);
        return {
          ...p,
          stockQuantity: newQty,
          status: newQty === 0 ? ('out_of_stock' as const) : newQty <= p.reorderLevel ? ('low_stock' as const) : ('in_stock' as const),
        };
      }
      return p;
    });

    const newNotif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `Order Created: ${newOrder.orderNumber}`,
      description: `New order of ${formatCurrency(newOrder.total, erpState.settings.currency)} recorded for ${newOrder.customerCompany}.`,
      timestamp: 'Just now',
      type: 'info',
      read: false,
      linkModule: 'sales',
    };

    setErpState((prev) => ({
      ...prev,
      salesOrders: [newOrder, ...prev.salesOrders],
      products: updatedProducts,
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setErpState((prev) => ({
      ...prev,
      salesOrders: prev.salesOrders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  };

  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    const order = erpState.salesOrders.find((o) => o.id === orderId);
    let newTransactions = erpState.transactions;

    // If marked paid from previously unpaid, automatically create an income transaction in GL
    if (order && order.paymentStatus !== 'paid' && paymentStatus === 'paid') {
      const receiptTx: Transaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'Customer Receipts',
        description: `Settlement for order ${order.orderNumber} (${order.customerCompany})`,
        amount: order.total,
        account: 'Operating Account (JPMorgan Chase)',
        referenceNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'cleared',
      };
      newTransactions = [receiptTx, ...newTransactions];
    }

    setErpState((prev) => ({
      ...prev,
      salesOrders: prev.salesOrders.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o)),
      transactions: newTransactions,
    }));
  };

  // Handlers for Inventory
  const handleAddProduct = (newProduct: Product) => {
    setErpState((prev) => {
      const exists = prev.products.some(p => p.id === newProduct.id);
      const log = createAuditEntry(
        exists ? 'Product Updated' : 'Product Created',
        'inventory',
        `${exists ? 'Updated catalog item' : 'Created new catalog item'} '${newProduct.name}' (${newProduct.sku}) with stock level ${newProduct.stockQuantity} ${newProduct.unit}.`,
        'info'
      );
      if (exists) {
        return {
          ...prev,
          products: prev.products.map(p => p.id === newProduct.id ? newProduct : p),
          auditLogs: [log, ...(prev.auditLogs || [])],
        };
      }
      return {
        ...prev,
        products: [newProduct, ...prev.products],
        auditLogs: [log, ...(prev.auditLogs || [])],
      };
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = erpState.products.find(p => p.id === productId);
    if (!window.confirm(`Are you sure you want to delete product "${prod ? prod.name : productId}"?`)) return;
    const log = createAuditEntry(
      'Product Deleted',
      'inventory',
      `Permanently deleted catalog item '${prod?.name || productId}' (${prod?.sku || 'SKU'}) with stock ${prod?.stockQuantity || 0} units.`,
      'danger'
    );
    setErpState((prev) => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
      auditLogs: [log, ...(prev.auditLogs || [])],
    }));
  };

  const handleAdjustStock = (productId: string, newQuantity: number) => {
    const prod = erpState.products.find((p) => p.id === productId);
    const oldQty = prod ? prod.stockQuantity : 0;
    const diff = newQuantity - oldQty;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    const log = createAuditEntry(
      'Stock Level Adjusted',
      'inventory',
      `Manual stock override for '${prod?.name || productId}' (${prod?.sku || 'SKU'}): ${oldQty} → ${newQuantity} units (${diffStr} units).`,
      'warning'
    );
    setErpState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === productId) {
          const status = newQuantity === 0 ? 'out_of_stock' : newQuantity <= p.reorderLevel ? 'low_stock' : 'in_stock';
          return { ...p, stockQuantity: newQuantity, status };
        }
        return p;
      }),
      auditLogs: [log, ...(prev.auditLogs || [])],
    }));
  };

  // Handlers for Purchasing
  const handleCreatePo = (newPo: PurchaseOrder) => {
    const newNotif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `PO Dispatched: ${newPo.poNumber}`,
      description: `Procurement request sent to ${newPo.vendorName} for ${formatCurrency(newPo.total, erpState.settings.currency)}.`,
      timestamp: 'Just now',
      type: 'info',
      read: false,
      linkModule: 'purchasing',
    };

    setErpState((prev) => ({
      ...prev,
      purchaseOrders: [newPo, ...prev.purchaseOrders],
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  const handleUpdatePoStatus = (poId: string, status: PurchaseStatus) => {
    setErpState((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map((po) => (po.id === poId ? { ...po, status } : po)),
    }));
  };

  const handleReceiveGoods = (po: PurchaseOrder) => {
    // Increment inventory stock
    const updatedProducts = erpState.products.map((p) => {
      const item = po.items.find((i) => i.productId === p.id);
      if (item) {
        const newQty = p.stockQuantity + item.quantity;
        return {
          ...p,
          stockQuantity: newQty,
          status: newQty <= p.reorderLevel ? ('low_stock' as const) : ('in_stock' as const),
        };
      }
      return p;
    });

    const newNotif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `Goods Received: ${po.poNumber}`,
      description: `Warehouse stocks updated for items received from ${po.vendorName}.`,
      timestamp: 'Just now',
      type: 'success',
      read: false,
      linkModule: 'inventory',
    };

    setErpState((prev) => ({
      ...prev,
      products: updatedProducts,
      purchaseOrders: prev.purchaseOrders.map((p) => (p.id === po.id ? { ...p, status: 'received' } : p)),
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  // Handlers for Finance
  const handleRecordExpense = (tx: Transaction) => {
    setErpState((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
    }));
  };

  // Handlers for Directory & Workforce
  const handleAddCustomer = (cust: Customer) => {
    setErpState((prev) => {
      const exists = prev.customers.some((c) => c.id === cust.id);
      const log = createAuditEntry(
        exists ? 'Customer Account Updated' : 'Customer Account Created',
        'customers',
        `${exists ? 'Updated customer details for' : 'Created customer account for'} '${cust.company}' (${cust.name}).`,
        'info'
      );
      if (exists) {
        return {
          ...prev,
          customers: prev.customers.map((c) => (c.id === cust.id ? cust : c)),
          auditLogs: [log, ...(prev.auditLogs || [])],
        };
      }
      return {
        ...prev,
        customers: [cust, ...prev.customers],
        auditLogs: [log, ...(prev.auditLogs || [])],
      };
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = erpState.customers.find((c) => c.id === customerId);
    if (!window.confirm(`Are you sure you want to delete customer "${cust ? cust.company : customerId}"?`)) return;
    const log = createAuditEntry(
      'Customer Deleted',
      'customers',
      `Permanently removed customer account '${cust?.company || customerId}' (Contact: ${cust?.name || 'N/A'}, Outstanding: ${formatCurrency(cust?.outstandingBalance || 0, erpState.settings.currency)})`,
      'danger'
    );
    setErpState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
      auditLogs: [log, ...(prev.auditLogs || [])],
    }));
  };

  const handleRunMigration = (migrationName: string, details: string) => {
    const log = createAuditEntry(
      'Database Migration Applied',
      'settings',
      `Executed ${migrationName}: ${details}`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      auditLogs: [log, ...(prev.auditLogs || [])],
    }));
  };

  const handleAddVendor = (vend: Vendor) => {
    setErpState((prev) => ({
      ...prev,
      vendors: [vend, ...prev.vendors],
    }));
  };

  const handleAddEmployee = (emp: Employee) => {
    setErpState((prev) => ({
      ...prev,
      employees: [emp, ...prev.employees],
    }));
  };

  // Bulk Import Handlers
  const handleOpenBulkImport = (type: ImportEntityType = 'products') => {
    setBulkImportInitialType(type);
    setIsBulkImportOpen(true);
  };

  const handleBulkImportProducts = (newProducts: Product[]) => {
    const notif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `Bulk Imported ${newProducts.length} Products`,
      description: `Successfully cataloged ${newProducts.length} SKU items to the inventory master table.`,
      timestamp: 'Just now',
      type: 'success',
      read: false,
      linkModule: 'inventory',
    };
    setErpState((prev) => ({
      ...prev,
      products: [...newProducts, ...prev.products],
      notifications: [notif, ...prev.notifications],
    }));
  };

  const handleBulkImportCustomers = (newCustomers: Customer[]) => {
    const notif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `Bulk Imported ${newCustomers.length} Customers`,
      description: `Successfully onboarded ${newCustomers.length} customer accounts to the CRM directory.`,
      timestamp: 'Just now',
      type: 'success',
      read: false,
      linkModule: 'sales',
    };
    setErpState((prev) => ({
      ...prev,
      customers: [...newCustomers, ...prev.customers],
      notifications: [notif, ...prev.notifications],
    }));
  };

  const handleBulkImportEmployees = (newEmployees: Employee[]) => {
    const notif: ERPNotification = {
      id: `notif-${Date.now()}`,
      title: `Bulk Imported ${newEmployees.length} Staff Records`,
      description: `Successfully added ${newEmployees.length} employee records to the HR workforce roster.`,
      timestamp: 'Just now',
      type: 'success',
      read: false,
      linkModule: 'hr',
    };
    setErpState((prev) => ({
      ...prev,
      employees: [...newEmployees, ...prev.employees],
      notifications: [notif, ...prev.notifications],
    }));
  };

  // Handlers for Settings & Audit Log Management
  const handleUpdateSettings = (settings: SystemSettings) => {
    const log = createAuditEntry(
      'System Settings Modified',
      'settings',
      `Updated company name to '${settings.companyName}' and base operating currency to ${settings.currency}.`,
      'warning'
    );
    setErpState((prev) => ({
      ...prev,
      settings,
      auditLogs: [log, ...(prev.auditLogs || [])],
    }));
  };

  const handleClearAuditLogs = () => {
    if (!window.confirm('Are you sure you want to flush all historic activity logs? An entry recording this flush will be kept.')) return;
    const log = createAuditEntry(
      'Audit Trail Reset',
      'security',
      'Historical audit trail flushed by administrator.',
      'danger'
    );
    setErpState((prev) => ({
      ...prev,
      auditLogs: [log],
    }));
  };

  // Handlers for Manufacturing
  const handleCreateWo = (wo: WorkOrder) => {
    setErpState((prev) => ({
      ...prev,
      workOrders: [wo, ...prev.workOrders],
    }));
  };

  const handleUpdateWoProgress = (id: string, progress: number) => {
    setErpState((prev) => ({
      ...prev,
      workOrders: prev.workOrders.map((wo) => {
        if (wo.id === id) {
          const status = progress >= 100 ? 'completed' : 'in_progress';
          return { ...wo, progress, status };
        }
        return wo;
      }),
    }));
  };

  const handleUpdateWoStatus = (id: string, status: WorkOrderStatus) => {
    setErpState((prev) => ({
      ...prev,
      workOrders: prev.workOrders.map((wo) => (wo.id === id ? { ...wo, status } : wo)),
    }));
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    setErpState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  // Reset sample dataset
  const handleResetData = () => {
    if (window.confirm('Reset all ERP data to default demonstration dataset?')) {
      const fresh = resetERPData();
      setErpState(fresh);
    }
  };

  // Quick reorder trigger from Dashboard or Inventory
  const handleTriggerQuickReorder = (product: Product) => {
    setQuickReorderProduct(product);
    setIsCreatePoOpen(true);
  };

  // Workshop Handlers (Modules A - G)
  const handleCreateEstimate = (estimate: Estimate) => {
    const audit = createAuditEntry(
      'Create Vehicle Estimate',
      'sales',
      `Estimate #${estimate.estimateNumber} generated (${estimate.estimateType}) for ${estimate.customerName}. Grand Total: ${formatCurrency(estimate.grandTotal, erpState.settings.currency)} (inc. 5% VAT: ${formatCurrency(estimate.vatAmount, erpState.settings.currency)})`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      estimates: [estimate, ...(prev.estimates || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  const handleUpdateEstimate = (updated: Estimate) => {
    setErpState((prev) => ({
      ...prev,
      estimates: (prev.estimates || []).map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  const handleCreateJobCard = (jobCard: JobCard) => {
    const audit = createAuditEntry(
      'Open Job Card',
      'workshop',
      `Opened ${jobCard.jobType.toUpperCase()} Job Card #${jobCard.jobCardNumber} for ${jobCard.customerName} (${jobCard.vehicleDetails}).`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      jobCards: [jobCard, ...(prev.jobCards || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  const handleUpdateJobCardStage = (jobCardId: string | number, stage: JobCardStage) => {
    const jc = (erpState.jobCards || []).find((j) => j.id === jobCardId);
    const audit = createAuditEntry(
      'Stage Transition',
      'workshop',
      `Job Card #${jc ? jc.jobCardNumber : jobCardId} transitioned to stage '${stage}'.`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) => (j.id === jobCardId ? { ...j, status: stage } : j)),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  const handleLogDispatch = (log: NotificationLog) => {
    const audit = createAuditEntry(
      `Quotation Dispatched via ${log.channel}`,
      'sales',
      `Sent to ${log.recipient}. Excerpt: ${log.message.substring(0, 70)}...`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      notificationLogs: [log, ...(prev.notificationLogs || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  const handleUpdateTechnicianTimer = (technicianId: string | number, jcId: string | number, action: 'start' | 'pause' | 'stop') => {
    setErpState((prev) => ({
      ...prev,
      technicians: (prev.technicians || []).map((t) => {
        if (t.id === technicianId) {
          return {
            ...t,
            timerStatus: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped',
            activeJobCardId: action === 'stop' ? undefined : jcId,
          };
        }
        return t;
      }),
    }));
  };

  // Handler for Operator Fast Job Card Entry
  const handleOperatorCreateJobCard = (card: JobCard) => {
    const audit = createAuditEntry(
      'Operator Intake Created',
      'workshop',
      `Job Card ${card.jobCardNumber} (${card.vehicleDetails || 'Vehicle'} - ${card.plateNumber || 'No Plate'}) created by Operator Desk`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      jobCards: [card, ...(prev.jobCards || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  // Handler for Operator Fast Estimate Entry
  const handleOperatorCreateEstimate = (estimate: Estimate) => {
    const audit = createAuditEntry(
      'Operator Estimate Created',
      'workshop',
      `Draft Estimate ${estimate.estimateNumber} (${estimate.vehicleDetails || 'Vehicle'}) created by Operator Desk`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      estimates: [estimate, ...(prev.estimates || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  // Handler for Manager Delegated Estimate Approval
  const handleManagerApproveEstimate = (estimateId: string | number) => {
    const audit = createAuditEntry(
      'Manager Approved Estimate',
      'workshop',
      `Estimate ${estimateId} approved under Anshad delegated authority`,
      'info'
    );
    setErpState((prev) => ({
      ...prev,
      estimates: (prev.estimates || []).map((e) =>
        e.id === estimateId ? { ...e, status: 'approved' } : e
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  // Counts for sidebar badges
  const lowStockCount = erpState.products.filter((p) => p.stockQuantity <= p.reorderLevel).length;
  const pendingOrdersCount = erpState.salesOrders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;
  const openPoCount = erpState.purchaseOrders.filter((po) => po.status !== 'received' && po.status !== 'cancelled').length;
  const activeJobCardsCount = (erpState.jobCards || []).filter((j) => j.status !== 'delivered').length;
  const pendingEstimatesCount = (erpState.estimates || []).filter((e) => e.status === 'draft' || e.status === 'sent').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        currentUserRole={currentUserRole}
        onSelectModule={setCurrentModule}
        onResetData={handleResetData}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        counts={{
          lowStockCount,
          pendingOrdersCount,
          openPoCount,
          activeJobCardsCount,
          pendingEstimatesCount,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          notifications={erpState.notifications}
          currentUserRole={currentUserRole}
          onChangeRole={setCurrentUserRole}
          onMarkNotificationRead={handleMarkNotificationRead}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenBulkImport={(type) => handleOpenBulkImport(type || 'products')}
          onOpenNewModal={(type) => {
            if (type === 'sale') setIsCreateSalesOrderOpen(true);
            if (type === 'inventory') setIsAddProductOpen(true);
            if (type === 'purchase') {
              setQuickReorderProduct(null);
              setIsCreatePoOpen(true);
            }
            if (type === 'expense') setIsRecordExpenseOpen(true);
          }}
          onNavigateModule={setCurrentModule}
        />

        {/* Dynamic Module Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* PUBLIC VISITOR & CAR TRACKING PORTAL */}
            {currentModule === 'public_portal' && (
              <PublicPortalView
                state={erpState}
                onNavigate={setCurrentModule}
              />
            )}

            {/* MANAGER CONTROL PORTAL (DELEGATED BY ANSHAD) */}
            {currentModule === 'manager_portal' && (
              <ManagerPortalView
                state={erpState}
                onNavigate={setCurrentModule}
                onApproveEstimate={handleManagerApproveEstimate}
              />
            )}

            {/* OPERATOR DESK (FAST INTAKE & ENTRY ONLY) */}
            {currentModule === 'operator_portal' && (
              <OperatorPortalView
                state={erpState}
                onCreateJobCard={handleOperatorCreateJobCard}
                onCreateEstimate={handleOperatorCreateEstimate}
                onCreateCustomer={handleAddCustomer}
                onNavigate={setCurrentModule}
              />
            )}

            {currentModule === 'dashboard' && (
              <DashboardView
                state={erpState}
                onNavigate={setCurrentModule}
                onViewOrder={(order) => setSelectedInvoiceOrder(order)}
                onQuickReorder={handleTriggerQuickReorder}
              />
            )}

            {/* AUTOMOTIVE WORKSHOP SUITE (MODULES A - G) */}
            {currentModule === 'job_cards' && (
              <JobCardsView
                state={erpState}
                onUpdateState={setErpState}
                onNavigateToSupervisorLive={() => setCurrentModule('supervisor_live')}
                onNavigateToPnl={() => setCurrentModule('job_card_pnl')}
                onNavigateToPartsTransfer={() => setCurrentModule('workshop_inventory')}
              />
            )}

            {currentModule === 'estimates' && (
              <EstimatesView
                state={erpState}
                onUpdateState={setErpState}
                onNavigateToJobCard={() => setCurrentModule('job_cards')}
              />
            )}

            {currentModule === 'supervisor_live' && (
              <SupervisorLiveView
                state={erpState}
                onUpdateState={setErpState}
              />
            )}

            {currentModule === 'workshop_inventory' && (
              <WorkshopInventoryView
                state={erpState}
                onUpdateState={setErpState}
                onNavigateToJobCard={() => setCurrentModule('job_cards')}
              />
            )}

            {currentModule === 'job_card_pnl' && (
              <JobCardPnlView
                state={erpState}
              />
            )}

            {currentModule === 'sales' && (
              <SalesView
                salesOrders={erpState.salesOrders}
                customers={erpState.customers}
                products={erpState.products}
                currency={erpState.settings.currency}
                onOpenNewOrderModal={() => setIsCreateSalesOrderOpen(true)}
                onOpenNewCustomerModal={(customer?: Customer) => {
                  setEditingCustomer(customer || null);
                  setIsAddCustomerOpen(true);
                }}
                onOpenBulkImportCustomers={() => handleOpenBulkImport('customers')}
                onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {currentModule === 'inventory' && (
              <InventoryView
                products={erpState.products}
                currency={erpState.settings.currency}
                onOpenAddProductModal={(product?: Product) => {
                  setEditingProduct(product || null);
                  setIsAddProductOpen(true);
                }}
                onOpenBulkImport={() => handleOpenBulkImport('products')}
                onAdjustStock={handleAdjustStock}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {currentModule === 'purchasing' && (
              <PurchasingView
                purchaseOrders={erpState.purchaseOrders}
                vendors={erpState.vendors}
                products={erpState.products}
                currency={erpState.settings.currency}
                onOpenNewPoModal={() => {
                  setQuickReorderProduct(null);
                  setIsCreatePoOpen(true);
                }}
                onOpenNewVendorModal={() => setIsAddVendorOpen(true)}
                onUpdatePoStatus={handleUpdatePoStatus}
                onReceiveGoods={handleReceiveGoods}
              />
            )}

            {currentModule === 'finance' && (
              <FinanceView
                transactions={erpState.transactions}
                salesOrders={erpState.salesOrders}
                currency={erpState.settings.currency}
                onOpenRecordExpenseModal={() => setIsRecordExpenseOpen(true)}
              />
            )}

            {currentModule === 'manufacturing' && (
              <ManufacturingView
                workOrders={erpState.workOrders}
                onOpenNewWoModal={() => setIsCreateWoOpen(true)}
                onUpdateWoProgress={handleUpdateWoProgress}
                onUpdateWoStatus={handleUpdateWoStatus}
              />
            )}

            {currentModule === 'hr' && (
              <HrView
                employees={erpState.employees}
                onOpenAddEmployeeModal={() => setIsAddEmployeeOpen(true)}
                onOpenBulkImport={() => handleOpenBulkImport('employees')}
              />
            )}

            {currentModule === 'settings' && (
              <SettingsView
                state={erpState}
                currentUserRole={currentUserRole}
                onUpdateSettings={handleUpdateSettings}
                onUpdateUsers={(users) => setErpState((prev) => ({ ...prev, systemUsers: users }))}
                onClearAuditLogs={handleClearAuditLogs}
                onResetData={handleResetData}
                onNavigate={setCurrentModule}
              />
            )}

            {currentModule === 'php_source' && (
              <PhpSourceViewer />
            )}

            {currentModule === 'sql_console' && (
              <SqlConsoleView
                state={erpState}
                onRunMigration={handleRunMigration}
                onUpdateState={setErpState}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          currency={erpState.settings.currency}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {isCreateSalesOrderOpen && (
        <CreateSalesOrderModal
          customers={erpState.customers}
          products={erpState.products}
          currency={erpState.settings.currency}
          onClose={() => setIsCreateSalesOrderOpen(false)}
          onSubmit={handleCreateSalesOrder}
        />
      )}

      {isAddProductOpen && (
        <AddProductModal
          editProduct={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setIsAddProductOpen(false);
          }}
          onSubmit={handleAddProduct}
        />
      )}

      {isCreatePoOpen && (
        <CreatePoModal
          vendors={erpState.vendors}
          products={erpState.products}
          initialProduct={quickReorderProduct}
          currency={erpState.settings.currency}
          onClose={() => {
            setIsCreatePoOpen(false);
            setQuickReorderProduct(null);
          }}
          onSubmit={handleCreatePo}
        />
      )}

      {isRecordExpenseOpen && (
        <RecordExpenseModal
          currency={erpState.settings.currency}
          onClose={() => setIsRecordExpenseOpen(false)}
          onSubmit={handleRecordExpense}
        />
      )}

      {isAddCustomerOpen && (
        <AddCustomerModal
          editCustomer={editingCustomer}
          onClose={() => {
            setEditingCustomer(null);
            setIsAddCustomerOpen(false);
          }}
          onSubmit={handleAddCustomer}
        />
      )}

      {isAddVendorOpen && (
        <AddVendorModal
          onClose={() => setIsAddVendorOpen(false)}
          onSubmit={handleAddVendor}
        />
      )}

      {isAddEmployeeOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddEmployeeOpen(false)}
          onSubmit={handleAddEmployee}
        />
      )}

      {isCreateWoOpen && (
        <CreateWoModal
          products={erpState.products}
          onClose={() => setIsCreateWoOpen(false)}
          onSubmit={handleCreateWo}
        />
      )}

      {isGlobalSearchOpen && (
        <GlobalSearchModal
          state={erpState}
          onClose={() => setIsGlobalSearchOpen(false)}
          onNavigate={(mod) => setCurrentModule(mod)}
          onViewOrder={(o) => setSelectedInvoiceOrder(o)}
        />
      )}

      {/* Bulk CSV Data Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        initialType={bulkImportInitialType}
        existingProducts={erpState.products}
        existingCustomers={erpState.customers}
        existingEmployees={erpState.employees}
        onImportProducts={handleBulkImportProducts}
        onImportCustomers={handleBulkImportCustomers}
        onImportEmployees={handleBulkImportEmployees}
      />
    </div>
  );
}
