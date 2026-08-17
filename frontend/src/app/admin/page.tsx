'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { adminOrdersService, AdminOrder, AdminOrderItem } from '@/services/adminOrders.service';
import { categoriesService, Category } from '@/services/categories.service';
import { productsService, CreateProductDto } from '@/services/products.service';
import { Product } from '@/types/product.type';
import { usersService } from '@/services/users.service';
import AdminSettingsPage from '@/app/admin/settings/page';
import api from '@/lib/axios';
import {
  Package,
  ShoppingBag,
  LayoutDashboard,
  DollarSign,
  Users,
  Tag,
  MessageSquare,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  Edit2,
  Loader2,
  X,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Menu,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Settings,
  Search,
  MessageCircle,
  Gift,
  Send,
  Paperclip,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckSquare
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'users' | 'vouchers' | 'comments' | 'settings'>('overview');
  const [darkMode, setDarkMode] = useState(true);

  // Database States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vouchersList, setVouchersList] = useState<any[]>([]);

  // Filter States Sản Phẩm
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('');
  const [prodStockFilter, setProdStockFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK'>('ALL');

  // Bulk Selection States Sản Phẩm
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDiscountId, setBulkDiscountId] = useState('');

  // Customer Detail State
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);

  // Chat & Gift States
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState('');

  // Helper format ngày giờ cho input datetime-local (YYYY-MM-DDTHH:mm)
  const getLocalDatetimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Voucher Form State (Hẹn ngày & giờ)
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_order_value: 0,
    max_discount: 50000,
    start_date: getLocalDatetimeString(new Date()),
    end_date: getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  });

  // Orders & Revenue Realtime States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Zustand Store
  const { comments, toggleApproveComment, deleteComment } = useAdminStore();

  // Modal Category States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', parent_id: '', image_url: '' });

  // Modal Product States
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [prodForm, setProdForm] = useState<CreateProductDto>({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    item_number: '',
    piece_count: undefined,
    min_age: undefined,
    base_price: 0,
    images: [{ image_url: '', is_primary: true }],
    skus: [{ sku_code: '', box_condition: 'NEW', price: 0, stock_quantity: 10 }],
  });

  const [imageInputType, setImageInputType] = useState<'URL' | 'FILE'>('URL');

  // Sync Theme & Dọn dẹp khi rời khỏi trang Admin
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    const isDark = savedTheme !== 'light';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 🟢 Dọn dẹp class dark khi chuyển sang các trang client
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('admin_theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync Auth
  useEffect(() => {
    const localToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    let localUser = user;

    if (!localUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try {
          localUser = JSON.parse(storedUser);
        } catch (e) {}
      }
    }

    if (!localToken) {
      router.replace('/login');
      return;
    }

    if (localUser && localUser.role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    setCheckingAuth(false);
    loadAllData();
    loadOrdersData();
  }, [user, token, router]);

  const loadAllData = async () => {
    try {
      const [catRes, prodRes, custRes, vouchRes] = await Promise.all([
        categoriesService.getAll(),
        productsService.getProducts({ limit: 100 }),
        usersService.getCustomersStatus().catch(() => []),
        api.get('/discounts').then((r) => r.data).catch(() => [])
      ]);
      setCategories(catRes);
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);
      setCustomers(custRes);
      setVouchersList(vouchRes);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  };

  const loadOrdersData = async () => {
    try {
      setLoadingOrders(true);
      const res = await adminOrdersService.getAllOrders();
      setOrders(res.orders || []);
      setTotalRevenue(res.total_revenue || 0);
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 🟢 Cập nhật trạng thái đơn hàng theo đúng 4 bước
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await adminOrdersService.updateStatus(orderId, newStatus);
      await loadOrdersData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng!');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Category Actions
  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id || '',
        image_url: cat.image_url || '',
      });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', slug: '', parent_id: '', image_url: '' });
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return alert('Vui lòng nhập tên danh mục!');
    const slug = catForm.slug || generateSlug(catForm.name);

    try {
      if (editingCat) {
        await categoriesService.update(editingCat.id, { ...catForm, slug });
        alert('Cập nhật danh mục thành công!');
      } else {
        await categoriesService.create({ ...catForm, slug });
        alert('Thêm danh mục mới thành công!');
      }
      setShowCatModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu danh mục!');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await categoriesService.delete(id);
      alert('Đã xóa danh mục!');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục!');
    }
  };

  // Product Actions
  const handleOpenProdModal = (prod?: any) => {
    if (prod) {
      setEditingProd(prod);
      const primaryImg =
        prod.product_images?.find((i: any) => i.is_primary)?.image_url ||
        prod.product_images?.[0]?.image_url ||
        '';

      const firstSku = prod.product_skus?.[0];

      setProdForm({
        name: prod.name,
        slug: prod.slug,
        category_id: prod.category_id || '',
        description: prod.description || '',
        item_number: prod.item_number || '',
        piece_count: prod.piece_count || undefined,
        min_age: prod.min_age || undefined,
        base_price: Number(prod.base_price),
        images: [{ image_url: primaryImg, is_primary: true }],
        skus: [
          {
            sku_code: firstSku?.sku_code || `SKU-${Date.now().toString().slice(-6)}`,
            box_condition: firstSku?.box_condition || 'NEW',
            price: Number(firstSku?.price || prod.base_price),
            stock_quantity: Number(firstSku?.stock_quantity ?? 10)
          }
        ],
      });
    } else {
      setEditingProd(null);
      setProdForm({
        name: '',
        slug: '',
        category_id: categories[0]?.id || '',
        description: '',
        item_number: '',
        piece_count: undefined,
        min_age: undefined,
        base_price: 0,
        images: [{ image_url: '', is_primary: true }],
        skus: [{ sku_code: `SKU-${Date.now().toString().slice(-6)}`, box_condition: 'NEW', price: 0, stock_quantity: 10 }],
      });
    }
    setShowProdModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setProdForm((prev) => {
          const newImgs = [...prev.images];
          newImgs[0].image_url = base64Url;
          return { ...prev, images: newImgs };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return alert('Vui lòng nhập tên sản phẩm!');
    if (!prodForm.base_price || Number(prodForm.base_price) <= 0) return alert('Giá bán phải lớn hơn 0!');

    const slug = prodForm.slug || generateSlug(prodForm.name);
    setSavingProduct(true);

    try {
      const payload: any = {
        ...prodForm,
        slug,
        base_price: Number(prodForm.base_price),
        piece_count: prodForm.piece_count ? Number(prodForm.piece_count) : undefined,
        min_age: prodForm.min_age ? Number(prodForm.min_age) : undefined,
        images: prodForm.images.filter((img) => img.image_url.trim() !== ''),
        skus: prodForm.skus.map((s) => ({
          ...s,
          price: Number(s.price || prodForm.base_price),
          stock_quantity: Number(s.stock_quantity || 0),
        })),
      };

      if (editingProd) {
        await api.patch(`/products/${editingProd.id}`, payload);
        alert('Đã cập nhật sản phẩm & tồn kho thành công!');
      } else {
        await productsService.createProduct(payload);
        alert('Đã thêm sản phẩm Lego mới thành công!');
      }

      setShowProdModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu sản phẩm!');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Xóa sản phẩm này khỏi hệ thống?')) return;
    try {
      await productsService.deleteProduct(id);
      alert('Đã xóa sản phẩm!');
      loadAllData();
    } catch (err: any) {
      alert('Không thể xóa sản phẩm!');
    }
  };

  // Lọc sản phẩm nâng cao
  const filteredProducts = products.filter((p: any) => {
    const totalStock = (p.product_skus || []).reduce((sum: number, s: any) => sum + Number(s.stock_quantity || 0), 0);
    const matchesSearch =
      prodSearch === '' ||
      p.name?.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.item_number?.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCat = prodCategoryFilter === '' || p.category_id === prodCategoryFilter;
    let matchesStock = true;
    if (prodStockFilter === 'OUT_OF_STOCK') matchesStock = totalStock === 0;
    if (prodStockFilter === 'LOW_STOCK') matchesStock = totalStock > 0 && totalStock <= 5;
    if (prodStockFilter === 'IN_STOCK') matchesStock = totalStock > 5;
    return matchesSearch && matchesCat && matchesStock;
  });

  // Chọn / Bỏ chọn sản phẩm hàng loạt
  const handleToggleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredProducts.map((p: any) => p.id);
    setSelectedProductIds(ids);
  };

  const handleDeselectAll = () => {
    setSelectedProductIds([]);
  };

  const handleApplyBulkDiscount = async () => {
    if (selectedProductIds.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm!');
    try {
      await api.post('/products/admin/bulk-discount', {
        product_ids: selectedProductIds,
        discount_id: bulkDiscountId || null,
      });
      alert('Đã cập nhật mã giảm giá cho các sản phẩm đã chọn!');
      loadAllData();
      setSelectedProductIds([]);
    } catch (err: any) {
      alert('Không thể áp dụng mã giảm giá!');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm!');
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedProductIds.length} sản phẩm đã chọn?`)) return;

    try {
      await api.post('/products/admin/bulk-delete', { product_ids: selectedProductIds });
      alert('Đã xóa các sản phẩm thành công!');
      loadAllData();
      setSelectedProductIds([]);
    } catch (err: any) {
      alert('Không thể xóa các sản phẩm đã chọn!');
    }
  };

  // Xem chi tiết khách hàng
  const handleViewCustomerDetail = async (userId: string) => {
    try {
      const res = await api.get(`/users/admin/customers/${userId}/analytics`);
      setCustomerDetail(res.data);
    } catch (err) {
      alert('Không thể lấy chi tiết khách hàng!');
    }
  };

  // Tạo & Lên lịch Voucher
  const handleCreateVoucher = async () => {
    if (!newVoucherForm.code.trim()) return alert('Vui lòng nhập mã code!');
    if (!newVoucherForm.start_date || !newVoucherForm.end_date) {
      return alert('Vui lòng chọn ngày giờ bắt đầu và kết thúc!');
    }

    const start = new Date(newVoucherForm.start_date);
    const end = new Date(newVoucherForm.end_date);

    if (start >= end) {
      return alert('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!');
    }

    const payload = {
      code: newVoucherForm.code.trim().toUpperCase(),
      discount_type: newVoucherForm.discount_type,
      discount_value: Number(newVoucherForm.discount_value),
      min_order_value: Number(newVoucherForm.min_order_value || 0),
      max_discount: newVoucherForm.max_discount ? Number(newVoucherForm.max_discount) : undefined,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      is_active: true,
    };

    try {
      await api.post('/discounts', payload);
      setNewVoucherForm({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        min_order_value: 0,
        max_discount: 50000,
        start_date: getLocalDatetimeString(new Date()),
        end_date: getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      });
      loadAllData();
      alert('Đã lên lịch mã giảm giá thành công!');
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : err.response?.data?.message || 'Không thể tạo voucher!';
      alert(msg);
    }
  };

  // Chat Actions
  const openChatWithCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    try {
      const res = await api.get(`/users/admin/chat/${cust.id}`);
      setChatMessages(res.data || []);
    } catch {
      setChatMessages([{ message: cust.last_message || 'Xin chào shop!' }]);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedCustomer) return;
    try {
      await usersService.sendMessage(selectedCustomer.id, replyMessage);
      setChatMessages((prev) => [...prev, { sender_id: user?.id, message: replyMessage, created_at: new Date() }]);
      setReplyMessage('');
    } catch {
      setChatMessages((prev) => [...prev, { sender_id: user?.id, message: replyMessage, created_at: new Date() }]);
      setReplyMessage('');
    }
  };

  const handleGiftVoucherSubmit = async () => {
    if (!selectedVoucherId || !selectedCustomer) return;
    try {
      await usersService.giftVoucher(selectedCustomer.id, selectedVoucherId);
      alert(`Đã tặng voucher thành công cho ${selectedCustomer.full_name}!`);
      setShowGiftModal(false);
      setSelectedVoucherId('');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tặng voucher thất bại!');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
      </div>
    );
  }

  const NavigationContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-red-600 font-black px-2.5 py-0.5 rounded text-xl tracking-wider shadow">
              HUY
            </span>
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white">ADMIN</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-105 transition shadow-sm border border-slate-200 dark:border-slate-700"
            title={darkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1.5 font-semibold text-sm">
          {[
            { id: 'overview', label: 'Bảng Doanh Thu', icon: LayoutDashboard },
            { id: 'products', label: 'Quản Lý Sản Phẩm', icon: Package },
            { id: 'categories', label: 'Quản Lý Danh Mục', icon: Layers },
            { id: 'users', label: 'Quản Lý Khách Hàng', icon: Users },
            { id: 'vouchers', label: 'Quản Lý Mã Giảm Giá', icon: Tag },
            { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare },
            { id: 'settings', label: 'Cài Đặt Hệ Thống', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" /> {tab.label}
              </button>
            );
          })}

          <Link
            href="/products"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition mt-6 pt-4 border-t border-slate-200 dark:border-slate-800"
          >
            <ShoppingBag className="w-5 h-5" /> Quay Về Cửa Hàng
          </Link>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-red-600 font-black px-2 py-0.5 rounded text-lg shadow">
            HUY
          </span>
          <span className="font-bold text-base text-slate-800 dark:text-white">ADMIN</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* DRAWER MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 bg-white dark:bg-slate-950 h-full p-6 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <NavigationContent />
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:block w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 shrink-0 transition-colors">
        <NavigationContent />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

          {/* TAB 1: BẢNG DOANH THU & DUYỆT ĐƠN HÀNG 4 BƯỚC */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-4">Thống Kê Doanh Thu System</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <DollarSign className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tổng Doanh Thu (Đã Giao)</span>
                      <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {totalRevenue.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <PackageCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Đơn Giao Thành Công</span>
                      <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
                        {orders.filter((o) => o.status === 'DELIVERED').length} / {orders.length} Đơn
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm sm:col-span-2 md:col-span-1">
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Đơn Cần Xử Lý</span>
                      <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
                        {orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'SHIPPED').length} Đơn
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-red-600" /> Quản Lý Đơn Hàng & Luồng Vận Chuyển
                  </h2>
                  <button onClick={loadOrdersData} className="text-xs font-bold text-red-600 hover:underline">
                    Làm mới danh sách
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm overflow-x-auto">
                  {loadingOrders ? (
                    <div className="text-center py-10 text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Đang lấy danh sách đơn hàng...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">Chưa có đơn hàng nào trong CSDL.</div>
                  ) : (
                    <table className="w-full text-left text-sm min-w-[750px]">
                      <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                        <tr>
                          <th className="p-3">Mã Đơn</th>
                          <th className="p-3">Khách Hàng</th>
                          <th className="p-3">Sản Phẩm</th>
                          <th className="p-3">Tổng Tiền</th>
                          <th className="p-3">Trạng Thái Quy Trình</th>
                          <th className="p-3 text-center">Xác Nhận Luồng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                        {orders.map((order) => {
                          const isUpdating = updatingOrderId === order.id;
                          return (
                            <tr key={order.id}>
                              <td className="p-3 font-mono font-bold text-xs text-amber-600 dark:text-yellow-400">
                                {order.order_code || `#${order.id.slice(0, 8)}`}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800 dark:text-white">
                                  {order.user?.full_name || 'Khách hàng'}
                                </div>
                                <div className="text-[11px] text-slate-400">{order.user?.phone || order.user?.email}</div>
                              </td>
                              <td className="p-3 text-xs text-slate-600 dark:text-slate-300 max-w-[200px]">
                                {order.order_items && order.order_items.length > 0 ? (
                                  order.order_items.map((it: AdminOrderItem, idx: number) => (
                                    <div key={idx} className="truncate">
                                      • {it.sku?.product?.name || 'Bộ Lego'} (x{it.quantity})
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-400">Chi tiết sản phẩm</span>
                                )}
                              </td>
                              <td className="p-3 font-black text-red-600 dark:text-red-400 whitespace-nowrap">
                                {Number(order.total_amount).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {order.status === 'PENDING' && (
                                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                    <Clock className="w-3.5 h-3.5" /> 1. Chờ duyệt đơn
                                  </span>
                                )}
                                {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 2. Đã xác nhận
                                  </span>
                                )}
                                {order.status === 'SHIPPED' && (
                                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                    <Truck className="w-3.5 h-3.5" /> 3. Đang giao hàng
                                  </span>
                                )}
                                {order.status === 'DELIVERED' && (
                                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                    <PackageCheck className="w-3.5 h-3.5" /> 4. Đã giao hàng
                                  </span>
                                )}
                                {order.status === 'CANCELLED' && (
                                  <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                    <XCircle className="w-3.5 h-3.5" /> Đã hủy
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {isUpdating ? (
                                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Bước 1: PENDING -> Duyệt sang CONFIRMED */}
                                    {order.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow"
                                        >
                                          Duyệt Đơn Hàng
                                        </button>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                          className="bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                        >
                                          Hủy Đơn
                                        </button>
                                      </>
                                    )}

                                    {/* Bước 2: CONFIRMED -> Chuyển sang SHIPPED (Đang giao hàng) */}
                                    {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow flex items-center gap-1"
                                        >
                                          <Truck className="w-3.5 h-3.5" /> Giao Vận Chuyển
                                        </button>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                          className="bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                        >
                                          Hủy Đơn
                                        </button>
                                      </>
                                    )}

                                    {/* Bước 3: SHIPPED -> Chuyển sang DELIVERED (Đã giao hàng + Doanh thu) */}
                                    {order.status === 'SHIPPED' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow flex items-center gap-1"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Xác Nhận Đã Giao
                                        </button>
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                          className="bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                        >
                                          Hủy Đơn
                                        </button>
                                      </>
                                    )}

                                    {/* Bước 4: DELIVERED / CANCELLED -> Hoàn tất */}
                                    {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                                      <span className="text-xs text-slate-400 italic">Hoàn tất quy trình</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ SẢN PHẨM & BỘ CHỌN HÀNG LOẠT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Sản Phẩm LEGO</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kiểm soát tồn kho, gán mã giảm giá & lọc nâng cao</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedProductIds([]);
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
                      isSelectMode ? 'bg-slate-900 dark:bg-white text-yellow-400 dark:text-slate-900 border border-yellow-400' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelectMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                    {isSelectMode ? 'Thoát Chế Độ Chọn' : 'Chọn Sản Phẩm'}
                  </button>

                  <button
                    onClick={() => handleOpenProdModal()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
                  >
                    <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
                  </button>
                </div>
              </div>

              {/* BỘ LỌC SẢN PHẨM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc mã bộ..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <select
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-800 dark:text-white"
                >
                  <option value="">-- Tất cả danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={prodStockFilter}
                  onChange={(e) => setProdStockFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none font-bold text-red-600 dark:text-red-400"
                >
                  <option value="ALL">📦 Tất cả trạng thái kho</option>
                  <option value="OUT_OF_STOCK">🚨 Đã Hết Hàng (0 bộ)</option>
                  <option value="LOW_STOCK">⚠️ Sắp Hết Hàng (≤ 5 bộ)</option>
                  <option value="IN_STOCK">✅ Còn Hàng (&gt; 5 bộ)</option>
                </select>
              </div>

              {/* THANH ĐIỀU KHIỂN KHI BẬT CHẾ ĐỘ CHỌN HÀNG LOẠT */}
              {isSelectMode && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                      Đã chọn: {selectedProductIds.length} / {filteredProducts.length} sản phẩm trong bộ lọc
                    </span>
                    <button
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-300 transition"
                    >
                      Chọn tất cả trong bộ lọc
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 transition"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={bulkDiscountId}
                      onChange={(e) => setBulkDiscountId(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">-- Gỡ mã giảm giá --</option>
                      {vouchersList.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          Áp mã: {v.code} (-{v.discount_value}%)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleApplyBulkDiscount}
                      disabled={selectedProductIds.length === 0}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" /> Áp Dụng Mã
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedProductIds.length === 0}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa Đã Chọn
                    </button>
                  </div>
                </div>
              )}

              {/* BẢNG DANH SÁCH SẢN PHẨM */}
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[750px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      {isSelectMode && <th className="p-3 w-10 text-center">Chọn</th>}
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Danh Mục</th>
                      <th className="p-3">Mã Giảm Giá</th>
                      <th className="p-3">Giá Cơ Bản</th>
                      <th className="p-3">Số Lượng Kho</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {filteredProducts.map((p: any) => {
                      const thumbImage =
                        p.product_images?.find((i: any) => i.is_primary)?.image_url ||
                        p.product_images?.[0]?.image_url ||
                        'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=100';

                      const totalStock = (p.product_skus || []).reduce((sum: number, s: any) => sum + Number(s.stock_quantity || 0), 0);
                      const isSelected = selectedProductIds.includes(p.id);

                      return (
                        <tr key={p.id} className={isSelected ? 'bg-amber-500/10 dark:bg-amber-900/20' : ''}>
                          {isSelectMode && (
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOne(p.id)}
                                className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                                <img src={thumbImage} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{p.name}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Mã: #{p.item_number || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{p.category?.name || 'Chưa chọn'}</td>
                          
                          {/* HIỂN THỊ CHI TIẾT MÃ GIẢM GIÁ & MỨC GIẢM */}
                          <td className="p-3">
                            {p.discount ? (
                              <div className="space-y-1">
                                <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black px-2.5 py-1 rounded-lg text-xs shadow flex items-center gap-1.5 w-fit">
                                  <Tag className="w-3.5 h-3.5" />
                                  <span>{p.discount.code}</span>
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                    {p.discount.discount_type === 'PERCENTAGE'
                                      ? `-${p.discount.discount_value}%`
                                      : `-${Number(p.discount.discount_value).toLocaleString('vi-VN')}đ`}
                                  </span>
                                </div>
                                <div className="text-[10px]">
                                  {p.discount.is_active ? (
                                    <span className="text-emerald-500 font-bold">● Đang hoạt động</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">● Đang tạm tắt</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Không có</span>
                            )}
                          </td>

                          <td className="p-3 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                            {Number(p.base_price).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3 font-mono font-black">{totalStock} bộ</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenProdModal(p)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                title="Sửa sản phẩm"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ DANH MỤC */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Danh Mục LEGO</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phân loại dòng sản phẩm</p>
                </div>
                <button
                  onClick={() => handleOpenCatModal()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition w-full sm:w-auto"
                >
                  <Plus className="w-5 h-5" /> Thêm Danh Mục Mới
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Tên Danh Mục</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">{c.name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.slug}</td>
                        <td className="p-3 text-center flex justify-center gap-3">
                          <button onClick={() => handleOpenCatModal(c)} className="text-blue-500 hover:underline flex items-center gap-1 font-bold text-xs">
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ KHÁCH HÀNG */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Khách Hàng Realtime</h1>
                <p className="text-xs text-slate-400">Trạng thái (🟢 Online | 🔴 Offline &lt; 30p | ⚪ Offline &gt; 1 ngày) & Xem Chi Tiết</p>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3">Số Điện Thoại</th>
                      <th className="p-3">Địa Chỉ Giao Hàng</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {customers.map((c) => {
                      let dotColor = 'bg-slate-400 dark:bg-slate-500';
                      let statusText = 'Offline hơn 1 ngày';

                      if (c.is_online) {
                        dotColor = 'bg-emerald-500 animate-pulse';
                        statusText = 'Đang online';
                      } else if (c.offline_minutes <= 30) {
                        dotColor = 'bg-red-500';
                        statusText = `Offline (${c.offline_minutes || 1} phút trước)`;
                      } else {
                        statusText = `Offline (${c.offline_duration})`;
                      }

                      return (
                        <tr key={c.id}>
                          <td className="p-3">
                            <button
                              onClick={() => handleViewCustomerDetail(c.id)}
                              className="font-bold text-left flex items-center gap-2 hover:text-red-600 transition"
                            >
                              <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} title={statusText}></span>
                              {c.full_name}
                            </button>
                            <div className="text-[11px] text-slate-400 pl-5">{c.email}</div>
                          </td>
                          <td className="p-3 text-xs font-semibold">
                            <span className={c.is_online ? 'text-emerald-500' : c.offline_minutes <= 30 ? 'text-red-500' : 'text-slate-400'}>
                              {statusText}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs">{c.phone || 'Chưa cập nhật'}</td>
                          <td className="p-3 text-xs text-slate-400 max-w-[180px] truncate">{c.address}</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewCustomerDetail(c.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs font-bold px-2.5 hover:bg-slate-200"
                                title="Xem chi tiết đơn hàng & chi tiêu"
                              >
                                <Eye className="w-4 h-4" /> Chi tiết
                              </button>
                              <button
                                onClick={() => openChatWithCustomer(c)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1 text-xs font-bold px-2.5 hover:bg-blue-100"
                                title="Nhắn tin với khách hàng"
                              >
                                <MessageCircle className="w-4 h-4" /> Nhắn tin
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setShowGiftModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-bold px-2.5 hover:bg-amber-100"
                                title="Tặng Voucher"
                              >
                                <Gift className="w-4 h-4" /> Tặng Voucher
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ MÃ GIẢM GIÁ (HẸN NGÀY & GIỜ) */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              {/* Form tạo & Hẹn giờ Voucher */}
              <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">Lên Lịch & Hẹn Giờ Mã Giảm Giá</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mã sẽ tự động kích hoạt và hết hiệu lực chính xác theo ngày giờ đã chọn.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mã Code *</label>
                    <input
                      type="text"
                      placeholder="VD: FLASH_SALE..."
                      value={newVoucherForm.code}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, code: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none uppercase font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Loại Giảm Giá</label>
                    <select
                      value={newVoucherForm.discount_type}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, discount_type: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Tiền mặt (VNĐ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mức Giảm *</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newVoucherForm.discount_value || ''}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, discount_value: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold text-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Bắt Đầu (Ngày & Giờ) *</label>
                    <input
                      type="datetime-local"
                      value={newVoucherForm.start_date}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, start_date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Kết Thúc (Ngày & Giờ) *</label>
                    <input
                      type="datetime-local"
                      value={newVoucherForm.end_date}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, end_date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleCreateVoucher}
                      className="w-full h-[38px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Tạo Voucher
                    </button>
                  </div>
                </div>
              </div>

              {/* Bảng Danh Sách Voucher & Trạng Thái Thời Gian Thực */}
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[750px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Mã Voucher</th>
                      <th className="p-3">Mức Giảm</th>
                      <th className="p-3">Thời Gian Hiệu Lực</th>
                      <th className="p-3">Trạng Thái Thời Gian</th>
                      <th className="p-3">Khóa / Mở</th>
                      <th className="p-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {vouchersList.map((v: any) => {
                      const now = new Date();
                      const start = new Date(v.start_date);
                      const end = new Date(v.end_date);

                      const isUpcoming = now < start;
                      const isExpired = now > end;
                      const isRunning = now >= start && now <= end;

                      return (
                        <tr key={v.id}>
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-yellow-400">{v.code}</td>
                          <td className="p-3 font-bold text-red-500">
                            {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : `${Number(v.discount_value).toLocaleString()} đ`}
                          </td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-300">
                            <div>Từ: {start.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            <div>Đến: {end.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                          </td>
                          <td className="p-3">
                            {isUpcoming && (
                              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <Clock className="w-3.5 h-3.5" /> Chưa tới giờ mở
                              </span>
                            )}
                            {isRunning && (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động
                              </span>
                            )}
                            {isExpired && (
                              <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <XCircle className="w-3.5 h-3.5" /> Đã kết thúc
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={async () => {
                                await api.patch(`/discounts/${v.id}/toggle`);
                                loadAllData();
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                v.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {v.is_active ? 'Bật' : 'Tắt thủ công'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={async () => {
                                if (!confirm('Xóa voucher này?')) return;
                                await api.delete(`/discounts/${v.id}`);
                                loadAllData();
                              }}
                              className="text-red-500 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: QUẢN LÝ BÌNH LUẬN */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Đánh Giá & Bình Luận</h1>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Đánh Giá</th>
                      <th className="p-3">Nội Dung</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {comments.map((cm) => (
                      <tr key={cm.id}>
                        <td className="p-3 font-bold">{cm.user_name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{cm.product_name}</td>
                        <td className="p-3 font-bold text-amber-500">⭐ {cm.rating}/5</td>
                        <td className="p-3 italic">"{cm.comment}"</td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button onClick={() => toggleApproveComment(cm.id)}>
                            <CheckCircle2 className={`w-4 h-4 ${cm.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                          </button>
                          <button onClick={() => deleteComment(cm.id)} className="text-red-500 dark:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: CÀI ĐẶT HỆ THỐNG */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <AdminSettingsPage />
            </div>
          )}

        </div>
      </main>

      {/* MODAL XEM CHI TIẾT HỒ SƠ & LỊCH SỬ KHÁCH HÀNG */}
      {customerDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-lg">
                  {customerDetail.customer?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">
                    {customerDetail.customer?.full_name}
                  </h2>
                  <p className="text-xs text-slate-400">ID: #{customerDetail.customer?.id}</p>
                </div>
              </div>
              <button onClick={() => setCustomerDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Thông tin cá nhân & Địa chỉ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Thông Tin Liên Hệ</span>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{customerDetail.customer?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customerDetail.customer?.phone || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tham gia: {new Date(customerDetail.customer?.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Địa Chỉ Nhận Hàng</span>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{customerDetail.customer?.formatted_address || 'Chưa thiết lập địa chỉ'}</span>
                </div>
              </div>
            </div>

            {/* Thống kê đơn hàng */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-semibold">Tổng Đơn Hàng</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">
                  {customerDetail.analytics?.total_orders || 0} Đơn
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-semibold">Đã Giao Thành Công</span>
                <span className="text-lg font-black text-blue-500">
                  {customerDetail.analytics?.delivered_orders || 0} Đơn
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-semibold">Tổng Chi Tiêu</span>
                <span className="text-lg font-black text-emerald-500">
                  {Number(customerDetail.analytics?.total_spent || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Lịch sử đơn hàng */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Lịch Sử Đơn Hàng Gần Đây</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(customerDetail.orders || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Khách hàng chưa có đơn hàng nào.</p>
                ) : (
                  customerDetail.orders.map((o: any) => (
                    <div key={o.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-amber-500 font-mono">#{o.order_code || o.id.slice(0, 8)}</span>
                        <span className="text-slate-400 ml-2">{new Date(o.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-red-500">{Number(o.total_amount).toLocaleString('vi-VN')} đ</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' :
                          o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHAT VỚI KHÁCH HÀNG */}
      {selectedCustomer && !showGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{selectedCustomer.full_name}</h3>
                <span className="text-xs text-emerald-500">{selectedCustomer.is_online ? '● Đang hoạt động' : 'Offline'}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-red-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 rounded-bl-none text-slate-800 dark:text-white'
                      }`}
                    >
                      {msg.media_url && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[200px]">
                          {msg.media_type === 'VIDEO' ? (
                            <video src={msg.media_url} controls className="w-full rounded-xl" />
                          ) : (
                            <img src={msg.media_url} alt="media" className="w-full object-cover rounded-xl" />
                          )}
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <label
                className="cursor-pointer p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 transition flex items-center justify-center"
                title="Gửi ảnh hoặc video"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedCustomer) return;

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('message', file.name);

                    try {
                      await api.post(`/users/admin/chat/${selectedCustomer.id}/media`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      openChatWithCustomer(selectedCustomer);
                    } catch (err) {
                      alert('Không thể gửi file lên khung chat!');
                    }
                  }}
                />
              </label>

              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-grow bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs outline-none text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
              />
              <button type="submit" className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẶNG VOUCHER */}
      {showGiftModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
              <Gift className="w-5 h-5" /> Tặng Voucher Cho {selectedCustomer.full_name}
            </h3>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Chọn Mã Giảm Giá</label>
              <select
                value={selectedVoucherId}
                onChange={(e) => setSelectedVoucherId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-xs outline-none text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                <option value="">-- Chọn Voucher --</option>
                {vouchersList.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.code} - {v.discount_type === 'PERCENTAGE' ? `Giảm ${v.discount_value}%` : `Giảm ${Number(v.discount_value).toLocaleString()}đ`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowGiftModal(false)} className="w-1/2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                Hủy
              </button>
              <button onClick={handleGiftVoucherSubmit} className="w-1/2 p-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold">
                Xác Nhận Tặng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATEGORY */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 md:space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                {editingCat ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục LEGO Mới'}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Danh Mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LEGO Star Wars"
                  value={catForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCatForm({ ...catForm, name, slug: generateSlug(name) });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">URL Đường Dẫn (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="lego-star-wars"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Ảnh Banner / Logo (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={catForm.image_url}
                  onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition text-sm"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUCT */}
      {showProdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-5 md:p-8 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                  {editingProd ? 'Cập Nhật Bộ LEGO' : 'Thêm Bộ LEGO Mới Vào Hệ Thống'}
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingProd ? `Đang chỉnh sửa sản phẩm ID: #${editingProd.id}` : 'Điền thông tin bộ sản phẩm, chọn danh mục & ảnh'}
                </p>
              </div>
              <button onClick={() => setShowProdModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Bộ Lego *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lego Star Wars Millennium Falcon"
                    value={prodForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setProdForm({ ...prodForm, name, slug: generateSlug(name) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.slug}
                    onChange={(e) => setProdForm({ ...prodForm, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Danh Mục Sản Phẩm *</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Chọn Danh Mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Giá Bán Niêm Yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="2500000"
                    value={prodForm.base_price || ''}
                    onChange={(e) => setProdForm({ ...prodForm, base_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-bold rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mã Bộ</label>
                  <input
                    type="text"
                    placeholder="75313"
                    value={prodForm.item_number || ''}
                    onChange={(e) => setProdForm({ ...prodForm, item_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mảnh Ghép</label>
                  <input
                    type="number"
                    placeholder="7541"
                    value={prodForm.piece_count || ''}
                    onChange={(e) => setProdForm({ ...prodForm, piece_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Độ Tuổi</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={prodForm.min_age || ''}
                    onChange={(e) => setProdForm({ ...prodForm, min_age: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={2}
                  placeholder="Giới thiệu bộ Lego..."
                  value={prodForm.description || ''}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl p-3 text-xs focus:outline-none leading-relaxed"
                />
              </div>

              {/* HÌNH ẢNH */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-red-500" /> Hình Ảnh Sản Phẩm *
                  </label>

                  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-fit">
                    <button
                      type="button"
                      onClick={() => setImageInputType('URL')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                        imageInputType === 'URL' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> Link Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputType('FILE')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                        imageInputType === 'FILE' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Máy Tính
                    </button>
                  </div>
                </div>

                {imageInputType === 'URL' ? (
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500"
                    value={prodForm.images[0]?.image_url || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setProdForm((prev) => {
                        const imgs = [...prev.images];
                        imgs[0] = { image_url: url, is_primary: true };
                        return { ...prev, images: imgs };
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-slate-900">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Chọn ảnh từ thư viện máy tính</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                {prodForm.images[0]?.image_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-1 border border-slate-300 dark:border-slate-700 shrink-0">
                      <img src={prodForm.images[0].image_url} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Đã nạp ảnh thành công</span>
                  </div>
                )}
              </div>

              {/* SKU & TỒN KHO */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Thông Tin SKU & Kho
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Mã Kho (SKU)</label>
                    <input
                      type="text"
                      required
                      value={prodForm.skus[0]?.sku_code || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdForm((prev) => {
                          const skus = [...prev.skus];
                          skus[0].sku_code = val;
                          return { ...prev, skus };
                        });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tồn Kho</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={prodForm.skus[0]?.stock_quantity ?? 10}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProdForm((prev) => {
                          const skus = [...prev.skus];
                          skus[0].stock_quantity = val;
                          return { ...prev, skus };
                        });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition text-sm"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProd ? 'Cập Nhật' : 'Tạo Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}