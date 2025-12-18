
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Settings as SettingsIcon, LogOut, Users, FileText, Wallet, Truck, ShieldAlert, UserCog, Factory, ShoppingCart } from 'lucide-react';
import { ViewState, Product, SaleRecord, CartItem, PaymentMethod, Customer, DeliveryDetails, Quotation, ExpenseRecord, ShopSettings, StockLog, DeliveryStatus, HeldOrder, SystemData, User, PaymentTransaction, PaymentDetail, SaleItemReturn, Department, PermissionRules, CategoryItem, Supplier, PurchaseOrder, POStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS, ROLE_LEVEL, DEFAULT_DEPARTMENTS, DEFAULT_PERMISSION_RULES, DEFAULT_CATEGORIES, INITIAL_SUPPLIERS } from './constants';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Dashboard } from './components/Dashboard';
import { Receipt } from './components/Receipt';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { Customers } from './components/Customers';
import { Quotations } from './components/Quotations';
import { Expenses } from './components/Expenses';
import { Deliveries } from './components/Deliveries';
import { Staff } from './components/Staff';
import { Suppliers } from './components/Suppliers';
import { PurchaseOrders } from './components/PurchaseOrders';
import { Header } from './components/Header';

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: 'MAHAXAY',
  branch: 'Construction Materials',
  address: 'Siphok Village, Sikhottabong District, Vientiane Capital',
  phone: '020-5555-8888',
  receiptFooter: 'Thank you for your business!',
  taxRate: 7,
  vatEnabled: false
};

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [currentView, setCurrentView] = useState<ViewState>('POS');
  
  // State for loading a quotation into POS
  const [cartToLoad, setCartToLoad] = useState<CartItem[] | undefined>(undefined);
  const [customerToLoad, setCustomerToLoad] = useState<Customer | undefined>(undefined);

  // Load initial state from Local Storage or use defaults
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('mahaxay_products');
      return savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
    } catch (e) {
      console.error("Failed to load products", e);
      return INITIAL_PRODUCTS;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const savedCats = localStorage.getItem('mahaxay_categories');
      return savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('mahaxay_suppliers');
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch (e) {
      return INITIAL_SUPPLIERS;
    }
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mahaxay_po');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('mahaxay_users');
      return savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('mahaxay_departments');
      return saved ? JSON.parse(saved) : DEFAULT_DEPARTMENTS;
    } catch (e) {
      return DEFAULT_DEPARTMENTS;
    }
  });

  const [permissionRules, setPermissionRules] = useState<PermissionRules>(() => {
    try {
      const saved = localStorage.getItem('mahaxay_permissions');
      return saved ? JSON.parse(saved) : DEFAULT_PERMISSION_RULES;
    } catch (e) {
      return DEFAULT_PERMISSION_RULES;
    }
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const savedSales = localStorage.getItem('mahaxay_sales');
      return savedSales ? JSON.parse(savedSales) : [];
    } catch (e) {
      console.error("Failed to load sales", e);
      return [];
    }
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    try {
      const savedLogs = localStorage.getItem('mahaxay_stock_logs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (e) {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem('mahaxay_transactions');
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (e) {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const savedCustomers = localStorage.getItem('mahaxay_customers');
      return savedCustomers ? JSON.parse(savedCustomers) : INITIAL_CUSTOMERS;
    } catch (e) {
      console.error("Failed to load customers", e);
      return INITIAL_CUSTOMERS;
    }
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const savedQuotations = localStorage.getItem('mahaxay_quotations');
      return savedQuotations ? JSON.parse(savedQuotations) : [];
    } catch (e) {
      console.error("Failed to load quotations", e);
      return [];
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const savedExpenses = localStorage.getItem('mahaxay_expenses');
      return savedExpenses ? JSON.parse(savedExpenses) : [];
    } catch (e) {
      console.error("Failed to load expenses", e);
      return [];
    }
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('mahaxay_shop_settings');
      return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SHOP_SETTINGS;
    } catch (e) {
      return DEFAULT_SHOP_SETTINGS;
    }
  });

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mahaxay_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for Receipt Modal (also acts as Viewing Sale state)
  const [viewingSale, setViewingSale] = useState<SaleRecord | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('mahaxay_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('mahaxay_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('mahaxay_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('mahaxay_po', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('mahaxay_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('mahaxay_stock_logs', JSON.stringify(stockLogs)); }, [stockLogs]);
  useEffect(() => { localStorage.setItem('mahaxay_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('mahaxay_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('mahaxay_quotations', JSON.stringify(quotations)); }, [quotations]);
  useEffect(() => { localStorage.setItem('mahaxay_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('mahaxay_shop_settings', JSON.stringify(shopSettings)); }, [shopSettings]);
  useEffect(() => { localStorage.setItem('mahaxay_held_orders', JSON.stringify(heldOrders)); }, [heldOrders]);
  useEffect(() => { localStorage.setItem('mahaxay_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('mahaxay_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('mahaxay_permissions', JSON.stringify(permissionRules)); }, [permissionRules]);

  // Helper: Check Permission
  const hasPermission = (userRole: string, requiredLevel: number) => {
     const userLevel = ROLE_LEVEL[userRole] || 0;
     return userLevel >= requiredLevel;
  };

  // User Management Handlers
  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
  };

  // Inventory Handlers
  const handleAddProduct = (newProduct: Product) => {
    setProducts([...products, newProduct]);
    if (newProduct.stock > 0) {
      const log: StockLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ADJUST',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        note: 'Initial Stock',
        performedBy: currentUser?.name
      };
      setStockLogs(prev => [...prev, log]);
    }
  };

  const handleImportProducts = (newProducts: Product[]) => {
    const existingIds = new Set(products.map(p => p.id));
    const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
    setProducts(prev => [...prev, ...uniqueNewProducts]);
    const newLogs: StockLog[] = uniqueNewProducts.map(p => ({
        id: Date.now().toString() + Math.random(),
        date: new Date().toISOString(),
        productId: p.id,
        productName: p.name,
        type: 'ADJUST',
        quantity: p.stock,
        previousStock: 0,
        newStock: p.stock,
        note: 'Imported via CSV',
        performedBy: currentUser?.name
    }));
    setStockLogs(prev => [...prev, ...newLogs]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };
  
  const handleRestockProduct = (productId: string, quantity: number, note: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const previousStock = product.stock;
    const newStock = previousStock + quantity;
    setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    const log: StockLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      type: 'RESTOCK',
      quantity: quantity,
      previousStock: previousStock,
      newStock: newStock,
      note: note,
      performedBy: currentUser?.name
    };
    setStockLogs(prev => [...prev, log]);
  };

  // Customer Handlers
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers([...customers, newCustomer]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  // Supplier Handlers
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers([...suppliers, newSupplier]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleSettleSupplierDebt = (supplierId: string, amount: number) => {
      const transaction: PaymentTransaction = {
          id: `spay-${Date.now()}`,
          date: new Date().toISOString(),
          amount: amount,
          type: 'PURCHASE_PAYMENT',
          method: PaymentMethod.CASH,
          referenceId: supplierId,
          note: `ຊຳລະໜີ້ຜູ້ສະໜອງ (Supplier Payment)`,
          performedBy: currentUser?.name
      };
      setTransactions(prev => [...prev, transaction]);
  };

  // Purchase Order Handlers
  const handleCreatePO = (po: PurchaseOrder) => {
    setPurchaseOrders([...purchaseOrders, po]);
    if (po.paidAmount > 0) {
        setTransactions(prev => [...prev, {
            id: `po-p-${po.id}`,
            date: po.date,
            amount: po.paidAmount,
            type: 'PURCHASE_PAYMENT',
            method: PaymentMethod.CASH,
            referenceId: po.id,
            note: `Deposit for PO #${po.id.slice(-6)}`,
            performedBy: currentUser?.name
        }]);
    }
  };

  const handleReceivePO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || po.status === POStatus.RECEIVED) return;

    setPurchaseOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: POStatus.RECEIVED, receivedDate: new Date().toISOString() } : p
    ));

    const newLogs: StockLog[] = [];
    setProducts(prevProducts => {
       return prevProducts.map(prod => {
          const poItem = po.items.find(i => i.productId === prod.id);
          if (poItem) {
             const previousStock = prod.stock;
             const newStock = prod.stock + poItem.quantity;
             newLogs.push({
                id: `stock-po-${poId}-${prod.id}`,
                date: new Date().toISOString(),
                productId: prod.id,
                productName: prod.name,
                type: 'PURCHASE',
                quantity: poItem.quantity,
                previousStock: previousStock,
                newStock: newStock,
                refId: poId,
                note: `PO #${poId.slice(-6)} Received`,
                performedBy: currentUser?.name
             });
             return { ...prod, stock: newStock, costPrice: poItem.costPrice };
          }
          return prod;
       });
    });
    setStockLogs(prev => [...prev, ...newLogs]);
  };

  const handleCancelPO = (poId: string) => {
    setPurchaseOrders(prev => prev.map(p => 
        p.id === poId ? { ...p, status: POStatus.CANCELLED } : p
    ));
  };

  // Quotation Handlers
  const handleSaveQuotation = (items: CartItem[], subtotal: number, discount: number, total: number, customer: Customer, note: string) => {
    const newQuotation: Quotation = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer,
      items,
      subtotal,
      discount,
      total,
      note,
      createdBy: currentUser?.name
    };
    setQuotations([...quotations, newQuotation]);
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations(quotations.filter(q => q.id !== id));
  };

  const handleLoadQuotationToCart = (items: CartItem[], customer: Customer) => {
    setCartToLoad(items);
    setCustomerToLoad(customer);
    setCurrentView('POS');
  };

  // Held Order Handlers
  const handleSaveHeldOrder = (items: CartItem[], customer: Customer, note?: string) => {
    const newOrder: HeldOrder = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items,
        customer,
        note
    };
    setHeldOrders([...heldOrders, newOrder]);
  };

  const handleRemoveHeldOrder = (id: string) => {
    setHeldOrders(heldOrders.filter(o => o.id !== id));
  };

  // Expense Handlers
  const handleAddExpense = (newExpense: ExpenseRecord) => {
    setExpenses([...expenses, { ...newExpense, recordedBy: currentUser?.name }]);
    const transaction: PaymentTransaction = {
       id: `exp-${newExpense.id}`,
       date: newExpense.date,
       amount: newExpense.amount,
       type: 'EXPENSE',
       method: PaymentMethod.CASH,
       note: `Expense: ${newExpense.category} - ${newExpense.note || ''}`,
       performedBy: currentUser?.name
    };
    setTransactions(prev => [...prev, transaction]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    setTransactions(prev => prev.filter(t => t.id !== `exp-${id}`));
  };

  // Settings Handler
  const handleUpdateSettings = (newSettings: ShopSettings) => {
    setShopSettings(newSettings);
  };

  // Delivery Status Handler
  const handleUpdateDeliveryStatus = (saleId: string, status: DeliveryStatus) => {
    setSales(sales.map(s => {
      if (s.id === saleId && s.delivery) {
        return {
          ...s,
          delivery: {
            ...s.delivery,
            status: status
          }
        };
      }
      return s;
    }));
  };

  // Checkout Handler
  const handleCheckout = (
    items: CartItem[], 
    subtotal: number,
    discount: number,
    deliveryFee: number,
    taxAmount: number,
    total: number, 
    paymentMethod: PaymentMethod, 
    receivedAmount: number, 
    changeAmount: number, 
    customer: Customer,
    delivery?: DeliveryDetails,
    splitPayments?: PaymentDetail[],
    projectRef?: string
  ) => {
    const itemRevenue = subtotal - discount;
    const totalCost = items.reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);
    const profit = itemRevenue - totalCost;
    const saleId = Date.now().toString();

    let status: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
    if (paymentMethod === PaymentMethod.CREDIT) {
        status = 'UNPAID';
    } else if (paymentMethod === PaymentMethod.SPLIT) {
        status = receivedAmount < total ? 'PARTIAL' : 'PAID';
    } else if (receivedAmount < total) {
        status = 'PARTIAL';
    }

    const newSale: SaleRecord = {
      id: saleId,
      date: new Date().toISOString(),
      subtotal: subtotal,
      discount: discount,
      taxAmount: taxAmount,
      total: total,
      profit: profit,
      items: items,
      paymentMethod: paymentMethod,
      payments: splitPayments,
      paymentStatus: status,
      receivedAmount: receivedAmount,
      changeAmount: changeAmount,
      customerId: customer.id,
      customerName: customer.name,
      delivery: delivery,
      status: 'COMPLETED',
      salespersonId: currentUser?.id,
      salespersonName: currentUser?.name,
      projectRef: projectRef,
      returns: []
    };
    
    setSales([...sales, newSale]);

    const txnDate = new Date().toISOString();
    if (paymentMethod === PaymentMethod.SPLIT && splitPayments) {
        splitPayments.forEach((pmt, idx) => {
            if (pmt.amount > 0) {
                setTransactions(prev => [...prev, {
                    id: `txn-${saleId}-${idx}`,
                    date: txnDate,
                    amount: pmt.amount,
                    type: 'SALE',
                    method: pmt.method,
                    referenceId: saleId,
                    note: `Sale #${saleId.slice(-6)} (Split)`,
                    performedBy: currentUser?.name
                }]);
            }
        });
    } else if (receivedAmount > 0 && paymentMethod !== PaymentMethod.CREDIT) {
       const realReceived = Math.min(receivedAmount, total);
       setTransactions(prev => [...prev, {
          id: `txn-${saleId}`,
          date: txnDate,
          amount: realReceived,
          type: 'SALE',
          method: paymentMethod,
          referenceId: saleId,
          note: `Sale #${saleId.slice(-6)}`,
          performedBy: currentUser?.name
       }]);
    }

    const newLogs: StockLog[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const cartItem = items.find(item => item.id === prod.id);
        if (cartItem) {
          const previousStock = prod.stock;
          const newStock = Math.max(0, prod.stock - cartItem.quantity);
          newLogs.push({
             id: Date.now().toString() + Math.random(),
             date: new Date().toISOString(),
             productId: prod.id,
             productName: prod.name,
             type: 'SALE',
             quantity: -cartItem.quantity,
             previousStock: previousStock,
             newStock: newStock,
             refId: saleId,
             note: `Sale #${saleId.slice(-6)}`,
             performedBy: currentUser?.name
          });
          return { ...prod, stock: newStock };
        }
        return prod;
      });
    });
    setStockLogs(prev => [...prev, ...newLogs]);
    setViewingSale(newSale);
    setCartToLoad(undefined);
    setCustomerToLoad(undefined);
  };

  // Return Items Handler
  const handleReturnItems = (saleId: string, itemsToReturn: { itemId: string, quantity: number, amount: number }[], note: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const returnDate = new Date().toISOString();
    const totalRefundAmount = itemsToReturn.reduce((sum, item) => sum + item.amount, 0);
    const isCreditSale = sale.paymentStatus === 'UNPAID' || (sale.paymentStatus === 'PARTIAL' && sale.receivedAmount === 0);
    const transaction: PaymentTransaction = {
       id: `ret-${Date.now()}`,
       date: returnDate,
       amount: -totalRefundAmount, 
       type: isCreditSale ? 'DEBT_ADJUSTMENT' : 'REFUND',
       method: PaymentMethod.CASH,
       referenceId: saleId,
       note: `Return items from Bill #${saleId.slice(-6)}: ${note}`,
       performedBy: currentUser?.name
    };
    setTransactions(prev => [...prev, transaction]);
    const newLogs: StockLog[] = [];
    setProducts(prevProducts => {
       return prevProducts.map(prod => {
          const returnItem = itemsToReturn.find(i => i.itemId === prod.id);
          if (returnItem) {
             const previousStock = prod.stock;
             const newStock = prod.stock + returnItem.quantity;
             newLogs.push({
                id: Date.now().toString() + Math.random(),
                date: returnDate,
                productId: prod.id,
                productName: prod.name,
                type: 'RETURN',
                quantity: returnItem.quantity,
                previousStock: previousStock,
                newStock: newStock,
                refId: saleId,
                note: `Returned from Bill #${saleId.slice(-6)}`,
                performedBy: currentUser?.name
             });
             return { ...prod, stock: newStock };
          }
          return prod;
       });
    });
    setStockLogs(prev => [...prev, ...newLogs]);
    const newReturns: SaleItemReturn[] = itemsToReturn.map(i => ({
        itemId: i.itemId,
        quantity: i.quantity,
        amount: i.amount,
        date: returnDate,
        reason: note
    }));
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, returns: [...(s.returns || []), ...newReturns] } : s));
  };

  // Void Sale Handler
  const handleVoidSale = (saleId: string, authorizedById?: string) => {
    const currentUserRole = currentUser?.role || 'EMPLOYEE';
    const requiredLevel = permissionRules.VOID_BILL;
    const userHasPermission = hasPermission(currentUserRole, requiredLevel);
    const isAuthorized = authorizedById && users.some(u => u.id === authorizedById && hasPermission(u.role, requiredLevel));
    if (!userHasPermission && !isAuthorized) {
        alert(`ບໍ່ມີສິດຍົກເລີກບິນ (Access Denied)`);
        return;
    }
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid || saleToVoid.status === 'VOIDED') return;
    setSales(sales.map(s => s.id === saleId ? { ...s, status: 'VOIDED' } : s));
    const performer = authorizedById ? users.find(u => u.id === authorizedById)?.name : currentUser?.name;
    if (saleToVoid.paymentMethod === PaymentMethod.SPLIT && saleToVoid.payments) {
        saleToVoid.payments.forEach((pmt, idx) => {
            if (pmt.amount > 0) {
                setTransactions(prev => [...prev, {
                    id: `ref-${saleId}-${idx}`,
                    date: new Date().toISOString(),
                    amount: -pmt.amount,
                    type: 'REFUND',
                    method: pmt.method,
                    referenceId: saleId,
                    note: `Void Bill #${saleId.slice(-6)} (Split)`,
                    performedBy: performer
                }]);
            }
        });
    } else if (saleToVoid.receivedAmount && saleToVoid.receivedAmount > 0) {
        setTransactions(prev => [...prev, {
          id: `ref-${Date.now()}`,
          date: new Date().toISOString(),
          amount: -Math.min(saleToVoid.receivedAmount, saleToVoid.total), 
          type: 'REFUND',
          method: saleToVoid.paymentMethod,
          referenceId: saleId,
          note: `Void Bill #${saleId.slice(-6)}`,
          performedBy: performer
       }]);
    }
    const newLogs: StockLog[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const soldItem = saleToVoid.items.find(item => item.id === prod.id);
        if (soldItem) {
          const previousStock = prod.stock;
          const newStock = prod.stock + soldItem.quantity;
          newLogs.push({
             id: Date.now().toString() + Math.random(),
             date: new Date().toISOString(),
             productId: prod.id,
             productName: prod.name,
             type: 'VOID',
             quantity: soldItem.quantity,
             previousStock: previousStock,
             newStock: newStock,
             refId: saleId,
             note: `Void Sale #${saleId.slice(-6)}`,
             performedBy: performer
          });
          return { ...prod, stock: newStock };
        }
        return prod;
      });
    });
    setStockLogs(prev => [...prev, ...newLogs]);
  };
  
  // Settle Debt Handler
  const handleSettleDebt = (saleId: string, amount: number) => {
    const sale = sales.find(s => s.id === saleId);
    if(!sale) return;
    const transaction: PaymentTransaction = {
       id: `pay-${Date.now()}`,
       date: new Date().toISOString(),
       amount: amount,
       type: 'DEBT_PAYMENT',
       method: PaymentMethod.CASH,
       referenceId: saleId,
       note: `Settled Bill #${saleId.slice(-6)}`,
       performedBy: currentUser?.name
    };
    setTransactions(prev => [...prev, transaction]);
    setSales(sales.map(s => {
      if (s.id === saleId) {
        const newReceived = (s.receivedAmount || 0) + amount;
        const newStatus = newReceived >= s.total ? 'PAID' : 'PARTIAL';
        return { ...s, paymentStatus: newStatus, receivedAmount: newReceived };
      }
      return s;
    }));
  };

  const handleBatchSettleDebt = (customerId: string, amount: number) => {
    let remainingToSettle = amount;
    const transaction: PaymentTransaction = {
       id: `batch-pay-${Date.now()}`,
       date: new Date().toISOString(),
       amount: amount,
       type: 'DEBT_PAYMENT',
       method: PaymentMethod.CASH,
       referenceId: customerId,
       note: `Batch Debt Payment`,
       performedBy: currentUser?.name
    };
    setTransactions(prev => [...prev, transaction]);
    setSales(prevSales => {
      const updatedSales = [...prevSales];
      const unpaidIndices = updatedSales
        .map((s, index) => ({ s, index }))
        .filter(item => item.s.customerId === customerId && item.s.paymentStatus !== 'PAID' && item.s.status !== 'VOIDED')
        .sort((a, b) => new Date(a.s.date).getTime() - new Date(b.s.date).getTime());
      if (unpaidIndices.length === 0) return prevSales;
      for (const { s: bill, index } of unpaidIndices) {
        if (remainingToSettle <= 0) break;
        const billBalance = bill.total - (bill.receivedAmount || 0);
        const payAmount = Math.min(billBalance, remainingToSettle);
        if (payAmount > 0) {
           const newReceived = (updatedSales[index].receivedAmount || 0) + payAmount;
           const newStatus = newReceived >= updatedSales[index].total ? 'PAID' : 'PARTIAL';
           updatedSales[index] = { ...updatedSales[index], receivedAmount: newReceived, paymentStatus: newStatus };
           remainingToSettle -= payAmount;
        }
      }
      return updatedSales;
    });
  };

  // Reset Data
  const handleResetData = () => {
    if (!hasPermission(currentUser?.role || '', permissionRules.ACCESS_SETTINGS)) {
        alert("Access Denied"); return;
    }
    localStorage.clear();
    window.location.reload();
  };

  const handleRestoreData = (data: SystemData) => {
    if (!hasPermission(currentUser?.role || '', permissionRules.ACCESS_SETTINGS)) {
        alert("Access Denied"); return;
    }
    try {
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.sales) setSales(data.sales);
      if (data.customers) setCustomers(data.customers);
      if (data.stockLogs) setStockLogs(data.stockLogs);
      if (data.quotations) setQuotations(data.quotations);
      if (data.expenses) setExpenses(data.expenses);
      if (data.shopSettings) setShopSettings(data.shopSettings);
      if (data.heldOrders) setHeldOrders(data.heldOrders);
      if (data.users) setUsers(data.users);
      if (data.transactions) setTransactions(data.transactions);
      if (data.departments) setDepartments(data.departments);
      if (data.permissionRules) setPermissionRules(data.permissionRules);
      alert('Data restored successfully!');
    } catch (e) {
      alert('Error restoring data');
    }
  };

  const handleLogout = () => setCurrentUser(null);

  if (!currentUser) return <Login users={users} onLogin={setCurrentUser} />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-30 shrink-0 relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm">{shopSettings.name.charAt(0)}</div>
           <h1 className="font-bold text-lg text-gray-800">{shopSettings.name}</h1>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-2"><LogOut size={20} /></button>
      </div>

      <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-gray-200 flex-col transition-all duration-300 shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 overflow-hidden">
            {shopSettings.logo ? <img src={shopSettings.logo} alt="Logo" className="w-full h-full object-cover" /> : shopSettings.name.charAt(0)}
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg text-gray-800 leading-tight truncate max-w-[150px]">{shopSettings.name}</h1>
            <p className="text-xs text-gray-500 truncate max-w-[150px]">{shopSettings.branch}</p>
          </div>
        </div>

        <div className="px-4 py-2 hidden lg:block">
           <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentUser.role === 'MANAGER' ? 'bg-red-600' : 'bg-blue-600'}`}>{currentUser.name.charAt(0)}</div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wide truncate">{currentUser.role}</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          <button onClick={() => setCurrentView('POS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'POS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><ShoppingBag size={24} /> <span className="hidden lg:block">ຂາຍໜ້າຮ້ານ</span></button>
          <button onClick={() => setCurrentView('DELIVERIES')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'DELIVERIES' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><Truck size={24} /> <span className="hidden lg:block">ການຈັດສົ່ງ</span></button>
          <button onClick={() => setCurrentView('QUOTATIONS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'QUOTATIONS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><FileText size={24} /> <span className="hidden lg:block">ໃບສະເໜີລາຄາ</span></button>
          <button onClick={() => setCurrentView('INVENTORY')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'INVENTORY' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><Package size={24} /> <span className="hidden lg:block">ສາງສິນຄ້າ</span></button>
          <button onClick={() => setCurrentView('PURCHASE_ORDERS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'PURCHASE_ORDERS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><ShoppingCart size={24} /> <span className="hidden lg:block">ການສັ່ງຊື້ (PO)</span></button>
          <button onClick={() => setCurrentView('CUSTOMERS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'CUSTOMERS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><Users size={24} /> <span className="hidden lg:block">ລູກຄ້າ</span></button>
          <button onClick={() => setCurrentView('SUPPLIERS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'SUPPLIERS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><Factory size={24} /> <span className="hidden lg:block">ຜູ້ສະໜອງ</span></button>
          <button onClick={() => setCurrentView('EXPENSES')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'EXPENSES' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><Wallet size={24} /> <span className="hidden lg:block">ລາຍຈ່າຍ</span></button>
          <button onClick={() => setCurrentView('DASHBOARD')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'DASHBOARD' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><LayoutDashboard size={24} /> <span className="hidden lg:block">ລາຍງານ</span></button>
          {hasPermission(currentUser.role, permissionRules.MANAGE_STAFF) && <button onClick={() => setCurrentView('STAFF')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'STAFF' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><UserCog size={24} /> <span className="hidden lg:block">ພະນັກງານ</span></button>}
          <button onClick={() => setCurrentView('SETTINGS')} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${currentView === 'SETTINGS' ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><SettingsIcon size={24} /> <span className="hidden lg:block">ຕັ້ງຄ່າ</span></button>
        </nav>
        
        <div className="p-4 border-t border-gray-100 hidden lg:block">
           <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"><LogOut size={20} /> <span className="hidden lg:block font-medium">ອອກຈາກລະບົບ</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden relative flex flex-col h-full bg-gray-100">
        {/* Top Header Integration */}
        <Header 
          currentUser={currentUser} 
          currentView={currentView} 
          products={products}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-hidden relative">
          {currentView === 'POS' && <POS currentUser={currentUser} products={products} categories={categories} customers={customers} shopSettings={shopSettings} heldOrders={heldOrders} sales={sales} onCheckout={handleCheckout} onSaveQuotation={handleSaveQuotation} onSaveHeldOrder={handleSaveHeldOrder} onRemoveHeldOrder={handleRemoveHeldOrder} initialCart={cartToLoad} initialCustomer={customerToLoad} onVoidSale={handleVoidSale} onViewSale={setViewingSale} />}
          {currentView === 'DELIVERIES' && <div className="h-full overflow-y-auto"><Deliveries sales={sales} onUpdateStatus={handleUpdateDeliveryStatus} onViewSale={setViewingSale} /></div>}
          {currentView === 'QUOTATIONS' && <div className="h-full overflow-y-auto"><Quotations quotations={quotations} onDeleteQuotation={handleDeleteQuotation} onLoadToCart={handleLoadQuotationToCart} shopSettings={shopSettings} /></div>}
          {currentView === 'INVENTORY' && <div className="h-full overflow-y-auto"><Inventory products={products} categories={categories} suppliers={suppliers} shopSettings={shopSettings} stockLogs={stockLogs} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onRestockProduct={handleRestockProduct} onDeleteProduct={handleDeleteProduct} /></div>}
          {currentView === 'PURCHASE_ORDERS' && <div className="h-full overflow-y-auto"><PurchaseOrders purchaseOrders={purchaseOrders} suppliers={suppliers} products={products} onCreatePO={handleCreatePO} onReceivePO={handleReceivePO} onCancelPO={handleCancelPO} shopSettings={shopSettings} /></div>}
          {currentView === 'CUSTOMERS' && <div className="h-full overflow-y-auto"><Customers customers={customers} sales={sales} shopSettings={shopSettings} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onBatchSettleDebt={handleBatchSettleDebt} transactions={transactions} /></div>}
          {currentView === 'SUPPLIERS' && <div className="h-full overflow-y-auto"><Suppliers suppliers={suppliers} sales={sales} purchaseOrders={purchaseOrders} transactions={transactions} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} onSettleDebt={handleSettleSupplierDebt} /></div>}
          {currentView === 'EXPENSES' && <div className="h-full overflow-y-auto"><Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} /></div>}
          {currentView === 'DASHBOARD' && <div className="h-full overflow-y-auto pb-20 md:pb-0"><Dashboard currentUser={currentUser} users={users} sales={sales} products={products} expenses={expenses} transactions={transactions} permissionRules={permissionRules} onVoidSale={handleVoidSale} onViewSale={setViewingSale} onSettleDebt={handleSettleDebt} /></div>}
          {currentView === 'STAFF' && <div className="h-full overflow-y-auto pb-20 md:pb-0">{hasPermission(currentUser.role, permissionRules.MANAGE_STAFF) ? <Staff users={users} departments={departments} permissionRules={permissionRules} onUpdateUsers={handleUpdateUsers} onUpdateDepartments={setDepartments} onUpdatePermissionRules={setPermissionRules} currentUser={currentUser} sales={sales} stockLogs={stockLogs} transactions={transactions} /> : <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center"><ShieldAlert size={64} className="mb-4 text-red-400" /><h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2><p>ຕ້ອງການສິດໃນການຈັດການບຸກຄະລາກອນ</p></div>}</div>}
          {currentView === 'SETTINGS' && <div className="h-full overflow-y-auto pb-20 md:pb-0">{hasPermission(currentUser.role, permissionRules.ACCESS_SETTINGS) ? <Settings users={users} onUpdateUsers={handleUpdateUsers} sales={sales} products={products} shopSettings={shopSettings} transactions={transactions} categories={categories} suppliers={suppliers} onUpdateSettings={handleUpdateSettings} onResetData={handleResetData} onRestoreData={handleRestoreData} onImportProducts={handleImportProducts} onUpdateCategories={setCategories} /> : <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center"><ShieldAlert size={64} className="mb-4 text-red-400" /><h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2><p>ຕ້ອງການສິດເຂົ້າເຖິງການຕັ້ງຄ່າລະບົບ</p></div>}</div>}
        </div>
      </main>

      <nav className="md:hidden bg-white border-t border-gray-200 flex overflow-x-auto p-2 z-50 shrink-0 pb-safe gap-2 scrollbar-hide">
         <button onClick={() => setCurrentView('POS')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'POS' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><ShoppingBag size={24} /> <span className="text-[10px] font-medium mt-1">ຂາຍ</span></button>
         <button onClick={() => setCurrentView('DELIVERIES')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'DELIVERIES' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><Truck size={24} /> <span className="text-[10px] font-medium mt-1">ຂົນສົ່ງ</span></button>
         <button onClick={() => setCurrentView('CUSTOMERS')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'CUSTOMERS' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><Users size={24} /> <span className="text-[10px] font-medium mt-1">ລູກຄ້າ</span></button>
         <button onClick={() => setCurrentView('DASHBOARD')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'DASHBOARD' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><LayoutDashboard size={24} /> <span className="text-[10px] font-medium mt-1">ລາຍງານ</span></button>
         {hasPermission(currentUser.role, permissionRules.MANAGE_STAFF) && <button onClick={() => setCurrentView('STAFF')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'STAFF' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><UserCog size={24} /> <span className="text-[10px] font-medium mt-1">ພະນັກງານ</span></button>}
         <button onClick={() => setCurrentView('SETTINGS')} className={`flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'SETTINGS' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><SettingsIcon size={24} /> <span className="text-[10px] font-medium mt-1">ຕັ້ງຄ່າ</span></button>
      </nav>

      {viewingSale && <Receipt sale={viewingSale} shopSettings={shopSettings} onClose={() => setViewingSale(null)} onReturnItems={handleReturnItems} />}
    </div>
  );
}

export default App;
