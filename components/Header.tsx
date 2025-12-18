
import React, { useState, useEffect } from 'react';
import { Bell, Search, Clock, ChevronRight, User as UserIcon, LogOut, AlertCircle } from 'lucide-react';
import { User, ViewState, Product } from '../types';

interface HeaderProps {
  currentUser: User | null;
  currentView: ViewState;
  products: Product[];
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, currentView, products, onLogout }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lowStockCount = products.filter(p => !p.isCustom && p.stock <= 10).length;

  const getViewTitle = (view: ViewState) => {
    switch (view) {
      case 'POS': return 'ຂາຍໜ້າຮ້ານ (Point of Sale)';
      case 'INVENTORY': return 'ສາງສິນຄ້າ (Inventory)';
      case 'CUSTOMERS': return 'ຈັດການລູກຄ້າ (Customers)';
      case 'SUPPLIERS': return 'ຜູ້ສະໜອງ (Suppliers)';
      case 'PURCHASE_ORDERS': return 'ການສັ່ງຊື້ (Purchase Orders)';
      case 'DELIVERIES': return 'ການຈັດສົ່ງ (Deliveries)';
      case 'QUOTATIONS': return 'ໃບສະເໜີລາຄາ (Quotations)';
      case 'EXPENSES': return 'ລາຍຈ່າຍ (Expenses)';
      case 'DASHBOARD': return 'ລາຍງານ (Dashboard)';
      case 'STAFF': return 'ບຸກຄະລາກອນ (Staff)';
      case 'SETTINGS': return 'ຕັ້ງຄ່າລະບົບ (Settings)';
      default: return 'ມະຫາໄຊ (MAHAXAY)';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm hidden md:flex">
      {/* View Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          {getViewTitle(currentView)}
        </h2>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        {/* Clock */}
        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Clock size={16} className="text-blue-500" />
          <span className="text-xs font-mono font-bold">
            {time.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Notifications / Low Stock Alert */}
        <div className="relative group cursor-pointer">
          <div className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
            <Bell size={20} />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {lowStockCount}
              </span>
            )}
          </div>
          
          {/* Dropdown Tooltip */}
          {lowStockCount > 0 && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 hidden group-hover:block animate-fade-in z-50">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                <AlertCircle size={12} className="text-orange-500" /> ການແຈ້ງເຕືອນ
              </p>
              <p className="text-sm text-gray-700">
                ມີສິນຄ້າ <span className="font-bold text-orange-600">{lowStockCount} ລາຍການ</span> ທີ່ກຳລັງຈະໝົດສາງ.
              </p>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800 leading-none">{currentUser?.name}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-wider">{currentUser?.role}</p>
          </div>
          <div className="relative group">
            <button className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <UserIcon size={20} />
            </button>
            
            {/* Quick Actions Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block animate-fade-in">
              <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                 <p className="text-xs text-gray-400">Username: <span className="text-gray-700 font-medium">{currentUser?.username}</span></p>
              </div>
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> ອອກຈາກລະບົບ
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
