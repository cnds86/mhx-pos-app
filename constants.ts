
import { Product, Customer, User, Department, PermissionRules, CategoryItem, Supplier } from './types';

// Deprecated Enum, kept for reference if needed, but we use strings now
export const CategoryEnum = {
  CEMENT: 'ຊີມັງ',
  STEEL: 'ເຫຼັກ',
  BRICK: 'ດິນຈີ່',
  PAINT: 'ສີ',
  TOOLS: 'ເຄື່ອງມືຊ່າງ',
  SAND_STONE: 'ຊາຍ/ຫີນ',
  OTHER: 'ອື່ນໆ'
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'ຊີມັງ' },
  { id: '2', name: 'ເຫຼັກ' },
  { id: '3', name: 'ດິນຈີ່' },
  { id: '4', name: 'ສີ' },
  { id: '5', name: 'ເຄື່ອງມືຊ່າງ' },
  { id: '6', name: 'ຊາຍ/ຫີນ' },
  { id: '7', name: 'ອື່ນໆ' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: '885001',
    name: 'ຊີມັງ ອິນຊີ (50kg)',
    unit: 'ເປົາ',
    price: 85000,
    wholesalePrice: 82000,
    costPrice: 78000,
    category: 'ຊີມັງ',
    stock: 200,
    image: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: '2',
    barcode: '885002',
    name: 'ເຫຼັກເສັ້ນ 10mm (ເຕັມ)',
    unit: 'ເສັ້ນ',
    price: 65000,
    wholesalePrice: 62000,
    costPrice: 58000,
    category: 'ເຫຼັກ',
    stock: 500,
    image: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    barcode: '885003',
    name: 'ດິນຈີ່ແດງ',
    unit: 'ກ້ອນ',
    price: 800,
    wholesalePrice: 700,
    costPrice: 550,
    category: 'ດິນຈີ່',
    stock: 10000,
    image: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: '4',
    barcode: '885004',
    name: 'ສີທາພາຍນອກ TOA (18L)',
    unit: 'ຖັງ',
    price: 1200000,
    wholesalePrice: 1100000,
    costPrice: 950000,
    category: 'ສີ',
    stock: 20,
    image: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: '5',
    barcode: '885005',
    name: 'ຊາຍກໍ່',
    unit: 'ຄິວ',
    price: 150000,
    wholesalePrice: 140000,
    costPrice: 110000,
    category: 'ຊາຍ/ຫີນ',
    stock: 50,
    image: 'https://picsum.photos/200/200?random=5'
  },
  {
    id: '6',
    barcode: '885006',
    name: 'ຄ້ອນຕີ (Eagle)',
    unit: 'ອັນ',
    price: 45000,
    wholesalePrice: 40000,
    costPrice: 32000,
    category: 'ເຄື່ອງມືຊ່າງ',
    stock: 30,
    image: 'https://picsum.photos/200/200?random=6'
  },
  {
    id: '7',
    barcode: '885007',
    name: 'ເຫຼັກກ່ອງ 4x4',
    unit: 'ເສັ້ນ',
    price: 180000,
    wholesalePrice: 175000,
    costPrice: 165000,
    category: 'ເຫຼັກ',
    stock: 120,
    image: 'https://picsum.photos/200/200?random=7'
  },
  {
    id: '8',
    barcode: '885008',
    name: 'ບຸ້ງກີ໋',
    unit: 'ອັນ',
    price: 15000,
    wholesalePrice: 13000,
    costPrice: 10000,
    category: 'ເຄື່ອງມືຊ່າງ',
    stock: 100,
    image: 'https://picsum.photos/200/200?random=8'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'ລູກຄ້າທົ່ວໄປ (General)',
    phone: '',
    type: 'GENERAL',
    address: '-'
  },
  {
    id: '2',
    name: 'ຊ່າງສົມສັກ (ກໍ່ສ້າງ)',
    phone: '020-5555-1234',
    type: 'CONTRACTOR',
    address: 'ບ້ານ ໂພນຕ້ອງ'
  },
  {
    id: '3',
    name: 'ບໍລິສັດ ວຽງຈັນ ກໍ່ສ້າງ',
    phone: '020-9999-8888',
    type: 'VIP',
    address: 'ຖະໜົນ ໄກສອນ'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'ບໍລິສັດ ຊີມັງລາວ',
    contactName: 'ທ່ານ ຄຳດີ',
    phone: '020-2222-3333',
    category: 'ຊີມັງ',
    address: 'ເຂດອຸດສາຫະກຳ ຫຼັກ 21'
  },
  {
    id: 's2',
    name: 'ໂຮງງານເຫຼັກ ວຽງຈັນ',
    contactName: 'ທ່ານ ສົມພອນ',
    phone: '020-4444-5555',
    category: 'ເຫຼັກ',
    address: 'ບ້ານ ນາໄຊ'
  }
];

export const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'ຜູ້ຈັດການພະແນກ (Dept Manager)',
  DEPT_HEAD: 'ຫົວໜ້າພະແນກ (Dept Head)',
  UNIT_HEAD: 'ຫົວໜ້າໜ່ວຍ (Unit Head)',
  TEAM_LEADER: 'ຫົວໜ້າທິມ (Team Leader)',
  EMPLOYEE: 'ພະນັກງານ (Employee)',
  ADMIN: 'Admin (Legacy)',
  STAFF: 'Staff (Legacy)'
};

// Hierarchy level for permission checking (Higher is more powerful)
export const ROLE_LEVEL: Record<string, number> = {
  MANAGER: 5,
  DEPT_HEAD: 4,
  UNIT_HEAD: 3,
  TEAM_LEADER: 2,
  EMPLOYEE: 1,
  ADMIN: 5,
  STAFF: 1
};

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Big Boss',
    username: 'admin',
    password: '123',
    role: 'MANAGER',
    department: 'ບໍລິຫານ (Management)'
  },
  {
    id: '2',
    name: 'Sales Staff 1',
    username: 'sale1',
    password: '123',
    role: 'EMPLOYEE',
    department: 'ຂາຍ (Sales)'
  },
  {
    id: '3',
    name: 'Head of Sales',
    username: 'head1',
    password: '123',
    role: 'DEPT_HEAD',
    department: 'ຂາຍ (Sales)'
  }
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'ບໍລິຫານ (Management)', description: 'Administration and Management' },
  { id: '2', name: 'ຂາຍ (Sales)', description: 'Sales and Customer Service' },
  { id: '3', name: 'ສາງ (Inventory)', description: 'Warehouse and Logistics' },
  { id: '4', name: 'ບັນຊີ (Accounting)', description: 'Finance and Accounting' }
];

export const DEFAULT_PERMISSION_RULES: PermissionRules = {
  VOID_BILL: 3, // Unit Head+
  ACCESS_SETTINGS: 5, // Manager
  MANAGE_STAFF: 4, // Dept Head+
  GIVE_DISCOUNT: 1, // Employee
  VIEW_COST: 3, // Unit Head+
  MANAGE_INVENTORY: 2, // Team Leader+
  SETTLE_DEBT: 2 // Team Leader+
};

export const FORMAT_CURRENCY = (amount: number) => {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK',
    minimumFractionDigits: 0
  }).format(amount);
};
