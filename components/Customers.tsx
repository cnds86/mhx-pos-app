import React, { useState } from 'react';
import { Customer, SaleRecord, ShopSettings, PaymentTransaction } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Plus, Search, Trash2, Edit2, Save, X, User, Phone, MapPin, Briefcase, History, Clock, TrendingUp, FileText, Printer, CreditCard, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  sales: SaleRecord[];
  shopSettings: ShopSettings;
  transactions?: PaymentTransaction[]; // Made optional to prevent breaking if not passed initially
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onBatchSettleDebt: (customerId: string, amount: number) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, sales, shopSettings, transactions = [], onAddCustomer, onUpdateCustomer, onDeleteCustomer, onBatchSettleDebt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // History / Statement State
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);
  const [historyTab, setHistoryTab] = useState<'HISTORY' | 'STATEMENT' | 'PAYMENTS'>('HISTORY');
  
  // Payment Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState<string>('');

  // Print Statement Modal State
  const [showStatementPrint, setShowStatementPrint] = useState(false);

  // Receipt Print State
  const [printingTransaction, setPrintingTransaction] = useState<PaymentTransaction | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    type: 'GENERAL',
    address: '',
    creditLimit: 0
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        type: 'GENERAL',
        address: '',
        creditLimit: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomer) {
      onUpdateCustomer({ ...editingCustomer, ...formData } as Customer);
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name!,
        phone: formData.phone || '',
        type: formData.type as 'GENERAL' | 'VIP' | 'CONTRACTOR',
        address: formData.address || '',
        creditLimit: formData.creditLimit || 0
      };
      onAddCustomer(newCustomer);
    }
    setIsModalOpen(false);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'VIP': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CONTRACTOR': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Calculate Debts
  const getCustomerDebt = (customerId: string) => {
    return sales
      .filter(s => s.customerId === customerId && s.paymentStatus !== 'PAID' && s.status !== 'VOIDED')
      .reduce((sum, s) => sum + (s.total - (s.receivedAmount || 0)), 0);
  };

  // Calculate Lifetime Value
  const getCustomerLifetimeValue = (customerId: string) => {
    return sales
      .filter(s => s.customerId === customerId && s.status !== 'VOIDED')
      .reduce((sum, s) => sum + s.total, 0);
  };

  // Get Customer History (All)
  const getCustomerHistory = (customerId: string) => {
    return sales
      .filter(s => s.customerId === customerId && s.status !== 'VOIDED')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get Unpaid Invoices
  const getUnpaidInvoices = (customerId: string) => {
    return sales
      .filter(s => s.customerId === customerId && s.paymentStatus !== 'PAID' && s.status !== 'VOIDED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first
  };

  // Get Payment History (New)
  const getPaymentHistory = (customerId: string) => {
     // 1. Get Sale IDs belonging to this customer
     const customerSaleIds = new Set(sales.filter(s => s.customerId === customerId).map(s => s.id));
     
     // 2. Filter Transactions
     return transactions.filter(t => 
        t.type === 'DEBT_PAYMENT' && (
           t.referenceId === customerId || // Direct batch payment
           (t.referenceId && customerSaleIds.has(t.referenceId)) // Single sale payment
        )
     ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingHistory) return;
    
    const amount = parseInt(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    onBatchSettleDebt(viewingHistory.id, amount);
    setSettleModalOpen(false);
    setSettleAmount('');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handlePrintPaymentReceipt = () => {
      window.print();
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ຂໍ້ມູນລູກຄ້າ (Customers)</h2>
          <p className="text-gray-500 text-sm">ຈັດການລາຍຊື່ລູກຄ້າ ແລະ ສະມາຊິກ</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden md:inline">ເພີ່ມລູກຄ້າໃໝ່</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List View */}
        <div className="overflow-auto flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => {
              const totalDebt = getCustomerDebt(customer.id);
              const lifetimeValue = getCustomerLifetimeValue(customer.id);
              const creditLimit = customer.creditLimit || 0;
              const creditUsage = creditLimit > 0 ? (totalDebt / creditLimit) * 100 : 0;

              return (
                <div key={customer.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        customer.type === 'VIP' ? 'bg-purple-100 text-purple-600' : 
                        customer.type === 'CONTRACTOR' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{customer.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getBadgeColor(customer.type)}`}>
                          {customer.type}
                        </span>
                      </div>
                    </div>
                    {customer.id !== '1' && ( // Prevent deleting default customer
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenModal(customer)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => {if(confirm('ລຶບລູກຄ້ານີ້?')) onDeleteCustomer(customer.id)}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{customer.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="truncate">{customer.address || '-'}</span>
                    </div>
                  </div>

                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-gray-50 p-2 rounded-lg">
                     <div>
                        <p className="text-gray-500">ຍອດຊື້ລວມ</p>
                        <p className="font-bold text-blue-600">{FORMAT_CURRENCY(lifetimeValue)}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-gray-500">ສະຖານະໜີ້</p>
                        <p className={`font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                           {totalDebt > 0 ? FORMAT_CURRENCY(totalDebt) : 'ປົກກະຕິ'}
                        </p>
                     </div>
                  </div>

                  {/* Credit Limit Bar */}
                  {creditLimit > 0 && (
                     <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                           <span>Credit Limit</span>
                           <span>{creditUsage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full ${creditUsage > 90 ? 'bg-red-500' : creditUsage > 70 ? 'bg-orange-500' : 'bg-green-500'}`} 
                              style={{width: `${Math.min(100, creditUsage)}%`}}
                           ></div>
                        </div>
                        <p className="text-[10px] text-right mt-0.5 text-gray-400">{FORMAT_CURRENCY(creditLimit)}</p>
                     </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                     <button 
                       onClick={() => { setViewingHistory(customer); setHistoryTab('HISTORY'); }}
                       className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                     >
                        <History size={14} />
                        ເບິ່ງປະຫວັດ
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredCustomers.length === 0 && (
             <div className="text-center py-10 text-gray-500">
               ບໍ່ພົບຂໍ້ມູນລູກຄ້າ
             </div>
          )}
        </div>
      </div>

      {/* Modal - Add/Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingCustomer ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມລູກຄ້າໃໝ່'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ລູກຄ້າ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    required
                    type="text"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ເບີໂທລະສັບ</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="020 xxxx xxxx"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">ປະເພດລູກຄ້າ</label>
                   <div className="relative">
                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <select
                       className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                       value={formData.type}
                       onChange={e => setFormData({...formData, type: e.target.value as any})}
                     >
                       <option value="GENERAL">ລູກຄ້າທົ່ວໄປ (General)</option>
                       <option value="CONTRACTOR">ຜູ້ຮັບເໝົາ (Contractor)</option>
                       <option value="VIP">ລູກຄ້າ VIP</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">ວົງເງິນສິນເຊື່ອ (Credit Limit)</label>
                   <div className="relative">
                     <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input
                       type="number"
                       min="0"
                       className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       placeholder="0 = ບໍ່ຈຳກັດ"
                       value={formData.creditLimit || ''}
                       onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
                     />
                   </div>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ທີ່ຢູ່</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2 font-medium"
                >
                  <Save size={18} />
                  ບັນທຶກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History/Statement Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                       <User className="text-blue-600" />
                       {viewingHistory.name}
                    </h3>
                    <p className="text-sm text-gray-500">{viewingHistory.phone}</p>
                 </div>
                 <button onClick={() => setViewingHistory(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 overflow-x-auto">
                 <button 
                   onClick={() => setHistoryTab('HISTORY')}
                   className={`flex-1 py-3 px-4 text-sm font-bold transition-colors whitespace-nowrap ${historyTab === 'HISTORY' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                    ປະຫວັດການຊື້ (Sales)
                 </button>
                 <button 
                   onClick={() => setHistoryTab('STATEMENT')}
                   className={`flex-1 py-3 px-4 text-sm font-bold transition-colors whitespace-nowrap ${historyTab === 'STATEMENT' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                    ໃບແຈ້ງໜີ້ (Statement)
                 </button>
                 <button 
                   onClick={() => setHistoryTab('PAYMENTS')}
                   className={`flex-1 py-3 px-4 text-sm font-bold transition-colors whitespace-nowrap ${historyTab === 'PAYMENTS' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                    ປະຫວັດການຊຳລະ (Payments)
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-gray-50">
                 {/* HISTORY TAB */}
                 {historyTab === 'HISTORY' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50">
                             <tr>
                                <th className="p-3 text-xs font-semibold text-gray-500">ວັນທີ</th>
                                <th className="p-3 text-xs font-semibold text-gray-500">ເລກບິນ</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຍອດລວມ</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຈ່າຍແລ້ວ</th>
                                <th className="p-3 text-xs font-semibold text-gray-500 text-center">ສະຖານະ</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {getCustomerHistory(viewingHistory.id).map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                   <td className="p-3 text-sm text-gray-600">
                                      {new Date(sale.date).toLocaleDateString('lo-LA')}
                                   </td>
                                   <td className="p-3 text-sm font-medium text-blue-600">
                                      #{sale.id.slice(-6)}
                                   </td>
                                   <td className="p-3 text-sm font-bold text-right text-gray-800">
                                      {FORMAT_CURRENCY(sale.total)}
                                   </td>
                                   <td className="p-3 text-sm text-right text-green-600">
                                      {FORMAT_CURRENCY(sale.receivedAmount || 0)}
                                   </td>
                                   <td className="p-3 text-center">
                                      {sale.paymentStatus === 'UNPAID' ? (
                                         <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">ຄ້າງຊຳລະ</span>
                                      ) : sale.paymentStatus === 'PARTIAL' ? (
                                         <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">ຄ້າງບາງສ່ວນ</span>
                                      ) : (
                                         <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ຈ່າຍແລ້ວ</span>
                                      )}
                                   </td>
                                </tr>
                             ))}
                             {getCustomerHistory(viewingHistory.id).length === 0 && (
                                <tr>
                                   <td colSpan={5} className="text-center py-8 text-gray-400">
                                      ບໍ່ມີປະຫວັດການຊື້
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 )}

                 {/* STATEMENT TAB */}
                 {historyTab === 'STATEMENT' && (
                    <div className="space-y-4">
                       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="p-3 bg-orange-50 border-b border-orange-100 text-orange-800 font-bold text-sm flex justify-between items-center">
                             <span>ລາຍການຄ້າງຊຳລະ (Outstanding Invoices)</span>
                             <span className="bg-white px-2 py-1 rounded border border-orange-200 text-xs">
                                {getUnpaidInvoices(viewingHistory.id).length} ລາຍການ
                             </span>
                          </div>
                          <table className="w-full text-left">
                             <thead className="bg-gray-50">
                                <tr>
                                   <th className="p-3 text-xs font-semibold text-gray-500">ວັນທີ</th>
                                   <th className="p-3 text-xs font-semibold text-gray-500">ເລກບິນ</th>
                                   <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຍອດເຕັມ</th>
                                   <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຈ່າຍແລ້ວ</th>
                                   <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຍອດຄ້າງ</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {getUnpaidInvoices(viewingHistory.id).map(sale => (
                                   <tr key={sale.id} className="hover:bg-gray-50">
                                      <td className="p-3 text-sm text-gray-600">
                                         {new Date(sale.date).toLocaleDateString('lo-LA')}
                                      </td>
                                      <td className="p-3 text-sm font-medium text-blue-600">
                                         #{sale.id.slice(-6)}
                                      </td>
                                      <td className="p-3 text-sm text-right text-gray-500">
                                         {FORMAT_CURRENCY(sale.total)}
                                      </td>
                                      <td className="p-3 text-sm text-right text-green-600">
                                         {FORMAT_CURRENCY(sale.receivedAmount || 0)}
                                      </td>
                                      <td className="p-3 text-sm font-bold text-right text-red-600">
                                         {FORMAT_CURRENCY(sale.total - (sale.receivedAmount || 0))}
                                      </td>
                                   </tr>
                                ))}
                                {getUnpaidInvoices(viewingHistory.id).length === 0 && (
                                   <tr>
                                      <td colSpan={5} className="text-center py-12 text-gray-400">
                                         <p>ບໍ່ມີໜີ້ຄ້າງຊຳລະ</p>
                                         <p className="text-xs text-green-600 font-bold mt-1">ລູກຄ້າຊັ້ນດີ (No Debt)</p>
                                      </td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}

                 {/* PAYMENTS TAB */}
                 {historyTab === 'PAYMENTS' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 bg-green-50 border-b border-green-100 text-green-800 font-bold text-sm flex justify-between items-center">
                             <span>ປະຫວັດການຊຳລະເງິນ (Payment Logs)</span>
                             <span className="bg-white px-2 py-1 rounded border border-green-200 text-xs">
                                {getPaymentHistory(viewingHistory.id).length} ລາຍການ
                             </span>
                        </div>
                        <table className="w-full text-left">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="p-3 text-xs font-semibold text-gray-500">ວັນທີ/ເວລາ</th>
                                 <th className="p-3 text-xs font-semibold text-gray-500">ປະເພດ</th>
                                 <th className="p-3 text-xs font-semibold text-gray-500 text-right">ຈຳນວນເງິນ</th>
                                 <th className="p-3 text-xs font-semibold text-gray-500 text-center">ຊ່ອງທາງ</th>
                                 <th className="p-3 text-xs font-semibold text-gray-500">ໝາຍເຫດ</th>
                                 <th className="p-3 text-xs font-semibold text-gray-500 text-center">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {getPaymentHistory(viewingHistory.id).map(txn => (
                                 <tr key={txn.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm text-gray-600">
                                       {new Date(txn.date).toLocaleString('lo-LA')}
                                    </td>
                                    <td className="p-3 text-sm">
                                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                          ຊຳລະໜີ້
                                       </span>
                                    </td>
                                    <td className="p-3 text-sm font-bold text-right text-green-600">
                                       {FORMAT_CURRENCY(txn.amount)}
                                    </td>
                                    <td className="p-3 text-center text-sm text-gray-500">
                                       {txn.method}
                                    </td>
                                    <td className="p-3 text-sm text-gray-600">
                                       {txn.note || '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                       <button 
                                          onClick={() => setPrintingTransaction(txn)}
                                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                          title="Print Receipt"
                                       >
                                          <Printer size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {getPaymentHistory(viewingHistory.id).length === 0 && (
                                 <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                       <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                                       <p>ຍັງບໍ່ມີປະຫວັດການຊຳລະໜີ້</p>
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                    </div>
                 )}
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">ຍອດໜີ້ລວມ (Total Debt)</p>
                    <p className="text-2xl font-bold text-red-600">{FORMAT_CURRENCY(getCustomerDebt(viewingHistory.id))}</p>
                 </div>
                 
                 <div className="flex gap-2">
                    {historyTab === 'STATEMENT' && getCustomerDebt(viewingHistory.id) > 0 && (
                       <button 
                         onClick={() => setShowStatementPrint(true)}
                         className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-bold transition-colors"
                       >
                          <Printer size={18} />
                          ພິມໃບແຈ້ງໜີ້
                       </button>
                    )}
                    {getCustomerDebt(viewingHistory.id) > 0 && (
                        <button 
                            onClick={() => {
                                setSettleAmount(getCustomerDebt(viewingHistory.id).toString());
                                setSettleModalOpen(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold shadow-md shadow-green-100 transition-all"
                        >
                            <ArrowUpRight size={18} />
                            ຊຳລະໜີ້
                        </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Settle Debt Modal */}
      {settleModalOpen && viewingHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
               <h3 className="font-bold text-green-800 flex items-center gap-2">
                 <DollarSign size={20} />
                 ຊຳລະໜີ້ (Settle Debt)
               </h3>
               <button onClick={() => setSettleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={24} />
               </button>
             </div>
             
             <form onSubmit={handleSettleSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                   <p className="text-sm text-gray-500 mb-1">ຍອດໜີ້ທັງໝົດ</p>
                   <p className="text-3xl font-bold text-red-600">
                     {FORMAT_CURRENCY(getCustomerDebt(viewingHistory.id))}
                   </p>
                   <p className="text-xs text-gray-400 mt-2">{viewingHistory.name}</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນເງິນທີ່ຊຳລະ (ກີບ)</label>
                   <input
                     required
                     type="number"
                     min="1"
                     max={getCustomerDebt(viewingHistory.id)}
                     autoFocus
                     className="w-full p-3 border-2 border-green-500 rounded-xl focus:ring-4 focus:ring-green-100 outline-none text-center text-2xl font-bold text-gray-800"
                     value={settleAmount}
                     onChange={e => setSettleAmount(e.target.value)}
                   />
                   <p className="text-xs text-gray-500 mt-2 text-center">
                      * ລະບົບຈະຕັດຍອດບິນເກົ່າກ່ອນ (FIFO)
                   </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100"
                >
                  ຢືນຢັນການຊຳລະ
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Printable Statement Modal */}
      {showStatementPrint && viewingHistory && (
         <div id="statement-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div id="statement-content" className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[80vh] relative">
               
               {/* Header (No Print) */}
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <FileText size={20} className="text-blue-600" />
                     ໃບແຈ້ງໜີ້ (Statement Preview)
                  </h3>
                  <div className="flex gap-2">
                     <button onClick={handlePrintStatement} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
                        <Printer size={18} /> ພິມ (Print)
                     </button>
                     <button onClick={() => setShowStatementPrint(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                        <X size={24} />
                     </button>
                  </div>
               </div>

               {/* A4 Content */}
               <div className="p-8 md:p-12 bg-white text-gray-800 flex-1">
                  {/* Shop Header */}
                  <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
                     <div>
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{shopSettings.name}</h1>
                        <p className="font-semibold text-gray-600">{shopSettings.branch}</p>
                        <p className="text-sm text-gray-500">{shopSettings.address}</p>
                        <p className="text-sm text-gray-500">Tel: {shopSettings.phone}</p>
                     </div>
                     <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">ໃບແຈ້ງໜີ້</h2>
                        <h3 className="text-sm text-gray-500 uppercase tracking-wider">STATEMENT OF ACCOUNT</h3>
                        <div className="mt-4 text-sm">
                           <p>ວັນທີ Date: {new Date().toLocaleDateString('lo-LA')}</p>
                        </div>
                     </div>
                  </div>

                  {/* Bill To */}
                  <div className="mb-8">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">ລູກຄ້າ / BILL TO</h4>
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="font-bold text-lg text-gray-800">{viewingHistory.name}</p>
                        <p className="text-sm text-gray-600">Tel: {viewingHistory.phone}</p>
                        <p className="text-sm text-gray-600">Address: {viewingHistory.address || '-'}</p>
                     </div>
                  </div>

                  {/* Table */}
                  <table className="w-full mb-8 text-sm">
                     <thead>
                        <tr className="border-b-2 border-gray-200">
                           <th className="py-2 text-left font-bold text-gray-600">ວັນທີ (Date)</th>
                           <th className="py-2 text-left font-bold text-gray-600">ເລກບິນ (Invoice #)</th>
                           <th className="py-2 text-right font-bold text-gray-600">ຍອດເຕັມ (Amount)</th>
                           <th className="py-2 text-right font-bold text-gray-600">ຈ່າຍແລ້ວ (Paid)</th>
                           <th className="py-2 text-right font-bold text-gray-600">ຍອດຄ້າງ (Balance)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {getUnpaidInvoices(viewingHistory.id).map((sale, idx) => (
                           <tr key={idx}>
                              <td className="py-3 text-gray-600">{new Date(sale.date).toLocaleDateString('lo-LA')}</td>
                              <td className="py-3 font-medium">#{sale.id.slice(-6)}</td>
                              <td className="py-3 text-right">{FORMAT_CURRENCY(sale.total)}</td>
                              <td className="py-3 text-right text-green-600">{FORMAT_CURRENCY(sale.receivedAmount || 0)}</td>
                              <td className="py-3 text-right font-bold">{FORMAT_CURRENCY(sale.total - (sale.receivedAmount || 0))}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-12">
                     <div className="w-64 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center text-lg font-bold text-red-600">
                           <span>ຍອດລວມທັງໝົດ:</span>
                           <span>{FORMAT_CURRENCY(getCustomerDebt(viewingHistory.id))}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1 uppercase tracking-wide">Total Balance Due</p>
                     </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
                     <p>ກະລຸນາຊຳລະເງິນພາຍໃນກຳນົດ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.</p>
                     <p>Please make payment by the due date. Thank you for your business.</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Payment Receipt Modal (Thermal Style) */}
      {printingTransaction && viewingHistory && (
         <div id="receipt-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div id="receipt-content" className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
               
               {/* Header (No Print) */}
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Printer size={20} className="text-blue-600" />
                     ໃບຮັບເງິນ (Receipt)
                  </h3>
                  <div className="flex gap-2">
                     <button onClick={handlePrintPaymentReceipt} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 text-sm">
                        <Printer size={16} /> ພິມ
                     </button>
                     <button onClick={() => setPrintingTransaction(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                     </button>
                  </div>
               </div>

               {/* Receipt Content (Thermal Style) */}
               <div className="p-6 text-gray-800 font-mono text-sm">
                  <div className="text-center mb-6">
                     {shopSettings.logo ? (
                        <img src={shopSettings.logo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
                     ) : (
                        <div className="w-10 h-10 bg-gray-800 text-white rounded-lg flex items-center justify-center mx-auto mb-2 font-bold">
                           {shopSettings.name.charAt(0)}
                        </div>
                     )}
                     <h2 className="text-lg font-bold uppercase">{shopSettings.name}</h2>
                     <p className="text-xs text-gray-500">{shopSettings.branch}</p>
                     <p className="text-xs text-gray-500 mt-1">{shopSettings.phone}</p>
                  </div>

                  <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                     <h3 className="text-center font-bold text-lg mb-4">ໃບຮັບເງິນ / RECEIPT</h3>
                     <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Date:</span>
                        <span>{new Date(printingTransaction.date).toLocaleString('lo-LA')}</span>
                     </div>
                     <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">No:</span>
                        <span>#{printingTransaction.id.slice(-8)}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Cashier:</span>
                        <span>{printingTransaction.performedBy || 'System'}</span>
                     </div>
                  </div>

                  <div className="mb-4 space-y-2">
                     <div className="flex flex-col border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">ໄດ້ຮັບເງິນຈາກ (Received From):</span>
                        <span className="font-bold">{viewingHistory.name}</span>
                     </div>
                     <div className="flex flex-col border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">ລາຍລະອຽດ (Description):</span>
                        <span>{printingTransaction.note || 'ຊຳລະໜີ້ຄ້າງຈ່າຍ (Debt Payment)'}</span>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">ຈຳນວນເງິນ (Amount):</span>
                        <span className="font-bold text-lg">{FORMAT_CURRENCY(printingTransaction.amount)}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>ຊ່ອງທາງ (Method):</span>
                        <span className="uppercase">{printingTransaction.method}</span>
                     </div>
                  </div>

                  <div className="text-center">
                     <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8">
                        <div className="flex justify-between text-xs text-gray-400 px-4">
                           <span>ຜູ້ຮັບເງິນ</span>
                           <span>ຜູ້ຈ່າຍເງິນ</span>
                        </div>
                     </div>
                     <p className="text-xs text-gray-400">ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
                     <p className="text-[10px] text-gray-300 mt-1">{shopSettings.receiptFooter}</p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};