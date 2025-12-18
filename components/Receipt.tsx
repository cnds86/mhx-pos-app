import React, { useState } from 'react';
import { SaleRecord, ShopSettings, PaymentMethod } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { X, Printer, CheckCircle, User, Phone, Ban, Clock, MapPin, Truck, FileText, Briefcase, Wallet, RotateCcw, AlertCircle, Save } from 'lucide-react';

interface ReceiptProps {
  sale: SaleRecord;
  shopSettings?: ShopSettings;
  onClose: () => void;
  onReturnItems?: (saleId: string, items: { itemId: string, quantity: number, amount: number }[], note: string) => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale, shopSettings, onClose, onReturnItems }) => {
  const [printMode, setPrintMode] = useState<'BILL' | 'DELIVERY' | 'INVOICE_A4'>('BILL');
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Return Form State
  const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
  const [returnNote, setReturnNote] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const deliveryFee = sale.delivery?.fee || 0;
  const taxAmount = sale.taxAmount || 0;
  const remainingBalance = sale.total - (sale.receivedAmount || 0);
  
  // Return Logic
  const canReturn = sale.status !== 'VOIDED' && onReturnItems;
  
  // Calculate total already returned qty per item
  const getReturnedQty = (itemId: string) => {
     return sale.returns?.filter(r => r.itemId === itemId).reduce((sum, r) => sum + r.quantity, 0) || 0;
  };

  const handleReturnAmountChange = (itemId: string, qty: number, maxQty: number) => {
     const val = Math.min(Math.max(0, qty), maxQty);
     setReturnItems(prev => ({ ...prev, [itemId]: val }));
  };

  const calculateTotalRefund = () => {
     let total = 0;
     Object.keys(returnItems).forEach((itemId) => {
        const qty = returnItems[itemId];
        const item = sale.items.find(i => i.id === itemId);
        if (item && qty > 0) {
           total += qty * item.price;
        }
     });
     return total;
  };

  const handleConfirmReturn = () => {
     const itemsToReturn = Object.keys(returnItems)
        .filter((itemId) => returnItems[itemId] > 0)
        .map((itemId) => {
           const qty = returnItems[itemId];
           const item = sale.items.find(i => i.id === itemId);
           return {
              itemId,
              quantity: qty,
              amount: qty * (item?.price || 0)
           };
        });

     if (itemsToReturn.length === 0) {
        alert('ກະລຸນາເລືອກຈຳນວນສິນຄ້າທີ່ຕ້ອງການຄືນ');
        return;
     }

     if (confirm(`ຍອດເງິນຄືນທັງໝົດ: ${FORMAT_CURRENCY(calculateTotalRefund())}\nຢືນຢັນການຮັບຄືນສິນຄ້າ?`)) {
        onReturnItems?.(sale.id, itemsToReturn, returnNote);
        setShowReturnModal(false);
        setReturnItems({});
        setReturnNote('');
     }
  };

  // Default values if settings not provided
  const shopName = shopSettings?.name || "MAHAXAY";
  const shopBranch = shopSettings?.branch || "Construction Materials";
  const shopPhone = shopSettings?.phone || "020-5555-8888";
  const shopAddress = shopSettings?.address || "";
  const shopFooter = shopSettings?.receiptFooter || "Thank you for your purchase!";

  return (
    <div id={printMode === 'INVOICE_A4' ? 'quotation-modal' : 'receipt-modal'} className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div id={printMode === 'INVOICE_A4' ? 'quotation-content' : 'receipt-content'} className={`bg-white w-full rounded-xl shadow-2xl overflow-hidden flex flex-col relative ${printMode === 'INVOICE_A4' ? 'max-w-2xl min-h-[80vh]' : 'max-w-sm max-h-[90vh]'}`}>
        
        {/* Void/Credit Stamp Overlay */}
        {sale.status === 'VOIDED' && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="border-4 border-red-500 text-red-500 text-4xl font-black p-4 rounded-xl transform -rotate-12 opacity-50 uppercase tracking-widest">
              VOID / CANCELED
            </div>
          </div>
        )}
        
        {sale.status !== 'VOIDED' && sale.paymentStatus !== 'PAID' && printMode !== 'INVOICE_A4' && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
             <div className="border-4 border-orange-500 text-orange-500 text-3xl font-black p-4 rounded-xl transform -rotate-12 opacity-30 uppercase tracking-widest">
              UNPAID / CREDIT
            </div>
          </div>
        )}

        {/* Header (No Print) */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-3 no-print">
          <div className="flex justify-between items-center">
             <h3 className={`font-bold flex items-center gap-2 ${
              sale.status === 'VOIDED' ? 'text-red-600' : 
              sale.paymentStatus !== 'PAID' ? 'text-orange-600' : 'text-gray-800'
            }`}>
              {printMode === 'DELIVERY' ? (
                <><Truck size={20} className="text-blue-600"/> ໃບສົ່ງເຄື່ອງ</>
              ) : printMode === 'INVOICE_A4' ? (
                 <><FileText size={20} className="text-blue-600"/> ໃບຮັບເງິນ (A4 Invoice)</>
              ) : sale.status === 'VOIDED' ? (
                 <><Ban size={20} /> ບິນຖືກຍົກເລີກ (Void)</>
              ) : sale.paymentStatus === 'PARTIAL' ? (
                 <><Clock size={20} /> ຈ່າຍບາງສ່ວນ (Partial)</>
              ) : sale.paymentStatus === 'UNPAID' ? (
                 <><Clock size={20} /> ບິນຕິດໜີ້ (Unpaid)</>
              ) : (
                 <><CheckCircle className="text-green-500" size={20} /> ຊຳລະເງິນສຳເລັດ</>
              )}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Print Mode Toggle */}
          <div className="flex bg-gray-200 p-1 rounded-lg gap-1">
             <button 
               onClick={() => setPrintMode('BILL')}
               className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${printMode === 'BILL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               ໃບບິນ (Bill)
             </button>
             <button 
               onClick={() => setPrintMode('DELIVERY')}
               className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${printMode === 'DELIVERY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               ໃບສົ່ງ (Delivery)
             </button>
             <button 
               onClick={() => setPrintMode('INVOICE_A4')}
               className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${printMode === 'INVOICE_A4' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               A4 ໃບຮັບເງິນ
             </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className={`overflow-y-auto flex-1 bg-white text-gray-800 relative ${printMode === 'INVOICE_A4' ? 'p-8 md:p-12 font-sans' : 'p-6 font-mono text-sm'}`}>
          
          {/* A4 INVOICE LAYOUT */}
          {printMode === 'INVOICE_A4' ? (
             <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
                   <div className="flex gap-4">
                      {shopSettings?.logo ? (
                         <img src={shopSettings.logo} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-gray-100" />
                      ) : (
                         <div className="w-16 h-16 bg-gray-800 text-white rounded-lg flex items-center justify-center font-bold text-3xl">
                            {shopName.charAt(0)}
                         </div>
                      )}
                      <div>
                         <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{shopName}</h1>
                         <p className="font-semibold text-gray-600">{shopBranch}</p>
                         <p className="text-sm text-gray-500">{shopAddress}</p>
                         <p className="text-sm text-gray-500">Tel: {shopPhone}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <h2 className="text-xl font-bold text-gray-800 mb-1">ໃບຮັບເງິນ</h2>
                      <h3 className="text-sm text-gray-500 uppercase tracking-wider">RECEIPT / INVOICE</h3>
                      <div className="mt-4 text-sm">
                         <p><span className="font-bold text-gray-600">ເລກທີ No:</span> #{sale.id.slice(-6)}</p>
                         <p><span className="font-bold text-gray-600">ວັນທີ Date:</span> {new Date(sale.date).toLocaleDateString('lo-LA')}</p>
                      </div>
                   </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-100 flex justify-between">
                   <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ລູກຄ້າ / CUSTOMER</h4>
                      <p className="font-bold text-lg text-gray-800">{sale.customerName}</p>
                      {sale.projectRef && (
                         <p className="text-sm text-blue-800 font-bold flex items-center gap-2 mt-1">
                            <Briefcase size={14} /> ໂຄງການ: {sale.projectRef}
                         </p>
                      )}
                      {sale.delivery && (
                         <div className="mt-1">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                               <Phone size={14} /> {sale.delivery.contactPhone}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                               <MapPin size={14} /> {sale.delivery.address}
                            </p>
                         </div>
                      )}
                   </div>
                   <div className="text-right">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ການຊຳລະ / PAYMENT</h4>
                      {sale.paymentMethod === PaymentMethod.SPLIT && sale.payments ? (
                         <div className="text-sm text-gray-800">
                            {sale.payments.map((p, i) => (
                               p.amount > 0 && (
                                  <p key={i}>
                                     {p.method}: <span className="font-bold">{FORMAT_CURRENCY(p.amount)}</span>
                                  </p>
                               )
                            ))}
                         </div>
                      ) : (
                         <p className="text-sm font-bold text-gray-800">{sale.paymentMethod}</p>
                      )}
                      
                      <p className={`text-sm font-bold mt-1 ${sale.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                         STATUS: {sale.paymentStatus}
                      </p>
                      {sale.salespersonName && (
                         <p className="text-xs text-gray-500 mt-2">Cashier: {sale.salespersonName}</p>
                      )}
                   </div>
                </div>

                {/* Table */}
                <table className="w-full mb-8 border-collapse">
                   <thead>
                      <tr className="border-b-2 border-gray-200">
                         <th className="py-2 text-left text-sm font-bold text-gray-600 w-12">#</th>
                         <th className="py-2 text-left text-sm font-bold text-gray-600">ລາຍການ (Description)</th>
                         <th className="py-2 text-center text-sm font-bold text-gray-600 w-24">ຈຳນວນ (Qty)</th>
                         <th className="py-2 text-right text-sm font-bold text-gray-600 w-32">ລາຄາ (Price)</th>
                         <th className="py-2 text-right text-sm font-bold text-gray-600 w-32">ລວມ (Total)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {sale.items.map((item, index) => {
                         const returnedQty = getReturnedQty(item.id);
                         return (
                           <tr key={index}>
                              <td className="py-3 text-sm text-gray-500">{index + 1}</td>
                              <td className="py-3 text-sm font-medium text-gray-800">
                                 {item.name}
                                 {item.note && <span className="block text-xs text-gray-500 italic">({item.note})</span>}
                                 {returnedQty > 0 && <span className="block text-xs text-red-500 font-bold">* ຄືນແລ້ວ: {returnedQty}</span>}
                              </td>
                              <td className="py-3 text-center text-sm text-gray-800">
                                 {item.quantity} {item.unit}
                              </td>
                              <td className="py-3 text-right text-sm text-gray-800">{FORMAT_CURRENCY(item.price)}</td>
                              <td className="py-3 text-right text-sm font-bold text-gray-800">{FORMAT_CURRENCY(item.price * item.quantity)}</td>
                           </tr>
                         );
                      })}
                      {/* Filler rows */}
                      {Array.from({ length: Math.max(0, 5 - sale.items.length) }).map((_, i) => (
                         <tr key={`empty-${i}`}>
                            <td className="py-4">&nbsp;</td><td></td><td></td><td></td><td></td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                   <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                         <span>ລວມເງິນ (Subtotal):</span>
                         <span>{FORMAT_CURRENCY(sale.subtotal)}</span>
                      </div>
                      {sale.discount > 0 && (
                         <div className="flex justify-between text-sm text-red-500">
                            <span>ສ່ວນຫຼຸດ (Discount):</span>
                            <span>-{FORMAT_CURRENCY(sale.discount)}</span>
                         </div>
                      )}
                      {taxAmount > 0 && (
                         <div className="flex justify-between text-sm text-gray-600">
                            <span>ອາກອນ (VAT):</span>
                            <span>+{FORMAT_CURRENCY(taxAmount)}</span>
                         </div>
                      )}
                      {deliveryFee > 0 && (
                         <div className="flex justify-between text-sm text-gray-600">
                            <span>ຄ່າຈັດສົ່ງ (Delivery):</span>
                            <span>+{FORMAT_CURRENCY(deliveryFee)}</span>
                         </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-gray-800 pt-2 mt-2">
                         <span>ຍອດສຸດທິ (Total):</span>
                         <span>{FORMAT_CURRENCY(sale.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 pt-1">
                         <span>ຈ່າຍແລ້ວ (Paid):</span>
                         <span>{FORMAT_CURRENCY(sale.receivedAmount || 0)}</span>
                      </div>
                      {remainingBalance > 0 && (
                         <div className="flex justify-between text-sm text-red-600 font-bold">
                            <span>ຄ້າງຊຳລະ (Balance Due):</span>
                            <span>{FORMAT_CURRENCY(remainingBalance)}</span>
                         </div>
                      )}
                   </div>
                </div>

                {/* Footer / Signature */}
                <div className="grid grid-cols-2 gap-12 mt-auto pt-8 border-t border-gray-200">
                   <div className="text-center">
                      <p className="text-sm font-bold text-gray-600 mb-16">ຜູ້ຮັບເງິນ / ຜູ້ອອກບິນ</p>
                      <div className="border-b border-gray-400 w-2/3 mx-auto"></div>
                   </div>
                   <div className="text-center">
                      <p className="text-sm font-bold text-gray-600 mb-16">ຜູ້ຈ່າຍເງິນ / ຜູ້ຮັບສິນຄ້າ</p>
                      <div className="border-b border-gray-400 w-2/3 mx-auto"></div>
                   </div>
                </div>
                
                <div className="mt-8 text-center text-xs text-gray-400">
                   <p>{shopFooter}</p>
                </div>
             </div>
          ) : (
            // THERMAL RECEIPT LAYOUT
            <>
              <div className="text-center mb-6">
                {shopSettings?.logo ? (
                  <img src={shopSettings.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
                ) : (
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                    {shopName.charAt(0)}
                  </div>
                )}
                <h2 className="text-xl font-bold uppercase">{shopName}</h2>
                <p className="text-xs text-gray-500">{shopBranch}</p>
                <p className="text-xs text-gray-500 mt-1">Tel: {shopPhone}</p>
                {printMode === 'DELIVERY' && (
                  <div className="mt-2 border-2 border-gray-800 px-2 py-1 inline-block font-bold text-lg uppercase">
                    ໃບສົ່ງເຄື່ອງ / DELIVERY NOTE
                  </div>
                )}
              </div>

              <div className="border-b-2 border-dashed border-gray-200 pb-3 mb-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Date:</span>
                  <span>{new Date(sale.date).toLocaleString('lo-LA')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>No:</span>
                  <span>#{sale.id.slice(-6)}</span>
                </div>
                {printMode === 'BILL' && (
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Status:</span>
                    <span className={`font-bold ${
                      sale.status === 'VOIDED' ? 'text-red-500' : 
                      sale.paymentStatus !== 'PAID' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {sale.status === 'VOIDED' ? 'VOIDED' : sale.paymentStatus === 'UNPAID' ? 'CREDIT' : sale.paymentStatus === 'PARTIAL' ? 'PARTIAL' : 'PAID'}
                    </span>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-dotted border-gray-200">
                  <div className="text-xs text-gray-700">
                      <div className="flex items-start gap-1">
                        <User size={12} className="mt-0.5" />
                        <span className="font-bold">{sale.customerName}</span>
                      </div>
                      {sale.projectRef && (
                         <div className="ml-4 mt-1 font-bold text-blue-800">
                            {sale.projectRef}
                         </div>
                      )}
                      {(sale.delivery || (sale.customerName !== 'General' && !sale.projectRef)) && (
                        <div className="ml-4 mt-1 space-y-0.5 text-gray-500">
                          {sale.delivery?.contactPhone && <div>Tel: {sale.delivery.contactPhone}</div>}
                          {sale.delivery?.address && <div>Addr: {sale.delivery.address}</div>}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-bold border-b border-gray-200 pb-1 mb-2">
                  <span className="flex-1">Items</span>
                  <span className="w-12 text-center">Qty</span>
                  {printMode === 'BILL' && <span className="w-20 text-right">Total</span>}
                </div>
                {sale.items.map((item, index) => {
                  const returnedQty = getReturnedQty(item.id);
                  return (
                    <div key={index} className={`flex flex-col ${sale.status === 'VOIDED' ? 'opacity-50' : ''}`}>
                      <div className={`flex justify-between items-start ${sale.status === 'VOIDED' ? 'line-through' : ''}`}>
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-xs">{item.name}</p>
                          {printMode === 'BILL' && <p className="text-[10px] text-gray-500">@{FORMAT_CURRENCY(item.price)}/{item.unit}</p>}
                        </div>
                        <div className="w-12 text-center font-bold text-xs">{item.quantity} {item.unit}</div>
                        {printMode === 'BILL' && (
                          <div className="w-20 text-right font-medium text-xs">{FORMAT_CURRENCY(item.price * item.quantity)}</div>
                        )}
                      </div>
                      {item.note && (
                        <div className="text-[10px] text-gray-500 italic ml-2 border-l-2 border-gray-300 pl-1 mt-0.5">
                            Note: {item.note}
                        </div>
                      )}
                      {returnedQty > 0 && printMode === 'BILL' && (
                         <div className="text-[10px] text-red-500 font-bold ml-2 mt-0.5">
                            * ຄືນແລ້ວ: {returnedQty}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {printMode === 'BILL' ? (
                <div className="border-t-2 border-dashed border-gray-200 pt-3 mb-4">
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ລວມເງິນ (Subtotal):</span>
                      <span>{FORMAT_CURRENCY(sale.subtotal)}</span>
                    </div>
                    
                    {(sale.discount > 0) && (
                      <div className="flex justify-between text-sm text-red-500 font-medium">
                        <span>ສ່ວນຫຼຸດ (Discount):</span>
                        <span>-{FORMAT_CURRENCY(sale.discount)}</span>
                      </div>
                    )}

                    {(taxAmount > 0) && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>ອາກອນ (VAT):</span>
                        <span>+{FORMAT_CURRENCY(taxAmount)}</span>
                      </div>
                    )}

                    {(deliveryFee > 0) && (
                      <div className="flex justify-between text-sm text-orange-600 font-medium">
                        <span>ຄ່າຈັດສົ່ງ (Delivery Fee):</span>
                        <span>+{FORMAT_CURRENCY(deliveryFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-lg font-bold mb-2 pt-2 border-t border-dotted border-gray-200">
                    <span>ຍອດສຸດທິ (Total)</span>
                    <span>{FORMAT_CURRENCY(sale.total)}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600 mt-4">
                    {/* Split Payment Logic */}
                    {sale.paymentMethod === PaymentMethod.SPLIT && sale.payments ? (
                       <div className="border-b border-dotted border-gray-200 pb-1 mb-1">
                          {sale.payments.map((p, i) => p.amount > 0 && (
                             <div key={i} className="flex justify-between">
                                <span>{p.method}:</span>
                                <span>{FORMAT_CURRENCY(p.amount)}</span>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="flex justify-between">
                         <span>ຊຳລະໂດຍ (Payment):</span>
                         <span className="font-semibold">{sale.paymentMethod}</span>
                       </div>
                    )}
                    
                    {sale.paymentMethod !== PaymentMethod.SPLIT && (
                       <div className="flex justify-between">
                         <span>ຮັບເງິນມາ (Received):</span>
                         <span>{FORMAT_CURRENCY(sale.receivedAmount || 0)}</span>
                       </div>
                    )}

                    {sale.paymentStatus === 'PAID' ? (
                        <div className="flex justify-between">
                          <span>ເງິນທອນ (Change):</span>
                          <span>{FORMAT_CURRENCY(sale.changeAmount)}</span>
                        </div>
                    ) : (
                      <div className="flex justify-between text-red-500 font-bold border-t border-dotted border-gray-200 pt-1 mt-1">
                          <span>ຍອດຄ້າງຊຳລະ (Balance Due):</span>
                          <span>{FORMAT_CURRENCY(remainingBalance)}</span>
                      </div>
                    )}
                    {sale.salespersonName && (
                        <div className="flex justify-between pt-1 mt-1 border-t border-dotted border-gray-200">
                          <span>Cashier:</span>
                          <span>{sale.salespersonName}</span>
                        </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-8 border-t-2 border-gray-800 pt-4">
                    <div className="grid grid-cols-2 gap-8 text-center text-xs">
                      <div>
                          <p className="mb-8">ຜູ້ສົ່ງ (Sender)</p>
                          <div className="border-b border-gray-400"></div>
                      </div>
                      <div>
                          <p className="mb-8">ຜູ້ຮັບ (Receiver)</p>
                          <div className="border-b border-gray-400"></div>
                      </div>
                    </div>
                    <div className="mt-4 text-[10px] text-gray-500 text-center">
                      ກະລຸນາກວດສອບສິນຄ້າໃຫ້ຄົບຖ້ວນກ່ອນເຊັນຮັບ
                    </div>
                </div>
              )}

              {sale.delivery && printMode === 'BILL' && (
                <div className="mt-4 pt-3 border-t-2 border-gray-100 bg-gray-50 p-3 rounded-lg border-dashed">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-2">
                      <Truck size={12} />
                      <span>ຂໍ້ມູນການຈັດສົ່ງ (Delivery Info)</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-start gap-2">
                        <User size={12} className="mt-0.5 text-gray-400" />
                        <span><b>ຜູ້ຮັບ:</b> {sale.delivery.contactName}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone size={12} className="mt-0.5 text-gray-400" />
                        <span><b>ໂທ:</b> {sale.delivery.contactPhone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="mt-0.5 text-gray-400" />
                        <span><b>ທີ່ຢູ່:</b> {sale.delivery.address}</span>
                      </div>
                    </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-400 mt-6">
                <p>ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
                <p>{shopFooter}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions (No Print) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 no-print">
          {canReturn && (
             <button onClick={() => setShowReturnModal(true)} className="flex-1 py-2.5 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 font-bold flex items-center justify-center gap-2">
               <RotateCcw size={18} />
               ຮັບຄືນ (Return)
             </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 font-medium">
            ປິດ (Close)
          </button>
          <button onClick={handlePrint} className="flex-1 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-sm">
            <Printer size={18} />
            ພິມ (Print)
          </button>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
                  <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                     <RotateCcw size={20} /> ຮັບຄືນສິນຄ້າ (Return Items)
                  </h3>
                  <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 flex items-start gap-2">
                     <AlertCircle size={16} className="shrink-0 mt-0.5" />
                     <p>ເລືອກສິນຄ້າທີ່ຕ້ອງການຮັບຄືນ. ສິນຄ້າຈະຖືກເພີ່ມກັບເຂົ້າສາງ ແລະ ຈະມີການບັນທຶກການຈ່າຍເງິນຄືນ (Refund).</p>
                  </div>

                  {sale.items.map(item => {
                     const alreadyReturned = getReturnedQty(item.id);
                     const remainingQty = item.quantity - alreadyReturned;
                     if (remainingQty <= 0) return null;

                     return (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                           <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">ຊື້: {item.quantity} | ຄືນແລ້ວ: {alreadyReturned}</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                 type="number" 
                                 min="0"
                                 max={remainingQty}
                                 className="w-16 p-2 border border-gray-300 rounded text-center font-bold"
                                 value={returnItems[item.id] || 0}
                                 onChange={(e) => handleReturnAmountChange(item.id, parseInt(e.target.value) || 0, remainingQty)}
                              />
                              <span className="text-xs text-gray-500 w-8">{item.unit}</span>
                           </div>
                        </div>
                     );
                  })}

                  <div className="pt-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">ເຫດຜົນການຄືນ</label>
                     <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="ຕົວຢ່າງ: ຊື້ເກີນ, ສິນຄ້າເສຍຫາຍ..."
                        value={returnNote}
                        onChange={(e) => setReturnNote(e.target.value)}
                     />
                  </div>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-gray-600 font-medium">ຍອດເງິນຄືນລວມ:</span>
                     <span className="text-xl font-bold text-red-600">{FORMAT_CURRENCY(calculateTotalRefund())}</span>
                  </div>
                  <button 
                     onClick={handleConfirmReturn}
                     className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-sm flex items-center justify-center gap-2"
                  >
                     <Save size={18} /> ຢືນຢັນການຮັບຄືນ
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};