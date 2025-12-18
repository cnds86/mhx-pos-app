
export enum PaymentMethod {
  CASH = 'ເງິນສົດ',
  TRANSFER = 'ໂອນເງິນ (QR)',
  CREDIT = 'ຕິດໜີ້ (Credit)',
  SPLIT = 'ຊຳລະຫຼາຍຊ່ອງທາງ (Split)'
}

export enum DeliveryStatus {
  PENDING = 'ລໍຖ້າຈັດສົ່ງ (Pending)',
  SHIPPING = 'ກຳລັງຈັດສົ່ງ (Shipping)',
  DELIVERED = 'ຈັດສົ່ງສຳເລັດ (Delivered)'
}

export enum POStatus {
  PENDING = 'ລໍຖ້າເຄື່ອງ (Pending)',
  RECEIVED = 'ຮັບເຄື່ອງແລ້ວ (Received)',
  CANCELLED = 'ຍົກເລີກ (Cancelled)'
}

// New Role Types
export type UserRole = 'EMPLOYEE' | 'TEAM_LEADER' | 'UNIT_HEAD' | 'DEPT_HEAD' | 'MANAGER' | 'ADMIN' | 'STAFF';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  totalOwed?: number; // How much we owe this supplier
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  dueDate?: string; // Track expected delivery date
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: POStatus;
  receivedDate?: string;
  note?: string;
  createdBy?: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paidAmount: number;
}

export type PermissionAction = 'VOID_BILL' | 'ACCESS_SETTINGS' | 'MANAGE_STAFF' | 'GIVE_DISCOUNT' | 'VIEW_COST' | 'MANAGE_INVENTORY' | 'SETTLE_DEBT';

export type PermissionRules = Record<PermissionAction, number>; // Action Key -> Minimum Role Level (1-5)

export interface User {
  id: string;
  name: string;
  username: string; 
  password: string; 
  role: UserRole;
  department?: string; // Stored as name or ID
}

export interface ShopSettings {
  name: string;
  branch: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRate: number; // Percentage
  vatEnabled: boolean;
  allowPriceChange: boolean; // New setting
  logo?: string; // Base64 image
}

export interface DeliveryDetails {
  status: DeliveryStatus;
  address: string;
  contactName: string;
  contactPhone: string;
  fee: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: 'GENERAL' | 'VIP' | 'CONTRACTOR';
  address?: string;
  creditLimit?: number; // Maximum allowed debt
}

export interface Product {
  id: string;
  barcode?: string; 
  name: string;
  unit: string; // e.g., 'ອັນ', 'ກ່ອງ', 'ເປົາ'
  price: number; // Retail Price
  wholesalePrice?: number; // Wholesale Price for VIP/Contractors
  costPrice: number; 
  category: string; 
  stock: number;
  image: string;
  isCustom?: boolean; // For non-inventory items added on the fly
}

export interface CartItem extends Product {
  quantity: number;
  note?: string; // Custom note for specific item (e.g. "Cut in half")
}

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
}

export interface SaleItemReturn {
  itemId: string;
  quantity: number;
  amount: number; // Value refunded
  date: string;
  reason?: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  subtotal: number;
  discount: number;
  taxAmount?: number;
  total: number;
  profit?: number; 
  items: CartItem[];
  paymentMethod: PaymentMethod;
  payments?: PaymentDetail[]; // For Split Payments
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  receivedAmount: number;
  changeAmount: number;
  customerId?: string;
  customerName?: string;
  delivery?: DeliveryDetails;
  status: 'COMPLETED' | 'VOIDED';
  salespersonId?: string;
  salespersonName?: string;
  projectRef?: string; // Construction Project / Job Site Name
  returns?: SaleItemReturn[]; // Track returned items
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'SALE' | 'DEBT_PAYMENT' | 'EXPENSE' | 'REFUND' | 'DEBT_ADJUSTMENT' | 'PURCHASE_PAYMENT';
  method: PaymentMethod;
  referenceId?: string; // Sale ID, Customer ID, or PO ID
  note?: string;
  performedBy?: string;
}

export interface StockLog {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUST' | 'VOID' | 'RETURN' | 'PURCHASE';
  quantity: number; // Positive for add, Negative for remove
  previousStock: number;
  newStock: number;
  note?: string;
  refId?: string; // Sale ID or PO ID
  performedBy?: string; // Name of user who performed action
}

export interface Quotation {
  id: string;
  date: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  note?: string;
  createdBy?: string;
}

export interface HeldOrder {
  id: string;
  date: string;
  items: CartItem[];
  customer: Customer;
  note?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'RENT' | 'UTILITIES' | 'SALARY' | 'MARKETING' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  note?: string;
  recordedBy?: string;
}

// Backup Data Structure
export interface SystemData {
  products: Product[];
  sales: SaleRecord[];
  customers: Customer[];
  stockLogs: StockLog[];
  quotations: Quotation[];
  expenses: ExpenseRecord[];
  shopSettings: ShopSettings;
  heldOrders: HeldOrder[];
  users?: User[];
  transactions?: PaymentTransaction[];
  departments?: Department[];
  permissionRules?: PermissionRules;
  categories?: CategoryItem[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
}

export type ViewState = 'POS' | 'INVENTORY' | 'CUSTOMERS' | 'DASHBOARD' | 'SETTINGS' | 'QUOTATIONS' | 'EXPENSES' | 'DELIVERIES' | 'STAFF' | 'SUPPLIERS' | 'PURCHASE_ORDERS' | 'CATEGORIES';
