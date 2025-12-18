import React, { useState, useMemo } from 'react';
import { SaleRecord, Product, ExpenseRecord, User, PaymentTransaction, PaymentMethod, PermissionRules } from '../types';
import { FORMAT_CURRENCY, ROLE_LEVEL } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Package, DollarSign, History, FileText, Printer, Trash2, Eye, CheckCircle2, Clock, Wallet, TrendingDown, Star, X, CreditCard, Coins, ListFilter, AlertCircle, ArrowUpRight, ArrowDownLeft, Lock, Truck } from 'lucide-react';

interface DashboardProps {
  currentUser: User | null;
  users: User[];
  sales: SaleRecord[];
  products: Product[];
  expenses: ExpenseRecord[];
  transactions: PaymentTransaction[];
  permissionRules: PermissionRules;
  onVoidSale: (saleId: string, authorizedById?: string) => void;
  onViewSale: (sale: SaleRecord) => void;
  onSettleDebt: (saleId: string, amount: number) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const EXPENSE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#06B6D4', '#6366F1'];

const expenseCategoryLabels: Record<string, string> = {
    'RENT': 'ຄ່າເຊົ່າ',
    'UTILITIES': 'ນ້ຳ/ໄຟ',
    'SALARY': 'ເງິນເດືອນ',
    'MARKETING': 'ການຕະຫຼາດ',
    'MAINTENANCE': 'ສ້ອມແປງ',
    'OTHER': 'ອື່ນໆ'
  };

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, users, sales, products, expenses = [], transactions = [], permissionRules, onVoidSale, onViewSale, onSettleDebt }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEBTORS' | 'CASHFLOW'>('OVERVIEW');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  // Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedDebtSale, setSelectedDebtSale] = useState<SaleRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);

  // Admin Auth Modal for Void
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState<SaleRecord | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Helper: Date Checking
  const checkDateMatch = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'TODAY') {
        return d >= todayStart;
    }
    if (dateFilter === 'WEEK') {
        const oneWeekAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        return d >= oneWeekAgo;
    }
    if (dateFilter === 'MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filter Sales based on Date (Accrual Basis - Created Date)
  const filteredSales = useMemo(() => {
    return sales.filter(sale => checkDateMatch(sale.date));
  }, [sales, dateFilter]);

  // Filter Transactions based on Date (Cash Basis - Payment Date)
  const filteredTransactions = useMemo(() => {
      return transactions.filter(txn => checkDateMatch(txn.date));
  }, [transactions, dateFilter]);

  // Filter only COMPLETED sales for stats
  const activeSales = useMemo(() => filteredSales.filter(s => s.status !== 'VOIDED'), [filteredSales]);
  
  // Calculate Revenue (Accrual)
  const totalRevenue = activeSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalProfit = activeSales.reduce((acc, sale) => acc + (sale.profit || 0), 0); // Gross Profit
  
  // Calculate Cash Flow (Cash Basis)
  const cashInHand = filteredTransactions
    .filter(t => t.method === PaymentMethod.CASH && (t.type === 'SALE' || t.type === 'DEBT_PAYMENT'))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const transferReceived = filteredTransactions
    .filter(t => t.method === PaymentMethod.TRANSFER && (t.type === 'SALE' || t.type === 'DEBT_PAYMENT'))
    .reduce((sum, t) => sum + t.amount, 0);

  const cashExpenses = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const refunds = filteredTransactions
    .filter(t => t.type === 'REFUND')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netCashFlow = (cashInHand + transferReceived) - cashExpenses - refunds;

  // Credit Pending (Global)
  const allUnpaidBills = sales.filter(s => s.paymentStatus !== 'PAID' && s.status !== 'VOIDED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalCreditPending = allUnpaidBills.reduce((acc, sale) => acc + (sale.total - (sale.receivedAmount || 0)), 0);
  
  // Inventory Value Calculation
  const totalStockCost = useMemo(() => products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0), [products]);

  // Low Stock Items
  const lowStockItems = useMemo(() => {
     return products
       .filter(p => !p.isCustom && p.stock <= 10)
       .sort((a, b) => a.stock - b.stock); // Ascending order
  }, [products]);

  // Sort sales by date (newest first) for history
  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Chart Data Preparation ---
  
  // 1. Sales Trend
  const salesTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    let daysToLookBack = 7;
    if (dateFilter === 'TODAY') daysToLookBack = 1;
    if (dateFilter === 'MONTH') daysToLookBack = 30;
    if (dateFilter === 'ALL') daysToLookBack = 30; 

    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const daySales = activeSales.filter(s => s.date.startsWith(dateStr));
      const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
      const profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);

      data.push({
        name: d.toLocaleDateString('lo-LA', { weekday: 'short', day: 'numeric' }),
        revenue,
        profit
      });
    }
    return data;
  }, [activeSales, dateFilter]);

  // 2. Expense Breakdown
  const expenseData = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.filter(e => checkDateMatch(e.date)).forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.keys(counts).map(key => ({
      name: expenseCategoryLabels[key] || key,
      value: counts[key]
    }));
  }, [expenses, dateFilter]);


  // 4. Top Selling Products
  const topProducts = useMemo(() => {
    const productStats: Record<string, { name: string, quantity: number, revenue: number, unit: string }> = {};
    
    activeSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productStats[item.id]) {
          productStats[item.id] = { name: item.name, quantity: 0, revenue: 0, unit: item.unit };
        }
        productStats[item.id].quantity += item.quantity;
        productStats[item.id].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Changed to Top 10 for report
  }, [activeSales]);

  // --- Handlers ---

  const handleVoidClick = (sale: SaleRecord) => {
    if (sale.status === 'VOIDED') return;
    
    // Check permission based on Rules
    const userRole = currentUser?.role || 'EMPLOYEE';
    const requiredLevel = permissionRules.VOID_BILL;
    const userLevel = ROLE_LEVEL[userRole] || 0;
    const hasPermission = userLevel >= requiredLevel;

    if (hasPermission) {
        if (window.confirm(`ຕ້ອງການຍົກເລີກບິນ #${sale.id.slice(-6)} ແທ້ບໍ່?\n(ສິນຄ້າຈະຖືກຄືນເຂົ້າສາງ)`)) {
            onVoidSale(sale.id, currentUser?.id);
        }
    } else {
        setSaleToVoid(sale);
        setAuthUsername('');
        setAuthPassword('');
        setAuthError('');
        setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const requiredLevel = permissionRules.VOID_BILL;
      
      const adminUser = users.find(u => {
         const userLevel = ROLE_LEVEL[u.role] || 0;
         return userLevel >= requiredLevel && u.username.toLowerCase() === authUsername.toLowerCase() && u.password === authPassword;
      });
      
      if (adminUser) {
          if (saleToVoid && window.confirm(`ຕ້ອງການຍົກເລີກບິນ #${saleToVoid.id.slice(-6)} ແທ້ບໍ່?`)) {
              onVoidSale(saleToVoid.id, adminUser.id);
              setShowAuthModal(false);
              setSaleToVoid(null);
          }
      } else {
          setAuthError('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ມີສິດອະນຸມັດ (Insufficient Permission)');
      }
  };

  // ... (Rest of component remains largely unchanged, just passing props)
  // Re-using the same UI logic as previous but with updated imports and props destructuring
  
  const handleOpenSettleModal = (sale: SaleRecord) => {
    setSelectedDebtSale(sale);
    const remaining = sale.total - (sale.receivedAmount || 0);
    setSettleAmount(remaining.toString());
    setSettleModalOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtSale || !settleAmount) return;
    
    const amount = parseInt(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    onSettleDebt(selectedDebtSale.id, amount);
    setSettleModalOpen(false);
    setSelectedDebtSale(null);
    setSettleAmount('');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'TODAY': return 'ມື້ນີ້ (Today)';
      case 'WEEK': return '7 ວັນຍ້ອນຫຼັງ (Last 7 Days)';
      case 'MONTH': return 'ເດືອນນີ້ (This Month)';
      case 'ALL': return 'ທັງໝົດ (All Time)';
      default: return '';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in pb-20 md:pb-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ພາບລວມທຸລະກິດ (Dashboard)</h2>
          <p className="text-sm text-gray-500">ສະຖິຕິການຂາຍ ແລະ ຜົນປະກອບການ</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex shrink-0">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'OVERVIEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ພາບລວມ
            </button>
            <button 
              onClick={() => setActiveTab('CASHFLOW')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'CASHFLOW' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ກະແສເງິນ
            </button>
            <button 
              onClick={() => setActiveTab('DEBTORS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'DEBTORS' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ລູກໜີ້
              {allUnpaidBills.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{allUnpaidBills.length}</span>
              )}
            </button>
          </div>

          {/* Date Filter */}
          {activeTab !== 'DEBTORS' && (
             <div className="bg-white border border-gray-200 p-1 rounded-lg flex shrink-0">
                <button onClick={() => setDateFilter('TODAY')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dateFilter === 'TODAY' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>ມື້ນີ້</button>
                <button onClick={() => setDateFilter('WEEK')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dateFilter === 'WEEK' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>7 ວັນ</button>
                <button onClick={() => setDateFilter('MONTH')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dateFilter === 'MONTH' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>ເດືອນນີ້</button>
                <button onClick={() => setDateFilter('ALL')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dateFilter === 'ALL' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>ທັງໝົດ</button>
             </div>
          )}

          {/* Print Button */}
          {activeTab === 'OVERVIEW' && (
             <button 
               onClick={() => setShowReportModal(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-sm transition-colors"
               title="ພິມລາຍງານ"
             >
               <Printer size={20} />
             </button>
          )}
        </div>
      </div>

      {activeTab === 'OVERVIEW' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={24} /></div>
                <span className="text-blue-100 text-sm">ຍອດຂາຍ (Revenue)</span>
              </div>
              <p className="text-3xl font-bold relative z-10">{FORMAT_CURRENCY(totalRevenue)}</p>
              <p className="text-blue-100 text-xs mt-1 relative z-10">ບິນຂາຍ: {activeSales.length} ໃບ</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
               <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
                <span className="text-green-100 text-sm">ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)</span>
              </div>
              <p className="text-3xl font-bold relative z-10">{FORMAT_CURRENCY(totalProfit)}</p>
              <p className="text-green-100 text-xs mt-1 relative z-10">ບໍ່ລວມຄ່າໃຊ້ຈ່າຍບໍລິຫານ</p>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
               <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg"><Clock size={24} /></div>
                <span className="text-orange-100 text-sm">ຍອດໜີ້ຄ້າງຊຳລະ (ທັງໝົດ)</span>
              </div>
              <p className="text-3xl font-bold relative z-10">{FORMAT_CURRENCY(totalCreditPending)}</p>
              <p className="text-orange-100 text-xs mt-1 relative z-10">{allUnpaidBills.length} ລາຍການ</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-full"><Package size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">ສິນຄ້າໃນສາງ</p>
                <p className="text-lg font-bold text-gray-800">{products.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><Coins size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">ມູນຄ່າສາງ (Cost)</p>
                <p className="text-lg font-bold text-purple-600">{FORMAT_CURRENCY(totalStockCost)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-full"><Wallet size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">ເງິນສົດຮັບຈິງ</p>
                <p className="text-lg font-bold text-green-600">{FORMAT_CURRENCY(cashInHand)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-full"><TrendingDown size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">ລາຍຈ່າຍ</p>
                <p className="text-lg font-bold text-red-600">{FORMAT_CURRENCY(cashExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                ທ່າອ່ຽງການຂາຍ ({getDateFilterLabel()})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => FORMAT_CURRENCY(value)}
                    />
                    <Legend />
                    <Bar name="ຍອດຂາຍ" dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar name="ກຳໄລ" dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingDown size={20} className="text-red-500" />
                ສັດສ່ວນລາຍຈ່າຍ
              </h3>
              <div className="flex-1 min-h-[250px] relative">
                {expenseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         formatter={(value: number) => FORMAT_CURRENCY(value)}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    ບໍ່ມີຂໍ້ມູນລາຍຈ່າຍ
                  </div>
                )}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <span className="block text-xl font-bold text-gray-800">{FORMAT_CURRENCY(cashExpenses)}</span>
                      <span className="text-[10px] text-gray-500">Total</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Star size={20} className="text-yellow-500" />
                   ສິນຄ້າຂາຍດີ (Top 5)
                 </h3>
               </div>
               <div className="p-2 flex-1">
                 {topProducts.slice(0,5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                             {index + 1}
                          </div>
                          <div>
                             <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                             <p className="text-xs text-gray-500">{item.quantity} {item.unit} sold</p>
                          </div>
                       </div>
                       <span className="text-sm font-bold text-blue-600">{FORMAT_CURRENCY(item.revenue)}</span>
                    </div>
                 ))}
                 {topProducts.length === 0 && (
                   <div className="p-8 text-center text-gray-400 text-sm">ຍັງບໍ່ມີຂໍ້ມູນການຂາຍ</div>
                 )}
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-red-50">
                 <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                   <AlertCircle size={20} />
                   ສິນຄ້າໃກ້ໝົດ (Low Stock)
                 </h3>
                 <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{lowStockItems.length}</span>
               </div>
               <div className="p-2 flex-1 overflow-auto max-h-[300px]">
                 {lowStockItems.length > 0 ? (
                    <table className="w-full text-left text-sm">
                       <tbody className="divide-y divide-gray-100">
                          {lowStockItems.slice(0, 8).map(item => (
                             <tr key={item.id}>
                                <td className="p-3 text-gray-700 line-clamp-1">{item.name}</td>
                                <td className="p-3 text-right font-bold text-red-600">{item.stock} {item.unit}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                       <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                       <p>ສະຕັອກປົກກະຕິ</p>
                    </div>
                 )}
               </div>
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="text-gray-500" size={20} />
                  ຂາຍລ່າສຸດ
                </h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-gray-100">
                    {sortedSales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${sale.status === 'VOIDED' ? 'bg-red-50/50' : ''}`}>
                        <td className="p-3">
                           <div className="text-sm font-bold text-gray-800">#{sale.id.slice(-6)}</div>
                           <div className="text-xs text-gray-500 flex items-center gap-1">
                              {new Date(sale.date).toLocaleTimeString('lo-LA', {hour: '2-digit', minute:'2-digit'})}
                              {sale.salespersonName && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">• {sale.salespersonName}</span>}
                           </div>
                        </td>
                        <td className="p-3 text-right">
                           <div className={`text-sm font-bold ${sale.status === 'VOIDED' ? 'text-gray-400 line-through' : 'text-blue-600'}`}>{FORMAT_CURRENCY(sale.total)}</div>
                           <div className="text-[10px] text-gray-500">{sale.paymentMethod}</div>
                        </td>
                        <td className="p-3 text-center">
                            <div className="flex justify-center gap-1">
                               <button 
                                 onClick={() => onViewSale(sale)}
                                 className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                               >
                                 <Eye size={16} />
                               </button>
                               {sale.status !== 'VOIDED' && (
                                  <button 
                                    onClick={() => handleVoidClick(sale)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Void Bill"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                               )}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'CASHFLOW' ? (
         <div className="space-y-6 animate-fade-in">
            {/* ... (Cashflow content remains the same) ... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">ເງິນສົດຮັບເຂົ້າ (Cash In)</p>
                  <p className="text-2xl font-bold text-green-600">{FORMAT_CURRENCY(cashInHand)}</p>
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                     <ArrowUpRight size={14} className="text-green-500" /> ລວມຮັບຊຳລະໜີ້
                  </div>
               </div>
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">ໂອນເງິນເຂົ້າ (Transfer)</p>
                  <p className="text-2xl font-bold text-blue-600">{FORMAT_CURRENCY(transferReceived)}</p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">ຈ່າຍອອກ (Expense/Refund)</p>
                  <p className="text-2xl font-bold text-red-600">{FORMAT_CURRENCY(cashExpenses + refunds)}</p>
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                     <ArrowDownLeft size={14} className="text-red-500" /> ລວມຄືນເງິນ
                  </div>
               </div>
               <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm text-white">
                  <p className="text-sm text-gray-400 mb-1">ເງິນສົດສຸດທິ (Net Cash)</p>
                  <p className="text-2xl font-bold">{FORMAT_CURRENCY(cashInHand - cashExpenses - refunds)}</p>
                  <p className="text-xs text-gray-500 mt-2">ຄວນມີໃນລິ້ນຊັກເກັບເງິນ</p>
               </div>
            </div>

            {/* Detailed Transaction Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <ListFilter size={20} /> ລາຍການເຄື່ອນໄຫວ (Transaction Log) - {getDateFilterLabel()}
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                           <th className="p-3">ເວລາ</th>
                           <th className="p-3">ປະເພດ</th>
                           <th className="p-3">ລາຍລະອຽດ</th>
                           <th className="p-3 text-center">ຊ່ອງທາງ</th>
                           <th className="p-3 text-right">ຈຳນວນເງິນ</th>
                           <th className="p-3">ຜູ້ເຮັດທຸລະກຳ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredTransactions.length > 0 ? (
                           filteredTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(txn => (
                              <tr key={txn.id} className="hover:bg-gray-50">
                                 <td className="p-3 text-gray-500">{new Date(txn.date).toLocaleTimeString('lo-LA')}</td>
                                 <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                       txn.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                                       txn.type === 'DEBT_PAYMENT' ? 'bg-green-100 text-green-700' :
                                       txn.type === 'EXPENSE' ? 'bg-red-100 text-red-700' :
                                       'bg-orange-100 text-orange-700'
                                    }`}>
                                       {txn.type}
                                    </span>
                                 </td>
                                 <td className="p-3 text-gray-700">{txn.note || '-'}</td>
                                 <td className="p-3 text-center text-xs font-mono">{txn.method}</td>
                                 <td className={`p-3 text-right font-bold ${
                                    txn.type === 'EXPENSE' || txn.type === 'REFUND' ? 'text-red-600' : 'text-green-600'
                                 }`}>
                                    {txn.type === 'EXPENSE' || txn.type === 'REFUND' ? '-' : '+'}{FORMAT_CURRENCY(txn.amount)}
                                 </td>
                                 <td className="p-3 text-gray-500 text-xs">{txn.performedBy}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400">ບໍ່ມີລາຍການເຄື່ອນໄຫວ</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           {/* Debtors List - No changes needed */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
                 <h3 className="font-bold text-orange-800 flex items-center gap-2">
                   <FileText size={20} />
                   ລາຍການບິນຄ້າງຊຳລະ (Unpaid Bills)
                 </h3>
                 <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                   Total: {FORMAT_CURRENCY(allUnpaidBills.reduce((acc, s) => acc + (s.total - (s.receivedAmount || 0)), 0))}
                 </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ວັນທີ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ເລກບິນ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ລູກຄ້າ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ຍອດລວມ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ຈ່າຍແລ້ວ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">ຍອດຄ້າງ</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUnpaidBills.length > 0 ? (
                      allUnpaidBills.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(sale.date).toLocaleDateString('lo-LA')}
                          </td>
                          <td className="p-4 text-sm font-medium text-blue-600 flex items-center gap-1">
                            #{sale.id.slice(-6)}
                            {sale.delivery && <Truck size={14} className="text-orange-500" />}
                          </td>
                          <td className="p-4 text-sm font-bold text-gray-800">
                             {sale.customerName}
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                             {FORMAT_CURRENCY(sale.total)}
                          </td>
                          <td className="p-4 text-sm text-green-600">
                             {FORMAT_CURRENCY(sale.receivedAmount || 0)}
                          </td>
                          <td className="p-4 text-sm font-bold text-right text-red-600">
                            {FORMAT_CURRENCY(sale.total - (sale.receivedAmount || 0))}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => onViewSale(sale)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-200"
                              >
                                ເບິ່ງບິນ
                              </button>
                              <button 
                                onClick={() => handleOpenSettleModal(sale)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 shadow-sm flex items-center gap-1"
                              >
                                <DollarSign size={14} /> ຊຳລະ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400">
                           <CheckCircle2 size={48} className="mx-auto mb-2 text-green-400" />
                           <p>ບໍ່ມີລາຍການຄ້າງຊຳລະ</p>
                           <p className="text-xs">No pending bills</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* Settle Debt Modal */}
      {settleModalOpen && selectedDebtSale && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
               <h3 className="font-bold text-green-800 flex items-center gap-2">
                 <CreditCard size={20} />
                 ຊຳລະໜີ້ (Settle Debt)
               </h3>
               <button onClick={() => setSettleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={24} />
               </button>
             </div>
             
             <form onSubmit={handleConfirmSettle} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                   <p className="text-sm text-gray-500 mb-1">ຍອດໜີ້ຄົງເຫຼືອ (Remaining)</p>
                   <p className="text-3xl font-bold text-red-600">
                     {FORMAT_CURRENCY(selectedDebtSale.total - (selectedDebtSale.receivedAmount || 0))}
                   </p>
                   <p className="text-xs text-gray-400 mt-2">Bill #{selectedDebtSale.id.slice(-6)} - {selectedDebtSale.customerName}</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນເງິນທີ່ຊຳລະ (ກີບ)</label>
                   <input
                     required
                     type="number"
                     min="1"
                     max={selectedDebtSale.total - (selectedDebtSale.receivedAmount || 0)}
                     autoFocus
                     className="w-full p-3 border-2 border-green-500 rounded-xl focus:ring-4 focus:ring-green-100 outline-none text-center text-2xl font-bold text-gray-800"
                     placeholder="0"
                     value={settleAmount}
                     onChange={e => setSettleAmount(e.target.value)}
                   />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2 shadow-lg shadow-green-100"
                >
                  <CheckCircle2 size={20} />
                  ຢືນຢັນການຊຳລະ
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Admin Authorization Modal for Void */}
      {showAuthModal && saleToVoid && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
               <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2">
                     <Lock size={20} /> ຢືນຢັນສິດ (Authorization)
                  </h3>
                  <button onClick={() => {setShowAuthModal(false); setSaleToVoid(null)}} className="hover:bg-red-700 p-1 rounded">
                     <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                  <div className="text-center text-gray-600 mb-4 text-sm">
                     <p>ຕ້ອງການຍົກເລີກບິນ #{saleToVoid.id.slice(-6)}</p>
                     <p className="text-red-600 font-bold mt-1">ຕ້ອງການສິດລະດັບ {permissionRules.VOID_BILL} ຂຶ້ນໄປ</p>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ຜູ້ໃຊ້ (Username)</label>
                     <input 
                        type="text" 
                        required
                        autoFocus
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                        value={authUsername}
                        onChange={e => setAuthUsername(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ລະຫັດຜ່ານ (Password)</label>
                     <input 
                        type="password" 
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                     />
                  </div>
                  {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
                  <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">
                     ຢືນຢັນ
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        // ... (existing Report Modal code) ...
        <div id="dashboard-report-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
           <div id="dashboard-report-content" className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[80vh]">
              
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 no-print">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Printer size={20} className="text-blue-600" />
                    ລາຍງານສະຫຼຸບ ({getDateFilterLabel()})
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={handlePrintReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm">
                       <Printer size={18} /> ພິມ (Print)
                    </button>
                    <button onClick={() => setShowReportModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                       <X size={24} />
                    </button>
                 </div>
              </div>

              <div className="p-8 md:p-12 flex-1 bg-white text-gray-800">
                 <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-2xl font-bold uppercase mb-1">MAHAXAY CONSTRUCTION MATERIALS</h1>
                    <h2 className="text-xl font-bold text-gray-700">ໃບສະຫຼຸບການເງິນ (Financial Report)</h2>
                    <p className="text-sm text-gray-500 mt-2">ໄລຍະເວລາ: {getDateFilterLabel()}</p>
                    <p className="text-sm text-gray-500">ວັນທີພິມ: {new Date().toLocaleString('lo-LA')}</p>
                 </div>

                 {/* Cash Flow Summary (Cash Basis) */}
                 <div className="mb-8">
                    <h3 className="font-bold text-sm text-gray-700 uppercase mb-2 border-b border-gray-200 pb-1">ສະຫຼຸບເງິນສົດ (Cash Flow)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 p-3 rounded">
                           <p className="text-xs text-gray-500">ເງິນສົດຮັບເຂົ້າ (Cash In)</p>
                           <p className="text-lg font-bold text-green-600">{FORMAT_CURRENCY(cashInHand)}</p>
                        </div>
                        <div className="border border-gray-200 p-3 rounded">
                           <p className="text-xs text-gray-500">ໂອນເງິນເຂົ້າ (Transfer)</p>
                           <p className="text-lg font-bold text-blue-600">{FORMAT_CURRENCY(transferReceived)}</p>
                        </div>
                        <div className="border border-gray-200 p-3 rounded">
                           <p className="text-xs text-gray-500">ຈ່າຍອອກ (Out)</p>
                           <p className="text-lg font-bold text-red-600">{FORMAT_CURRENCY(cashExpenses + refunds)}</p>
                        </div>
                        <div className="border border-gray-200 p-3 rounded bg-gray-50">
                           <p className="text-xs text-gray-500">ຄົງເຫຼືອໃນລິ້ນຊັກ (Net Cash)</p>
                           <p className="text-lg font-bold text-gray-800">{FORMAT_CURRENCY(cashInHand - cashExpenses - refunds)}</p>
                        </div>
                    </div>
                 </div>

                 {/* Sales Summary (Accrual Basis) */}
                 <div className="mb-8">
                    <h3 className="font-bold text-sm text-gray-700 uppercase mb-2 border-b border-gray-200 pb-1">ສະຫຼຸບການຂາຍ (Sales Performance)</h3>
                    <table className="w-full text-sm">
                       <tbody>
                          <tr className="border-b border-gray-100">
                             <td className="py-2">ຍອດຂາຍລວມ (Total Revenue)</td>
                             <td className="py-2 text-right font-bold">{FORMAT_CURRENCY(totalRevenue)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                             <td className="py-2">ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)</td>
                             <td className="py-2 text-right font-bold text-green-600">{FORMAT_CURRENCY(totalProfit)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                             <td className="py-2">ຈຳນວນບິນຂາຍ</td>
                             <td className="py-2 text-right">{activeSales.length} ໃບ</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>

                 {/* Expense Breakdown */}
                 {expenseData.length > 0 && (
                    <div className="mb-8">
                       <h3 className="font-bold text-sm text-gray-700 uppercase mb-2 border-b border-gray-200 pb-1">ລາຍຈ່າຍ (Expenses)</h3>
                       <table className="w-full text-sm">
                          <tbody>
                             {expenseData.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                   <td className="py-2">{item.name}</td>
                                   <td className="py-2 text-right font-medium text-red-600">{FORMAT_CURRENCY(item.value)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 )}

                 {/* Signature Area */}
                 <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-200">
                    <div className="text-center">
                       <p className="text-sm font-bold mb-12">ຜູ້ສະຫຼຸບ (Prepared By)</p>
                       <div className="border-b border-gray-400 w-2/3 mx-auto"></div>
                    </div>
                    <div className="text-center">
                       <p className="text-sm font-bold mb-12">ຜູ້ກວດສອບ (Approved By)</p>
                       <div className="border-b border-gray-400 w-2/3 mx-auto"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};