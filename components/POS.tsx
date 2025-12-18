
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, PaymentMethod, Customer, DeliveryDetails, DeliveryStatus, ShopSettings, HeldOrder, User, SaleRecord, PaymentDetail, CategoryItem } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, ChevronRight, Banknote, QrCode, User as UserIcon, ChevronDown, Tag, FileText, Truck, MapPin, Phone, ScanBarcode, AlertCircle, PauseCircle, Clock, Play, MessageSquare, CheckCircle2, PenTool, Wallet, Briefcase, History } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// UI Components
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';

interface POSProps {
  currentUser: User | null;
  products: Product[];
  categories: CategoryItem[];
  customers: Customer[];
  initialCart?: CartItem[];
  initialCustomer?: Customer;
  shopSettings: ShopSettings;
  heldOrders: HeldOrder[];
  sales: SaleRecord[]; 
  onCheckout: (
    items: CartItem[], subtotal: number, discount: number, deliveryFee: number,
    taxAmount: number, total: number, method: PaymentMethod, received: number, 
    change: number, customer: Customer, delivery?: DeliveryDetails,
    splitPayments?: PaymentDetail[], projectRef?: string
  ) => void;
  onSaveQuotation: (items: CartItem[], subtotal: number, discount: number, total: number, customer: Customer, note: string) => void;
  onSaveHeldOrder: (items: CartItem[], customer: Customer, note?: string) => void;
  onRemoveHeldOrder: (id: string) => void;
  onVoidSale?: (saleId: string, authorizedById?: string) => void;
  onViewSale?: (sale: SaleRecord) => void;
}

export const POS: React.FC<POSProps> = ({ 
  currentUser, products, categories = [], customers, initialCart, initialCustomer, shopSettings, heldOrders, sales, onCheckout, onSaveQuotation, onSaveHeldOrder, onRemoveHeldOrder, onViewSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // State for Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isRecentSalesModalOpen, setIsRecentSalesModalOpen] = useState(false);

  // Business State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {id: '0', name: 'General', phone: '', type: 'GENERAL'});
  const [projectRef, setProjectRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [enableDelivery, setEnableDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContact, setDeliveryContact] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [customItemData, setCustomItemData] = useState({ name: '', price: '', quantity: '1' });

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (enableDelivery ? (Number(deliveryFee) || 0) : 0);

  const addToCart = (product: Product) => {
    if (product.stock <= 0 && !product.isCustom) return alert('ສິນຄ້າໝົດ!');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, price: product.price }];
    });
  };

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden relative">
      
      {/* Scanner Modal */}
      <Modal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        title="ສະແກນບາໂຄດ" 
        headerIcon={<ScanBarcode className="text-blue-600" />}
      >
        <div id="reader" className="w-full aspect-square bg-black rounded-xl overflow-hidden"></div>
        <p className="text-center text-gray-500 text-sm mt-4">ຫັນບາໂຄດສິນຄ້າໃສ່ກ້ອງເພື່ອທຳການສະແກນ</p>
      </Modal>

      {/* Main Product Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 md:border-r border-gray-200 h-full ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-white shadow-sm z-10 shrink-0 space-y-3">
          <div className="flex gap-3">
            <Input 
              placeholder="ຄົ້ນຫາສິນຄ້າ ຫຼື ສະແກນ Barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} />}
              rightIcon={<Button variant="ghost" size="sm" onClick={() => setIsScannerOpen(true)}><ScanBarcode size={20}/></Button>}
            />
            <Button variant="outline" onClick={() => setIsCustomItemModalOpen(true)} leftIcon={<PenTool size={18}/>}>ລາຍການອື່ນໆ</Button>
            <Button variant="outline" className="relative" onClick={() => setIsHeldOrdersModalOpen(true)}>
               <Clock size={22} />
               {heldOrders.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{heldOrders.length}</span>}
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button variant={selectedCategory === 'All' ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedCategory('All')}>ທັງໝົດ</Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={selectedCategory === cat.name ? 'primary' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat.name)}>{cat.name}</Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 group">
                <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
                  <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 h-10">{product.name}</h3>
                <div className="flex justify-between items-end mt-2">
                   <p className="font-black text-blue-600">{FORMAT_CURRENCY(product.price)}</p>
                   <p className="text-[10px] font-bold text-gray-400">{product.stock} {product.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`w-full md:w-96 bg-white shadow-xl flex flex-col z-20 absolute md:relative inset-0 md:inset-auto h-full ${showMobileCart ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-blue-600" /> ກະຕ່າສິນຄ້າ</h2>
            <Badge variant="blue" size="sm">{cart.length} ລາຍການ</Badge>
          </div>
          
          <Button variant="outline" fullWidth onClick={() => setIsCustomerModalOpen(true)} leftIcon={<UserIcon size={18}/>} className="justify-between">
            <div className="text-left overflow-hidden">
               <p className="text-[10px] text-gray-400 uppercase">ລູກຄ້າ</p>
               <p className="truncate">{selectedCustomer.name}</p>
            </div>
            <ChevronDown size={16}/>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50"><ShoppingCart size={64} /><p className="font-bold mt-2">ຍັງບໍ່ມີສິນຄ້າ</p></div>
          ) : cart.map(item => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3">
               <img src={item.image} className="w-12 h-12 rounded-lg object-cover" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-blue-600 font-black">{FORMAT_CURRENCY(item.price)}</p>
               </div>
               <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                  <button className="p-1 hover:bg-gray-100 rounded"><Minus size={14}/></button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button className="p-1 hover:bg-gray-100 rounded" onClick={() => addToCart(item)}><Plus size={14}/></button>
               </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t bg-gray-50/50 space-y-4">
          <div className="space-y-1">
             <div className="flex justify-between text-sm text-gray-500"><span>ລວມເງິນ</span><span>{FORMAT_CURRENCY(subtotal)}</span></div>
             <div className="flex justify-between text-xl font-black text-gray-800 pt-2 border-t border-gray-200"><span>ຍອດສຸດທິ</span><span>{FORMAT_CURRENCY(total)}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" leftIcon={<FileText/>}>ສະເໜີລາຄາ</Button>
            <Button variant="primary" className="flex-[2]" onClick={() => setIsCheckoutOpen(true)} leftIcon={<CreditCard/>}>ຊຳລະເງິນ</Button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="ເລືອກລູກຄ້າ">
         <div className="space-y-2">
            {customers.map(c => (
              <button key={c.id} onClick={() => {setSelectedCustomer(c); setIsCustomerModalOpen(false);}} className="w-full p-4 rounded-2xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-3 group">
                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">{c.name[0]}</div>
                 <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone || 'No phone'}</p>
                 </div>
              </button>
            ))}
         </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="ຊຳລະເງິນ" maxWidth="md">
         <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl text-center">
               <p className="text-sm text-blue-600 font-bold uppercase">ຍອດລວມທັງໝົດ</p>
               <p className="text-4xl font-black text-blue-900 mt-1">{FORMAT_CURRENCY(total)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <Button variant={paymentMethod === PaymentMethod.CASH ? 'primary' : 'outline'} onClick={() => setPaymentMethod(PaymentMethod.CASH)} leftIcon={<Banknote/>}>ເງິນສົດ</Button>
               <Button variant={paymentMethod === PaymentMethod.TRANSFER ? 'primary' : 'outline'} onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)} leftIcon={<QrCode/>}>ໂອນເງິນ</Button>
            </div>

            <Input label="ຮັບເງິນມາ" type="number" placeholder="0" className="text-2xl font-bold text-center" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} />

            <Button fullWidth size="lg" variant="success" leftIcon={<CheckCircle2/>}>ຢືນຢັນການຊຳລະ</Button>
         </div>
      </Modal>

    </div>
  );
};
