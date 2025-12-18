
import React from 'react';
import { ShoppingBag, Truck, Users, LayoutDashboard, UserCog, Settings as SettingsIcon } from 'lucide-react';
import { ViewState, User, PermissionRules } from '../types';
import { ROLE_LEVEL } from '../constants';

interface MobileNavProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  currentUser: User;
  permissionRules: PermissionRules;
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  permissionRules 
}) => {
  const hasPermission = (userRole: string, requiredLevel: number) => {
    const userLevel = ROLE_LEVEL[userRole] || 0;
    return userLevel >= requiredLevel;
  };

  const MobileNavItem = ({ view, icon: Icon, label, permissionLevel = 0 }: { view: ViewState, icon: any, label: string, permissionLevel?: number }) => {
    if (permissionLevel > 0 && !hasPermission(currentUser.role, permissionLevel)) return null;
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setCurrentView(view)} 
        className={`flex-shrink-0 w-16 flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
      >
        <Icon size={22} />
        <span className="text-[10px] font-medium mt-1">{label}</span>
      </button>
    );
  };

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 z-50 shrink-0 pb-safe overflow-x-auto scrollbar-hide">
      <MobileNavItem view="POS" icon={ShoppingBag} label="ຂາຍ" />
      <MobileNavItem view="DELIVERIES" icon={Truck} label="ຂົນສົ່ງ" />
      <MobileNavItem view="CUSTOMERS" icon={Users} label="ລູກຄ້າ" />
      <MobileNavItem view="DASHBOARD" icon={LayoutDashboard} label="ລາຍງານ" />
      <MobileNavItem view="STAFF" icon={UserCog} label="ພະນັກງານ" permissionLevel={permissionRules.MANAGE_STAFF} />
      <MobileNavItem view="SETTINGS" icon={SettingsIcon} label="ຕັ້ງຄ່າ" />
    </nav>
  );
};
