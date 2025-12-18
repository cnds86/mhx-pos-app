
import React from 'react';
import { ShoppingBag, Truck, FileText, Package, List, ShoppingCart, Users, Factory, Wallet, LayoutDashboard, UserCog, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { ViewState, User, ShopSettings, PermissionRules } from '../types';
import { ROLE_LEVEL } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  currentUser: User;
  shopSettings: ShopSettings;
  permissionRules: PermissionRules;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  shopSettings, 
  permissionRules, 
  onLogout 
}) => {
  const hasPermission = (userRole: string, requiredLevel: number) => {
    const userLevel = ROLE_LEVEL[userRole] || 0;
    return userLevel >= requiredLevel;
  };

  const NavItem = ({ view, icon: Icon, label, permissionLevel = 0 }: { view: ViewState, icon: any, label: string, permissionLevel?: number }) => {
    if (permissionLevel > 0 && !hasPermission(currentUser.role, permissionLevel)) return null;
    
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setCurrentView(view)} 
        className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-blue-50 text-blue-600 shadow-sm font-semibold' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`}
      >
        <Icon size={24} />
        <span className="hidden lg:block">{label}</span>
      </button>
    );
  };

  return (
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentUser.role === 'MANAGER' ? 'bg-red-600' : 'bg-blue-600'}`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        <NavItem view="POS" icon={ShoppingBag} label="ຂາຍໜ້າຮ້ານ" />
        <NavItem view="DELIVERIES" icon={Truck} label="ການຈັດສົ່ງ" />
        <NavItem view="QUOTATIONS" icon={FileText} label="ໃບສະເໜີລາຄາ" />
        <NavItem view="INVENTORY" icon={Package} label="ສາງສິນຄ້າ" />
        <NavItem view="CATEGORIES" icon={List} label="ໝວດໝູ່ສິນຄ້າ" />
        <NavItem view="PURCHASE_ORDERS" icon={ShoppingCart} label="ການສັ່ງຊື້ (PO)" />
        <NavItem view="CUSTOMERS" icon={Users} label="ລູກຄ້າ" />
        <NavItem view="SUPPLIERS" icon={Factory} label="ຜູ້ສະໜອງ" />
        <NavItem view="EXPENSES" icon={Wallet} label="ລາຍຈ່າຍ" />
        <NavItem view="DASHBOARD" icon={LayoutDashboard} label="ລາຍງານ" />
        <NavItem view="STAFF" icon={UserCog} label="ພະນັກງານ" permissionLevel={permissionRules.MANAGE_STAFF} />
        <NavItem view="SETTINGS" icon={SettingsIcon} label="ຕັ້ງຄ່າ" />
      </nav>
      
      <div className="p-4 border-t border-gray-100 hidden lg:block">
        <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={20} /> 
          <span className="hidden lg:block font-medium">ອອກຈາກລະບົບ</span>
        </button>
      </div>
    </aside>
  );
};
