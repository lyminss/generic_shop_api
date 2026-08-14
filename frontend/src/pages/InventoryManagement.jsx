import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Boxes,
  ChefHat,
  FilePlus2,
  FileDiff,
  History,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  X
} from 'lucide-react';
import {
  ingredientService,
  recipeService,
  productService,
  stockReceiptService,
  stockAdjustmentService,
  inventoryTransactionService
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import './InventoryManagement.css';

const getActiveFeatureFromPath = (pathname) => {
  if (pathname.includes('/recipes')) return 'recipes';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/adjustments')) return 'adjustments';
  if (pathname.includes('/logs')) return 'logs';
  return 'stock';
};

const FEATURE_TITLES = {
  stock: {
    title: 'Tồn Kho Nguyên Liệu',
    subtitle: 'Theo dõi số lượng tồn, ngưỡng cảnh báo và giá vốn trung bình từng nguyên liệu',
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
  const [stockSearch, setStockSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showIngModal, setShowIngModal] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [ingForm, setIngForm] = useState({
    code: '',
    name: '',
    unit: 'g',
    currentStock: 0,
    minStockAlert: 100,
    costPrice: 0,
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
    try {
      const res = await ingredientService.getAll();
      setIngredients(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách nguyên liệu');
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
    setIngForm({
      code: `NL${String(ingredients.length + 1).padStart(3, '0')}`,
      name: '',
      unit: 'g',
      currentStock: 0,
      minStockAlert: 100,
      costPrice: 0,
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

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplier: receiptForm.supplier,
        note: receiptForm.note,
        items: receiptForm.items.map(item => ({
          ingredientId: Number(item.ingredientId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      };
      await stockReceiptService.create(payload);
      toast.success('Tạo phiếu nhập kho thành công!');
      setShowReceiptModal(false);
      setReceiptForm({ supplier: '', note: '', items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }] });
      fetchReceipts();
      fetchIngredients();
    } catch (err) {
      toast.error(err.response?.data || 'Lỗi khi tạo phiếu nhập kho');
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
  // COMPUTED STATS
  // ----------------------------------------------------
  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStockAlert).length;
  const totalStockValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPrice), 0);

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          ing.code.toLowerCase().includes(stockSearch.toLowerCase());
    const matchesLow = showLowStockOnly ? ing.currentStock <= ing.minStockAlert : true;
    return matchesSearch && matchesLow;
  });

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

      {/* STATS OVERVIEW CARDS */}
      <div className="inventory-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue">
            <Boxes className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng loại nguyên liệu</span>
            <span className="stat-value">{ingredients.length} <small>mặt hàng</small></span>
          </div>
        </div>

        <div className={`stat-card ${lowStockCount > 0 ? 'warning-card' : ''}`}>
          <div className="stat-icon-wrapper bg-amber">
            <AlertTriangle className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Cảnh báo sắp hết</span>
            <span className="stat-value text-amber">{lowStockCount} <small>nguyên liệu</small></span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-emerald">
            <TrendingUp className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ước tính giá trị kho</span>
            <span className="stat-value text-emerald">{formatPrice(totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* ROUTE 1: TỒN KHO NGUYÊN LIỆU (/admin/inventory/stock) */}
      {/* ==================================================== */}
      {activeFeature === 'stock' && (
        <div className="tab-content-panel">
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
                <span>Chỉ hiện NL sắp hết</span>
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
                  <th>Mã NL</th>
                  <th>Tên Nguyên Liệu</th>
                  <th>Đơn Vị</th>
                  <th>Tồn Kho Hiện Tại</th>
                  <th>Ngưỡng Cảnh Báo</th>
                  <th>Giá Vốn TB / Đơn vị</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-td">Không tìm thấy nguyên liệu nào</td>
                  </tr>
                ) : (
                  filteredIngredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.minStockAlert;
                    return (
                      <tr key={ing.id} className={isLow ? 'row-warning' : ''}>
                        <td><span className="code-badge">{ing.code}</span></td>
                        <td className="font-semibold">{ing.name}</td>
                        <td><span className="unit-chip">{ing.unit}</span></td>
                        <td>
                          <span className={`stock-amount ${isLow ? 'text-danger font-bold' : ''}`}>
                            {ing.currentStock.toLocaleString('vi-VN')} {ing.unit}
                          </span>
                        </td>
                        <td>{ing.minStockAlert.toLocaleString('vi-VN')} {ing.unit}</td>
                        <td>{formatPrice(ing.costPrice)} / {ing.unit}</td>
                        <td>
                          {isLow ? (
                            <span className="status-badge badge-warning">
                              <AlertTriangle size={14} /> Sắp hết hàng
                            </span>
                          ) : (
                            <span className="status-badge badge-success">
                              <CheckCircle size={14} /> Tồn an toàn
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group-actions">
                            <button className="btn-icon btn-edit" title="Chỉnh sửa" onClick={() => handleOpenEditIng(ing)}>
                              <Edit size={16} />
                            </button>
                            <button className="btn-icon btn-delete" title="Xóa" onClick={() => handleDeleteIng(ing.id)}>
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
                                  {ing.code} - {ing.name} (Tồn: {ing.currentStock} {ing.unit})
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
                            <span className="unit-chip">{item.unit || 'g'}</span>
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
                  <th>Tổng Tiền Nhập</th>
                  <th>Ghi Chú</th>
                  <th>Ngày Nhập Kho</th>
                  <th>Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-td">Chưa có phiếu nhập kho nào</td>
                  </tr>
                ) : (
                  receipts.map(r => (
                    <tr key={r.id}>
                      <td><span className="code-badge-blue">{r.receiptCode}</span></td>
                      <td className="font-semibold">{r.supplier || 'Không rõ'}</td>
                      <td className="font-bold text-emerald">{formatPrice(r.totalAmount)}</td>
                      <td>{r.note || '-'}</td>
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
                        </td>
                        <td>
                          <span className={`qty-change ${isPositive ? 'text-emerald font-bold' : 'text-danger font-bold'}`}>
                            {isPositive ? `+${t.quantity}` : t.quantity} {t.ingredient?.unit}
                          </span>
                        </td>
                        <td>{t.stockBefore} {t.ingredient?.unit}</td>
                        <td className="font-semibold">{t.stockAfter} {t.ingredient?.unit}</td>
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
                      placeholder="g, ml, kg, lon, hộp..."
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
      {/* MODAL: TẠO PHIẾU NHẬP KHO */}
      {/* ==================================================== */}
      {showReceiptModal && (
        <div className="modal-backdrop modal-lg">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Tạo Phiếu Nhập Kho Nguyên Liệu Mới</h3>
              <button className="btn-close" onClick={() => setShowReceiptModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveReceipt}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Nhà Cung Cấp</label>
                    <input
                      type="text"
                      placeholder="Tên nhà cung cấp / Nguồn nhập..."
                      value={receiptForm.supplier}
                      onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ghi Chú Phiếu Nhập</label>
                    <input
                      type="text"
                      placeholder="Ghi chú thêm..."
                      value={receiptForm.note}
                      onChange={(e) => setReceiptForm({ ...receiptForm, note: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-table-section">
                  <div className="section-head-flex">
                    <h4>Danh Sách Nguyên Liệu Nhập</h4>
                    <button type="button" className="btn-secondary" onClick={handleAddReceiptRow}>
                      <Plus size={16} /> Thêm Dòng
                    </button>
                  </div>

                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Nguyên Liệu</th>
                        <th>Số Lượng Nhập</th>
                        <th>Đơn Giá Nhập (VNĐ)</th>
                        <th>Thành Tiền (VNĐ)</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptForm.items.map((row, idx) => {
                        const total = (row.quantity || 0) * (row.unitPrice || 0);
                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                className="select-table-input"
                                value={row.ingredientId}
                                required
                                onChange={(e) => handleReceiptRowChange(idx, 'ingredientId', e.target.value)}
                              >
                                <option value="">-- Chọn NL --</option>
                                {ingredients.map(i => (
                                  <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                className="input-table-num"
                                value={row.quantity}
                                onChange={(e) => handleReceiptRowChange(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                className="input-table-num"
                                value={row.unitPrice}
                                onChange={(e) => handleReceiptRowChange(idx, 'unitPrice', e.target.value)}
                              />
                            </td>
                            <td className="font-bold text-emerald">{formatPrice(total)}</td>
                            <td>
                              <button type="button" className="btn-icon btn-delete" onClick={() => handleRemoveReceiptRow(idx)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowReceiptModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo Phiếu Nhập Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TẠO PHIẾU KIỂM KÊ / ĐIỀU CHỈNH KHO */}
      {/* ==================================================== */}
      {showAdjModal && (
        <div className="modal-backdrop modal-lg">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Tạo Phiếu Kiểm Kê & Điều Chỉnh Kho</h3>
              <button className="btn-close" onClick={() => setShowAdjModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Lý Do Điều Chỉnh (*)</label>
                    <select
                      className="select-custom"
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
                  <div className="form-group">
                    <label>Ghi Chú Chi Tiết</label>
                    <input
                      type="text"
                      placeholder="Diễn giải thêm..."
                      value={adjForm.note}
                      onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-table-section">
                  <div className="section-head-flex">
                    <h4>Danh Sách Nguyên Liệu Kiểm Kê</h4>
                    <button type="button" className="btn-secondary" onClick={handleAddAdjRow}>
                      <Plus size={16} /> Thêm Dòng
                    </button>
                  </div>

                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Nguyên Liệu</th>
                        <th>Tồn Hệ Thống</th>
                        <th>Tồn Thực Tế Kiểm Đếm</th>
                        <th>Chênh Lệch (+/-)</th>
                        <th>Ghi Chú Dòng</th>
                        <th>Xóa</th>
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
                                className="select-table-input"
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
                            <td className="font-semibold">{systemStock} {targetIng?.unit}</td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                className="input-table-num"
                                value={row.actualStock}
                                onChange={(e) => handleAdjRowChange(idx, 'actualStock', e.target.value)}
                              />
                            </td>
                            <td>
                              <span className={`diff-tag ${diff > 0 ? 'text-emerald' : diff < 0 ? 'text-danger' : ''}`}>
                                {diff > 0 ? `+${diff}` : diff} {targetIng?.unit}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Ghi chú..."
                                className="input-table-text"
                                value={row.note || ''}
                                onChange={(e) => handleAdjRowChange(idx, 'note', e.target.value)}
                              />
                            </td>
                            <td>
                              <button type="button" className="btn-icon btn-delete" onClick={() => handleRemoveAdjRow(idx)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdjModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Xác Nhận Kiểm Kê & Điều Chỉnh</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU NHẬP KHO */}
      {/* ==================================================== */}
      {selectedReceipt && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chi Tiết Phiếu Nhập Kho: <span className="text-primary">{selectedReceipt.receiptCode}</span></h3>
              <button className="btn-close" onClick={() => setSelectedReceipt(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-meta-grid">
                <p><strong>Nhà cung cấp:</strong> {selectedReceipt.supplier || 'Không rõ'}</p>
                <p><strong>Ngày nhập:</strong> {new Date(selectedReceipt.createdAt).toLocaleString('vi-VN')}</p>
                <p><strong>Ghi chú:</strong> {selectedReceipt.note || '-'}</p>
                <p><strong>Tổng tiền nhập:</strong> <span className="text-emerald font-bold">{formatPrice(selectedReceipt.totalAmount)}</span></p>
              </div>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Mã NL</th>
                    <th>Tên Nguyên Liệu</th>
                    <th>Số Lượng Nhập</th>
                    <th>Đơn Giá Nhập</th>
                    <th>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceipt.details?.map(d => (
                    <tr key={d.id}>
                      <td><span className="code-badge">{d.ingredient?.code}</span></td>
                      <td className="font-semibold">{d.ingredient?.name}</td>
                      <td>{d.quantity} {d.ingredient?.unit}</td>
                      <td>{formatPrice(d.unitPrice)}</td>
                      <td className="font-bold text-emerald">{formatPrice(d.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedReceipt(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU ĐIỀU CHỈNH */}
      {/* ==================================================== */}
      {selectedAdjustment && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chi Tiết Phiếu Kiểm Kê: <span className="text-amber">{selectedAdjustment.adjustmentCode}</span></h3>
              <button className="btn-close" onClick={() => setSelectedAdjustment(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-meta-grid">
                <p><strong>Lý do điều chỉnh:</strong> <span className="reason-tag">{selectedAdjustment.reason}</span></p>
                <p><strong>Ngày lập phiếu:</strong> {new Date(selectedAdjustment.createdAt).toLocaleString('vi-VN')}</p>
                <p><strong>Ghi chú:</strong> {selectedAdjustment.note || '-'}</p>
              </div>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Mã NL</th>
                    <th>Tên Nguyên Liệu</th>
                    <th>Tồn Sổ Sách</th>
                    <th>Tồn Thực Tế</th>
                    <th>Chênh Lệch</th>
                    <th>Ghi Chú Dòng</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAdjustment.details?.map(d => (
                    <tr key={d.id}>
                      <td><span className="code-badge">{d.ingredient?.code}</span></td>
                      <td className="font-semibold">{d.ingredient?.name}</td>
                      <td>{d.systemStock} {d.ingredient?.unit}</td>
                      <td className="font-bold">{d.actualStock} {d.ingredient?.unit}</td>
                      <td>
                        <span className={`diff-tag ${d.adjustmentQuantity > 0 ? 'text-emerald' : d.adjustmentQuantity < 0 ? 'text-danger' : ''}`}>
                          {d.adjustmentQuantity > 0 ? `+${d.adjustmentQuantity}` : d.adjustmentQuantity} {d.ingredient?.unit}
                        </span>
                      </td>
                      <td>{d.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedAdjustment(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
