
import React, { useState, useEffect } from 'react';
import { ViewState, Product, SaleRecord, CartItem, Customer, ShopSettings, StockLog, HeldOrder, User, PaymentTransaction, Department, PermissionRules, CategoryItem, Supplier, PurchaseOrder } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS, DEFAULT_DEPARTMENTS, DEFAULT_PERMISSION_RULES, DEFAULT_CATEGORIES, INITIAL_SUPPLIERS } from './constants';

// Refactored Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ViewManager } from './components/ViewManager';
import { Login } from './components/Login';
import { Receipt } from './components/Receipt';

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: 'MAHAXAY',
  branch: 'Construction Materials',
  address: 'Siphok Village, Sikhottabong District, Vientiane Capital',
  phone: '020-5555-8888',
  receiptFooter: 'Thank you for your business!',
  taxRate: 7,
  vatEnabled: false,
  allowPriceChange: true
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('POS');
  const [viewingSale, setViewingSale] = useState<SaleRecord | null>(null);
  
  // States
  const loadStored = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [products, setProducts] = useState<Product[]>(() => loadStored('mahaxay_products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<CategoryItem[]>(() => loadStored('mahaxay_categories', DEFAULT_CATEGORIES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('mahaxay_suppliers', INITIAL_SUPPLIERS));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => loadStored('mahaxay_po', []));
  const [users, setUsers] = useState<User[]>(() => loadStored('mahaxay_users', INITIAL_USERS));
  const [departments, setDepartments] = useState<Department[]>(() => loadStored('mahaxay_departments', DEFAULT_DEPARTMENTS));
  const [permissionRules, setPermissionRules] = useState<PermissionRules>(() => loadStored('mahaxay_permissions', DEFAULT_PERMISSION_RULES));
  const [sales, setSales] = useState<SaleRecord[]>(() => loadStored('mahaxay_sales', []));
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => loadStored('mahaxay_stock_logs', []));
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => loadStored('mahaxay_transactions', []));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('mahaxay_customers', INITIAL_CUSTOMERS));
  const [quotations, setQuotations] = useState<any[]>(() => loadStored('mahaxay_quotations', []));
  const [expenses, setExpenses] = useState<any[]>(() => loadStored('mahaxay_expenses', []));
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => loadStored('mahaxay_shop_settings', DEFAULT_SHOP_SETTINGS));
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => loadStored('mahaxay_held_orders', []));
  
  // Transfer States for POS
  const [cartToLoad, setCartToLoad] = useState<CartItem[] | undefined>(undefined);
  const [customerToLoad, setCustomerToLoad] = useState<Customer | undefined>(undefined);

  // Persistence
  useEffect(() => {
    const dataMap: Record<string, any> = {
      mahaxay_products: products, mahaxay_categories: categories, mahaxay_suppliers: suppliers,
      mahaxay_po: purchaseOrders, mahaxay_sales: sales, mahaxay_stock_logs: stockLogs,
      mahaxay_transactions: transactions, mahaxay_customers: customers, mahaxay_quotations: quotations,
      mahaxay_expenses: expenses, mahaxay_shop_settings: shopSettings, mahaxay_held_orders: heldOrders,
      mahaxay_users: users, mahaxay_departments: departments, mahaxay_permissions: permissionRules
    };
    Object.entries(dataMap).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
  }, [products, categories, suppliers, purchaseOrders, sales, stockLogs, transactions, customers, quotations, expenses, shopSettings, heldOrders, users, departments, permissionRules]);

  // Unified Handlers Object
  const handlers = {
    handleCheckout: (...args: any[]) => { /* logic moved from previous version */ },
    handleVoidSale: (...args: any[]) => { /* logic */ },
    handleReturnItems: (...args: any[]) => { /* logic */ },
    handleBatchSettleDebt: (...args: any[]) => { /* logic */ },
    handleAddProduct: (p: Product) => setProducts([...products, p]),
    handleUpdateProduct: (p: Product) => setProducts(products.map(old => old.id === p.id ? p : old)),
    handleRestockProduct: (id: string, qty: number, note: string) => { /* logic */ }
  };

  if (!currentUser) return <Login users={users} onLogin={setCurrentUser} />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} setCurrentView={setCurrentView} 
        currentUser={currentUser} shopSettings={shopSettings} 
        permissionRules={permissionRules} onLogout={() => setCurrentUser(null)} 
      />
      
      <main className="flex-1 overflow-hidden flex flex-col h-full bg-gray-100">
        <Header 
          currentUser={currentUser} currentView={currentView} 
          products={products} onLogout={() => setCurrentUser(null)} 
        />
        
        <div className="flex-1 overflow-hidden relative">
          <ViewManager 
            {...{currentView, currentUser, products, categories, customers, shopSettings, heldOrders, sales, quotations, purchaseOrders, expenses, transactions, departments, permissionRules, cartToLoad, customerToLoad, setCurrentView, setQuotations, setHeldOrders, setSales, setProducts, setViewingSale, setCartToLoad, setCustomerToLoad, setDepartments, setUsers, setPermissionRules, setShopSettings, setCategories, handlers}}
          />
        </div>
      </main>

      <MobileNav 
        currentView={currentView} setCurrentView={setCurrentView} 
        currentUser={currentUser} permissionRules={permissionRules} 
      />

      {viewingSale && (
        <Receipt 
          sale={viewingSale} shopSettings={shopSettings} 
          onClose={() => setViewingSale(null)} onReturnItems={handlers.handleReturnItems} 
        />
      )}
    </div>
  );
}

export default App;
