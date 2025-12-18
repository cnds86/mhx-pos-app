import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, PaymentMethod, Customer, DeliveryDetails, DeliveryStatus, ShopSettings, HeldOrder, User, SaleRecord, PaymentDetail, CategoryItem } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, ChevronRight, X, Banknote, QrCode, User as UserIcon, ChevronDown, Tag, FileText, Truck, MapPin, Phone, ScanBarcode, AlertCircle, PauseCircle, Clock, Play, MessageSquare, CheckCircle2, PenTool, Wallet, Briefcase, History } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
    items: CartItem[], 
    subtotal: number, 
    discount: number, 
    deliveryFee: number,
    taxAmount: number,
    total: number, 
    method: PaymentMethod, 
    received: number, 
    change: number, 
    customer: Customer,
    delivery?: DeliveryDetails,
    splitPayments?: PaymentDetail[],
    projectRef?: string
  ) => void;
  onSaveQuotation: (
    items: CartItem[],
    subtotal: number,
    discount: number,
    total: number,
    customer: Customer,
    note: string
  ) => void;
  onSaveHeldOrder: (items: CartItem[], customer: Customer, note?: string) => void;
  onRemoveHeldOrder: (id: string) => void;
  onVoidSale?: (saleId: string, authorizedById?: string) => void;
  onViewSale?: (sale: SaleRecord) => void;
}

export const POS: React.FC<POSProps> = ({ 
  currentUser,
  products,
  categories = [], 
  customers, 
  initialCart, 
  initialCustomer, 
  shopSettings, 
  heldOrders,
  sales,
  onCheckout, 
  onSaveQuotation,
  onSaveHeldOrder,
  onRemoveHeldOrder,
  onVoidSale,
  onViewSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {id: '0', name: 'General', phone: '', type: 'GENERAL'});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [projectRef, setProjectRef] = useState('');

  // Discount State
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  
  // Split Payment State
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitTransfer, setSplitTransfer] = useState<string>('');

  // Delivery State
  const [enableDelivery, setEnableDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContact, setDeliveryContact] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Held Orders Modal
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

  // Recent Sales Modal
  const [isRecentSalesModalOpen, setIsRecentSalesModalOpen] = useState(false);

  // Custom Item Modal
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemData, setCustomItemData] = useState({ name: '', price: '', quantity: '1' });

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Helper to determine price based on customer type
  const getCustomerPrice = (product: Product, customer: Customer) => {
    if (product.isCustom) return product.price;
    if ((customer.type === 'VIP' || customer.type === 'CONTRACTOR') && product.wholesalePrice && product.wholesalePrice > 0) {
      return product.wholesalePrice;
    }
    return product.price;
  };

  // Helper: Calc Current Debt for Customer
  const currentDebt = useMemo(() => {
     if (!selectedCustomer) return 0;
     return sales
      .filter(s => s.customerId === selectedCustomer.id && s.paymentStatus !== 'PAID' && s.status !== 'VOIDED')
      .reduce((sum, s) => sum + (s.total - (s.receivedAmount || 0)), 0);
  }, [selectedCustomer, sales]);

  // Load initial cart (from Quotation)
  useEffect(() => {
    if (initialCart && initialCart.length > 0) {
      setCart(initialCart);
    }
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
    }
  }, [initialCart, initialCustomer]);

  // Recalculate prices when customer type changes
  useEffect(() => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.isCustom) return item;
        const originalProduct = products.find(p => p.id === item.id);
        if (!originalProduct) return item;
        const currentStandardPrice = originalProduct.price;
        const currentWholesalePrice = originalProduct.wholesalePrice || originalProduct.price;
        if (item.price === currentStandardPrice || item.price === currentWholesalePrice) {
           return { ...item, price: getCustomerPrice(originalProduct, selectedCustomer) };
        }
        return item;
      });
    });
  }, [selectedCustomer, products]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (product.barcode && product.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue);
    if (!val || val < 0) return 0;
    if (discountType === 'PERCENT') {
      return Math.floor((subtotal * Math.min(val, 100)) / 100);
    }
    return Math.min(val, subtotal);
  }, [discountValue, discountType, subtotal]);

  const deliveryFeeAmount = enableDelivery ? (Number(deliveryFee) || 0) : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = shopSettings.vatEnabled ? Math.floor(taxableAmount * (shopSettings.taxRate / 100)) : 0;
  const total = taxableAmount + taxAmount + deliveryFeeAmount;

  // Auto-fill delivery info
  useEffect(() => {
    if (selectedCustomer.id !== '1') {
      setDeliveryContact(selectedCustomer.name);
      setDeliveryPhone(selectedCustomer.phone);
      setDeliveryAddress(selectedCustomer.address || '');
    } else {
      setDeliveryContact('');
      setDeliveryPhone('');
      setDeliveryAddress('');
    }
  }, [selectedCustomer]);

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1500;
        osc.type = 'sine';
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        setTimeout(() => ctx.close(), 200);
      }
    } catch (e) {}
  };

  // Scanner Lifecycle Effect
  useEffect(() => {
    if (isScannerOpen) {
      const timeoutId = setTimeout(() => {
        const scannerElement = document.getElementById('reader');
        if (scannerElement && !scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            "reader",
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
              handleScanSuccess(decodedText);
            },
            (error) => {}
          );
        }
      }, 300); // Increased timeout to ensure DOM is ready

      return () => {
        clearTimeout(timeoutId);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
      };
    }
  }, [isScannerOpen]);

  const handleScanSuccess = (decodedText: string) => {
    const product = products.find(p => p.barcode === decodedText);
    if (product) {
      playBeep();
      addToCart(product);
      setIsScannerOpen(false);
    } else {
      alert(`ບໍ່ພົບສິນຄ້າທີ່ມີ Barcode: ${decodedText}`);
      setIsScannerOpen(false);
    }
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    if (product.stock <= 0 && !product.isCustom) {
       alert('ສິນຄ້າໝົດ!');
       return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (!product.isCustom && existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, price: getCustomerPrice(product, selectedCustomer) }];
    });
  };

  const addCustomItem = () => {
     if (!customItemData.name || !customItemData.price) return;
     const price = parseFloat(customItemData.price);
     const qty = parseInt(customItemData.quantity) || 1;
     const customProduct: Product = {
        id: `custom-${Date.now()}`,
        name: customItemData.name,
        price: price,
        costPrice: 0,
        unit: 'ອັນ',
        category: 'ອື່ນໆ',
        stock: 9999,
        image: 'https://placehold.co/200?text=Custom',
        isCustom: true
     };
     setCart(prev => [...prev, { ...customProduct, quantity: qty }]);
     setCustomItemData({ name: '', price: '', quantity: '1' });
     setIsCustomItemModalOpen(false);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, price: newPrice >= 0 ? newPrice : 0 };
      }
      return item;
    }));
  };

  const updateNote = (id: string, note: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, note: note };
      }
      return item;
    }));
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactMatch = products.find(p => 
        p.barcode === searchTerm || 
        p.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm(''); 
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      }
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setReceivedAmount('');
    setPaymentMethod(PaymentMethod.CASH);
    setSplitCash('');
    setSplitTransfer('');
    if(selectedCustomer.id === '1') {
       setEnableDelivery(false);
       setDeliveryFee('');
    }
    setIsCheckoutOpen(true);
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toString());
  };

  const handleConfirmCheckout = () => {
    let received = Number(receivedAmount) || 0;
    let splitPayments: PaymentDetail[] = [];
    if (enableDelivery && (!deliveryAddress || !deliveryContact)) {
       alert('ກະລຸນາໃສ່ຂໍ້ມູນການຈັດສົ່ງ (ທີ່ຢູ່ ແລະ ຜູ້ຮັບ)');
       return;
    }
    if (paymentMethod === PaymentMethod.SPLIT) {
        const cAmount = Number(splitCash) || 0;
        const tAmount = Number(splitTransfer) || 0;
        received = cAmount + tAmount;
        splitPayments.push({ method: PaymentMethod.CASH, amount: cAmount });
        splitPayments.push({ method: PaymentMethod.TRANSFER, amount: tAmount });
    }
    if ((paymentMethod === PaymentMethod.CASH || paymentMethod === PaymentMethod.SPLIT || paymentMethod === PaymentMethod.TRANSFER) && received < total) {
       const remaining = total - received;
       const creditLimit = selectedCustomer.creditLimit || 0;
       if (selectedCustomer.id === '1' && remaining > 0) {
           alert('ລູກຄ້າທົ່ວໄປຕ້ອງຊຳລະເຕັມຈຳນວນ!');
           return;
       }
       if (remaining > 0 && creditLimit > 0) {
           if ((currentDebt + remaining) > creditLimit) {
               alert(`ບໍ່ສາມາດຕິດໜີ້ໄດ້! ເກີນວົງເງິນ.\nວົງເງິນ: ${FORMAT_CURRENCY(creditLimit)}\nໜີ້ລວມໃໝ່: ${FORMAT_CURRENCY(currentDebt + remaining)}`);
               return;
           }
       }
    }
    if (paymentMethod === PaymentMethod.CREDIT) {
        const creditLimit = selectedCustomer.creditLimit || 0;
        if (creditLimit > 0) {
            if ((currentDebt + total) > creditLimit) {
                alert(`ບໍ່ສາມາດຕິດໜີ້ໄດ້! ເກີນວົງເງິນສິນເຊື່ອ.\nວົງເງິນ: ${FORMAT_CURRENCY(creditLimit)}\nໜີ້ປະຈຸບັນ: ${FORMAT_CURRENCY(currentDebt)}\nຍອດໃໝ່: ${FORMAT_CURRENCY(total)}`);
                return;
            }
        }
        received = 0;
    }
    const change = (paymentMethod === PaymentMethod.CASH && received > total) ? (received - total) : 0;
    const deliveryDetails: DeliveryDetails | undefined = enableDelivery ? {
      status: DeliveryStatus.PENDING,
      address: deliveryAddress,
      contactName: deliveryContact,
      contactPhone: deliveryPhone,
      fee: deliveryFeeAmount
    } : undefined;

    onCheckout(cart, subtotal, discountAmount, deliveryFeeAmount, taxAmount, total, paymentMethod, received, change, selectedCustomer, deliveryDetails, splitPayments.length > 0 ? splitPayments : undefined, projectRef);
    setCart([]);
    setDiscountValue('');
    setShowDiscountInput(false);
    setIsCheckoutOpen(false);
    setShowMobileCart(false);
    setEnableDelivery(false);
    setSelectedCustomer(customers[0]);
    setProjectRef('');
  };

  const handleSaveQuotationClick = () => {
    if (cart.length === 0) return;
    const note = prompt('ເພີ່ມໝາຍເຫດ (Note) - ບໍ່ບັງຄັບ:', '');
    if (note !== null) {
      onSaveQuotation(cart, subtotal, discountAmount, total, selectedCustomer, note);
      setCart([]);
      setDiscountValue('');
      setShowDiscountInput(false);
      alert('ບັນທຶກໃບສະເໜີລາຄາສຳເລັດ!');
    }
  };

  const handleHoldOrderClick = () => {
     if (cart.length === 0) return;
     const note = prompt('ໃສ່ໝາຍເຫດການພັກບິນ:', '');
     if (note !== null) {
        onSaveHeldOrder(cart, selectedCustomer, note);
        setCart([]);
        setDiscountValue('');
        setShowDiscountInput(false);
        setSelectedCustomer(customers[0]);
        setProjectRef('');
     }
  };

  const handleResumeOrder = (order: HeldOrder) => {
      if (cart.length > 0) {
         if (!confirm('ກະຕ່າປະຈຸບັນມີສິນຄ້າຢູ່, ທ່ານຕ້ອງການແທນທີ່ດ້ວຍບິນທີ່ພັກໄວ້ບໍ່?')) return;
      }
      setCart(order.items);
      setSelectedCustomer(order.customer);
      onRemoveHeldOrder(order.id);
      setIsHeldOrdersModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden relative">
      
      {/* Scanner Modal Overlay */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/80 z-[120] flex flex-col items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><ScanBarcode size={20} className="text-blue-600" /> ສະແກນບາໂຄດ</h3>
                 <button onClick={() => setIsScannerOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
              </div>
              <div className="p-4 bg-black aspect-square md:aspect-video relative">
                 {/* The essential ID element */}
                 <div id="reader" className="w-full h-full overflow-hidden"></div>
              </div>
              <div className="p-6 text-center text-gray-500 text-sm">
                 ຫັນບາໂຄດສິນຄ້າໃສ່ກ້ອງເພື່ອທຳການສະແກນ
              </div>
           </div>
        </div>
      )}

      {/* Product Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 md:border-r border-gray-200 h-full ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-white shadow-sm z-10 shrink-0">
          <div className="flex gap-4 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ຄົ້ນຫາສິນຄ້າ ຫຼື ສະແກນ Barcode..."
                className="w-full pl-10 pr-12 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 p-1.5 hover:bg-white rounded-lg transition-all"
                title="Scan Barcode"
              >
                <ScanBarcode size={20} />
              </button>
            </div>
             <button
               onClick={() => setIsCustomItemModalOpen(true)}
               className="bg-purple-50 text-purple-700 border border-purple-200 px-3 rounded-xl flex items-center justify-center hover:bg-purple-100 transition-colors gap-2 font-medium text-sm"
               title="ເພີ່ມລາຍການອື່ນໆ (Custom Item)"
             >
               <PenTool size={18} /> <span className="hidden md:inline">ລາຍການອື່ນໆ</span>
             </button>
             <button
               onClick={() => setIsHeldOrdersModalOpen(true)}
               className="relative bg-white border border-gray-200 text-gray-600 px-3 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
               title="ເອີ້ນບິນຄືນ (Resume Held Order)"
             >
                <Clock size={22} />
                {heldOrders.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {heldOrders.length}
                   </span>
                )}
             </button>
             <button
               onClick={() => setIsRecentSalesModalOpen(true)}
               className="bg-white border border-gray-200 text-gray-600 px-3 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
               title="ບິນขາຍລ່າສຸດ (Recent Sales)"
             >
                <History size={22} />
             </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              ທັງໝົດ
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map(product => {
              const isLowStock = product.stock > 0 && product.stock <= 10;
              const displayPrice = getCustomerPrice(product, selectedCustomer);
              const isWholesaleApplied = displayPrice < product.price;
              return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`bg-white rounded-xl shadow-sm border p-2 md:p-3 hover:shadow-md transition-all text-left flex flex-col h-full ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed border-gray-100' : isLowStock ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100 active:scale-95'}`}
              >
                <div className="relative aspect-square mb-2 md:mb-3 rounded-lg overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  {product.stock <= 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs md:text-sm">ສິນຄ້າໝົດ</div>}
                  {isLowStock && <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><AlertCircle size={10} /> ໃກ້ໝົດ</div>}
                  {isWholesaleApplied && <div className="absolute bottom-1 right-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">VIP</div>}
                  {cart.find(c => c.id === product.id) && (
                     <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white">
                        {cart.find(c => c.id === product.id)?.quantity}
                     </div>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 mb-1 min-h-[40px] md:min-h-[48px]">{product.name}</h3>
                <div className="mt-auto flex items-end justify-between">
                  <span className={`font-bold text-sm md:text-base ${isWholesaleApplied ? 'text-purple-600' : 'text-blue-600'}`}>
                    {FORMAT_CURRENCY(displayPrice)} <span className="text-gray-400 font-normal text-xs">/{product.unit}</span>
                  </span>
                  <span className={`text-[10px] md:text-xs font-bold ${isLowStock ? 'text-red-500' : 'text-gray-500'}`}>{product.stock} {product.unit}</span>
                </div>
              </button>
            )})}
          </div>
        </div>
        
        {cart.length > 0 && (
          <div className="md:hidden absolute bottom-4 left-4 right-4 z-20 animate-slide-up">
            <button onClick={() => setShowMobileCart(true)} className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center">{cartItemCount}</div>
                <div className="flex flex-col items-start">
                   <span className="text-xs text-blue-100">ຍອດລວມ (Total)</span>
                   <span className="font-bold">{FORMAT_CURRENCY(total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">ເບິ່ງກະຕ່າ <ChevronRight size={18} /></div>
            </button>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className={`w-full md:w-96 bg-white shadow-xl flex flex-col z-20 absolute md:relative inset-0 md:inset-auto h-full ${showMobileCart ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-white shrink-0">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileCart(false)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={24} className="text-blue-600 hidden md:block" /> ກະຕ່າສິນຄ້າ
              </h2>
            </div>
            <div className="flex gap-2">
               {cart.length > 0 && <button onClick={handleHoldOrderClick} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-orange-600 rounded-lg transition-colors" title="ພັກບິນ (Hold Order)"><PauseCircle size={20} /></button>}
               <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{cart.length}</span>
            </div>
          </div>
          <button onClick={() => setIsCustomerModalOpen(true)} className={`w-full flex items-center justify-between p-3 border rounded-xl transition-colors ${selectedCustomer.type === 'VIP' || selectedCustomer.type === 'CONTRACTOR' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedCustomer.type === 'VIP' || selectedCustomer.type === 'CONTRACTOR' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}><UserIcon size={16} /></div>
              <div className="text-left overflow-hidden"><p className="text-xs text-gray-500">ລູກຄ້າ (Customer)</p><p className="font-bold text-sm text-gray-800 truncate">{selectedCustomer.name}</p></div>
            </div>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </button>
          {selectedCustomer.id !== '1' && (
             <div className="mt-2 relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="w-full pl-9 p-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 outline-none" placeholder="ຊື່ໂຄງການ / Job Site (Optional)" value={projectRef} onChange={(e) => setProjectRef(e.target.value)} />
             </div>
          )}
          {selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 ? (
             <div className="mt-2 px-1 text-xs flex justify-between text-gray-500"><span>Debt: {FORMAT_CURRENCY(currentDebt)}</span><span className={currentDebt >= selectedCustomer.creditLimit ? 'text-red-500 font-bold' : 'text-green-600'}>Limit: {FORMAT_CURRENCY(selectedCustomer.creditLimit)}</span></div>
          ) : (selectedCustomer.type === 'VIP' || selectedCustomer.type === 'CONTRACTOR') && <p className="text-xs text-purple-600 mt-1 text-center font-medium">* ໃຊ້ລາຄາຂາຍສົ່ງ (Wholesale Price)</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 md:space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50"><ShoppingCart size={64} /><p>ຍັງບໍ່ມີລາຍການສິນຄ້າ</p></div>
          ) : cart.map(item => (
              <div key={item.id} className={`bg-gray-50 p-3 rounded-lg border relative group ${item.isCustom ? 'border-purple-200 bg-purple-50' : 'border-gray-100'}`}>
                <div className="flex gap-3 items-start">
                   <img src={item.image} alt={item.name} className="w-16 h-16 md:w-12 md:h-12 rounded object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">₭</span>
                      <input type="number" min="0" value={item.price} onChange={(e) => updatePrice(item.id, Number(e.target.value))} className="w-24 p-1 text-sm font-bold text-blue-600 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <span className="text-[10px] text-gray-400">/{item.unit}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{item.isCustom ? <span className="text-purple-600 font-bold">* ລາຍການພິເສດ</span> : <>Stock: <span className={item.stock - item.quantity < 5 ? 'text-red-500 font-bold' : ''}>{item.stock}</span> (Rem: {Math.max(0, item.stock - item.quantity)})</>}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600 w-7 h-7 flex items-center justify-center"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} disabled={!item.isCustom && item.quantity >= item.stock} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30 w-7 h-7 flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                   <MessageSquare size={14} className="text-gray-400" />
                   <input type="text" placeholder="ເພີ່ມໝາຍເຫດ (e.g. ຕັດເຄິ່ງ, ສີແດງ)" className="flex-1 text-xs bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-600" value={item.note || ''} onChange={(e) => updateNote(item.id, e.target.value)} />
                </div>
              </div>
            ))
          }
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 mb-safe">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-500"><span>ລວມເງິນ (Subtotal)</span><span>{FORMAT_CURRENCY(subtotal)}</span></div>
          <div className="mb-3">
             {!showDiscountInput ? (
               <button onClick={() => setShowDiscountInput(true)} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"><Tag size={14} />+ ເພີ່ມສ່ວນຫຼຸດ (Discount)</button>
            ) : (
              <div className="bg-white border border-blue-200 rounded-lg p-2 animate-fade-in">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-700 flex items-center gap-1"><Tag size={12}/> ສ່ວນຫຼຸດ</span><button onClick={() => {setShowDiscountInput(false); setDiscountValue('');}} className="text-gray-400 hover:text-red-500"><X size={14}/></button></div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="number" placeholder={discountType === 'PERCENT' ? "0-100%" : "ຈຳນວນເງິນ"} className="w-full pl-2 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  </div>
                  <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200">
                    <button onClick={() => setDiscountType('FIXED')} className={`px-2 py-1 text-xs rounded font-bold ${discountType === 'FIXED' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>₭</button>
                    <button onClick={() => setDiscountType('PERCENT')} className={`px-2 py-1 text-xs rounded font-bold ${discountType === 'PERCENT' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>%</button>
                  </div>
                </div>
                {discountAmount > 0 && <div className="text-right mt-1 text-xs text-green-600 font-bold">- {FORMAT_CURRENCY(discountAmount)}</div>}
              </div>
            )}
          </div>
           {shopSettings.vatEnabled && <div className="flex justify-between items-center mb-2 text-sm text-gray-600"><span>ອາກອນ (VAT {shopSettings.taxRate}%)</span><span>+{FORMAT_CURRENCY(taxAmount)}</span></div>}
          <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-200"><span className="text-gray-800 font-bold">ຍອດສຸດທິ (Total)</span><span className="text-2xl font-bold text-blue-800">{FORMAT_CURRENCY(total)}</span></div>
          <div className="flex gap-2">
            <button onClick={handleSaveQuotationClick} disabled={cart.length === 0} className="flex-1 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100 py-4 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2" title="ບັນທຶກໃບສະເໜີລາຄາ"><FileText size={20} />ສະເໜີລາຄາ</button>
            <button onClick={handleOpenCheckout} disabled={cart.length === 0} className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"><CreditCard />ຊຳລະເງິນ</button>
          </div>
        </div>
      </div>

      {/* Other Modals (Sales, Held, Custom, Customer, Payment) remain the same */}
      {isRecentSalesModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History className="text-blue-600" />ບິນຂາຍລ່າສຸດ (Recent Sales)</h3>
               <button onClick={() => setIsRecentSalesModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
             </div>
             <div className="overflow-y-auto p-0 flex-1">
                {sales.length === 0 ? <div className="text-center py-12 text-gray-400"><History size={48} className="mx-auto mb-2 opacity-30" /><p>ຍັງບໍ່ມີລາຍການຂາຍ</p></div> : (
                   <table className="w-full text-left">
                      <thead className="bg-gray-50"><tr><th className="p-4 text-xs font-semibold text-gray-500">ເວລາ</th><th className="p-4 text-xs font-semibold text-gray-500">ເລກບິນ</th><th className="p-4 text-xs font-semibold text-gray-500">ລູກຄ້າ</th><th className="p-4 text-xs font-semibold text-gray-500 text-right">ຍອດລວມ</th><th className="p-4 text-xs font-semibold text-gray-500 text-center">Status</th><th className="p-4 text-xs font-semibold text-gray-500 text-center">Actions</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                         {sales.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                               <td className="p-4 text-sm text-gray-600">{new Date(sale.date).toLocaleTimeString('lo-LA', {hour: '2-digit', minute:'2-digit'})}<div className="text-[10px] text-gray-400">{new Date(sale.date).toLocaleDateString('lo-LA')}</div></td>
                               <td className="p-4 text-sm font-medium text-blue-600">#{sale.id.slice(-6)}</td>
                               <td className="p-4 text-sm text-gray-800">{sale.customerName}</td>
                               <td className="p-4 text-sm font-bold text-right text-gray-800">{FORMAT_CURRENCY(sale.total)}</td>
                               <td className="p-4 text-center">{sale.status === 'VOIDED' ? <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">VOID</span> : sale.paymentStatus === 'PAID' ? <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">PAID</span> : <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">{sale.paymentStatus}</span>}</td>
                               <td className="p-4 text-center"><div className="flex justify-center gap-1"><button onClick={() => onViewSale?.(sale)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Print/View"><FileText size={16} /></button>{sale.status !== 'VOIDED' && <button onClick={() => {if(confirm('ຕ້ອງການຍົກເລີກບິນນີ້ແທ້ບໍ່?')) onVoidSale?.(sale.id, currentUser?.id);}} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Void"><Trash2 size={16} /></button>}</div></td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                )}
             </div>
           </div>
         </div>
      )}

      {isHeldOrdersModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock className="text-orange-500" />ລາຍການທີ່ພັກໄວ້ (Held Orders)</h3><button onClick={() => setIsHeldOrdersModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
             <div className="overflow-y-auto p-4 flex-1">{heldOrders.length === 0 ? <div className="text-center py-10 text-gray-400"><Clock size={48} className="mx-auto mb-2 opacity-30" /><p>ບໍ່ມີລາຍການທີ່ພັກໄວ້</p></div> : <div className="space-y-3">{heldOrders.map(order => (<div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm"><div className="flex justify-between items-start mb-2"><div><p className="font-bold text-gray-800 flex items-center gap-2"><UserIcon size={16} className="text-gray-400" />{order.customer.name}</p><p className="text-xs text-gray-500 mt-1">{new Date(order.date).toLocaleString('lo-LA')}</p></div><div className="flex items-center gap-2"><button onClick={() => handleResumeOrder(order)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm font-bold"><Play size={16} /> ສືບຕໍ່ຂາຍ</button><button onClick={() => onRemoveHeldOrder(order.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16} /></button></div></div>{order.note && <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded mb-2 italic border border-yellow-100">Note: {order.note}</div>}<div className="text-xs text-gray-500 border-t border-gray-100 pt-2 flex justify-between items-center"><span>{order.items.length} ລາຍການ</span><span className="font-bold text-gray-800 text-sm">{FORMAT_CURRENCY(order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0))}</span></div></div>))}</div>}</div>
           </div>
         </div>
      )}

      {isCustomItemModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"><div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50"><h3 className="font-bold text-purple-800 flex items-center gap-2"><PenTool size={20} /> ເພີ່ມລາຍການອື່ນ (Misc)</h3><button onClick={() => setIsCustomItemModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="p-6 space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ລາຍການ / ສິນຄ້າ</label><input autoFocus type="text" placeholder="ຕົວຢ່າງ: ຄ່າແຮງງານ, ຄ່າຂົນສົ່ງ..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={customItemData.name} onChange={e => setCustomItemData({...customItemData, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">ລາຄາ (Price)</label><input type="number" min="0" placeholder="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-600" value={customItemData.price} onChange={e => setCustomItemData({...customItemData, price: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">ຈຳນວນ (Qty)</label><input type="number" min="1" placeholder="1" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={customItemData.quantity} onChange={e => setCustomItemData({...customItemData, quantity: e.target.value})} /></div><button onClick={addCustomItem} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-md transition-colors">ເພີ່ມລົງກະຕ່າ</button></div></div>
         </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 animate-fade-in"><div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"><div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800">ເລືອກລູກຄ້າ</h3><button onClick={() => setIsCustomerModalOpen(false)}><X className="text-gray-400" /></button></div><div className="p-4 overflow-y-auto"><div className="space-y-2">{customers.map(customer => (<button key={customer.id} onClick={() => {setSelectedCustomer(customer); setIsCustomerModalOpen(false);}} className={`w-full p-3 rounded-xl flex items-center gap-3 border transition-colors ${selectedCustomer.id === customer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${customer.type === 'VIP' || customer.type === 'CONTRACTOR' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>{customer.name.charAt(0)}</div><div className="text-left"><p className="font-bold text-gray-800">{customer.name}</p><p className="text-xs text-gray-500">{customer.type} • {customer.phone || 'No Phone'}</p></div></button>))}</div></div></div></div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"><div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="text-lg font-bold text-gray-800">ຊຳລະເງິນ (Checkout)</h3><button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm"><X size={24} /></button></div><div className="p-6 overflow-y-auto space-y-6"><div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100"><div className="flex items-center gap-2 text-blue-800"><UserIcon size={18} /><div><span className="font-bold block">{selectedCustomer.name}</span>{projectRef && <span className="text-xs font-normal flex items-center gap-1"><Briefcase size={10} /> {projectRef}</span>}</div></div><span className="text-xs px-2 py-1 bg-white rounded text-blue-600 border border-blue-200 font-medium">{selectedCustomer.type}</span></div><div className="border border-gray-200 rounded-xl p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Truck className="text-gray-600" size={20} /><span className="font-bold text-gray-700">ບໍລິການຈັດສົ່ງ (Delivery)</span></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={enableDelivery} onChange={() => setEnableDelivery(!enableDelivery)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></div>{enableDelivery && (<div className="space-y-3 animate-fade-in pt-2 border-t border-dashed border-gray-200"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-gray-500 font-medium block mb-1">ຜູ້ຮັບສິນຄ້າ</label><div className="relative"><UserIcon className="absolute left-2 top-2 text-gray-400" size={14} /><input type="text" className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="ຊື່ຜູ້ຮັບ" value={deliveryContact} onChange={e => setDeliveryContact(e.target.value)} /></div></div><div><label className="text-xs text-gray-500 font-medium block mb-1">ເບີໂທຕິດຕໍ່</label><div className="relative"><Phone className="absolute left-2 top-2 text-gray-400" size={14} /><input type="text" className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="ເບີໂທ" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} /></div></div></div><div><label className="text-xs text-gray-500 font-medium block mb-1">ສະຖານທີ່ຈັດສົ່ງ</label><div className="relative"><MapPin className="absolute left-2 top-2 text-gray-400" size={14} /><input type="text" className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="ທີ່ຢູ່ຈັດສົ່ງ" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} /></div></div><div><label className="text-xs text-gray-500 font-medium block mb-1">ຄ່າຈັດສົ່ງ (Delivery Fee)</label><input type="number" min="0" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-bold text-orange-600" placeholder="0" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} /></div></div>)}</div><div><label className="block text-sm font-medium text-gray-700 mb-2">ຮູບແບບການຊຳລະ</label><div className="grid grid-cols-4 gap-2"><button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Banknote size={20} /><span className="text-[10px]">ເງິນສົດ</span></button><button onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === PaymentMethod.TRANSFER ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><QrCode size={20} /><span className="text-[10px]">ໂອນເງິນ</span></button><button onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === PaymentMethod.CREDIT ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Clock size={20} /><span className="text-[10px]">ຕິດໜີ້</span></button><button onClick={() => setPaymentMethod(PaymentMethod.SPLIT)} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === PaymentMethod.SPLIT ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Wallet size={20} /><span className="text-[10px]">ແບ່ງຈ່າຍ</span></button></div>{paymentMethod === PaymentMethod.CREDIT && (<div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-800 border border-orange-100 text-center">ຍອດໜີ້ປັດຈຸບັນ: <strong>{FORMAT_CURRENCY(currentDebt)}</strong><br/>{selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (<span className={currentDebt + total > selectedCustomer.creditLimit ? 'text-red-600 font-bold' : ''}>(Limit: {FORMAT_CURRENCY(selectedCustomer.creditLimit)})</span>)}</div>)}</div>{(paymentMethod === PaymentMethod.CASH || paymentMethod === PaymentMethod.TRANSFER) && (<div><label className="block text-sm font-medium text-gray-700 mb-2">ຮັບເງິນມາ (Received)</label><input type="number" inputMode="numeric" className="w-full p-4 text-3xl font-bold text-center border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all" placeholder="0" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} autoFocus /><div className="flex gap-2 mt-3 overflow-x-auto pb-1"><button onClick={() => handleQuickAmount(total)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold whitespace-nowrap">ພໍດີ</button><button onClick={() => handleQuickAmount(Math.ceil(total / 1000) * 1000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold whitespace-nowrap">ປັດເສດ</button><button onClick={() => handleQuickAmount(50000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold whitespace-nowrap">50,000</button><button onClick={() => handleQuickAmount(100000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold whitespace-nowrap">100,000</button><button onClick={() => handleQuickAmount(500000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold whitespace-nowrap">500,000</button></div></div>)}{paymentMethod === PaymentMethod.SPLIT && (<div className="space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-100"><div><label className="block text-xs font-bold text-gray-700 mb-1">ຍອດເງິນສົດ (Cash)</label><div className="relative"><Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="number" className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="0" /></div></div><div><label className="block text-xs font-bold text-gray-700 mb-1">ຍອດໂອນ (Transfer)</label><div className="relative"><QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="number" className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={splitTransfer} onChange={(e) => setSplitTransfer(e.target.value)} placeholder="0" /></div></div><div className="flex justify-between items-center pt-2 border-t border-purple-200 text-sm"><span>ລວມຈ່າຍ:</span><span className={`font-bold ${(Number(splitCash) + Number(splitTransfer)) < total ? 'text-red-600' : 'text-green-600'}`}>{FORMAT_CURRENCY(Number(splitCash) + Number(splitTransfer))}</span></div>{(Number(splitCash) + Number(splitTransfer)) < total && (<p className="text-xs text-red-500 text-right">ຍັງເຫຼືອ (Credit/Partial): {FORMAT_CURRENCY(total - (Number(splitCash) + Number(splitTransfer)))}</p>)}</div>)}</div><div className="p-4 border-t border-gray-100 bg-gray-50"><div className="flex justify-between items-center mb-4"><div className="text-sm text-gray-500">ລວມຍອດທັງໝົດ</div><div className="text-2xl font-bold text-gray-800">{FORMAT_CURRENCY(total)}</div></div>{paymentMethod !== PaymentMethod.CREDIT && receivedAmount && (<div className="flex justify-between items-center mb-4 text-sm">{Number(receivedAmount) < total ? (<><span className="text-gray-500 font-medium">ຍອດຄ້າງຊຳລະ (Balance Due)</span><span className="font-bold text-red-500">{FORMAT_CURRENCY(total - Number(receivedAmount))}</span></>) : (<><span className="text-gray-500">ເງິນທອນ</span><span className="font-bold text-green-600">{FORMAT_CURRENCY(Number(receivedAmount) - total)}</span></>)}</div>)}<button onClick={handleConfirmCheckout} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 />ຢືນຢັນການຊຳລະ</button></div></div></div>
      )}
    </div>
  );
};