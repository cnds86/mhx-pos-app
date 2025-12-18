import React, { useState, useEffect, useRef } from 'react';
import { SaleRecord, Product, ShopSettings, SystemData, User, PaymentTransaction, CategoryItem } from '../types';
import { Download, Trash2, Database, FileSpreadsheet, Store, Save, Percent, Upload, Image as ImageIcon, Package, RotateCcw, AlertTriangle, List, Plus, X } from 'lucide-react';

interface SettingsProps {
  sales: SaleRecord[];
  products: Product[];
  shopSettings: ShopSettings;
  users: User[];
  transactions: PaymentTransaction[];
  categories: CategoryItem[];
  onUpdateSettings: (settings: ShopSettings) => void;
  onUpdateUsers: (users: User[]) => void;
  onResetData: () => void;
  onRestoreData: (data: SystemData) => void;
  onImportProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ sales, products, shopSettings, users = [], transactions = [], categories = [], onUpdateSettings, onUpdateUsers, onResetData, onRestoreData, onImportProducts, onUpdateCategories }) => {
  const [formData, setFormData] = useState<ShopSettings>(shopSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'DATA' | 'CATEGORIES'>('GENERAL');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const importCsvRef = useRef<HTMLInputElement>(null);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    setFormData(shopSettings);
  }, [shopSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportSalesCSV = () => {
    const headers = ['Bill ID,Date,Customer,Items,Total Amount,Tax,Payment Method'];
    const rows = sales.map(sale => {
      const itemsList = sale.items.map(i => `${i.name} (${i.quantity})`).join('; ');
      return `${sale.id},${new Date(sale.date).toLocaleDateString()},"${sale.customerName || 'General'}","${itemsList}",${sale.total},${sale.taxAmount || 0},${sale.paymentMethod}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mahaxay_sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventoryCSV = () => {
    const headers = ['ID,Barcode,Name,Category,Unit,Cost Price,Retail Price,Wholesale Price,Stock'];
    const rows = products.map(p => {
      return `${p.id},"${p.barcode || ''}","${p.name}","${p.category}","${p.unit}",${p.costPrice || 0},${p.price},${p.wholesalePrice || 0},${p.stock}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mahaxay_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBackup = () => {
    const data = {
      products,
      categories,
      sales,
      shopSettings,
      users,
      transactions,
      version: '2.5.0',
      timestamp: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mahaxay_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (json.products && Array.isArray(json.products) && json.sales && Array.isArray(json.sales)) {
                if(confirm(`ພົບຂໍ້ມູນ Backup ວັນທີ: ${new Date(json.timestamp || Date.now()).toLocaleString()}\n\nຄຳເຕືອນ: ຂໍ້ມູນປະຈຸບັນຈະຖືກທັບດ້ວຍຂໍ້ມູນຈາກໄຟລ໌ Backup ນີ້. ທ່ານຕ້ອງການດຳເນີນການຕໍ່ບໍ່?`)) {
                    onRestoreData(json);
                }
            } else {
                alert('ຮູບແບບໄຟລ໌ບໍ່ຖືກຕ້ອງ (Invalid Backup File)');
            }
        } catch (err) {
            console.error(err);
            alert('ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌ (File Error)');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        
        // Remove Header
        const dataRows = rows.slice(1);
        const newProducts: Product[] = [];

        dataRows.forEach(row => {
           // Basic CSV parsing (not robust for commas inside quotes)
           const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
           
           if (cols.length >= 4 && cols[2]) { // Ensure Name exists
              // Format: ID, Barcode, Name, Category, Unit, Cost, Retail, Wholesale, Stock
              const newProduct: Product = {
                 id: cols[0] || Date.now().toString() + Math.random(),
                 barcode: cols[1] || '',
                 name: cols[2],
                 category: cols[3] || 'ອື່ນໆ',
                 unit: cols[4] || 'ອັນ',
                 costPrice: parseFloat(cols[5]) || 0,
                 price: parseFloat(cols[6]) || 0,
                 wholesalePrice: parseFloat(cols[7]) || 0,
                 stock: parseFloat(cols[8]) || 0,
                 image: 'https://picsum.photos/200/200?random=' + Math.random() // Default image
              };
              newProducts.push(newProduct);
           }
        });

        if (newProducts.length > 0) {
           if(confirm(`ພົບສິນຄ້າ ${newProducts.length} ລາຍການ. ຕ້ອງການນຳເຂົ້າບໍ່?`)) {
              onImportProducts(newProducts);
              alert('ນຳເຂົ້າສຳເລັດ!');
           }
        } else {
           alert('ບໍ່ພົບຂໍ້ມູນທີ່ຖືກຕ້ອງໃນໄຟລ໌ CSV');
        }

      } catch (err) {
        console.error(err);
        alert('ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌ CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCategoryName.trim()) return;
      
      onUpdateCategories([
          ...categories, 
          { id: Date.now().toString(), name: newCategoryName.trim() }
      ]);
      setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
      if(confirm('ຕ້ອງການລຶບໝວດໝູ່ນີ້ແທ້ບໍ່?')) {
          onUpdateCategories(categories.filter(c => c.id !== id));
      }
  };

  return (
    <div className="p-4 md:p-6 animate-fade-in max-w-4xl mx-auto pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ຕັ້ງຄ່າລະບົບ (Settings)</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
         <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'GENERAL' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
         >
            ຂໍ້ມູນທົ່ວໄປ (General)
            {activeTab === 'GENERAL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
         </button>
         <button 
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'CATEGORIES' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
         >
            ໝວດໝູ່ສິນຄ້າ (Categories)
            {activeTab === 'CATEGORIES' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
         </button>
         <button 
            onClick={() => setActiveTab('DATA')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'DATA' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
         >
            ຈັດການຂໍ້ມູນ (Data)
            {activeTab === 'DATA' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
         </button>
      </div>

      <div className="grid gap-6">
        
        {/* Shop Settings */}
        {activeTab === 'GENERAL' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-gray-100 bg-blue-50 flex items-center gap-2">
               <Store className="text-blue-600" size={20} />
               <h3 className="font-semibold text-gray-800">ຂໍ້ມູນຮ້ານ (Shop Information)</h3>
             </div>
             <div className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                   
                   {/* Logo Upload */}
                   <div className="flex justify-center mb-6">
                     <div 
                       className="relative group cursor-pointer w-32 h-32"
                       onClick={() => fileInputRef.current?.click()}
                     >
                       {formData.logo ? (
                         <img 
                           src={formData.logo} 
                           alt="Shop Logo" 
                           className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-sm"
                         />
                       ) : (
                         <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                           <ImageIcon className="text-gray-400" size={32} />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                         <Upload size={20} className="mb-1" />
                         <span className="text-[10px] font-medium">ອັບໂຫຼດໂລໂກ້</span>
                       </div>
                       <input 
                         type="file" 
                         ref={fileInputRef}
                         className="hidden"
                         accept="image/*"
                         onChange={handleLogoUpload}
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ຮ້ານ (Shop Name)</label>
                       <input 
                         type="text" 
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                     </div>
                      <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">ສາຂາ (Branch / Slogan)</label>
                       <input 
                         type="text" 
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={formData.branch}
                         onChange={e => setFormData({...formData, branch: e.target.value})}
                       />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ເບີໂທຕິດຕໍ່ (Phone)</label>
                     <input 
                       type="text" 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={formData.phone}
                       onChange={e => setFormData({...formData, phone: e.target.value})}
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ທີ່ຢູ່ (Address)</label>
                     <textarea 
                       rows={2}
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={formData.address}
                       onChange={e => setFormData({...formData, address: e.target.value})}
                     />
                   </div>

                   {/* Tax Settings */}
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                       <div className="flex items-center justify-between mb-2">
                           <label className="flex items-center gap-2 font-medium text-gray-800">
                               <Percent size={18} />
                               ການຄິດໄລ່ອາກອນ (VAT/Tax)
                           </label>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               className="sr-only peer" 
                               checked={formData.vatEnabled} 
                               onChange={e => setFormData({...formData, vatEnabled: e.target.checked})} 
                             />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                           </label>
                       </div>
                       {formData.vatEnabled && (
                           <div className="animate-fade-in">
                               <label className="block text-xs font-medium text-gray-600 mb-1">ອັດຕາອາກອນ (%)</label>
                               <input 
                                   type="number" 
                                   min="0"
                                   max="100"
                                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={formData.taxRate}
                                   onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value)})}
                               />
                               <p className="text-[10px] text-gray-500 mt-1">ອາກອນຈະຖືກຄິດໄລ່ເພີ່ມຈາກຍອດລວມ (Exclusive Tax)</p>
                           </div>
                       )}
                   </div>

                    <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ຂໍ້ຄວາມທ້າຍບິນ (Receipt Footer)</label>
                     <input 
                       type="text" 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={formData.receiptFooter}
                       onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                     />
                   </div>

                   <div className="pt-2">
                     <button 
                       type="submit"
                       className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                     >
                       <Save size={18} />
                       {isSaved ? 'ບັນທຶກແລ້ວ!' : 'ບັນທຶກຂໍ້ມູນ'}
                     </button>
                   </div>
                </form>
             </div>
           </div>
        )}

        {/* Category Settings */}
        {activeTab === 'CATEGORIES' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
               <div className="p-4 border-b border-gray-100 bg-orange-50 flex items-center gap-2">
                  <List className="text-orange-600" size={20} />
                  <h3 className="font-semibold text-gray-800">ຈັດການໝວດໝູ່ສິນຄ້າ (Product Categories)</h3>
               </div>
               <div className="p-6">
                  <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                     <input 
                        type="text" 
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="ຊື່ໝວດໝູ່ໃໝ່ (New Category Name)"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        required
                     />
                     <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2">
                        <Plus size={18} /> ເພີ່ມ
                     </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                           <span className="font-medium text-gray-700">{cat.name}</span>
                           <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
        )}

        {/* Data Management */}
        {activeTab === 'DATA' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
               <Database className="text-gray-600" size={20} />
               <h3 className="font-semibold text-gray-800">ຈັດການຂໍ້ມູນ (Data Management)</h3>
             </div>
             
             <div className="p-6 space-y-4">
               
               {/* Backup & Restore Section */}
               <div className="flex flex-col md:flex-row gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100 items-center">
                  <div className="flex-1 w-full">
                     <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-2">
                       <Database size={18} />
                       ສຳຮອງ ແລະ ກູ້ຄືນຂໍ້ມູນ (Backup & Restore)
                     </h4>
                     <p className="text-xs text-purple-700">ບັນທຶກຂໍ້ມູນທັງໝົດເປັນໄຟລ໌ ຫຼື ນຳຂໍ້ມູນເກົ່າກັບມາໃຊ້</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                     <button 
                       onClick={handleDownloadBackup}
                       className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm font-medium"
                     >
                       <Download size={16} />
                       <span>Backup</span>
                     </button>
                     <button 
                       onClick={() => restoreInputRef.current?.click()}
                       className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors shadow-sm text-sm font-medium"
                     >
                       <RotateCcw size={16} />
                       <span>Restore</span>
                     </button>
                     <input 
                       type="file" 
                       ref={restoreInputRef} 
                       className="hidden" 
                       accept=".json" 
                       onChange={handleRestoreUpload}
                     />
                  </div>
               </div>

               {/* Import CSV Section */}
               <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                     <h4 className="font-medium text-blue-900">ນຳເຂົ້າສິນຄ້າຈາກ CSV (Import Inventory)</h4>
                     <p className="text-xs text-blue-700">Format: Barcode, Name, Category, Unit, Cost, Retail, Wholesale, Stock</p>
                  </div>
                  <button 
                     onClick={() => importCsvRef.current?.click()}
                     className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                  >
                     <Upload size={16} />
                     <span>Import .CSV</span>
                  </button>
                  <input 
                     type="file" 
                     ref={importCsvRef}
                     className="hidden"
                     accept=".csv"
                     onChange={handleImportCsv}
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                   <div>
                     <h4 className="font-medium text-gray-900">ສົ່ງອອກຂໍ້ມູນການຂາຍ</h4>
                     <p className="text-xs text-gray-500">Sales Report (.CSV)</p>
                   </div>
                   <button 
                     onClick={handleExportSalesCSV}
                     className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                   >
                     <FileSpreadsheet size={16} />
                     <span>Sales</span>
                   </button>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                   <div>
                     <h4 className="font-medium text-gray-900">ສົ່ງອອກຂໍ້ມູນສິນຄ້າ</h4>
                     <p className="text-xs text-gray-500">Inventory Stock (.CSV)</p>
                   </div>
                   <button 
                     onClick={handleExportInventoryCSV}
                     className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                   >
                     <Package size={16} />
                     <span>Stock</span>
                   </button>
                 </div>
               </div>

               <hr className="border-gray-100 my-4" />

               <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                 <div className="flex items-center gap-2">
                   <AlertTriangle size={20} className="text-red-500" />
                   <div>
                     <h4 className="font-bold text-red-700">ລ້າງຂໍ້ມູນທັງໝົດ (Factory Reset)</h4>
                     <p className="text-xs text-red-500">ລົບປະຫວັດການຂາຍ ແລະ ສິນຄ້າທັງໝົດ (ບໍ່ສາມາດກູ້ຄືນໄດ້)</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => {
                      if(confirm('ຄຳເຕືອນ: ຂໍ້ມູນທັງໝົດຈະຖືກລົບ! ທ່ານແນ່ໃຈບໍ່?')) {
                        onResetData();
                      }
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold shadow-sm"
                 >
                   <Trash2 size={16} />
                   <span>Reset</span>
                 </button>
               </div>
             </div>
           </div>
        )}

        {/* System Info */}
        <div className="text-center text-xs text-gray-400 mt-4">
           Version 2.7.2
        </div>

      </div>
    </div>
  );
};