import React, { useState, useMemo } from 'react';
import { Supplier, PaymentTransaction, PurchaseOrder, POStatus } from '../types';
import { Plus, Search, Trash2, Edit2, Save, X, Phone, MapPin, Mail, User, Briefcase, Factory, CreditCard, DollarSign, ArrowUpRight, History } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';

interface SuppliersProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  transactions: PaymentTransaction[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onSettleDebt: (supplierId: string, amount: number) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, purchaseOrders = [], transactions = [], onAddSupplier, onUpdateSupplier, onDeleteSupplier, onSettleDebt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '', contactName: '', phone: '', email: '', address: '', category: ''
  });

  // Calculate Debt per Supplier
  const getSupplierDebt = (supplierId: string) => {
      const poTotal = purchaseOrders
          .filter(po => po.supplierId === supplierId && po.status !== POStatus.CANCELLED)
          .reduce((sum, po) => sum + po.total, 0);

      const paymentsTotal = transactions
          .filter(t => t.referenceId === supplierId && t.type === 'PURCHASE_PAYMENT')
          .reduce((sum, t) => sum + t.amount, 0);

      const poDirectPayments = purchaseOrders
          .filter(po => po.supplierId === supplierId && po.status !== POStatus.CANCELLED)
          .reduce((sum, po) => sum + po.paidAmount, 0);

      return poTotal - poDirectPayments - paymentsTotal;
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contactName: '', phone: '', email: '', address: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenSettleModal = (supplier: Supplier) => {
      const debt = getSupplierDebt(supplier.id);
      if (debt <= 0) return alert('ບໍ່ມີໜີ້ຄ້າງຊຳລະ');
      setViewingSupplier(supplier);
      setSettleAmount(debt.toString());
      setSettleModalOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!viewingSupplier || !settleAmount) return;
      onSettleDebt(viewingSupplier.id, parseFloat(settleAmount));
      setSettleModalOpen(false);
      setViewingSupplier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    if (editingSupplier) {
      onUpdateSupplier({ ...editingSupplier, ...formData } as Supplier);
    } else {
      onAddSupplier({ id: Date.now().toString(), name: formData.name!, contactName: formData.contactName || '', phone: formData.phone!, email: formData.email || '', address: formData.address || '', category: formData.category || '' });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Factory className="text-blue-600" /> ຜູ້ສະໜອງສິນຄ້າ (Suppliers)
          </h2>
          <p className="text-gray-500 text-sm">ຈັດການຂໍ້ມູນບໍລິສັດ ແລະ ຍອດໜີ້ຜູ້ສະໜອງ</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus size={20} /> <span className="hidden md:inline">ເພີ່ມຜູ້ສະໜອງ</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="ຄົ້ນຫາຊື່ ຫຼື ໝວດໝູ່..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-auto flex-1 p-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map(supplier => {
                 const debt = getSupplierDebt(supplier.id);
                 return (
                 <div key={supplier.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group relative">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold"><Factory size={20} /></div>
                          <div>
                             <h3 className="font-bold text-gray-800 line-clamp-1">{supplier.name}</h3>
                             <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{supplier.category || 'General'}</span>
                          </div>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 size={16} /></button>
                          <button onClick={() => {if(confirm('ລຶບຜູ້ສະໜອງນີ້?')) onDeleteSupplier(supplier.id)}} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16} /></button>
                       </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                       <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /><span>{supplier.contactName || '-'}</span></div>
                       <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span className="font-bold">{supplier.phone}</span></div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 uppercase font-bold">ໜີ້ຄ້າງຊຳລະ:</span>
                          <span className={`font-black ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{FORMAT_CURRENCY(debt)}</span>
                       </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                       <button 
                          onClick={() => handleOpenSettleModal(supplier)}
                          disabled={debt <= 0}
                          className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1 disabled:opacity-30"
                       >
                          <DollarSign size={14} /> ຊຳລະໜີ້
                       </button>
                    </div>
                 </div>
              )})}
           </div>
        </div>
      </div>

      {/* Settle Modal */}
      {settleModalOpen && viewingSupplier && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
               <div className="p-4 border-b bg-green-50 flex justify-between items-center">
                  <h3 className="font-bold text-green-800">ຊຳລະໜີ້ຜູ້ສະໜອງ</h3>
                  <button onClick={() => setSettleModalOpen(false)}><X/></button>
               </div>
               <form onSubmit={handleConfirmSettle} className="p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                     <p className="text-xs text-gray-500 mb-1">ຍອດໜີ້ຄ້າງຊຳລະ</p>
                     <p className="text-2xl font-black text-red-600">{FORMAT_CURRENCY(getSupplierDebt(viewingSupplier.id))}</p>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ຈຳນວນເງິນທີ່ຊຳລະ</label>
                     <input type="number" required autoFocus className="w-full p-3 border-2 border-green-500 rounded-xl text-2xl font-bold text-center" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg">ຢືນຢັນການຈ່າຍ</button>
               </form>
            </div>
         </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingSupplier ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ' : 'ເພີ່ມຜູ້ສະໜອງໃໝ່'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ບໍລິສັດ/ຮ້ານ</label><input required type="text" className="w-full p-2.5 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ຜູ້ຕິດຕໍ່</label><input type="text" className="w-full p-2.5 border rounded-lg" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">ເບີໂທລະສັບ</label><input required type="text" className="w-full p-2.5 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ໝວດໝູ່</label><input type="text" className="w-full p-2.5 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ທີ່ຢູ່</label><textarea className="w-full p-2.5 border rounded-lg" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border rounded-lg font-medium">ຍົກເລີກ</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium">ບັນທຶກ</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};