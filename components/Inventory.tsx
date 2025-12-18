import React, { useState, useEffect, useRef } from 'react';
import { Product, ShopSettings, StockLog, CategoryItem, Supplier, User as UserType } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Plus, Search, Trash2, Edit2, Save, X, ScanBarcode, AlertCircle, Package, Upload, Image as ImageIcon, Printer, PackagePlus, History, ArrowRight, ArrowDown, ArrowUp, DollarSign, Coins, ClipboardList, Minus, Truck, User as UserIcon } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface InventoryProps {
  products: Product[];
  categories: CategoryItem[];
  suppliers: Supplier[];
  shopSettings: ShopSettings;
  stockLogs?: StockLog[];
  currentUser: UserType | null;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onRestockProduct: (productId: string, quantity: number, note: string) => void;
  onDeleteProduct: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, categories = [], suppliers = [], shopSettings, stockLogs = [], currentUser, onAddProduct, onUpdateProduct, onRestockProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LOW_STOCK'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Restock / Adjust State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('');
  const [restockNote, setRestockNote] = useState('');
  const [restockSupplierId, setRestockSupplierId] = useState('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');

  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  
  // Global History State
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Label State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printQuantity, setPrintQuantity] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    unit: 'ອັນ',
    category: categories[0]?.name || 'ອື່ນໆ',
    price: 0,
    wholesalePrice: 0,
    costPrice: 0,
    stock: 0,
    image: 'https://picsum.photos/200/200'
  });

  const lowStockThreshold = 20;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(searchTerm));
    
    if (!matchesSearch) return false;

    if (filterType === 'LOW_STOCK') {
       return p.stock <= lowStockThreshold;
    }

    return true;
  });

  const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;
  
  // Inventory Value Calculation
  const totalCostValue = products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);

  // Filter logs for selected product history
  const productLogs = historyProduct 
    ? stockLogs.filter(log => log.productId === historyProduct.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
    
  // Global Sorted Logs
  const globalLogs = [...stockLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Play Beep Sound
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1500; // Hz
        osc.type = 'sine';
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        setTimeout(() => ctx.close(), 200);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Scanner Lifecycle
  useEffect(() => {
    if (isScannerOpen) {
      const timeoutId = setTimeout(() => {
        if (!scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            "inventory-reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true,
              rememberLastUsedCamera: true
            },
            false
          );
          
          scannerRef.current = scanner;

          scanner.render(
            (decodedText) => {
              playBeep();
              setFormData(prev => ({ ...prev, barcode: decodedText }));
              setIsScannerOpen(false);
            },
            (error) => {
              // Ignore errors
            }
          );
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear().catch(console.error);
          } catch(e) { console.error(e) }
          scannerRef.current = null;
        }
      };
    }
  }, [isScannerOpen]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        unit: 'ອັນ',
        category: categories[0]?.name || 'ອື່ນໆ',
        price: 0,
        wholesalePrice: 0,
        costPrice: 0,
        stock: 0,
        image: 'https://picsum.photos/200/200?random=' + Math.random()
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenRestockModal = (product: Product) => {
    setRestockProduct(product);
    setRestockAmount('');
    setRestockNote('');
    setRestockSupplierId('');
    setAdjustType('ADD');
    setIsRestockModalOpen(true);
  };

  const handleOpenHistoryModal = (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockAmount) return;
    
    let amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Negate amount if removing stock
    if (adjustType === 'REMOVE') {
       amount = -amount;
    }

    let finalNote = restockNote;
    const selectedSupplier = suppliers.find(s => s.id === restockSupplierId);

    if (adjustType === 'ADD' && selectedSupplier) {
        finalNote = `Supplier: ${selectedSupplier.name}${restockNote ? ' - ' + restockNote : ''}`;
    } else if (!finalNote) {
        finalNote = adjustType === 'ADD' ? 'Manual Restock' : 'Stock Adjustment';
    }

    onRestockProduct(restockProduct.id, amount, finalNote);
    
    setIsRestockModalOpen(false);
    setRestockProduct(null);
    setRestockAmount('');
    setRestockNote('');
    setRestockSupplierId('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPrintModal = (product: Product) => {
      setPrintProduct(product);
      setPrintQuantity(1);
      setIsPrintModalOpen(true);
  };

  const handlePrintLabel = () => {
      window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    // Ensure costPrice is set (default to 0 if missing)
    const cost = Number(formData.costPrice) || 0;
    const wholesale = Number(formData.wholesalePrice) || 0;

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...formData, costPrice: cost, wholesalePrice: wholesale } as Product);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        barcode: formData.barcode,
        name: formData.name!,
        unit: formData.unit || 'ອັນ',
        category: formData.category || 'ອື່ນໆ',
        price: Number(formData.price),
        wholesalePrice: wholesale,
        costPrice: cost,
        stock: Number(formData.stock),
        image: formData.image!
      };
      onAddProduct(newProduct);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-gray-800">ສາງສິນຄ້າ (Inventory)</h2>
           <p className="text-gray-500 text-sm">ຈັດການລາຍການສິນຄ້າ ແລະ ສະຕັອກ</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button 
             onClick={() => setIsGlobalHistoryOpen(true)}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm flex-1 md:flex-none justify-center"
           >
             <ClipboardList size={20} />
             <span className="hidden md:inline">ປະຫວັດການເຄື່ອນໄຫວ</span>
           </button>
           <button 
             onClick={() => handleOpenModal()}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm flex-1 md:flex-none justify-center"
           >
             <Plus size={20} />
             <span className="hidden md:inline">ເພີ່ມສິນຄ້າໃໝ່</span>
           </button>
        </div>
      </div>

      {/* Valuation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Package size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">ສິນຄ້າທັງໝົດ</p>
            <p className="text-xl font-bold text-gray-800">{products.length} ລາຍການ</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><Coins size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">ມູນຄ່າສາງ (Cost)</p>
            <p className="text-xl font-bold text-gray-800">{FORMAT_CURRENCY(totalCostValue)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">ສິນຄ້າໃກ້ໝົດ</p>
            <p className="text-xl font-bold text-gray-800">{lowStockCount} ລາຍການ</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ຄົ້ນຫາສິນຄ້າ, ບາໂຄດ..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setFilterType('ALL')} 
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
           >
             ທັງໝົດ
           </button>
           <button 
             onClick={() => setFilterType('LOW_STOCK')} 
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'LOW_STOCK' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-red-600'}`}
           >
             <AlertCircle size={16} />
             ສິນຄ້າໃກ້ໝົດ
           </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ສິນຄ້າ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ໝວດໝູ່</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">ຕົ້ນທຶນ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">ລາຄາຂາຍ</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Stock</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.barcode || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{product.category}</span>
                  </td>
                  <td className="p-4 text-right text-sm text-gray-500">
                    {FORMAT_CURRENCY(product.costPrice || 0)}
                  </td>
                  <td className="p-4 text-right text-sm font-bold text-blue-600">
                    {FORMAT_CURRENCY(product.price)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      product.stock <= 0 ? 'bg-red-100 text-red-700' :
                      product.stock <= lowStockThreshold ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleOpenRestockModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Adjust Stock">
                        <PackagePlus size={16} />
                      </button>
                      <button onClick={() => handleOpenHistoryModal(product)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="History">
                        <History size={16} />
                      </button>
                      <button onClick={() => handleOpenPrintModal(product)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Print Barcode">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(product)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Are you sure?')) onDeleteProduct(product.id) }} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    ບໍ່ພົບສິນຄ້າ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingProduct ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Image & Scanner */}
                <div className="w-full md:w-1/3 space-y-4">
                   <div 
                     className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden group"
                     onClick={() => fileInputRef.current?.click()}
                   >
                      {formData.image && formData.image.startsWith('data:') ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="text-gray-400 mb-2" size={32} />
                          <span className="text-xs text-gray-500">ອັບໂຫຼດຮູບ</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Upload className="text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                   </div>

                   <button 
                     type="button"
                     onClick={() => setIsScannerOpen(!isScannerOpen)}
                     className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 border ${isScannerOpen ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
                   >
                     <ScanBarcode size={18} />
                     {isScannerOpen ? 'ປິດສະແກນເນີ' : 'ສະແກນ Barcode'}
                   </button>
                   
                   {isScannerOpen && (
                     <div id="inventory-reader" className="w-full rounded-lg overflow-hidden border border-gray-300 h-48 bg-black"></div>
                   )}
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.barcode}
                          onChange={e => setFormData({...formData, barcode: e.target.value})}
                          placeholder="ສະແກນ ຫຼື ພິມ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ໝວດໝູ່</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ສິນຄ້າ</label>
                      <input 
                        required
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ລາຄາຂາຍຍ່ອຍ</label>
                        <input 
                          required
                          type="number" 
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ຫົວໜ່ວຍ</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.unit}
                          onChange={e => setFormData({...formData, unit: e.target.value})}
                          placeholder="ອັນ, ກ່ອງ..."
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ລາຄາຕົ້ນທຶນ</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.costPrice}
                          onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ລາຄາສົ່ງ (VIP)</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-purple-600"
                          value={formData.wholesalePrice}
                          onChange={e => setFormData({...formData, wholesalePrice: parseFloat(e.target.value)})}
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນໃນສາງ</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                        disabled={!!editingProduct} // Disable direct stock edit if updating, force use restock
                        placeholder={editingProduct ? "ໃຊ້ເມນູ Restock ເພື່ອປັບສະຕັອກ" : "0"}
                      />
                      {editingProduct && <p className="text-xs text-gray-500 mt-1">* ກະລຸນາໃຊ້ປຸ່ມ Restock ເພື່ອປັບຈຳນວນ</p>}
                   </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                 >
                   ຍົກເລີກ
                 </button>
                 <button 
                   type="submit"
                   className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                 >
                   <Save size={18} /> ບັນທຶກຂໍ້ມູນ
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isRestockModalOpen && restockProduct && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                  <h3 className="text-lg font-bold text-blue-800">ປັບປຸງຈຳນວນສິນຄ້າ (Stock Adjustment)</h3>
                  <button onClick={() => setIsRestockModalOpen(false)}><X className="text-gray-400" /></button>
               </div>
               <form onSubmit={handleRestockSubmit} className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <img src={restockProduct.image} className="w-12 h-12 rounded object-cover" alt="" />
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{restockProduct.name}</p>
                        <p className="text-xs text-gray-500">ປະຈຸບັນ: <span className="font-bold text-blue-600">{restockProduct.stock} {restockProduct.unit}</span></p>
                     </div>
                  </div>

                  {/* User Performing Action Display */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                     <UserIcon size={14} className="text-blue-500" />
                     <span className="font-medium">ຜູ້ເຮັດລາຍການ: <span className="text-gray-800 font-bold">{currentUser?.name || 'Unknown'}</span></span>
                  </div>

                  <div className="flex bg-gray-100 p-1 rounded-lg">
                     <button 
                       type="button" 
                       onClick={() => setAdjustType('ADD')}
                       className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${adjustType === 'ADD' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                     >
                        <ArrowUp size={16} /> ນຳເຂົ້າ (Add)
                     </button>
                     <button 
                       type="button" 
                       onClick={() => setAdjustType('REMOVE')}
                       className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${adjustType === 'REMOVE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                     >
                        <ArrowDown size={16} /> ນຳອອກ (Remove)
                     </button>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນທີ່ປ່ຽນແປງ (Quantity)</label>
                     <input 
                       required
                       type="number"
                       min="1"
                       autoFocus
                       className={`w-full p-3 border-2 rounded-lg focus:ring-4 outline-none text-center text-xl font-bold transition-all ${
                         adjustType === 'ADD' ? 'border-green-100 focus:border-green-500 focus:ring-green-50' : 'border-red-100 focus:border-red-500 focus:ring-red-50'
                       }`}
                       value={restockAmount}
                       onChange={e => setRestockAmount(e.target.value)}
                       placeholder="0"
                     />
                  </div>

                  {adjustType === 'ADD' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                           <Truck size={14} /> ເລືອກຜູ້ສະໜອງ (Supplier) - Option
                        </label>
                        <select 
                           className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                           value={restockSupplierId}
                           onChange={e => setRestockSupplierId(e.target.value)}
                        >
                           <option value="">-- ເລືອກຜູ້ສະໜອງ --</option>
                           {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                           ))}
                        </select>
                     </div>
                  )}

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">ໝາຍເຫດ / ເຫດຜົນການປັບປຸງ (Reason)</label>
                     <textarea 
                       required
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       rows={2}
                       placeholder="ກະລຸນາໃສ່ເຫດຜົນການປັບປຸງ..."
                       value={restockNote}
                       onChange={e => setRestockNote(e.target.value)}
                     />
                  </div>

                  <button 
                    type="submit"
                    className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md ${adjustType === 'ADD' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
                  >
                     <Save size={18} /> ຢືນຢັນການປັບປຸງ
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Product Specific History Modal */}
      {isHistoryModalOpen && historyProduct && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <History size={20} /> ປະຫວັດສິນຄ້າ: {historyProduct.name}
                  </h3>
                  <button onClick={() => setIsHistoryModalOpen(false)}><X className="text-gray-400" /></button>
               </div>
               <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="p-3 text-xs font-semibold text-gray-500">ວັນທີ/ເວລາ</th>
                           <th className="p-3 text-xs font-semibold text-gray-500">ລາຍການ</th>
                           <th className="p-3 text-xs font-semibold text-gray-500 text-center">ປ່ຽນແປງ</th>
                           <th className="p-3 text-xs font-semibold text-gray-500 text-center">ຄົງເຫຼືອ</th>
                           <th className="p-3 text-xs font-semibold text-gray-500">ໝາຍເຫດ / ຜູ້ເຮັດລາຍການ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {productLogs.length > 0 ? productLogs.map(log => (
                           <tr key={log.id}>
                              <td className="p-3 text-sm text-gray-600">{new Date(log.date).toLocaleString('lo-LA')}</td>
                              <td className="p-3 text-sm">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.type === 'SALE' ? 'bg-blue-100 text-blue-700' : 
                                    log.type === 'RESTOCK' ? 'bg-green-100 text-green-700' :
                                    log.type === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                 }`}>
                                    {log.type}
                                 </span>
                              </td>
                              <td className={`p-3 text-sm font-bold text-center ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {log.quantity > 0 ? '+' : ''}{log.quantity}
                              </td>
                              <td className="p-3 text-sm text-center text-gray-800">{log.newStock}</td>
                              <td className="p-3 text-sm text-gray-500">
                                 <div>{log.note || '-'}</div>
                                 <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5"><UserIcon size={10} /> {log.performedBy || 'System'}</div>
                              </td>
                           </tr>
                        )) : (
                           <tr><td colSpan={5} className="text-center py-8 text-gray-400">ບໍ່ມີປະຫວັດ</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {/* Global History Modal */}
      {isGlobalHistoryOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <ClipboardList size={22} className="text-blue-600" /> 
                     ປະຫວັດການເຄື່ອນໄຫວສາງ (Stock Movement History)
                  </h3>
                  <button onClick={() => setIsGlobalHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={24} />
                  </button>
               </div>
               <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50 sticky top-0 shadow-sm">
                        <tr>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ວັນທີ/ເວລາ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ສິນຄ້າ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ປະເພດ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ຈຳນວນ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ກ່ອນໜ້າ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">ຄົງເຫຼືອ</th>
                           <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ໝາຍເຫດ / ຜູ້ເຮັດລາຍການ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {globalLogs.length > 0 ? globalLogs.map(log => (
                           <tr key={log.id} className="hover:bg-gray-50">
                              <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{new Date(log.date).toLocaleString('lo-LA')}</td>
                              <td className="p-4 text-sm font-medium text-gray-800">{log.productName}</td>
                              <td className="p-4 text-center">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.type === 'SALE' ? 'bg-blue-100 text-blue-700' : 
                                    log.type === 'RESTOCK' ? 'bg-green-100 text-green-700' :
                                    log.type === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                 }`}>
                                    {log.type}
                                 </span>
                              </td>
                              <td className={`p-4 text-sm font-bold text-center ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {log.quantity > 0 ? '+' : ''}{log.quantity}
                              </td>
                              <td className="p-4 text-sm text-center text-gray-500">{log.previousStock}</td>
                              <td className="p-4 text-sm text-center font-bold text-gray-800">{log.newStock}</td>
                              <td className="p-4 text-sm text-gray-500">
                                 <div>{log.note || '-'}</div>
                                 <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5"><UserIcon size={10} /> {log.performedBy || 'System'}</div>
                              </td>
                           </tr>
                        )) : (
                           <tr><td colSpan={7} className="text-center py-12 text-gray-400">ບໍ່ມີປະຫວັດ</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {/* Barcode Print Modal */}
      {isPrintModalOpen && printProduct && (
         <div id="barcode-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div id="barcode-content" className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden p-8 flex flex-col items-center">
               <h3 className="text-xl font-bold mb-6 no-print">ພິມບາໂຄດສິນຄ້າ</h3>
               
               {/* Controls */}
               <div className="w-full flex items-center justify-center gap-4 mb-6 no-print">
                  <div className="flex items-center gap-2">
                     <button onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Minus size={16} /></button>
                     <input 
                        type="number" 
                        value={printQuantity} 
                        onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border p-2 rounded-lg" 
                     />
                     <button onClick={() => setPrintQuantity(printQuantity + 1)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus size={16} /></button>
                  </div>
                  <span className="text-sm text-gray-500">ຈຳນວນດວງ</span>
               </div>

               {/* Print Preview Area - Grid Layout */}
               <div className="w-full max-h-[60vh] overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 w-full" style={{ pageBreakInside: 'avoid' }}>
                     {Array.from({ length: printQuantity }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-300 p-4 rounded-lg flex flex-col items-center justify-center text-center h-40 shadow-sm break-inside-avoid">
                           <p className="font-bold text-sm mb-1 line-clamp-1 w-full">{printProduct.name}</p>
                           <p className="font-barcode text-4xl my-2">{printProduct.barcode || printProduct.id}</p>
                           <p className="text-xs tracking-widest">{printProduct.barcode || printProduct.id}</p>
                           <p className="font-bold text-lg mt-1">{FORMAT_CURRENCY(printProduct.price)}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex gap-4 w-full mt-6 no-print">
                  <button onClick={() => setIsPrintModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">ປິດ</button>
                  <button onClick={handlePrintLabel} className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                     <Printer size={18} /> ພິມ
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};