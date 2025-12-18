import React, { useState, useMemo } from 'react';
import { Supplier, Product, PurchaseOrder, POStatus, PurchaseOrderItem, ShopSettings } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Plus, Search, Trash2, Save, X, Printer, ShoppingCart, Calendar, CheckCircle2, AlertCircle, FileText, Package, Briefcase, PlusCircle, MinusCircle, Clock } from 'lucide-react';

interface PurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  onCreatePO: (po: PurchaseOrder) => void;
  onReceivePO: (poId: string) => void;
  onCancelPO: (poId: string) => void;
  shopSettings: ShopSettings;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ purchaseOrders, suppliers, products, onCreatePO, onReceivePO, onCancelPO, shopSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // New PO Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [poNote, setPoNote] = useState('');
  const [poDueDate, setPoDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('0');

  const filteredPOs = purchaseOrders.filter(po => 
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.id.includes(searchTerm)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const addItemToPO = (product: Product) => {
     setPoItems(prev => {
        const existing = prev.find(i => i.productId === product.id);
        if (existing) {
           return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, {
           productId: product.id,
           productName: product.name,
           quantity: 1,
           costPrice: product.costPrice || 0,
           unit: product.unit
        }];
     });
  };

  const updateItemQty = (id: string, delta: number) => {
     setPoItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const updateItemCost = (id: string, cost: number) => {
     setPoItems(prev => prev.map(i => i.productId === id ? { ...i, costPrice: Math.max(0, cost) } : i));
  };

  const removeItemFromPO = (id: string) => {
     setPoItems(prev => prev.filter(i => i.productId !== id));
  };

  const subtotal = poItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const total = subtotal; // Simplified for this example (could add tax later)

  const handleSubmitPO = (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedSupplierId || poItems.length === 0) return;

     const supplier = suppliers.find(s => s.id === selectedSupplierId);
     if (!supplier) return;

     const newPO: PurchaseOrder = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        dueDate: poDueDate || undefined,
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: poItems,
        subtotal,
        taxAmount: 0,
        total,
        status: POStatus.PENDING,
        note: poNote,
        paymentStatus: Number(paidAmount) >= total ? 'PAID' : Number(paidAmount) > 0 ? 'PARTIAL' : 'UNPAID',
        paidAmount: Number(paidAmount),
        createdBy: 'Admin'
     };

     onCreatePO(newPO);
     setIsModalOpen(false);
     // Reset
     setSelectedSupplierId('');
     setPoItems([]);
     setPoNote('');
     setPoDueDate('');
     setPaidAmount('0');
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            ການສັ່ງຊື້ສິນຄ້າ (Purchase Orders)
          </h2>
          <p className="text-gray-500 text-sm">ສັ່ງສິນຄ້າເຂົ້າສາງຈາກຜູ້ສະໜອງ (Suppliers)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          <span>ສ້າງໃບ PO ໃໝ່</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາເລກບິນ ຫຼື ຜູ້ສະໜອງ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ວັນທີສັ່ງ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ເລກທີ PO</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ຜູ້ສະໜອງ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ກຳນົດສົ່ງ (Due Date)</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">ຍອດລວມ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ສະຖານະ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPOs.map(po => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(po.date).toLocaleDateString('lo-LA')}
                  </td>
                  <td className="p-4 text-sm font-medium text-blue-600">
                    PO-{po.id.slice(-6)}
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-800">
                    {po.supplierName}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {po.dueDate ? (
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-orange-500" />
                            {new Date(po.dueDate).toLocaleDateString('lo-LA')}
                        </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-sm font-bold text-right text-gray-800">
                    {FORMAT_CURRENCY(po.total)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                       po.status === POStatus.RECEIVED ? 'bg-green-100 text-green-700 border-green-200' :
                       po.status === POStatus.CANCELLED ? 'bg-red-100 text-red-700 border-red-200' :
                       'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                       {po.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => setViewingPO(po)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <FileText size={18} />
                       </button>
                       {po.status === POStatus.PENDING && (
                          <>
                             <button 
                                onClick={() => { if(confirm('ຢືນຢັນການຮັບສິນຄ້າເຂົ້າສາງ?')) onReceivePO(po.id) }} 
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                             >
                                <CheckCircle2 size={14} /> ຮັບເຄື່ອງ
                             </button>
                             <button 
                                onClick={() => { if(confirm('ຍົກເລີກ PO ນີ້?')) onCancelPO(po.id) }} 
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                             >
                                <X size={18} />
                             </button>
                          </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400">ບໍ່ພົບລາຍການສັ່ງຊື້</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CREATE PO MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                 <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <PlusCircle size={24} /> ສ້າງໃບສັ່ງຊື້ສິນຄ້າ (New PO)
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                 {/* Left: Product Selector */}
                 <div className="w-full md:w-1/3 border-r border-gray-100 p-4 overflow-y-auto bg-gray-50/50">
                    <h4 className="font-bold text-gray-700 mb-3 text-sm">ເລືອກສິນຄ້າ</h4>
                    <div className="space-y-2">
                       {products.filter(p => !p.isCustom).map(product => (
                          <button 
                             key={product.id}
                             onClick={() => addItemToPO(product)}
                             className="w-full p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all text-left flex items-center gap-3"
                          >
                             <img src={product.image} className="w-10 h-10 rounded object-cover" alt="" />
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{product.name}</p>
                                <p className="text-[10px] text-gray-500">Stock: {product.stock} {product.unit}</p>
                             </div>
                             <Plus size={14} className="text-blue-500" />
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Right: PO Form */}
                 <form onSubmit={handleSubmitPO} className="flex-1 p-6 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ເລືອກຜູ້ສະໜອງ (Supplier)</label>
                           <select 
                              required
                              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                              value={selectedSupplierId}
                              onChange={e => setSelectedSupplierId(e.target.value)}
                           >
                              <option value="">-- ເລືອກຜູ້ສະໜອງ --</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                               <Calendar size={12} /> ກຳນົດມື້ສົ່ງ (Due Date)
                           </label>
                           <input 
                              type="date"
                              className="w-full p-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                              value={poDueDate}
                              onChange={e => setPoDueDate(e.target.value)}
                           />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto mb-4 border rounded-xl">
                       <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-600">
                             <tr>
                                <th className="p-2 text-left">ລາຍການ</th>
                                <th className="p-2 text-center w-24">ຈຳນວນ</th>
                                <th className="p-2 text-right w-32">ຕົ້ນທຶນ (ກີບ)</th>
                                <th className="p-2 text-center w-10"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {poItems.map(item => (
                                <tr key={item.productId}>
                                   <td className="p-2 font-medium">{item.productName}</td>
                                   <td className="p-2">
                                      <div className="flex items-center gap-2">
                                         <button type="button" onClick={() => updateItemQty(item.productId, -1)}><MinusCircle size={16} className="text-gray-400"/></button>
                                         <input type="number" className="w-12 text-center border-b font-bold" value={item.quantity} onChange={e => updateItemQty(item.productId, parseInt(e.target.value) - item.quantity)} />
                                         <button type="button" onClick={() => updateItemQty(item.productId, 1)}><PlusCircle size={16} className="text-blue-500"/></button>
                                      </div>
                                   </td>
                                   <td className="p-2">
                                      <input type="number" className="w-full text-right border-b outline-none focus:border-blue-500" value={item.costPrice} onChange={e => updateItemCost(item.productId, parseFloat(e.target.value))} />
                                   </td>
                                   <td className="p-2">
                                      <button type="button" onClick={() => removeItemFromPO(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                   </td>
                                </tr>
                             ))}
                             {poItems.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">ຍັງບໍ່ມີລາຍການສັ່ງຊື້</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">ໝາຍເຫດ</label>
                          <textarea className="w-full p-2 border border-gray-300 rounded-lg text-sm" rows={2} value={poNote} onChange={e => setPoNote(e.target.value)} placeholder="ຂໍ້ມູນເພີ່ມເຕີມ..."></textarea>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-xl text-right">
                          <p className="text-xs text-gray-500 uppercase">ຍອດລວມທັງໝົດ</p>
                          <p className="text-2xl font-black text-gray-800">{FORMAT_CURRENCY(total)}</p>
                          <div className="mt-2 flex items-center justify-end gap-2">
                             <span className="text-xs text-gray-500">ມັດຈຳ (Paid):</span>
                             <input type="number" className="w-32 p-1 text-right border rounded font-bold text-green-600" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                          </div>
                       </div>
                    </div>

                    <button type="submit" disabled={poItems.length === 0} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-lg shadow-blue-100">
                       ອອກໃບ PO ແລະ ບັນທຶກ
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* --- VIEW PO MODAL --- */}
      {viewingPO && (
         <div id="quotation-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div id="quotation-content" className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[80vh] relative">
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <FileText size={20} className="text-blue-600" /> ໃບສັ່ງຊື້ສິນຄ້າ (PO Preview)
                  </h3>
                  <div className="flex gap-2">
                     <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
                        <Printer size={18} /> ພິມ
                     </button>
                     <button onClick={() => setViewingPO(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={24} /></button>
                  </div>
               </div>

               <div className="p-12 bg-white text-gray-800 flex-1">
                  <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                     <div>
                        <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">{shopSettings.name}</h1>
                        <p className="font-semibold text-gray-600">{shopSettings.branch}</p>
                        <p className="text-sm text-gray-500">{shopSettings.address}</p>
                        <p className="text-sm text-gray-500">ໂທ: {shopSettings.phone}</p>
                     </div>
                     <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-800 mb-1 uppercase">Purchase Order</h2>
                        <h3 className="text-sm text-gray-500 uppercase tracking-wider">ໃບສັ່ງຊື້ສິນຄ້າ</h3>
                        <div className="mt-4 text-sm">
                           <p><span className="font-bold text-gray-600">PO No:</span> PO-{viewingPO.id.slice(-6)}</p>
                           <p><span className="font-bold text-gray-600">Order Date:</span> {new Date(viewingPO.date).toLocaleDateString('lo-LA')}</p>
                           {viewingPO.dueDate && (
                               <p className="text-orange-600 font-bold"><span className="font-bold text-gray-600">Due Date:</span> {new Date(viewingPO.dueDate).toLocaleDateString('lo-LA')}</p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ສັ່ງຊື້ຈາກ / SUPPLIER</h4>
                        <p className="font-bold text-lg text-gray-800">{viewingPO.supplierName}</p>
                        <p className="text-sm text-gray-600">Supplier ID: {viewingPO.supplierId}</p>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ສະຖານະ / STATUS</h4>
                        <p className="font-bold text-lg uppercase">{viewingPO.status}</p>
                        <p className="text-sm text-gray-600">Payment: {viewingPO.paymentStatus}</p>
                     </div>
                  </div>

                  <table className="w-full mb-8 border-collapse">
                     <thead>
                        <tr className="border-b-2 border-gray-200">
                           <th className="py-2 text-left text-sm font-bold text-gray-600">#</th>
                           <th className="py-2 text-left text-sm font-bold text-gray-600">ລາຍການ (Description)</th>
                           <th className="py-2 text-center text-sm font-bold text-gray-600">ຈຳນວນ (Qty)</th>
                           <th className="py-2 text-right text-sm font-bold text-gray-600">ຕົ້ນທຶນ (Cost)</th>
                           <th className="py-2 text-right text-sm font-bold text-gray-600">ລວມ (Total)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {viewingPO.items.map((item, idx) => (
                           <tr key={idx}>
                              <td className="py-3 text-sm text-gray-500">{idx + 1}</td>
                              <td className="py-3 text-sm font-medium text-gray-800">{item.productName}</td>
                              <td className="py-3 text-center text-sm text-gray-800">{item.quantity} {item.unit}</td>
                              <td className="py-3 text-right text-sm text-gray-800">{FORMAT_CURRENCY(item.costPrice)}</td>
                              <td className="py-3 text-right text-sm font-bold text-gray-800">{FORMAT_CURRENCY(item.costPrice * item.quantity)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="flex justify-end mb-12">
                     <div className="w-64 space-y-2 border-t-2 border-gray-800 pt-4">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                           <span>ຍອດລວມ (Total):</span>
                           <span>{FORMAT_CURRENCY(viewingPO.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600 font-bold">
                           <span>ຈ່າຍແລ້ວ (Paid):</span>
                           <span>{FORMAT_CURRENCY(viewingPO.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600 font-bold">
                           <span>ຄ້າງຈ່າຍ (Balance):</span>
                           <span>{FORMAT_CURRENCY(viewingPO.total - viewingPO.paidAmount)}</span>
                        </div>
                     </div>
                  </div>

                  {viewingPO.note && (
                     <div className="mb-8 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-600 italic">
                        <b>Note:</b> {viewingPO.note}
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-12 mt-auto pt-12 border-t border-gray-100">
                     <div className="text-center">
                        <div className="border-b border-gray-300 h-20 mb-2"></div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Ordered By</p>
                        <p className="text-xs text-gray-400">ຜູ້ຈັດຊື້</p>
                     </div>
                     <div className="text-center">
                        <div className="border-b border-gray-300 h-20 mb-2"></div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Authorized By</p>
                        <p className="text-xs text-gray-400">ຜູ້ອະນຸມັດ</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
