import React, { useState } from 'react';
import { SaleRecord, DeliveryStatus } from '../types';
import { Truck, MapPin, Phone, User, CheckCircle2, Clock, Navigation, Search, ExternalLink } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';

interface DeliveriesProps {
  sales: SaleRecord[];
  onUpdateStatus: (saleId: string, status: DeliveryStatus) => void;
  onViewSale: (sale: SaleRecord) => void;
}

export const Deliveries: React.FC<DeliveriesProps> = ({ sales, onUpdateStatus, onViewSale }) => {
  const [activeTab, setActiveTab] = useState<DeliveryStatus | 'ALL'>(DeliveryStatus.PENDING);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only sales with delivery details and not voided
  const deliveryOrders = sales.filter(s => s.delivery && s.status !== 'VOIDED');

  const filteredOrders = deliveryOrders.filter(order => {
    const matchesTab = activeTab === 'ALL' || order.delivery?.status === activeTab;
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm);
    return matchesTab && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case DeliveryStatus.SHIPPING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case DeliveryStatus.DELIVERED: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = deliveryOrders.filter(o => o.delivery?.status === DeliveryStatus.PENDING).length;
  const shippingCount = deliveryOrders.filter(o => o.delivery?.status === DeliveryStatus.SHIPPING).length;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-blue-600" />
            ການຈັດສົ່ງ (Deliveries)
          </h2>
          <p className="text-gray-500 text-sm">ຕິດຕາມສະຖານະການຈັດສົ່ງສິນຄ້າ</p>
        </div>
        
        {/* Status Tabs */}
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto max-w-full">
           <button
             onClick={() => setActiveTab(DeliveryStatus.PENDING)}
             className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === DeliveryStatus.PENDING ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Clock size={16} /> ລໍຖ້າ
             {pendingCount > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
           </button>
           <button
             onClick={() => setActiveTab(DeliveryStatus.SHIPPING)}
             className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === DeliveryStatus.SHIPPING ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Truck size={16} /> ກຳລັງສົ່ງ
             {shippingCount > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{shippingCount}</span>}
           </button>
           <button
             onClick={() => setActiveTab(DeliveryStatus.DELIVERED)}
             className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === DeliveryStatus.DELIVERED ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <CheckCircle2 size={16} /> ສຳເລັດ
           </button>
           <button
             onClick={() => setActiveTab('ALL')}
             className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'ALL' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             ທັງໝົດ
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາບິນ, ຊື່ລູກຄ້າ, ຫຼື ທີ່ຢູ່..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Deliveries Grid */}
        <div className="flex-1 overflow-y-auto p-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                 <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-gray-800 text-lg">#{order.id.slice(-6)}</span>
                             <span className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('lo-LA')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 font-medium">
                             <User size={14} /> {order.delivery?.contactName || order.customerName}
                          </div>
                       </div>
                       <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.delivery!.status)}`}>
                          {order.delivery!.status}
                       </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 space-y-4">
                       {/* Address Section */}
                       <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                             <MapPin size={16} className="shrink-0 mt-0.5 text-red-500" />
                             <span className="leading-relaxed">{order.delivery?.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             <Phone size={16} className="shrink-0 text-blue-500" />
                             <a href={`tel:${order.delivery?.contactPhone}`} className="hover:text-blue-600 underline decoration-dotted">
                                {order.delivery?.contactPhone}
                             </a>
                          </div>
                       </div>
                       
                       {/* Google Maps Link */}
                       <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery?.address || '')}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-lg justify-center border border-blue-100"
                       >
                          <Navigation size={14} /> ເປີດແຜນທີ່ (Google Maps) <ExternalLink size={12} />
                       </a>

                       {/* Items Preview */}
                       <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          <p className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">ລາຍການສິນຄ້າ:</p>
                          <ul className="space-y-1">
                             {order.items.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="flex justify-between text-gray-600">
                                   <span className="truncate pr-2">• {item.name}</span>
                                   <span className="font-mono font-bold shrink-0">x{item.quantity}</span>
                                </li>
                             ))}
                             {order.items.length > 3 && (
                                <li className="text-xs text-gray-400 italic pt-1">+ ອີກ {order.items.length - 3} ລາຍການ...</li>
                             )}
                          </ul>
                       </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-2">
                       {order.delivery?.status === DeliveryStatus.PENDING && (
                          <button 
                            onClick={() => onUpdateStatus(order.id, DeliveryStatus.SHIPPING)}
                            className="col-span-2 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                             <Truck size={16} /> ເລີ່ມຈັດສົ່ງ
                          </button>
                       )}
                       {order.delivery?.status === DeliveryStatus.SHIPPING && (
                          <button 
                            onClick={() => onUpdateStatus(order.id, DeliveryStatus.DELIVERED)}
                            className="col-span-2 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                             <CheckCircle2 size={16} /> ຈັດສົ່ງສຳເລັດ
                          </button>
                       )}
                       {order.delivery?.status === DeliveryStatus.DELIVERED && (
                          <div className="col-span-2 text-center text-green-600 font-bold text-sm py-2 bg-green-50 rounded-lg border border-green-100 flex items-center justify-center gap-2">
                             <CheckCircle2 size={16} /> ສົ່ງຮຽບຮ້ອຍແລ້ວ
                          </div>
                       )}

                       <button 
                          onClick={() => onViewSale(order)}
                          className="col-span-2 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50"
                       >
                          ເບິ່ງບິນ / ພິມໃບສົ່ງເຄື່ອງ
                       </button>
                    </div>
                 </div>
              ))}
           </div>
           
           {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                 <Truck size={64} className="mb-4 opacity-20" />
                 <p className="text-lg font-medium">ບໍ່ພົບລາຍການຈັດສົ່ງ</p>
                 <p className="text-sm">ໃນສະຖານະ: {activeTab}</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};