import React, { useState } from 'react';
import { Quotation, CartItem, ShopSettings } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { FileText, Printer, Trash2, ShoppingCart, Search, X, Calendar, User, Phone, MapPin } from 'lucide-react';

interface QuotationsProps {
  quotations: Quotation[];
  onDeleteQuotation: (id: string) => void;
  onLoadToCart: (items: CartItem[], customer: any) => void;
  shopSettings: ShopSettings;
}

export const Quotations: React.FC<QuotationsProps> = ({ quotations, onDeleteQuotation, onLoadToCart, shopSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);

  const filteredQuotes = quotations.filter(q => 
    q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.id.includes(searchTerm)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ໃບສະເໜີລາຄາ (Quotations)</h2>
          <p className="text-gray-500 text-sm">ຈັດການ ແລະ ພິມໃບສະເໜີລາຄາສຳລັບລູກຄ້າ</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຕາມຊື່ລູກຄ້າ ຫຼື ເລກບິນ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List View */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">ວັນທີ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ເລກທີ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ລູກຄ້າ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ຈຳນວນລາຍການ</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">ຍອດລວມ</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotes.map(quote => (
                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(quote.date).toLocaleDateString('lo-LA')}
                  </td>
                  <td className="p-4 text-sm font-medium text-blue-600">
                    QT-{quote.id.slice(-6)}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {quote.customer.name}
                    <span className="block text-xs text-gray-500 font-normal">{quote.customer.type}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {quote.items.length} ລາຍການ
                  </td>
                  <td className="p-4 font-bold text-gray-800 text-right">
                    {FORMAT_CURRENCY(quote.total)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => setViewingQuote(quote)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                        title="ເບິ່ງ/ພິມ"
                      >
                        <Printer size={16} />
                        <span className="text-xs font-bold hidden md:inline">Print</span>
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm('ຕ້ອງການດຶງລາຍການໄປທີ່ໜ້າຂາຍບໍ່? (ກະຕ່າປັດຈຸບັນຈະຖືກລ້າງ)')) {
                            onLoadToCart(quote.items, quote.customer);
                          }
                        }}
                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1"
                        title="ສ້າງລາຍການຂາຍ"
                      >
                        <ShoppingCart size={16} />
                        <span className="text-xs font-bold hidden md:inline">Sell</span>
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm('ຕ້ອງການລຶບໃບສະເໜີລາຄານີ້ແທ້ບໍ່?')) {
                            onDeleteQuotation(quote.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ລຶບ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>ບໍ່ພົບໃບສະເໜີລາຄາ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Preview / Print Modal - Changed ID to quotation-modal for A4 printing */}
      {viewingQuote && (
        <div id="quotation-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div id="quotation-content" className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[80vh] relative">
            
            {/* Modal Header (No Print) */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                ຕົວຢ່າງໃບສະເໜີລາຄາ (Preview)
              </h3>
              <div className="flex gap-2">
                 <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
                    <Printer size={18} /> ພິມ (Print)
                 </button>
                 <button onClick={() => setViewingQuote(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                    <X size={24} />
                 </button>
              </div>
            </div>

            {/* A4 Paper Content */}
            <div className="p-8 md:p-12 bg-white text-gray-800 flex-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                <div className="flex gap-4">
                  {shopSettings.logo ? (
                    <img src={shopSettings.logo} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-3xl">
                      {shopSettings.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">{shopSettings.name}</h1>
                    <p className="font-semibold text-gray-600">{shopSettings.branch}</p>
                    <p className="text-sm text-gray-500">{shopSettings.address}</p>
                    <p className="text-sm text-gray-500">ໂທ: {shopSettings.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">ໃບສະເໜີລາຄາ</h2>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider">QUOTATION</h3>
                  <div className="mt-4 text-sm">
                    <p><span className="font-bold text-gray-600">ເລກທີ No:</span> QT-{viewingQuote.id.slice(-6)}</p>
                    <p><span className="font-bold text-gray-600">ວັນທີ Date:</span> {new Date(viewingQuote.date).toLocaleDateString('lo-LA')}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-100 flex justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ລູກຄ້າ / CUSTOMER</h4>
                  <p className="font-bold text-lg text-gray-800">{viewingQuote.customer.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                     <Phone size={14} /> {viewingQuote.customer.phone || '-'}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                     <MapPin size={14} /> {viewingQuote.customer.address || '-'}
                  </p>
                </div>
                {viewingQuote.note && (
                   <div className="text-right max-w-xs">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ໝາຍເຫດ / NOTE</h4>
                     <p className="text-sm text-gray-600 italic">{viewingQuote.note}</p>
                   </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
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
                  {viewingQuote.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="py-3 text-sm font-medium text-gray-800">
                        {item.name}
                        <span className="block text-xs text-gray-500">{item.category}</span>
                      </td>
                      <td className="py-3 text-center text-sm text-gray-800">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right text-sm text-gray-800">{FORMAT_CURRENCY(item.price)}</td>
                      <td className="py-3 text-right text-sm font-bold text-gray-800">{FORMAT_CURRENCY(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows to make it look full */}
                  {Array.from({ length: Math.max(0, 5 - viewingQuote.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                       <td className="py-4">&nbsp;</td>
                       <td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ລວມເງິນ (Subtotal):</span>
                    <span>{FORMAT_CURRENCY(viewingQuote.subtotal)}</span>
                  </div>
                  {viewingQuote.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>ສ່ວນຫຼຸດ (Discount):</span>
                      <span>-{FORMAT_CURRENCY(viewingQuote.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-blue-900 border-t-2 border-blue-100 pt-2 mt-2">
                    <span>ຍອດສຸດທິ (Total):</span>
                    <span>{FORMAT_CURRENCY(viewingQuote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer / Signature */}
              <div className="grid grid-cols-2 gap-12 mt-auto pt-12">
                 <div className="text-center">
                    <div className="border-b border-gray-300 h-24 mb-2"></div>
                    <p className="text-sm font-bold text-gray-600">ຜູ້ສະເໜີລາຄາ (Prepared By)</p>
                 </div>
                 <div className="text-center">
                    <div className="border-b border-gray-300 h-24 mb-2"></div>
                    <p className="text-sm font-bold text-gray-600">ຜູ້ອະນຸມັດ (Authorized By)</p>
                 </div>
              </div>
              
              <div className="mt-8 text-center text-xs text-gray-400">
                 <p>ໃບສະເໜີລາຄານີ້ມີກຳນົດ 15 ວັນ. ລາຄາອາດມີການປ່ຽນແປງໂດຍບໍ່ແຈ້ງລ່ວງໜ້າ.</p>
                 <p>This quotation is valid for 15 days. Prices are subject to change without prior notice.</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};