
import React from 'react';
// Import the missing Quotation type from ../types
import { ViewState, User, Product, CategoryItem, Customer, ShopSettings, HeldOrder, SaleRecord, PurchaseOrder, ExpenseRecord, PaymentTransaction, Department, PermissionRules, POStatus, PaymentMethod, Quotation } from '../types';
import { POS } from './POS';
import { Deliveries } from './Deliveries';
import { Quotations } from './Quotations';
import { Inventory } from './Inventory';
import { Categories } from './Categories';
import { PurchaseOrders } from './PurchaseOrders';
import { Customers } from './Customers';
import { Suppliers } from './Suppliers';
import { Expenses } from './Expenses';
import { Dashboard } from './Dashboard';
import { Staff } from './Staff';
import { Settings } from './Settings';
import { ShieldAlert } from 'lucide-react';
import { ROLE_LEVEL } from '../constants';

interface ViewManagerProps {
  currentView: ViewState;
  currentUser: User;
  products: Product[];
  categories: CategoryItem[];
  customers: Customer[];
  shopSettings: ShopSettings;
  heldOrders: HeldOrder[];
  sales: SaleRecord[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  expenses: ExpenseRecord[];
  transactions: PaymentTransaction[];
  departments: Department[];
  permissionRules: PermissionRules;
  cartToLoad?: any[];
  customerToLoad?: Customer;
  setCurrentView: (view: ViewState) => void;
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  setHeldOrders: React.Dispatch<React.SetStateAction<HeldOrder[]>>;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setViewingSale: (sale: SaleRecord | null) => void;
  setCartToLoad: (items: any[] | undefined) => void;
  setCustomerToLoad: (cust: Customer | undefined) => void;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setPermissionRules: React.Dispatch<React.SetStateAction<PermissionRules>>;
  setShopSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  handlers: {
    handleCheckout: any;
    handleVoidSale: any;
    handleReturnItems: any;
    handleBatchSettleDebt: any;
    handleAddProduct: any;
    handleUpdateProduct: any;
    handleRestockProduct: any;
  };
}

export const ViewManager: React.FC<ViewManagerProps> = (props) => {
  const { currentView, currentUser, permissionRules } = props;

  const hasPermission = (requiredLevel: number) => {
    const userLevel = ROLE_LEVEL[currentUser.role] || 0;
    return userLevel >= requiredLevel;
  };

  const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
      <ShieldAlert size={64} className="mb-4 text-red-400" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2>
      <p>ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້</p>
    </div>
  );

  switch (currentView) {
    case 'POS': 
      return <POS 
        currentUser={currentUser} products={props.products} categories={props.categories} 
        customers={props.customers} shopSettings={props.shopSettings} heldOrders={props.heldOrders} 
        sales={props.sales} onCheckout={props.handlers.handleCheckout} 
        onSaveQuotation={(items, sub, disc, tot, cust, note) => props.setQuotations([...props.quotations, { id: Date.now().toString(), date: new Date().toISOString(), customer: cust, items, subtotal: sub, discount: disc, total: tot, note, createdBy: currentUser.name }])} 
        onSaveHeldOrder={(items, cust, note) => props.setHeldOrders([...props.heldOrders, { id: Date.now().toString(), date: new Date().toISOString(), items, customer: cust, note }])} 
        onRemoveHeldOrder={id => props.setHeldOrders(props.heldOrders.filter(o => o.id !== id))} 
        initialCart={props.cartToLoad} initialCustomer={props.customerToLoad} 
        onVoidSale={props.handlers.handleVoidSale} onViewSale={props.setViewingSale} 
      />;

    case 'DELIVERIES': 
      return <Deliveries 
        sales={props.sales} 
        onUpdateStatus={(id, stat) => props.setSales(props.sales.map(s => s.id === id ? { ...s, delivery: { ...s.delivery!, status: stat } } : s))} 
        onViewSale={props.setViewingSale} 
      />;

    case 'QUOTATIONS': 
      return <Quotations 
        quotations={props.quotations} 
        onDeleteQuotation={id => props.setQuotations(props.quotations.filter(q => q.id !== id))} 
        onLoadToCart={(items, cust) => { props.setCartToLoad(items); props.setCustomerToLoad(cust); props.setCurrentView('POS'); }} 
        shopSettings={props.shopSettings} 
      />;

    case 'INVENTORY': 
      return <Inventory 
        products={props.products} categories={props.categories} suppliers={props.suppliers} 
        shopSettings={props.shopSettings} stockLogs={props.stockLogs} currentUser={currentUser} 
        onAddProduct={props.handlers.handleAddProduct} onUpdateProduct={props.handlers.handleUpdateProduct} 
        onRestockProduct={props.handlers.handleRestockProduct} onDeleteProduct={id => props.setProducts(props.products.filter(p => p.id !== id))} 
      />;

    case 'CATEGORIES': 
      return <Categories categories={props.categories} products={props.products} onUpdateCategories={props.setCategories} />;

    case 'PURCHASE_ORDERS': 
      return <PurchaseOrders 
        purchaseOrders={props.purchaseOrders} suppliers={props.suppliers} products={props.products} 
        onCreatePO={po => props.setPurchaseOrders([...props.purchaseOrders, po])} 
        onReceivePO={id => props.handlers.handleRestockProduct(id, 0, 'PO Received')} 
        onCancelPO={id => props.setPurchaseOrders(props.purchaseOrders.map(p => p.id === id ? { ...p, status: POStatus.CANCELLED } : p))} 
        shopSettings={props.shopSettings} 
      />;

    case 'CUSTOMERS': 
      return <Customers 
        customers={props.customers} sales={props.sales} shopSettings={props.shopSettings} 
        onAddCustomer={c => props.setCustomers([...props.customers, c])} 
        onUpdateCustomer={c => props.setCustomers(props.customers.map(old => old.id === c.id ? c : old))} 
        onDeleteCustomer={id => props.setCustomers(props.customers.filter(c => c.id !== id))} 
        onBatchSettleDebt={props.handlers.handleBatchSettleDebt} transactions={props.transactions} 
      />;

    case 'SUPPLIERS': 
      return <Suppliers 
        suppliers={props.suppliers} sales={props.sales} purchaseOrders={props.purchaseOrders} 
        transactions={props.transactions} onAddSupplier={s => props.setSuppliers([...props.suppliers, s])} 
        onUpdateSupplier={s => props.setSuppliers(props.suppliers.map(old => old.id === s.id ? s : old))} 
        onDeleteSupplier={id => props.setSuppliers(props.suppliers.filter(s => s.id !== id))} 
        onSettleDebt={(id, amt) => props.setTransactions([...props.transactions, { id: `spay-${Date.now()}`, date: new Date().toISOString(), amount: amt, type: 'PURCHASE_PAYMENT', method: PaymentMethod.CASH, referenceId: id, note: 'Supplier Payment', performedBy: currentUser.name }])} 
      />;

    case 'EXPENSES': 
      return <Expenses 
        expenses={props.expenses} 
        onAddExpense={e => props.setExpenses([...props.expenses, { ...e, recordedBy: currentUser.name }])} 
        onDeleteExpense={id => props.setExpenses(props.expenses.filter(e => e.id !== id))} 
      />;

    case 'DASHBOARD': 
      return <Dashboard 
        currentUser={currentUser} users={props.users} sales={props.sales} products={props.products} 
        expenses={props.expenses} transactions={props.transactions} permissionRules={permissionRules} 
        onVoidSale={props.handlers.handleVoidSale} onViewSale={props.setViewingSale} 
        onSettleDebt={(id, amt) => props.handlers.handleBatchSettleDebt(props.sales.find(s => s.id === id)?.customerId || '', amt)} 
      />;

    case 'STAFF': 
      return hasPermission(permissionRules.MANAGE_STAFF) 
        ? <Staff 
            users={props.users} departments={props.departments} permissionRules={permissionRules} 
            onUpdateUsers={props.setUsers} onUpdateDepartments={props.setDepartments} 
            onUpdatePermissionRules={props.setPermissionRules} currentUser={currentUser} 
            sales={props.sales} stockLogs={props.stockLogs} transactions={props.transactions} 
          /> 
        : <AccessDenied />;

    case 'SETTINGS': 
      return hasPermission(permissionRules.ACCESS_SETTINGS) 
        ? <Settings 
            users={props.users} onUpdateUsers={props.setUsers} sales={props.sales} products={props.products} 
            shopSettings={props.shopSettings} transactions={props.transactions} categories={props.categories} 
            suppliers={props.suppliers} onUpdateSettings={props.setShopSettings} 
            onResetData={() => { localStorage.clear(); window.location.reload(); }} 
            onRestoreData={data => { /* restore logic */ }} 
            onImportProducts={p => props.setProducts([...props.products, ...p])} onUpdateCategories={props.setCategories} 
          /> 
        : <AccessDenied />;

    default: 
      return AccessDenied();
  }
};
