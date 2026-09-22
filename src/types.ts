export type SupportedLanguage = 'en' | 'ml' | 'ar' | 'bn' | 'ur';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  shortCode: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export type ModuleType =
  | 'dashboard'
  | 'job_cards'         // Open Job Card (Lube & Bodyshop serials, Stage monitoring: parts waiting, denting, painting, ready to deliver, delivered)
  | 'estimates'         // Vehicle Estimate (spare parts + labour, lumpsum estimate, WhatsApp & Insurance email dispatch)
  | 'supervisor_live'   // Work Assign by Supervisor (Start/pause/stop timers, Tech mobile portal, Repeat job tracking, Live monitoring, Performance)
  | 'workshop_inventory'// Spare Parts & Consumables Inventory (Parts stock, Consumables stock, Transfer stock/consumables to job cards, Parts monitoring)
  | 'job_card_pnl'      // Job Card Profit & Loss (Purchase details, Labor details, Profit/Loss each job card)
  | 'manager_portal'    // Manager Panel (Authorized specifically by Owner Anshad)
  | 'operator_portal'   // Operator Panel (Strictly Fast Data Entry: Job Cards, Estimates & Intake)
  | 'public_portal'     // Visitor & Public Portal (Company Information, Services & Live Vehicle Car Tracker)
  | 'sales'
  | 'inventory'
  | 'purchasing'
  | 'finance'
  | 'hr'
  | 'manufacturing'
  | 'settings'
  | 'php_source'
  | 'sql_console';

export type UserRole =
  | 'Owner'
  | 'Admin'
  | 'Manager'
  | 'Operator'
  | 'Workshop Supervisor'
  | 'Accountant'
  | 'Inventory Clerk'
  | 'Sales Rep'
  | 'HR Manager'
  | 'User'
  | 'Visitor';

export interface ManagerPermissions {
  canApproveEstimates: boolean;
  canManageJobCards: boolean;
  canManageInventory: boolean;
  canViewFinances: boolean;
  canViewJobCardPnl: boolean;
  canApprovePurchaseOrders: boolean;
  canManageStaff: boolean;
}

export const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  canApproveEstimates: true,
  canManageJobCards: true,
  canManageInventory: true,
  canViewFinances: false, // Protected by default
  canViewJobCardPnl: false, // Protected by default
  canApprovePurchaseOrders: false,
  canManageStaff: false,
};

export const ROLE_PERMISSIONS: Record<UserRole, ModuleType[]> = {
  'Owner': [
    'dashboard',
    'job_cards',
    'estimates',
    'supervisor_live',
    'workshop_inventory',
    'job_card_pnl',
    'manager_portal',
    'operator_portal',
    'public_portal',
    'sales',
    'inventory',
    'purchasing',
    'finance',
    'hr',
    'manufacturing',
    'settings',
    'php_source',
    'sql_console',
  ],
  'Admin': [
    'dashboard',
    'job_cards',
    'estimates',
    'supervisor_live',
    'workshop_inventory',
    'job_card_pnl',
    'manager_portal',
    'operator_portal',
    'public_portal',
    'sales',
    'inventory',
    'purchasing',
    'finance',
    'hr',
    'manufacturing',
    'settings',
    'php_source',
    'sql_console',
  ],
  'Manager': [
    'dashboard',
    'manager_portal',
    'job_cards',
    'estimates',
    'supervisor_live',
    'workshop_inventory',
    'public_portal',
  ],
  'Operator': [
    'operator_portal',
    'job_cards',
    'estimates',
    'public_portal',
  ], // Strictly Fast Data Entry only (No Settings, No P&L, No Finances, No Deletion)
  'Workshop Supervisor': [
    'dashboard',
    'job_cards',
    'estimates',
    'supervisor_live',
    'workshop_inventory',
    'job_card_pnl',
    'inventory',
    'public_portal',
  ],
  'Accountant': ['dashboard', 'job_card_pnl', 'estimates', 'finance', 'purchasing', 'sales', 'public_portal'],
  'Inventory Clerk': ['dashboard', 'workshop_inventory', 'inventory', 'purchasing', 'manufacturing', 'public_portal'],
  'Sales Rep': ['dashboard', 'estimates', 'sales', 'job_cards', 'public_portal'],
  'HR Manager': ['dashboard', 'hr', 'supervisor_live', 'public_portal'],
  'User': ['dashboard', 'job_cards', 'public_portal'],
  'Visitor': ['public_portal'], // STRICT: Visitors CANNOT access any Settings, Admin, or Internal Staff panels; only Company Info, Services & Vehicle Tracker
};

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PurchaseStatus = 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';
export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type WorkOrderStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';

export type JobCardStage =
  | 'draft'
  | 'parts_waiting'
  | 'denting'
  | 'painting'
  | 'in_progress'
  | 'ready_to_deliver'
  | 'delivered'
  | 'completed';

export type JobCardType = 'lube' | 'bodyshop';

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  warehouseLocation: string;
  status: ProductStatus;
  isSparePart?: boolean;
  partNumber?: string;
  compatibleVehicles?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  outstandingBalance: number;
  status: 'active' | 'inactive';
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  paymentTerms: string;
  balanceOwed: number;
  rating: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  date: string;
  dueDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  expectedDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  account: string;
  referenceNumber: string;
  status: 'cleared' | 'pending';
}

export interface Employee {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: 'Engineering' | 'Sales & Marketing' | 'Operations' | 'Finance' | 'Human Resources' | 'Executive';
  salary: number;
  status: 'active' | 'on_leave' | 'inactive';
  joinDate: string;
  avatar?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  productSku: string;
  productName: string;
  quantity: number;
  status: WorkOrderStatus;
  startDate: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  progress: number;
}

export interface ERPNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  read: boolean;
  linkModule?: ModuleType;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin: string;
  twoFactorEnabled: boolean;
  avatar?: string;
}

export interface SystemSettings {
  currency: 'OMR' | 'USD' | 'EUR' | 'GBP';
  companyName: string;
  companyArabicName?: string;
  logoUrl?: string;
  workshopPhotoUrl?: string;
  tagline?: string;
  language?: SupportedLanguage;
  vatRate?: number;
  vatNumber?: string;
  crNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  workshopBayCount?: number;
  defaultLaborRate?: number;
  sessionTimeoutMinutes?: number;
  require2FA?: boolean;
  restrictVisitorAccess?: boolean;
  // ANSHAD OWNER VAULT & SECURITY CONTROLS
  ownerName?: string;
  ownerPhone?: string;
  ownerVaultPin?: string;
  managerPermissions?: ManagerPermissions;
}

// ─────────────────────────────────────────────────────────
// AUTOMOTIVE WORKSHOP SUITE TYPES (MAIN THEME)
// ─────────────────────────────────────────────────────────

export interface JobCardPartItem {
  id: string;
  partNumber: string;
  partName: string;
  category: 'spare_part' | 'consumable';
  quantity: number;
  unitCost: number;
  unitPrice: number;
  status: 'pending' | 'ordered' | 'arrived' | 'allocated';
  allocatedAt?: string;
}

export interface JobCardConsumableItem {
  id: string;
  consumableId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  transferredAt: string;
}

export interface JobCardLaborEntry {
  id: string;
  technicianId: string;
  technicianName: string;
  operation: string;
  hourlyWageCost: number;
  hourlyChargeRate: number;
  hours: number;
  status: 'active' | 'completed';
}

export type LaborEntry = JobCardLaborEntry;

export interface JobCard {
  id: number | string;
  jobCardNumber: string; // LB-2026-xxx (Lube) or BS-2026-xxx (Bodyshop)
  jobType: JobCardType;
  customerName: string;
  contactPhone?: string;
  vehicleDetails?: string;
  plateNumber?: string;
  vinNumber?: string;
  status: JobCardStage;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  bayNumber?: string;
  notes?: string;
  before_photo?: string | null;
  after_photo?: string | null;
  isRepeatJob: boolean; // Flag to identify repeat visits / rework / warranty jobs
  repeatReason?: string;
  previousJobCardNumber?: string;
  isRepeatCustomer?: boolean; // Flag / status indicating repeat customer
  repeatVisitCount?: number; // Total number of recorded visits for this customer / vehicle
  workTimerStatus?: 'stopped' | 'running' | 'paused';
  timerStartedAt?: string;
  elapsedMinutes?: number;
  pauseReason?: string;
  partsRequired?: JobCardPartItem[];
  consumablesUsed?: JobCardConsumableItem[];
  laborEntries?: JobCardLaborEntry[];
  createdAt: string;
  completedAt?: string;
}

export interface EstimateItem {
  id: string;
  type: 'part' | 'labour';
  partNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Estimate {
  id: number | string;
  estimateNumber: string;
  estimateType: 'parts_labour' | 'lumpsum';
  jobCardId?: number | string;
  jobCardNumber?: string;
  customerName: string;
  contactPhone?: string;
  vehicleDetails?: string;
  date: string;
  validUntil?: string;
  insuranceCompany?: string;
  claimNumber?: string;
  policyNumber?: string;
  items?: EstimateItem[];
  lumpsumDetails?: {
    packageName: string;
    scopeOfWork: string;
    warranty: string;
    packagePrice: number;
  };
  totalAmount: number; // base total
  subtotal: number;    // DECIMAL(10,3)
  vatRate?: number;    // 0.05
  vatAmount: number;   // DECIMAL(10,3) 5% Oman VAT
  grandTotal: number;  // DECIMAL(10,3)
  status: 'draft' | 'sent' | 'approved' | 'invoiced' | 'declined';
  notes?: string;
  sentViaWhatsApp?: boolean;
  sentViaEmail?: boolean;
}

export interface Technician {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
  phone: string;
  status: 'available' | 'working' | 'on_break' | 'off_duty';
  currentJobCardNumber?: string;
  currentJobCardId?: string | number;
  bay: string;
  activeTimerDurationMinutes: number;
  hourlyWage: number;
  completedJobsCount: number;
  reworkJobsCount: number;
  efficiencyRating: number; // percentage (e.g., 96)
  jobsCompleted?: number;
  reworkCount?: number;
  efficiency?: number;
  timerStatus?: 'active' | 'paused' | 'stopped';
  activeJobCardId?: string | number;
}

export interface ConsumableItem {
  id: string;
  sku: string;
  name: string;
  category: 'paint_materials' | 'clips_fasteners' | 'welding_rods' | 'lubricants_fluids' | 'abrasives_tools';
  unit: string;
  unitCost: number;
  stockQuantity: number;
  reorderLevel: number;
  minStock?: number;
  warehouseLocation: string;
}

export interface NotificationLog {
  id: number;
  jobCardId?: number | null;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  recipient: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'customers' | 'inventory' | 'sales' | 'finance' | 'settings' | 'purchasing' | 'security' | 'workshop';
  details: string;
  performedBy: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface ERPState {
  settings: SystemSettings;
  products: Product[];
  customers: Customer[];
  vendors: Vendor[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  transactions: Transaction[];
  employees: Employee[];
  workOrders: WorkOrder[];
  notifications: ERPNotification[];
  auditLogs: AuditLog[];
  jobCards: JobCard[];
  estimates: Estimate[];
  notificationLogs: NotificationLog[];
  technicians: Technician[];
  consumables: ConsumableItem[];
  systemUsers?: SystemUser[];
}
