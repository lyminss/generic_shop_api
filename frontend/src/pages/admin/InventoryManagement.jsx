import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Boxes,
  ChefHat,
  FilePlus2,
  FileDiff,
  History,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  X,
  Sparkles,
  Clock,
  Calendar,
  CalendarDays,
  Filter,
  Check
} from 'lucide-react';
import {
  ingredientService,
  recipeService,
  productService,
  stockReceiptService,
  stockAdjustmentService,
  inventoryTransactionService
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatTimeAgo, formatDate, formatDateTime, fmtQty } from '../../utils/format';
import { TableSkeleton, EmptyState, ErrorState } from '../../components/common/StateViews';
import CreateStockReceiptModal from './components/CreateStockReceiptModal';
import StockReceiptDetailModal from './components/StockReceiptDetailModal';

import './InventoryManagement.css';

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getActiveFeatureFromPath = (pathname) => {
  if (pathname.includes('/recipes')) return 'recipes';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/adjustments')) return 'adjustments';
  if (pathname.includes('/logs')) return 'logs';
  return 'stock';
};

const FEATURE_TITLES = {
  stock: {
    title: 'Tồn Kho Nguyên Liệu & Quản Lý FEFO',
    subtitle: 'Theo dõi số lượng tồn, hạn sử dụng FEFO, số ngày hết hạn và giá vốn từng nguyên liệu',
    icon: <Boxes className="icon-header" />
  },
  recipes: {
    title: 'Công Thức Pha Chế (Recipe BOM)',
    subtitle: 'Thiết lập định lượng nguyên liệu tiêu hao cho từng món ăn & đồ uống',
    icon: <ChefHat className="icon-header" />
  },
  receipts: {
    title: 'Phiếu Nhập Kho Nguyên Liệu',
    subtitle: 'Tạo phiếu nhập nguyên liệu mới từ nhà cung cấp & xem lịch sử nhập kho',
    icon: <FilePlus2 className="icon-header" />
  },
  adjustments: {
    title: 'Kiểm Kê & Điều Chỉnh Kho',
    subtitle: 'Đối soát tồn kho sổ sách vs tồn thực tế kiểm đếm, ghi nhận chênh lệch',
    icon: <FileDiff className="icon-header" />
  },
  logs: {
    title: 'Nhật Ký Biến Động Kho',
    subtitle: 'Lịch sử chi tiết mọi giao dịch xuất nhập kho, pha chế món & điều chỉnh',
    icon: <History className="icon-header" />
  }
};

const InventoryManagement = () => {
  const location = useLocation();
  const toast = useToast();
  const activeFeature = getActiveFeatureFromPath(location.pathname);

  // --- TAB 1: STOCK DATA ---
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockSearch, setStockSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [expiryFilterTab, setExpiryFilterTab] = useState('all'); // 'all' | 'expired' | 'urgent' | 'low_stock' | 'safe'
  const [showIngModal, setShowIngModal] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [ingForm, setIngForm] = useState({
    code: '',
    name: '',
    unit: 'chai',
    currentStock: 0,
    minStockAlert: 100,
    costPrice: 0,
    expiryDate: '',
    openedStock: 0,
    openedExpiryDate: '',
  });

  // --- TAB 2: RECIPE DATA ---
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]); // [{ ingredientId, quantity, unit }]

  // --- TAB 3: STOCK RECEIPTS ---
  const [receipts, setReceipts] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    supplier: '',
    note: '',
    items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }],
  });

  // --- TAB 4: STOCK ADJUSTMENTS ---
  const [adjustments, setAdjustments] = useState([]);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [adjForm, setAdjForm] = useState({
    reason: 'Kiểm kê định kỳ',
    note: '',
    items: [{ ingredientId: '', actualStock: 0, note: '' }],
  });

  // --- TAB 5: LOGS ---
  const [transactions, setTransactions] = useState([]);
  const [logFilterType, setLogFilterType] = useState('');
  const [logFilterIng, setLogFilterIng] = useState('');

  // ----------------------------------------------------
  // FETCHERS
  // ----------------------------------------------------
  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ingredientService.getAll();
      setIngredients(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  }, [toast]);


  const fetchProducts = useCallback(async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách sản phẩm');
    }
  }, [toast]);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await stockReceiptService.getAll();
      setReceipts(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách phiếu nhập kho');
    }
  }, [toast]);

  const fetchAdjustments = useCallback(async () => {
    try {
      const res = await stockAdjustmentService.getAll();
      setAdjustments(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách phiếu điều chỉnh');
    }
  }, [toast]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await inventoryTransactionService.getAll(logFilterIng || null, logFilterType || null);
      setTransactions(res.data || []);
    } catch (err) {
      toast.error('Không thể tải nhật ký biến động kho');
    }
  }, [logFilterIng, logFilterType, toast]);

  useEffect(() => {
    fetchIngredients();
    fetchProducts();
  }, [fetchIngredients, fetchProducts]);

  useEffect(() => {
    if (activeFeature === 'receipts') fetchReceipts();
    if (activeFeature === 'adjustments') fetchAdjustments();
    if (activeFeature === 'logs') fetchTransactions();

    // Đóng tất cả modal khi chuyển chức năng
    setShowIngModal(false);
    setShowReceiptModal(false);
    setShowAdjModal(false);
    setSelectedReceipt(null);
    setSelectedAdjustment(null);
  }, [activeFeature, fetchReceipts, fetchAdjustments, fetchTransactions]);


  // Load Recipe when selectedProductId changes
  useEffect(() => {
    if (selectedProductId) {
      recipeService.getRecipeByProductId(selectedProductId)
        .then(res => {
          setRecipeDetails(res.data);
          const formattedItems = res.data.recipeItems.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit
          }));
          setRecipeItems(formattedItems);
        })
        .catch(() => {
          setRecipeDetails(null);
          setRecipeItems([]);
        });
    } else {
      setRecipeDetails(null);
      setRecipeItems([]);
    }
  }, [selectedProductId]);

  // ----------------------------------------------------
  // INGREDIENT HANDLERS
  // ----------------------------------------------------
  const handleOpenAddIng = () => {
    setEditingIng(null);
    const defaultExp = new Date();
    defaultExp.setDate(defaultExp.getDate() + 30);
    const defaultOpExp = new Date();
    defaultOpExp.setDate(defaultOpExp.getDate() + 3);
    setIngForm({
      code: `NL${String(ingredients.length + 1).padStart(3, '0')}`,
      name: '',
      unit: 'chai',
      currentStock: 0,
      minStockAlert: 100,
      costPrice: 0,
      expiryDate: defaultExp.toISOString().split('T')[0],
      openedStock: 0,
      openedExpiryDate: defaultOpExp.toISOString().split('T')[0],
    });
    setShowIngModal(true);
  };

  const handleOpenEditIng = (ing) => {
    setEditingIng(ing);
    setIngForm({
      code: ing.code,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
      minStockAlert: ing.minStockAlert,
      costPrice: ing.costPrice,
      expiryDate: ing.expiryDate || '',
      openedStock: ing.openedStock || 0,
      openedExpiryDate: ing.openedExpiryDate || '',
    });
    setShowIngModal(true);
  };



  const handleSaveIng = async (e) => {
    e.preventDefault();
    try {
      if (editingIng) {
        await ingredientService.update(editingIng.id, ingForm);
        toast.success('Cập nhật nguyên liệu thành công');
      } else {
        await ingredientService.create(ingForm);
        toast.success('Thêm nguyên liệu mới thành công');
      }
      setShowIngModal(false);
      fetchIngredients();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể lưu nguyên liệu');
    }
  };

  const handleDeleteIng = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nguyên liệu này?')) return;
    try {
      await ingredientService.delete(id);
      toast.success('Xóa nguyên liệu thành công');
      fetchIngredients();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể xóa nguyên liệu');
    }
  };

  const handleDiscardExpired = async (id, ingName) => {
    if (!window.confirm(`Xác nhận xuất hủy lô nguyên liệu hết hạn của "${ingName}"? Hệ thống sẽ ghi nhận lịch sử vào nhật ký biến động kho.`)) return;
    try {
      await ingredientService.discardExpired(id);
      toast.success(`Đã xuất hủy nguyên liệu "${ingName}" và ghi nhận biến động kho!`);
      fetchIngredients();
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Không thể xuất hủy nguyên liệu');
    }
  };

  const handleDiscardAllExpired = async () => {
    if (!window.confirm(`Xác nhận xuất hủy TẤT CẢ các nguyên liệu đã quá hạn sử dụng? Thao tác này sẽ ghi nhận vào lịch sử biến động kho.`)) return;
    try {
      await ingredientService.discardAllExpired();
      toast.success(`Đã xuất hủy tất cả các nguyên liệu hết hạn và ghi nhật ký biến động kho thành công!`);
      fetchIngredients();
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Không thể xuất hủy nguyên liệu');
    }
  };


  // ----------------------------------------------------
  // RECIPE HANDLERS
  // ----------------------------------------------------
  const handleAddRecipeRow = () => {
    if (ingredients.length === 0) return toast.warning('Chưa có nguyên liệu trong kho!');
    setRecipeItems([...recipeItems, { ingredientId: ingredients[0].id, quantity: 1, unit: ingredients[0].unit }]);
  };

  const handleRemoveRecipeRow = (index) => {
    const next = [...recipeItems];
    next.splice(index, 1);
    setRecipeItems(next);
  };

  const handleRecipeRowChange = (index, field, value) => {
    const next = [...recipeItems];
    next[index][field] = value;
    if (field === 'ingredientId') {
      const found = ingredients.find(i => String(i.id) === String(value));
      if (found) next[index].unit = found.unit;
    }
    setRecipeItems(next);
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return toast.warning('Vui lòng chọn sản phẩm!');
    try {
      const payload = {
        productId: Number(selectedProductId),
        items: recipeItems.map(item => ({
          ingredientId: Number(item.ingredientId),
          quantity: Number(item.quantity),
          unit: item.unit
        }))
      };
      const res = await recipeService.saveRecipe(payload);
      setRecipeDetails(res.data);
      toast.success('Cập nhật công thức pha chế thành công!');
    } catch (err) {
      toast.error(err.response?.data || 'Lỗi khi lưu công thức');
    }
  };

  // ----------------------------------------------------
  // STOCK RECEIPT HANDLERS
  // ----------------------------------------------------
  const handleAddReceiptRow = () => {
    setReceiptForm({
      ...receiptForm,
      items: [...receiptForm.items, { ingredientId: ingredients[0]?.id || '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveReceiptRow = (idx) => {
    const next = [...receiptForm.items];
    next.splice(idx, 1);
    setReceiptForm({ ...receiptForm, items: next });
  };

  const handleReceiptRowChange = (idx, field, val) => {
    const next = [...receiptForm.items];
    next[idx][field] = val;
    setReceiptForm({ ...receiptForm, items: next });
  };

  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const handleSaveReceiptModal = async (payload) => {
    setSubmittingReceipt(true);
    try {
      await stockReceiptService.create(payload);
      toast.success('Tạo phiếu nhập kho thành công!');
      setShowReceiptModal(false);
      fetchReceipts();
      fetchIngredients();
    } catch (err) {
      toast.error(err.response?.data || 'Lỗi khi tạo phiếu nhập kho');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  // ----------------------------------------------------
  // STOCK ADJUSTMENT HANDLERS
  // ----------------------------------------------------
  const handleAddAdjRow = () => {
    const firstIng = ingredients[0];
    setAdjForm({
      ...adjForm,
      items: [...adjForm.items, { ingredientId: firstIng?.id || '', actualStock: firstIng?.currentStock || 0, note: '' }]
    });
  };

  const handleRemoveAdjRow = (idx) => {
    const next = [...adjForm.items];
    next.splice(idx, 1);
    setAdjForm({ ...adjForm, items: next });
  };

  const handleAdjRowChange = (idx, field, val) => {
    const next = [...adjForm.items];
    next[idx][field] = val;
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => String(i.id) === String(val));
      if (ing) next[idx].actualStock = ing.currentStock;
    }
    setAdjForm({ ...adjForm, items: next });
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        reason: adjForm.reason,
        note: adjForm.note,
        items: adjForm.items.map(item => ({
          ingredientId: Number(item.ingredientId),
          actualStock: Number(item.actualStock),
          note: item.note
        }))
      };
      await stockAdjustmentService.create(payload);
      toast.success('Tạo phiếu điều chỉnh kiểm kê thành công!');
      setShowAdjModal(false);
      setAdjForm({ reason: 'Kiểm kê định kỳ', note: '', items: [{ ingredientId: '', actualStock: 0, note: '' }] });
      fetchAdjustments();
      fetchIngredients();
    } catch (err) {
      toast.error(err.response?.data || 'Lỗi khi tạo phiếu điều chỉnh');
    }
  };

  // ----------------------------------------------------
  // COMPUTED STATS & EXPIRY EVALUATION
  // ----------------------------------------------------
  const getIngredientExpiryInfo = (ing) => {
    const openedCount = ing.openedStock || 0;
    const sealedCount = Math.max(0, (ing.currentStock || 0) - openedCount);
    const opDays = (openedCount > 0 && ing.openedExpiryDate) ? getDaysUntilExpiry(ing.openedExpiryDate) : null;
    const seDays = ing.expiryDate ? getDaysUntilExpiry(ing.expiryDate) : null;

    const isOpenedExpired = opDays !== null && opDays < 0;
    const isSealedExpired = seDays !== null && seDays < 0;
    const isExpired = isOpenedExpired || isSealedExpired;

    const minDays = (() => {
      if (opDays !== null && seDays !== null) return Math.min(opDays, seDays);
      return opDays ?? seDays ?? 9999;
    })();

    const isUrgent = !isExpired && minDays <= 3;
    const isWarning = !isExpired && minDays > 3 && minDays <= 7;
    const isSafe = !isExpired && minDays > 7;
    const isLow = ing.currentStock <= ing.minStockAlert;

    return {
      openedCount,
      sealedCount,
      opDays,
      seDays,
      isOpenedExpired,
      isSealedExpired,
      isExpired,
      minDays,
      isUrgent,
      isWarning,
      isSafe,
      isLow,
    };
  };

  const computedIngredients = ingredients.map(ing => ({
    ...ing,
    _info: getIngredientExpiryInfo(ing)
  }));

  const expiredCount = computedIngredients.filter(i => i._info.isExpired).length;
  const urgentCount = computedIngredients.filter(i => i._info.isUrgent).length;
  const expiringSoonCount = computedIngredients.filter(i => i._info.isUrgent || i._info.isWarning).length;
  const lowStockCount = computedIngredients.filter(i => i._info.isLow).length;
  const safeCount = computedIngredients.filter(i => i._info.isSafe).length;
  const totalStockValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPrice), 0);

  const filteredIngredients = computedIngredients
    .filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                            ing.code.toLowerCase().includes(stockSearch.toLowerCase());

      let matchesTab = true;
      if (expiryFilterTab === 'expired') matchesTab = ing._info.isExpired;
      else if (expiryFilterTab === 'urgent') matchesTab = (ing._info.isUrgent || ing._info.isWarning);
      else if (expiryFilterTab === 'low_stock') matchesTab = ing._info.isLow;
      else if (expiryFilterTab === 'safe') matchesTab = ing._info.isSafe;

      const matchesLowCheckbox = showLowStockOnly ? ing._info.isLow : true;

      return matchesSearch && matchesTab && matchesLowCheckbox;
    })
    .sort((a, b) => a._info.minDays - b._info.minDays);

  const headerInfo = FEATURE_TITLES[activeFeature] || FEATURE_TITLES.stock;

  return (
    <div className="inventory-management-container">
      {/* HEADER BAR FOR DEDICATED ROUTE */}
      <header className="inventory-header">
        <div className="header-title-box">
          <h2>{headerInfo.icon} {headerInfo.title}</h2>
          <p>{headerInfo.subtitle}</p>
        </div>
      </header>

      {/* EMERGENCY EXPIRY ALERT BANNERS */}
      {expiredCount > 0 && (
        <div className="expiry-alert-banner critical-banner animate-fade-in">
          <div className="banner-left">
            <div className="banner-icon-box danger-pulse">
              <AlertOctagon size={26} />
            </div>
            <div>
              <h4 className="banner-title">🚨 CẢNH BÁO AN TOÀN VỆ SINH: Có {expiredCount} nguyên liệu ĐÃ QUÁ HẠN SỬ DỤNG!</h4>
              <p className="banner-desc">Các nguyên liệu quá hạn không được phép tiếp tục phục vụ khách hàng. Các món liên quan đã tự động tạm ngưng đặt đơn.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn-banner-action danger-btn ${expiryFilterTab === 'expired' ? 'active-filter' : ''}`}
              onClick={() => setExpiryFilterTab(prev => prev === 'expired' ? 'all' : 'expired')}
            >
              <Filter size={16} /> {expiryFilterTab === 'expired' ? 'Đang lọc hết hạn (Tắt)' : `Lọc ${expiredCount} món hết hạn`}
            </button>
            <button
              className="btn-banner-action"
              style={{ background: '#991b1b', color: '#fff', border: '1px solid #ef4444' }}
              onClick={handleDiscardAllExpired}
            >
              <Trash2 size={16} /> Xuất hủy {expiredCount} lô hết hạn
            </button>
          </div>
        </div>
      )}

      {expiredCount === 0 && expiringSoonCount > 0 && (
        <div className="expiry-alert-banner warning-banner animate-fade-in">
          <div className="banner-left">
            <div className="banner-icon-box warning-box">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="banner-title">⚠️ CHÚ Ý QUẢN LÝ FEFO: Có {expiringSoonCount} nguyên liệu sắp hết hạn trong 7 ngày tới!</h4>
              <p className="banner-desc">Ưu tiên xuất dùng các lô hàng cận date trước theo nguyên tắc FEFO (First Expired, First Out) để tránh lãng phí.</p>
            </div>
          </div>
          <button
            className={`btn-banner-action warning-btn ${expiryFilterTab === 'urgent' ? 'active-filter' : ''}`}
            onClick={() => setExpiryFilterTab(prev => prev === 'urgent' ? 'all' : 'urgent')}
          >
            <Clock size={16} /> {expiryFilterTab === 'urgent' ? 'Đang lọc cận date (Tắt)' : `Xem ${expiringSoonCount} món cận date`}
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* ROUTE 1: TỒN KHO NGUYÊN LIỆU (/admin/inventory/stock) */}
      {/* ==================================================== */}
      {activeFeature === 'stock' && (
        <div className="tab-content-panel">

          {/* QUICK FILTER PILLS */}
          <div className="expiry-filter-pills-container">
            <div className="expiry-filter-pills">
              <button
                className={`pill-btn ${expiryFilterTab === 'all' ? 'active' : ''}`}
                onClick={() => setExpiryFilterTab('all')}
              >
                Tất cả <span className="pill-badge">{ingredients.length}</span>
              </button>

              <button
                className={`pill-btn pill-danger ${expiryFilterTab === 'expired' ? 'active' : ''}`}
                onClick={() => setExpiryFilterTab('expired')}
              >
                <AlertOctagon size={14} />
                Hết hạn
                {expiredCount > 0 && <span className="pill-badge badge-red">{expiredCount}</span>}
              </button>

              <button
                className={`pill-btn pill-urgent ${expiryFilterTab === 'urgent' ? 'active' : ''}`}
                onClick={() => setExpiryFilterTab('urgent')}
              >
                <Clock size={14} />
                Gần hết hạn
                {expiringSoonCount > 0 && <span className="pill-badge badge-orange">{expiringSoonCount}</span>}
              </button>

              <button
                className={`pill-btn pill-warning ${expiryFilterTab === 'low_stock' ? 'active' : ''}`}
                onClick={() => setExpiryFilterTab('low_stock')}
              >
                <AlertTriangle size={14} />
                Gần hết hàng
                {lowStockCount > 0 && <span className="pill-badge badge-amber">{lowStockCount}</span>}
              </button>

              <button
                className={`pill-btn pill-safe ${expiryFilterTab === 'safe' ? 'active' : ''}`}
                onClick={() => setExpiryFilterTab('safe')}
              >
                <CheckCircle size={14} />
                Đủ hàng
                <span className="pill-badge badge-green">{safeCount}</span>
              </button>
            </div>
          </div>

          <div className="panel-actions-bar">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc tên nguyên liệu..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>
            <div className="action-filters">
              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                />
                <span>Chỉ hiện NL gần hết hàng</span>
              </label>
              <button className="btn-primary" onClick={handleOpenAddIng}>
                <Plus size={18} /> Thêm Nguyên Liệu
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: '75px' }}>Mã NL</th>
                  <th style={{ minWidth: '140px' }}>Tên Nguyên Liệu</th>
                  <th style={{ minWidth: '220px' }}>Hạn Sử Dụng (FEFO)</th>
                  <th style={{ minWidth: '110px' }}>Tổng Tồn</th>
                  <th>Ngưỡng</th>
                  <th style={{ minWidth: '130px' }}>Trạng Thái</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6">
                      <EmptyState
                        title="Không tìm thấy nguyên liệu"
                        description={
                          expiryFilterTab === 'expired'
                            ? 'Tuyệt vời! Hiện tại trong kho không có nguyên liệu nào bị quá hạn sử dụng.'
                            : 'Hiện không có nguyên liệu nào khớp với bộ lọc tìm kiếm.'
                        }
                        actionText="Thêm nguyên liệu mới"
                        onAction={handleOpenAddIng}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((ing) => {
                    const info = ing._info;
                    const rowClass = info.isExpired
                      ? 'row-expired'
                      : info.isUrgent
                      ? 'row-urgent'
                      : info.isLow
                      ? 'row-warning'
                      : '';

                    return (
                      <tr key={ing.id} className={rowClass}>
                        <td>
                          <span className="code-badge">{ing.code}</span>
                        </td>
                        <td>
                          <div className="font-semibold text-dark">{ing.name}</div>
                          <small className="text-muted">Đơn vị: <strong>{ing.unit}</strong></small>
                        </td>

                        {/* CỘT HẠN SỬ DỤNG CỤ THỂ */}
                        <td>
                          <div className="expiry-display-box">
                            {/* 📦 HSD Tem nguyên (Seal) */}
                            <div className={`expiry-item-row ${info.isSealedExpired ? 'is-expired' : ''}`}>
                              <div className="expiry-item-left">
                                <span className="expiry-icon">📦</span>
                                <span className="expiry-label">HSD Seal:</span>
                                <strong className="expiry-date-val">{formatDate(ing.expiryDate)}</strong>
                                <span className="expiry-sub-count">({fmtQty(info.sealedCount)} {ing.unit})</span>
                              </div>
                              <div className="expiry-item-right">
                                {info.seDays === null ? (
                                  <span className="badge-fefo-none">Chưa đặt</span>
                                ) : info.seDays < 0 ? (
                                  <span className="badge-fefo-expired">
                                    <span className="pulse-dot-mini red"></span>
                                    <AlertOctagon size={11} /> Hết hạn
                                  </span>
                                ) : info.seDays <= 7 ? (
                                  <span className="badge-fefo-urgent">
                                    <span className="pulse-dot-mini orange"></span>
                                    <Clock size={11} /> Gần hết hạn
                                  </span>
                                ) : (
                                  <span className="badge-fefo-safe">
                                    <Check size={11} /> Còn hạn
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 🍾 HSD Mở nắp (nếu có tồn mở nắp hoặc có ngày mở nắp) */}
                            {(info.openedCount > 0 || ing.openedExpiryDate) && (
                              <div className={`expiry-item-row ${info.isOpenedExpired ? 'is-expired' : ''}`}>
                                <div className="expiry-item-left">
                                  <span className="expiry-icon">🍾</span>
                                  <span className="expiry-label">HSD Mở nắp:</span>
                                  <strong className="expiry-date-val">{formatDate(ing.openedExpiryDate)}</strong>
                                  {info.openedCount > 0 && (
                                    <span className="expiry-sub-count text-amber">({fmtQty(info.openedCount)} {ing.unit} đã mở)</span>
                                  )}
                                </div>
                                <div className="expiry-item-right">
                                  {info.opDays === null ? (
                                    <span className="badge-fefo-none">—</span>
                                  ) : info.opDays < 0 ? (
                                    <span className="badge-fefo-expired">
                                      <span className="pulse-dot-mini red"></span>
                                      <AlertOctagon size={11} /> Hết hạn
                                    </span>
                                  ) : info.opDays <= 7 ? (
                                    <span className="badge-fefo-urgent">
                                      <span className="pulse-dot-mini orange"></span>
                                      <Clock size={11} /> Gần hết hạn
                                    </span>
                                  ) : (
                                    <span className="badge-fefo-safe">
                                      <Check size={11} /> Còn hạn
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* CỘT TỔNG TỒN KHO */}
                        <td>
                          <span className={`stock-amount ${info.isLow ? 'text-danger font-bold' : ''}`}>
                            {fmtQty(ing.currentStock)} <span className="unit-chip">{ing.unit}</span>
                          </span>
                        </td>

                        <td>{fmtQty(ing.minStockAlert)} {ing.unit}</td>

                        {/* CỘT TRẠNG THÁI */}
                        <td>
                          {info.isExpired ? (
                            <div className="status-pill-wrap">
                              <span className="inv-status-pill expired" title="Nguyên liệu đã quá hạn sử dụng!">
                                <span className="inv-status-beacon red"></span>
                                <AlertOctagon size={12} className="inv-status-ico" />
                                <span className="inv-status-text">Hết hạn</span>
                              </span>
                            </div>
                          ) : (info.isUrgent || info.isWarning) ? (
                            <div className="status-pill-wrap">
                              <span className="inv-status-pill urgent" title="Nguyên liệu gần hết hạn">
                                <span className="inv-status-beacon orange"></span>
                                <Clock size={12} className="inv-status-ico" />
                                <span className="inv-status-text">Gần hết hạn</span>
                              </span>
                              {info.isLow && (
                                <span className="inv-micro-pill amber" title="Tồn kho dưới mức cảnh báo">
                                  Gần hết hàng
                                </span>
                              )}
                            </div>
                          ) : info.isLow ? (
                            <div className="status-pill-wrap">
                              <span className="inv-status-pill low-stock" title="Số lượng tồn kho thấp dưới ngưỡng">
                                <span className="inv-status-beacon amber"></span>
                                <AlertTriangle size={12} className="inv-status-ico" />
                                <span className="inv-status-text">Gần hết hàng</span>
                              </span>
                            </div>
                          ) : (
                            <div className="status-pill-wrap">
                              <span className="inv-status-pill safe" title="Tồn kho an toàn & còn hạn sử dụng">
                                <span className="inv-status-beacon green"></span>
                                <CheckCircle size={12} className="inv-status-ico" />
                                <span className="inv-status-text">Đủ hàng</span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* THAO TÁC */}
                        <td>
                          <div className="btn-group-actions">
                            {info.isExpired && (
                              <button
                                className="btn-icon text-danger"
                                title="Xuất hủy lô hết hạn & ghi nhật ký biến động kho"
                                style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fee2e2' }}
                                onClick={() => handleDiscardExpired(ing.id, ing.name)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <button className="btn-icon btn-edit" title="Chỉnh sửa hạn và thông tin" onClick={() => handleOpenEditIng(ing)}>
                              <Edit size={16} />
                            </button>
                            <button className="btn-icon btn-delete" title="Xóa nguyên liệu" onClick={() => handleDeleteIng(ing.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* ==================================================== */}
      {/* ROUTE 2: CÔNG THỨC PHA CHẾ (/admin/inventory/recipes) */}
      {/* ==================================================== */}
      {activeFeature === 'recipes' && (
        <div className="tab-content-panel">
          <div className="recipe-selection-card">
            <label className="field-label">Chọn Món Ăn / Đồ Uống để Cài Đặt Công Thức:</label>
            <select
              className="select-custom"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Chọn món từ danh sách menu --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ({p.category})</option>
              ))}
            </select>
          </div>

          {selectedProductId ? (
            <div className="recipe-editor-container">
              <div className="recipe-servings-banner">
                <div className="servings-info">
                  <ChefHat size={28} className="text-primary" />
                  <div>
                    <h4>Khả năng pha chế ước tính từ kho hiện tại:</h4>
                    <p>Dựa trên định lượng công thức và tồn kho hiện có của các nguyên liệu</p>
                  </div>
                </div>
                <div className="servings-badge">
                  <span className="num">{recipeDetails?.maxServingsAvailable ?? 0}</span>
                  <span className="unit">ly / phần</span>
                </div>
              </div>

              <div className="recipe-items-box">
                <div className="box-header-flex">
                  <h3>Thành Phần Nguyên Liệu & Định Lượng</h3>
                  <button className="btn-secondary" onClick={handleAddRecipeRow}>
                    <Plus size={16} /> Thêm Nguyên Liệu
                  </button>
                </div>

                {recipeItems.length === 0 ? (
                  <div className="empty-recipe-box">
                    <p>Món này chưa khai báo công thức pha chế nào.</p>
                  </div>
                ) : (
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Nguyên Liệu</th>
                        <th>Định Lượng Tiêu Hao (cho 1 món)</th>
                        <th>Đơn Vị tính</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <select
                              className="select-table-input"
                              value={item.ingredientId}
                              onChange={(e) => handleRecipeRowChange(idx, 'ingredientId', e.target.value)}
                            >
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.code} - {ing.name} (Tồn: {fmtQty(ing.currentStock)} {ing.unit})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              className="input-table-num"
                              value={item.quantity}
                              onChange={(e) => handleRecipeRowChange(idx, 'quantity', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="select-table-input"
                              style={{ minWidth: '95px' }}
                              value={item.unit || 'g'}
                              onChange={(e) => handleRecipeRowChange(idx, 'unit', e.target.value)}
                            >
                              <option value="g">g (Gram)</option>
                              <option value="ml">ml (Mili-lít)</option>
                              <option value="kg">kg (Kilogram)</option>
                              <option value="chai">chai</option>
                              <option value="lon">lon</option>
                              <option value="hộp">hộp</option>
                              <option value="gói">gói</option>
                              <option value="l">l (Lít)</option>
                            </select>
                          </td>
                          <td>
                            <button className="btn-icon btn-delete" onClick={() => handleRemoveRecipeRow(idx)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="recipe-save-footer">
                  <button className="btn-primary btn-lg" onClick={handleSaveRecipe}>
                    Lưu Công Thức Pha Chế
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="select-prompt-box">
              <ChefHat size={48} className="prompt-icon" />
              <p>Vui lòng chọn một sản phẩm ở trên để xem và cấu hình công thức nguyên liệu.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* ROUTE 3: PHIẾU NHẬP KHO (/admin/inventory/receipts) */}
      {/* ==================================================== */}
      {activeFeature === 'receipts' && (
        <div className="tab-content-panel">
          <div className="panel-actions-bar">
            <h3>Danh Sách Phiếu Nhập Kho Nguyên Liệu</h3>
            <button className="btn-primary" onClick={() => setShowReceiptModal(true)}>
              <Plus size={18} /> Tạo Phiếu Nhập Kho Mới
            </button>
          </div>

          <div className="table-responsive">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Mã Phiếu Nhập</th>
                  <th>Nhà Cung Cấp</th>
                  <th>Ghi Chú</th>
                  <th>Số Mặt Hàng Nhập</th>
                  <th>Tổng Tiền Nhập</th>
                  <th>Ngày Nhập Kho</th>
                  <th>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-td">Chưa có phiếu nhập kho nào</td>
                  </tr>
                ) : (
                  receipts.map(r => (
                    <tr key={r.id}>
                      <td><span className="code-badge-blue">{r.receiptCode}</span></td>
                      <td><span className="supplier-tag">{r.supplier || 'Không rõ'}</span></td>
                      <td>{r.note || '-'}</td>
                      <td>{r.details?.length || 0} nguyên liệu</td>
                      <td className="font-bold text-emerald">{formatPrice(r.totalAmount)}</td>
                      <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <button className="btn-icon btn-view" onClick={() => setSelectedReceipt(r)}>
                          <Eye size={16} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ROUTE 4: KIỂM KÊ & ĐIỀU CHỈNH (/admin/inventory/adjustments) */}
      {/* ==================================================== */}
      {activeFeature === 'adjustments' && (
        <div className="tab-content-panel">
          <div className="panel-actions-bar">
            <h3>Danh Sách Phiếu Kiểm Kê & Điều Chỉnh Tồn Kho</h3>
            <button className="btn-primary" onClick={() => setShowAdjModal(true)}>
              <Plus size={18} /> Tạo Phiếu Kiểm Kê Mới
            </button>
          </div>

          <div className="table-responsive">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Mã Phiếu Kiểm Kê</th>
                  <th>Lý Do Điều Chỉnh</th>
                  <th>Ghi Chú</th>
                  <th>Số Mặt Hàng Điều Chỉnh</th>
                  <th>Ngày Kiểm Kê</th>
                  <th>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-td">Chưa có phiếu kiểm kê điều chỉnh nào</td>
                  </tr>
                ) : (
                  adjustments.map(a => (
                    <tr key={a.id}>
                      <td><span className="code-badge-amber">{a.adjustmentCode}</span></td>
                      <td><span className="reason-tag">{a.reason}</span></td>
                      <td>{a.note || '-'}</td>
                      <td>{a.details?.length || 0} nguyên liệu</td>
                      <td>{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <button className="btn-icon btn-view" onClick={() => setSelectedAdjustment(a)}>
                          <Eye size={16} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ROUTE 5: NHẬT KÝ BIẾN ĐỘNG KHO (/admin/inventory/logs) */}
      {/* ==================================================== */}
      {activeFeature === 'logs' && (
        <div className="tab-content-panel">
          <div className="panel-actions-bar">
            <div className="filters-row">
              <select
                className="select-custom"
                value={logFilterIng}
                onChange={(e) => setLogFilterIng(e.target.value)}
              >
                <option value="">-- Tất cả Nguyên Liệu --</option>
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
                ))}
              </select>

              <select
                className="select-custom"
                value={logFilterType}
                onChange={(e) => setLogFilterType(e.target.value)}
              >
                <option value="">-- Tất cả loại biến động --</option>
                <option value="IMPORT">Nhập kho (IMPORT)</option>
                <option value="EXPORT_PREPARATION">Trừ kho pha chế (EXPORT_PREPARATION)</option>
                <option value="ADJUSTMENT">Điều chỉnh kiểm kê (ADJUSTMENT)</option>
                <option value="RETURN">Hoàn trả kho (RETURN)</option>
                <option value="EXPIRED_DISCARD">Xuất hủy hết hạn (EXPIRED_DISCARD)</option>
              </select>

              <button className="btn-secondary" onClick={fetchTransactions}>
                <RefreshCw size={16} /> Tải lại
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Mã NL</th>
                  <th>Tên Nguyên Liệu</th>
                  <th>Loại Biến Động</th>
                  <th>Biến Động</th>
                  <th>Tồn Trước</th>
                  <th>Tồn Sau</th>
                  <th>Mã Chứng Từ</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table-td">Chưa có nhật ký biến động kho nào</td>
                  </tr>
                ) : (
                  transactions.map(t => {
                    const isPositive = t.quantity > 0;
                    return (
                      <tr key={t.id}>
                        <td>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                        <td><span className="code-badge">{t.ingredient?.code}</span></td>
                        <td className="font-semibold">{t.ingredient?.name}</td>
                        <td>
                          {t.type === 'IMPORT' && <span className="type-badge badge-import">Nhập kho</span>}
                          {t.type === 'EXPORT_PREPARATION' && <span className="type-badge badge-export">Pha chế món</span>}
                          {t.type === 'ADJUSTMENT' && <span className="type-badge badge-adj">Kiểm kê</span>}
                          {t.type === 'RETURN' && <span className="type-badge badge-return">Hoàn đơn</span>}
                          {t.type === 'EXPIRED_DISCARD' && <span className="type-badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171' }}>🗑️ Xuất hủy hết hạn</span>}
                        </td>
                        <td>
                          <span className={`qty-change ${isPositive ? 'text-emerald font-bold' : 'text-danger font-bold'}`}>
                            {isPositive ? `+${fmtQty(t.quantity)}` : fmtQty(t.quantity)} {t.ingredient?.unit}
                          </span>
                        </td>
                        <td>{fmtQty(t.stockBefore)} {t.ingredient?.unit}</td>
                        <td className="font-semibold">{fmtQty(t.stockAfter)} {t.ingredient?.unit}</td>
                        <td><code className="ref-code">{t.referenceCode || '-'}</code></td>
                        <td>{t.note || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: THÊM / SỬA NGUYÊN LIỆU */}
      {/* ==================================================== */}
      {showIngModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingIng ? 'Chỉnh Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}</h3>
              <button className="btn-close" onClick={() => setShowIngModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveIng}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mã Nguyên Liệu (*)</label>
                  <input
                    type="text"
                    required
                    value={ingForm.code}
                    disabled={!!editingIng}
                    onChange={(e) => setIngForm({ ...ingForm, code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tên Nguyên Liệu (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cà phê hạt Arabica, Sữa tươi Vinamilk..."
                    value={ingForm.name}
                    onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Đơn Vị Tính (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="chai, kg, lon, hộp..."
                      value={ingForm.unit}
                      onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    />

                  </div>
                  <div className="form-group">
                    <label>Ngưỡng Cảnh Báo Sắp Hết (*)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={ingForm.minStockAlert}
                      onChange={(e) => setIngForm({ ...ingForm, minStockAlert: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Tồn Kho Khởi Tạo</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={!!editingIng}
                      value={ingForm.currentStock}
                      onChange={(e) => setIngForm({ ...ingForm, currentStock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá Vốn Trung Bình / Đơn Vị (VNĐ)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={ingForm.costPrice}
                      onChange={(e) => setIngForm({ ...ingForm, costPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📦 Hạn Dùng Tem Nguyên (Seal)</span>
                      {ingForm.expiryDate && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {getDaysUntilExpiry(ingForm.expiryDate) < 0 ? (
                            <span style={{ color: '#dc2626' }}>⛔ Đã quá hạn {Math.abs(getDaysUntilExpiry(ingForm.expiryDate))} ngày</span>
                          ) : getDaysUntilExpiry(ingForm.expiryDate) === 0 ? (
                            <span style={{ color: '#d97706' }}>⚠️ Hết hạn hôm nay</span>
                          ) : (
                            <span style={{ color: '#16a34a' }}>✅ Còn {getDaysUntilExpiry(ingForm.expiryDate)} ngày ({formatDate(ingForm.expiryDate)})</span>
                          )}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={ingForm.expiryDate || ''}
                      onChange={(e) => setIngForm({ ...ingForm, expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🍾 Hạn Dùng Sau Mở Nắp (Opened)</span>
                      {ingForm.openedExpiryDate && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {getDaysUntilExpiry(ingForm.openedExpiryDate) < 0 ? (
                            <span style={{ color: '#dc2626' }}>⛔ Quá hạn {Math.abs(getDaysUntilExpiry(ingForm.openedExpiryDate))} ngày</span>
                          ) : getDaysUntilExpiry(ingForm.openedExpiryDate) === 0 ? (
                            <span style={{ color: '#d97706' }}>⚠️ Hết hạn hôm nay</span>
                          ) : (
                            <span style={{ color: '#16a34a' }}>✅ Còn {getDaysUntilExpiry(ingForm.openedExpiryDate)} ngày ({formatDate(ingForm.openedExpiryDate)})</span>
                          )}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={ingForm.openedExpiryDate || ''}
                      onChange={(e) => setIngForm({ ...ingForm, openedExpiryDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Số Lượng Đã Mở Nắp Đang Dùng ({ingForm.unit})</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ingForm.openedStock || 0}
                    onChange={(e) => setIngForm({ ...ingForm, openedStock: Number(e.target.value) })}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Số lượng này sẽ được ưu tiên theo dõi hạn dùng sau mở nắp theo nguyên tắc FEFO.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowIngModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Nguyên Liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TẠO PHIẾU NHẬP KHO (HIỆN ĐẠI) */}
      {/* ==================================================== */}
      <CreateStockReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSave={handleSaveReceiptModal}
        ingredients={ingredients}
        submitting={submittingReceipt}
      />

      {/* ==================================================== */}
      {/* MODAL: TẠO PHIẾU KIỂM KÊ / ĐIỀU CHỈNH KHO */}
      {/* ==================================================== */}
      {showAdjModal && (
        <div className="aodm-overlay" onClick={() => setShowAdjModal(false)}>
          <div className="aodm-panel" style={{ maxWidth: '860px', maxHeight: 'calc(100vh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
            {/* ── Header ── */}
            <div className="aodm-header">
              <div className="aodm-header-left">
                <div className="aodm-header-icon" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                  <FileDiff size={20} />
                </div>
                <div>
                  <p className="aodm-eyebrow">Quản lý tồn kho nguyên liệu</p>
                  <h2 className="aodm-title">Tạo Phiếu Kiểm Kê & Điều Chỉnh Kho</h2>
                  <p className="aodm-date">
                    <CalendarDays size={12} />
                    Đối soát tồn sổ sách vs tồn thực tế & ghi nhận chênh lệch
                  </p>
                </div>
              </div>
              <div className="aodm-header-right">
                <span className="aodm-status-badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <span className="aodm-status-dot" style={{ background: '#d97706' }} />
                  Phiếu mới
                </span>
                <button className="aodm-close-btn" onClick={() => setShowAdjModal(false)} title="Đóng">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <form id="create-adj-form" onSubmit={handleSaveAdjustment} className="aodm-body">
              {/* Section 1: Thông tin phiếu */}
              <div className="aodm-section">
                <p className="aodm-section-label">
                  <Filter size={13} /> Lý do & Ghi chú kiểm kê
                </p>
                <div className="aodm-info-grid">
                  <div className="aodm-info-cell">
                    <label className="aodm-info-label">Lý Do Điều Chỉnh (*)</label>
                    <select
                      className="aodm-select"
                      value={adjForm.reason}
                      onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                    >
                      <option value="Kiểm kê định kỳ">Kiểm kê định kỳ</option>
                      <option value="Hàng bị hư hỏng / hỏng hóc">Hàng bị hư hỏng / hỏng hóc</option>
                      <option value="Hết hạn sử dụng">Hết hạn sử dụng</option>
                      <option value="Sai lệch ghi nhận ban đầu">Sai lệch ghi nhận ban đầu</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="aodm-info-cell">
                    <label className="aodm-info-label">Ghi Chú Chi Tiết</label>
                    <input
                      type="text"
                      placeholder="Diễn giải thêm về đợt kiểm kê này..."
                      className="aodm-input"
                      value={adjForm.note}
                      onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Danh sách nguyên liệu kiểm kê */}
              <div className="aodm-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p className="aodm-section-label" style={{ margin: 0 }}>
                    <Boxes size={13} /> Danh sách nguyên liệu kiểm kê ({adjForm.items.length} dòng)
                  </p>
                  <button type="button" className="aodm-receipt-add-btn" onClick={handleAddAdjRow}>
                    <Plus size={13} /> Thêm dòng
                  </button>
                </div>

                <div className="aodm-receipt-table-wrap">
                  <table className="aodm-receipt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '32%' }}>Nguyên Liệu</th>
                        <th style={{ width: '16%' }}>Tồn Hệ Thống</th>
                        <th style={{ width: '18%' }}>Tồn Thực Tế Kiểm Đếm</th>
                        <th style={{ width: '14%' }}>Chênh Lệch</th>
                        <th style={{ width: '16%' }}>Ghi Chú Dòng</th>
                        <th style={{ width: '40px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjForm.items.map((row, idx) => {
                        const targetIng = ingredients.find(i => String(i.id) === String(row.ingredientId));
                        const systemStock = targetIng ? targetIng.currentStock : 0;
                        const diff = (row.actualStock || 0) - systemStock;

                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                className="aodm-select"
                                value={row.ingredientId}
                                required
                                onChange={(e) => handleAdjRowChange(idx, 'ingredientId', e.target.value)}
                              >
                                <option value="">-- Chọn NL --</option>
                                {ingredients.map(i => (
                                  <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ fontWeight: 600, color: '#374151' }}>{fmtQty(systemStock)} {targetIng?.unit}</td>
                            <td>
                              <div className="aodm-input-affix-wrap">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  required
                                  placeholder="0"
                                  className="aodm-input"
                                  value={row.actualStock}
                                  onChange={(e) => handleAdjRowChange(idx, 'actualStock', e.target.value)}
                                />
                                <span className="aodm-input-affix">{targetIng?.unit || ''}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`diff-tag ${diff > 0 ? 'text-emerald' : diff < 0 ? 'text-danger' : ''}`}>
                                {diff > 0 ? `+${fmtQty(diff)}` : fmtQty(diff)}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Ghi chú..."
                                className="aodm-input"
                                value={row.note || ''}
                                onChange={(e) => handleAdjRowChange(idx, 'note', e.target.value)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button type="button" className="aodm-row-del-btn" onClick={() => handleRemoveAdjRow(idx)} title="Xóa dòng">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Tóm tắt */}
              <div className="aodm-payment-box">
                <div className="aodm-payment-row">
                  <span><Boxes size={13} /> Số nguyên liệu kiểm kê</span>
                  <span>{adjForm.items.length} nguyên liệu</span>
                </div>
                <div className="aodm-payment-row">
                  <span><TrendingUp size={13} /> Tổng chênh lệch</span>
                  <span>
                    {adjForm.items.reduce((sum, row) => {
                      const ing = ingredients.find(i => String(i.id) === String(row.ingredientId));
                      const sys = ing ? ing.currentStock : 0;
                      return sum + ((row.actualStock || 0) - sys);
                    }, 0).toFixed(2)} đơn vị
                  </span>
                </div>
              </div>
            </form>

            {/* ── Footer ── */}
            <div className="aodm-footer">
              <div className="aodm-footer-left">
                <CheckCircle size={14} className="text-stone-400" />
                <p className="aodm-footer-note">
                  Tồn kho sẽ được cập nhật theo số lượng thực tế sau khi xác nhận kiểm kê.
                </p>
              </div>
              <div className="aodm-footer-actions">
                <button type="button" className="aodm-btn-cancel" onClick={() => setShowAdjModal(false)}>Hủy</button>
                <button type="submit" form="create-adj-form" className="aodm-btn-submit">
                  <CheckCircle size={15} /> Xác Nhận Kiểm Kê & Điều Chỉnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU NHẬP KHO (HIỆN ĐẠI) */}
      {/* ==================================================== */}
      <StockReceiptDetailModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* ==================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU ĐIỀU CHỈNH */}
      {/* ==================================================== */}
      {selectedAdjustment && (
        <div className="aodm-overlay" onClick={() => setSelectedAdjustment(null)}>
          <div className="aodm-panel" style={{ maxWidth: '860px', maxHeight: 'calc(100vh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
            {/* ── Header ── */}
            <div className="aodm-header">
              <div className="aodm-header-left">
                <div className="aodm-header-icon" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                  <FileDiff size={20} />
                </div>
                <div>
                  <p className="aodm-eyebrow">Chi tiết phiếu kiểm kê & điều chỉnh</p>
                  <h2 className="aodm-title">{selectedAdjustment.adjustmentCode}</h2>
                  <p className="aodm-date">
                    <Calendar size={12} />
                    {new Date(selectedAdjustment.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="aodm-header-right">
                <span className="aodm-status-badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <span className="aodm-status-dot" style={{ background: '#d97706' }} />
                  Đã điều chỉnh
                </span>
                <button className="aodm-close-btn" onClick={() => setSelectedAdjustment(null)} title="Đóng">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="aodm-body">
              {/* Section 1: Thông tin phiếu */}
              <div className="aodm-section">
                <p className="aodm-section-label">
                  <Filter size={13} /> Thông tin phiếu kiểm kê
                </p>
                <div className="aodm-info-grid">
                  <div className="aodm-info-cell">
                    <span className="aodm-info-label">Lý do điều chỉnh</span>
                    <span className="reason-tag" style={{ display: 'inline-block', marginTop: '4px' }}>{selectedAdjustment.reason}</span>
                  </div>
                  <div className="aodm-info-cell">
                    <span className="aodm-info-label">Số nguyên liệu điều chỉnh</span>
                    <span className="aodm-info-value" style={{ fontWeight: 700 }}>{selectedAdjustment.details?.length || 0} nguyên liệu</span>
                  </div>
                  <div className="aodm-info-cell aodm-info-cell--full">
                    <span className="aodm-info-label">Ghi chú</span>
                    <span className="aodm-info-value">{selectedAdjustment.note || 'Không có ghi chú thêm.'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Chi tiết nguyên liệu */}
              <div className="aodm-section">
                <p className="aodm-section-label">
                  <Boxes size={13} /> Chi tiết nguyên liệu kiểm kê ({selectedAdjustment.details?.length || 0} dòng)
                </p>
                <div className="aodm-receipt-table-wrap">
                  <table className="aodm-receipt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Mã NL</th>
                        <th style={{ width: '28%' }}>Tên Nguyên Liệu</th>
                        <th style={{ width: '16%', textAlign: 'right' }}>Tồn Sổ Sách</th>
                        <th style={{ width: '16%', textAlign: 'right' }}>Tồn Thực Tế</th>
                        <th style={{ width: '14%', textAlign: 'right' }}>Chênh Lệch</th>
                        <th style={{ width: '14%' }}>Ghi Chú Dòng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAdjustment.details?.map(d => (
                        <tr key={d.id}>
                          <td>
                            <span
                              className="aodm-status-badge aodm-status--stone"
                              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                            >
                              {d.ingredient?.code || `#${d.ingredientId}`}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.ingredient?.name}</td>
                          <td style={{ textAlign: 'right', color: '#64748b' }}>{fmtQty(d.systemStock)} {d.ingredient?.unit}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtQty(d.actualStock)} {d.ingredient?.unit}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`diff-tag ${d.adjustmentQuantity > 0 ? 'text-emerald' : d.adjustmentQuantity < 0 ? 'text-danger' : ''}`}>
                              {d.adjustmentQuantity > 0 ? `+${fmtQty(d.adjustmentQuantity)}` : fmtQty(d.adjustmentQuantity)} {d.ingredient?.unit}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{d.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Tổng kết */}
              <div className="aodm-payment-box">
                <div className="aodm-payment-row">
                  <span><Boxes size={13} /> Số nguyên liệu điều chỉnh</span>
                  <span>{selectedAdjustment.details?.length || 0} loại</span>
                </div>
                <div className="aodm-payment-divider" />
                <div className="aodm-payment-row aodm-payment-total">
                  <span><TrendingUp size={15} /> Tổng chênh lệch tuyệt đối</span>
                  <span>
                    {selectedAdjustment.details?.reduce((sum, d) => sum + Math.abs(d.adjustmentQuantity || 0), 0).toFixed(2)} đơn vị
                  </span>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="aodm-footer">
              <div className="aodm-footer-left">
                <CheckCircle size={14} className="text-stone-400" />
                <p className="aodm-footer-note">
                  Phiếu kiểm kê đã được ghi nhận và tồn kho đã được cập nhật theo số thực tế.
                </p>
              </div>
              <div className="aodm-footer-actions">
                <button type="button" className="aodm-btn-cancel" onClick={() => setSelectedAdjustment(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
