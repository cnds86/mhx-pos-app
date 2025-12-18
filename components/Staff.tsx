import React, { useState, useMemo } from 'react';
import { User, UserRole, Department, PermissionRules, PermissionAction, SaleRecord, StockLog, PaymentTransaction } from '../types';
import { ROLE_LABELS, ROLE_LEVEL, FORMAT_CURRENCY } from '../constants';
import { Users, UserPlus, Trash2, User as UserIcon, Shield, Briefcase, Building2, Lock, Plus, Save, Edit2, X, CheckCircle2, Activity, Clock, ShoppingBag, Package } from 'lucide-react';

interface StaffProps {
  users: User[];
  departments: Department[];
  permissionRules: PermissionRules;
  onUpdateUsers: (users: User[]) => void;
  onUpdateDepartments: (depts: Department[]) => void;
  onUpdatePermissionRules: (rules: PermissionRules) => void;
  currentUser: User | null;
  sales: SaleRecord[];
  stockLogs: StockLog[];
  transactions: PaymentTransaction[];
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  VOID_BILL: 'ອະນຸມັດການຍົກເລີກບິນ (Void Bill)',
  ACCESS_SETTINGS: 'ເຂົ້າເຖິງການຕັ້ງຄ່າລະບົບ (Settings Access)',
  MANAGE_STAFF: 'ຈັດການຂໍ້ມູນພະນັກງານ (Manage Staff)',
  GIVE_DISCOUNT: 'ມອບສ່ວນຫຼຸດທ້າຍບິນ (Give Discount)',
  VIEW_COST: 'ເບິ່ງຕົ້ນທຶນສິນຄ້າ (View Cost Price)',
  MANAGE_INVENTORY: 'ຈັດການສາງ/ເພີ່ມສິນຄ້າ (Inventory Mgmt)',
  SETTLE_DEBT: 'ຮັບຊຳລະໜີ້ (Settle Debt)'
};

export const Staff: React.FC<StaffProps> = ({ 
  users, 
  departments, 
  permissionRules, 
  onUpdateUsers, 
  onUpdateDepartments, 
  onUpdatePermissionRules, 
  currentUser,
  sales = [],
  stockLogs = [],
  transactions = []
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'DEPARTMENTS' | 'PERMISSIONS' | 'ACTIVITY'>('USERS');
  
  // User Form
  const [newUser, setNewUser] = useState<Partial<User>>({ 
    name: '', 
    username: '', 
    password: '', 
    role: 'EMPLOYEE',
    department: ''
  });

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Department Form
  const [newDept, setNewDept] = useState<Partial<Department>>({ name: '', description: '' });
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Activity Log State
  const [activityUserFilter, setActivityUserFilter] = useState<string>('ALL');

  // Helper: Calculate Sales
  const calculateUserSales = (userId: string) => {
      return sales
          .filter(s => s.salespersonId === userId && s.status !== 'VOIDED')
          .reduce((sum, s) => sum + s.total, 0);
  };

  // Helper: Combine Logs for Activity Feed
  const combinedActivity = useMemo(() => {
     const logs = [];

     // 1. Sales
     sales.forEach(sale => {
        logs.push({
           id: `sale-${sale.id}`,
           date: sale.date,
           type: 'SALE',
           user: sale.salespersonName || 'Unknown',
           userId: sale.salespersonId,
           detail: `ຂາຍສິນຄ້າ ${sale.items.length} ລາຍການ - Total: ${FORMAT_CURRENCY(sale.total)}`
        });
     });

     // 2. Stock Logs
     stockLogs.forEach(log => {
        // Only show manual adjustments/restocks, not auto-sales logs to reduce clutter
        if (log.type !== 'SALE') {
           logs.push({
              id: `stock-${log.id}`,
              date: log.date,
              type: 'STOCK',
              user: log.performedBy || 'Unknown',
              userId: null, // Stock logs might not store ID directly, relying on name
              detail: `${log.type}: ${log.productName} (${log.quantity > 0 ? '+' : ''}${log.quantity}) - ${log.note || ''}`
           });
        }
     });

     // 3. Transactions (Payments, Expenses)
     transactions.forEach(txn => {
        // Filter out Sales transactions to avoid dupes, keep manual payments/expenses
        if (txn.type !== 'SALE') {
           logs.push({
              id: `txn-${txn.id}`,
              date: txn.date,
              type: 'FINANCE',
              user: txn.performedBy || 'Unknown',
              userId: null,
              detail: `${txn.type}: ${FORMAT_CURRENCY(txn.amount)} - ${txn.note || ''}`
           });
        }
     });

     return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, stockLogs, transactions]);

  const filteredActivity = useMemo(() => {
     if (activityUserFilter === 'ALL') return combinedActivity;
     const selectedUserName = users.find(u => u.id === activityUserFilter)?.name;
     return combinedActivity.filter(log => 
        log.userId === activityUserFilter || log.user === selectedUserName
     );
  }, [combinedActivity, activityUserFilter, users]);

  // Handlers for Users
  const handleAddUser = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newUser.name || !newUser.username || !newUser.password) return;
     
     if (users.some(u => u.username.toLowerCase() === newUser.username?.toLowerCase())) {
        alert('ຊື່ຜູ້ໃຊ້ນີ້ຖືກໃຊ້ແລ້ວ (Username exists)');
        return;
     }

     const user: User = {
        id: Date.now().toString(),
        name: newUser.name!,
        username: newUser.username!,
        password: newUser.password!,
        role: newUser.role as UserRole,
        department: newUser.department || departments[0]?.name || ''
     };
     onUpdateUsers([...users, user]);
     setNewUser({ name: '', username: '', password: '', role: 'EMPLOYEE', department: '' });
     alert('ເພີ່ມພະນັກງານສຳເລັດ!');
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingUser) return;
      
      onUpdateUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
     if (users.length <= 1) return alert('Cannot delete last user');
     if (id === currentUser?.id) return alert('Cannot delete yourself');
     if (confirm('Delete this user?')) {
        onUpdateUsers(users.filter(u => u.id !== id));
     }
  };

  // Handlers for Departments
  const handleAddDept = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newDept.name) return;
     const dept: Department = {
        id: Date.now().toString(),
        name: newDept.name!,
        description: newDept.description || ''
     };
     onUpdateDepartments([...departments, dept]);
     setNewDept({ name: '', description: '' });
  };

  const handleEditDeptSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingDept) return;
      onUpdateDepartments(departments.map(d => d.id === editingDept.id ? editingDept : d));
      setEditingDept(null);
  };

  const handleDeleteDept = (id: string) => {
     if (confirm('Delete this department?')) {
        onUpdateDepartments(departments.filter(d => d.id !== id));
     }
  };

  // Handlers for Permissions
  const handlePermissionChange = (action: PermissionAction, level: number) => {
     onUpdatePermissionRules({
        ...permissionRules,
        [action]: level
     });
  };

  const getRoleBadgeColor = (role: string) => {
     switch(role) {
        case 'MANAGER': return 'bg-red-100 text-red-800 border-red-200';
        case 'DEPT_HEAD': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'UNIT_HEAD': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'TEAM_LEADER': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'ADMIN': return 'bg-gray-800 text-white';
        default: return 'bg-green-100 text-green-800 border-green-200';
     }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Users className="text-purple-600" />
             ຈັດການບຸກຄະລາກອນ (HR Management)
          </h2>
          <p className="text-gray-500 text-sm">ພະນັກງານ, ພະແນກ ແລະ ສິດການນຳໃຊ້</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
         <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'USERS' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Users size={16} className="inline mr-2" /> ພະນັກງານ (Staff)
         </button>
         <button onClick={() => setActiveTab('DEPARTMENTS')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'DEPARTMENTS' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Building2 size={16} className="inline mr-2" /> ພະແນກ (Departments)
         </button>
         <button onClick={() => setActiveTab('PERMISSIONS')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'PERMISSIONS' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Lock size={16} className="inline mr-2" /> ສິດການນຳໃຊ້ (Permissions)
         </button>
         <button onClick={() => setActiveTab('ACTIVITY')} className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'ACTIVITY' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Activity size={16} className="inline mr-2" /> ປະຫວັດການເຄື່ອນໄຫວ (Logs)
         </button>
      </div>

      {/* --- USER MANAGEMENT TAB --- */}
      {activeTab === 'USERS' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
                   <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-purple-600" /> 
                      ເພີ່ມຜູ້ໃຊ້ໃໝ່
                   </h4>
                   <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ພະນັກງານ (Full Name)</label>
                         <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="ຊື່ ແລະ ນາມສະກຸນ" />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ຜູ້ໃຊ້ (Username)</label>
                         <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: sale01" />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">ລະຫັດຜ່ານ (Password)</label>
                         <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Set password" />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">ຕຳແໜ່ງ (Role)</label>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                               {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                               ))}
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">ພະແນກ (Department)</label>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}>
                               <option value="">-- Select Department --</option>
                               {departments.map(d => (
                                  <option key={d.id} value={d.name}>{d.name}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                      <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-bold transition-colors shadow-md shadow-purple-100 mt-4">ຢືນຢັນການເພີ່ມ</button>
                   </form>
               </div>
            </div>
            <div className="lg:col-span-2">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                     <h3 className="font-bold text-gray-700">ລາຍຊື່ພະນັກງານ ({users.length})</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                     {users.sort((a,b) => (ROLE_LEVEL[b.role] || 0) - (ROLE_LEVEL[a.role] || 0)).map(user => {
                        const userTotalSales = calculateUserSales(user.id);
                        return (
                        <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-4">
                           <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-sm shrink-0 ${user.role === 'MANAGER' || user.role === 'ADMIN' ? 'bg-red-600' : user.role === 'DEPT_HEAD' ? 'bg-purple-600' : 'bg-green-600'}`}>
                                 {user.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                 <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {user.name}
                                    {user.id === currentUser?.id && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">(You)</span>}
                                 </p>
                                 <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1 items-center">
                                    <span className="flex items-center gap-1"><UserIcon size={14}/> {user.username}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
                                       <Shield size={10} /> {ROLE_LABELS[user.role] || user.role}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1 text-gray-600 text-xs"><Briefcase size={12} /> {user.department || '-'}</span>
                                 </div>
                                 
                                 {/* Sales Performance Stats */}
                                 {userTotalSales > 0 && (
                                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100 flex items-center gap-2 w-fit">
                                       <span className="text-blue-600 font-bold">Total Sales:</span> {FORMAT_CURRENCY(userTotalSales)}
                                    </div>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-2 justify-end">
                              <div className="text-right mr-4 hidden sm:block">
                                 <p className="text-xs text-gray-400">Password</p>
                                 <p className="font-mono text-sm text-gray-600 bg-gray-100 px-2 rounded">{user.password}</p>
                              </div>
                              
                              <button onClick={() => setEditingUser(user)} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                 <Edit2 size={20} />
                              </button>

                              {(ROLE_LEVEL[currentUser?.role || 'EMPLOYEE'] > ROLE_LEVEL[user.role] || currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') && user.id !== currentUser?.id && (
                                 <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 size={20} />
                                 </button>
                              )}
                           </div>
                        </div>
                     )})}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- DEPARTMENT MANAGEMENT TAB --- */}
      {activeTab === 'DEPARTMENTS' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                     <Plus size={20} className="text-purple-600" /> ເພີ່ມພະແນກໃໝ່
                  </h4>
                  <form onSubmit={handleAddDept} className="space-y-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ພະແນກ (Name)</label>
                        <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="Ex: ຝ່າຍຂາຍ, ບັນຊີ" />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ລາຍລະອຽດ (Description)</label>
                        <textarea className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" rows={3} value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} placeholder="Optional description..." />
                     </div>
                     <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-bold transition-colors">ບັນທຶກພະແນກ</button>
                  </form>
               </div>
            </div>
            <div className="lg:col-span-2">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-700">ລາຍຊື່ພະແນກ ({departments.length})</h3></div>
                  <div className="divide-y divide-gray-100">
                     {departments.map(dept => (
                        <div key={dept.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                           <div>
                              <p className="font-bold text-gray-800">{dept.name}</p>
                              <p className="text-sm text-gray-500">{dept.description}</p>
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => setEditingDept(dept)} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeleteDept(dept.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- PERMISSION MANAGEMENT TAB --- */}
      {activeTab === 'PERMISSIONS' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-gray-700 flex items-center gap-2"><Lock size={20} className="text-purple-600"/> ກຳນົດສິດການເຂົ້າເຖິງ (Permission Matrix)</h3>
               <p className="text-xs text-gray-500 mt-1">ເລືອກລະດັບຂັ້ນຕໍ່າທີ່ສາມາດເຮັດລາຍການເຫຼົ່ານີ້ໄດ້ (Minimum Role Level Required)</p>
            </div>
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(permissionRules).map(([action, minLevel]) => (
                     <div key={action} className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition-colors">
                        <div className="mb-3">
                           <span className="font-bold text-gray-800 text-sm block">{PERMISSION_DESCRIPTIONS[action] || action.replace('_', ' ')}</span>
                           <span className="text-xs text-gray-500 font-mono mt-1 block">{action}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                           <span className="text-xs font-bold text-purple-700">Min Level: {minLevel}</span>
                           <select 
                              className="w-1/2 p-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-purple-500 outline-none"
                              value={minLevel}
                              onChange={(e) => handlePermissionChange(action as PermissionAction, parseInt(e.target.value))}
                           >
                              {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                                 <option key={roleKey} value={ROLE_LEVEL[roleKey]}>
                                    {label} ({ROLE_LEVEL[roleKey]})
                                 </option>
                              ))}
                           </select>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-100">
                  <strong>Role Hierarchy Levels:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {Object.entries(ROLE_LEVEL)
                        .sort(([,a], [,b]) => a - b)
                        .map(([role, level]) => (
                           <span key={role} className="px-2 py-1 bg-white border border-yellow-200 rounded text-xs">
                              {role}: <strong>{level}</strong>
                           </span>
                        ))}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- ACTIVITY LOG TAB --- */}
      {activeTab === 'ACTIVITY' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-gray-700 flex items-center gap-2"><Activity size={20} className="text-blue-600"/> ປະຫວັດການເຄື່ອນໄຫວ (Activity Logs)</h3>
                  <p className="text-xs text-gray-500 mt-1">Sales, Stock Adjustments, Payments</p>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filter by User:</span>
                  <select 
                     className="p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                     value={activityUserFilter}
                     onChange={(e) => setActivityUserFilter(e.target.value)}
                  >
                     <option value="ALL">ທັງໝົດ (All Users)</option>
                     {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                     ))}
                  </select>
               </div>
            </div>
            <div className="flex-1 overflow-auto p-0">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 shadow-sm">
                     <tr>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ເວລາ (Time)</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ຜູ້ໃຊ້ (User)</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ປະເພດ (Type)</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ລາຍລະອຽດ (Details)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredActivity.length > 0 ? (
                        filteredActivity.map((log, index) => (
                           <tr key={`${log.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                 {new Date(log.date).toLocaleString('lo-LA')}
                              </td>
                              <td className="p-4 text-sm font-bold text-gray-800">
                                 {log.user}
                              </td>
                              <td className="p-4 text-center">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                                    log.type === 'STOCK' ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                 }`}>
                                    {log.type === 'SALE' ? <ShoppingBag size={12} className="inline mr-1"/> : log.type === 'STOCK' ? <Package size={12} className="inline mr-1"/> : <Activity size={12} className="inline mr-1"/>}
                                    {log.type}
                                 </span>
                              </td>
                              <td className="p-4 text-sm text-gray-600">
                                 {log.detail}
                              </td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={4} className="p-12 text-center text-gray-400">
                              <Clock size={48} className="mx-auto mb-2 opacity-20" />
                              <p>ບໍ່ພົບປະຫວັດການເຄື່ອນໄຫວ</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Edit2 size={20} className="text-blue-600" />
                     ແກ້ໄຂຂໍ້ມູນພະນັກງານ (Edit User)
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                     <X size={24} />
                  </button>
               </div>
               <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ພະນັກງານ (Full Name)</label>
                     <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ຜູ້ໃຊ້ (Username)</label>
                     <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ລະຫັດຜ່ານ (Password)</label>
                     <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ຕຳແໜ່ງ (Role)</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                           {Object.entries(ROLE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ພະແນກ (Department)</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingUser.department} onChange={e => setEditingUser({...editingUser, department: e.target.value})}>
                           <option value="">-- Select Department --</option>
                           {departments.map(d => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                           ))}
                        </select>
                     </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">ຍົກເລີກ</button>
                     <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-bold transition-colors flex justify-center items-center gap-2">
                        <CheckCircle2 size={18} /> ບັນທຶກ
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Edit2 size={20} className="text-purple-600" />
                     ແກ້ໄຂພະແນກ (Edit Dept)
                  </h3>
                  <button onClick={() => setEditingDept(null)} className="text-gray-400 hover:text-gray-600">
                     <X size={24} />
                  </button>
               </div>
               <form onSubmit={handleEditDeptSubmit} className="p-6 space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ຊື່ພະແນກ (Name)</label>
                     <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={editingDept.name} onChange={e => setEditingDept({...editingDept, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">ລາຍລະອຽດ (Description)</label>
                     <textarea className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" rows={3} value={editingDept.description} onChange={e => setEditingDept({...editingDept, description: e.target.value})} />
                  </div>
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setEditingDept(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">ຍົກເລີກ</button>
                     <button type="submit" className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-bold transition-colors">
                        ບັນທຶກ
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};