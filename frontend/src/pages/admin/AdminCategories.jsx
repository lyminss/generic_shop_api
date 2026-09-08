import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  List,
  UtensilsCrossed,
  FolderPlus,
  Loader2,
  Info,
} from 'lucide-react';
import { categoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton, EmptyState } from '../../components/common/StateViews';
import AdminCategoryModal from './components/AdminCategoryModal';
import './AdminCategories.css';

const CAT_ICONS = {
  'Trà Sữa': '🧋',
  'Cà Phê': '☕',
  'Trà Trái Cây': '🍵',
  'Đá Xay': '🧊',
  'Topping': '✨',
  'Sinh Tố': '🥤',
};

const getCategoryIcon = (name) => {
  if (!name) return '📂';
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🍵';
};

const AdminCategories = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'grid'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Modal for Hide/Show
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll();
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Modal
  const openAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setShowModal(true);
  };

  // Submit Add / Edit
  const handleSaveCategory = async (catData) => {
    if (!catData.name?.trim()) {
      toast.error('Tên danh mục không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: catData.name.trim(),
        description: catData.description,
        image: catData.image,
        displayOrder: Number(catData.displayOrder) || 0,
        active: catData.active,
      };

      if (editingCategory) {
        await categoryService.update(editingCategory.id, payload);
        toast.success(`Đã cập nhật danh mục "${payload.name}"`);
      } else {
        await categoryService.create(payload);
        toast.success(`Đã thêm danh mục mới "${payload.name}"`);
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Hide / Show with Cascade
  const handleToggleClick = (cat) => {
    setConfirmToggle(cat);
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    setToggling(true);
    try {
      const res = await categoryService.toggleActive(confirmToggle.id);
      toast.success(res.data?.message || 'Đã thay đổi trạng thái danh mục');
      setConfirmToggle(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể đổi trạng thái danh mục');
    } finally {
      setToggling(false);
    }
  };

  // Delete Category
  const handleDelete = async (cat) => {
    if (cat.productCount > 0) {
      alert(`Không thể xóa danh mục "${cat.name}" vì đang chứa ${cat.productCount} món ăn. Hãy chuyển các món sang danh mục khác hoặc ẩn danh mục thay vì xóa!`);
      return;
    }

    if (!window.confirm(`Xác nhận xóa vĩnh viễn danh mục "${cat.name}"?`)) return;

    try {
      await categoryService.delete(cat.id);
      toast.success(`Đã xóa danh mục "${cat.name}"`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Không thể xóa danh mục');
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
  });

  const activeCount = categories.filter((c) => c.active).length;
  const hiddenCount = categories.filter((c) => !c.active).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  return (
    <div className="admin-tab-content animate-fade-in">
      {/* ── Hero Banner ── */}
      <div className="admin-hero-banner">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider rounded-full border border-amber-500/30 mb-2.5">
            <Sparkles size={13} /> Phân loại & Hiển thị thực đơn
          </div>
          <h1 className="admin-hero-title">Quản Lý Danh Mục</h1>
          <p className="admin-hero-subtitle">
            Thiết lập danh mục món ăn, kiểm soát hiển thị trên menu và tự động chuyển các món sang trạng thái "Ngừng bán" khi ẩn danh mục.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAdd}
            className="stats-action-btn"
            style={{ background: '#d97706', color: '#ffffff' }}
          >
            <Plus size={17} /> Thêm Danh Mục Mới
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="stats-cards-grid">
        {/* Card 1: Tổng danh mục */}
        <div className="stat-tile accent-taro flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng danh mục</p>
            <div className="icon-tile ml-2">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{categories.length}</h3>
            <div className="stats-card-caption">Nhóm phân loại đồ uống</div>
          </div>
        </div>

        {/* Card 2: Đang hiển thị */}
        <div className="stat-tile accent-matcha flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Đang hiển thị</p>
            <div className="icon-tile ml-2">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{activeCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Hiển thị trên menu</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Đang ẩn */}
        <div className="stat-tile accent-caramel flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Đang tạm ẩn</p>
            <div className="icon-tile ml-2">
              <EyeOff size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{hiddenCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Món bị ngừng bán</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Tạm đóng
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Tổng số món */}
        <div className="stat-tile accent-teal flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Món trực thuộc</p>
            <div className="icon-tile ml-2">
              <UtensilsCrossed size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{totalProducts}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Tổng đồ uống được gán</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Phân bổ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Utility Filter Bar ── */}
      <div className="admin-utility-bar">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1">
            Tổng cộng {categories.length} nhóm món
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="admin-search-input-group">
            <Search size={15} className="text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục theo tên hoặc mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="view-mode-toggle" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`view-mode-btn ${view === 'table' ? 'active' : ''}`}
              title="Dạng bảng"
            >
              <List size={15} /> Bảng
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`view-mode-btn ${view === 'grid' ? 'active' : ''}`}
              title="Dạng lưới"
            >
              <LayoutGrid size={15} /> Lưới
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {view === 'grid' ? (
        <div className="prod-grid-layout">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cat-card animate-pulse">
                <div className="skeleton-line w-12 h-12 rounded-2xl mb-4" />
                <div className="skeleton-line w-2/3 h-5 mb-2 rounded-lg" />
                <div className="skeleton-line w-full h-3 mb-1 rounded" />
                <div className="skeleton-line w-1/2 h-3 mb-4 rounded" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full stats-bento-panel py-20 text-center">
              <EmptyState
                title="Chưa có danh mục nào phù hợp"
                description="Thêm danh mục mới để tổ chức thực đơn đồ uống của quán."
                actionText="Thêm danh mục"
                onAction={openAdd}
              />
            </div>
          ) : (
            filtered.map((c) => {
              const icon = getCategoryIcon(c.name);
              return (
                <div key={c.id} className={`cat-card ${!c.active ? 'is-hidden' : ''}`}>
                  <div>
                    <div className="cat-card-header">
                      <div className="cat-icon-wrap">{icon}</div>
                      <span className={`cat-status-badge ${c.active ? 'active' : 'hidden'}`}>
                        <span className={`cat-status-dot ${c.active ? 'active' : 'hidden'}`} />
                        {c.active ? 'Đang hiển thị' : 'Đang tạm ẩn'}
                      </span>
                    </div>

                    <h3 className="cat-card-title">{c.name}</h3>
                    <p className="cat-card-desc">
                      {c.description || 'Chưa có mô tả chi tiết cho danh mục này.'}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-stone-500 font-semibold">
                      <span className="px-2 py-0.5 bg-stone-100 rounded-md">
                        {c.productCount || 0} món ăn
                      </span>
                      <span>·</span>
                      <span>Thứ tự: {c.displayOrder}</span>
                    </div>
                  </div>

                  <div className="cat-card-footer">
                    <button
                      type="button"
                      onClick={() => handleToggleClick(c)}
                      className={`cat-toggle-btn ${c.active ? 'btn-hide' : 'btn-show'}`}
                      title={c.active ? 'Ẩn danh mục và ngừng bán các món' : 'Hiển thị danh mục'}
                    >
                      {c.active ? (
                        <>
                          <EyeOff size={13} /> Ẩn danh mục
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Hiện danh mục
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="action-icon-btn edit"
                        title="Chỉnh sửa danh mục"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="action-icon-btn delete"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="stats-bento-panel">
          <div className="stats-panel-header">
            <div>
              <h3 className="stats-panel-title">
                <Layers size={18} className="text-amber-700" />
                Danh Sách Nhóm Phân Loại Thực Đơn
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Hiển thị {filtered.length} danh mục. Khi ẩn danh mục, các món ăn thuộc danh mục sẽ tự động chuyển sang "Ngừng bán".
              </p>
            </div>
          </div>

          <div className="stats-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Danh mục</th>
                  <th>Mô tả chi tiết</th>
                  <th style={{ textAlign: 'center' }}>Số món trực thuộc</th>
                  <th style={{ textAlign: 'center' }}>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Chuyển đổi Ẩn/Hiện</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <EmptyState
                        title="Chưa có danh mục nào"
                        description="Thêm danh mục mới để bắt đầu phân loại thực đơn quán."
                        actionText="Thêm danh mục mới"
                        onAction={openAdd}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const icon = getCategoryIcon(c.name);
                    return (
                      <tr key={c.id}>
                        {/* Tên danh mục */}
                        <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl flex-shrink-0">
                              {icon}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-stone-900">{c.name}</p>
                              <span className="text-[11px] text-stone-400">ID: #{c.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Mô tả */}
                        <td style={{ maxWidth: '240px' }}>
                          <p className="text-xs text-stone-500 truncate" title={c.description}>
                            {c.description || <span className="text-stone-300 italic">Chưa có mô tả</span>}
                          </p>
                        </td>

                        {/* Số món trực thuộc */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg text-xs font-extrabold">
                            {c.productCount || 0} món
                          </span>
                        </td>

                        {/* Thứ tự */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="font-mono text-xs font-bold text-stone-600">
                            {c.displayOrder}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td>
                          <span className={`cat-status-badge ${c.active ? 'active' : 'hidden'}`}>
                            <span className={`cat-status-dot ${c.active ? 'active' : 'hidden'}`} />
                            {c.active ? 'Hiển thị' : 'Đang ẩn'}
                          </span>
                        </td>

                        {/* Chuyển đổi Ẩn/Hiện */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleClick(c)}
                            className={`cat-toggle-btn ${c.active ? 'btn-hide' : 'btn-show'}`}
                            title={c.active ? 'Ẩn danh mục và ngừng bán các món' : 'Hiển thị danh mục'}
                          >
                            {c.active ? (
                              <>
                                <EyeOff size={13} /> Ẩn danh mục
                              </>
                            ) : (
                              <>
                                <Eye size={13} /> Hiện danh mục
                              </>
                            )}
                          </button>
                        </td>

                        {/* Thao tác */}
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="action-icon-btn edit"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              className="action-icon-btn delete"
                              title="Xóa danh mục"
                            >
                              <Trash2 size={14} />
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

      {/* ── Modal Thêm / Chỉnh Sửa Danh Mục ── */}
      <AdminCategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        submitting={submitting}
        defaultOrder={categories.length + 1}
      />

      {/* ── Modal Xác Nhận Ẩn / Hiện Danh Mục (AODM Chuẩn) ── */}
      {confirmToggle && (
        <div className="aodm-overlay" onClick={() => setConfirmToggle(null)}>
          <div
            className="aodm-panel"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="aodm-header">
              <div className="aodm-header-left">
                <div
                  className="aodm-header-icon"
                  style={
                    confirmToggle.active
                      ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }
                      : { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }
                  }
                >
                  {confirmToggle.active ? <EyeOff size={22} /> : <Eye size={22} />}
                </div>
                <div>
                  <p className="aodm-eyebrow">
                    {confirmToggle.active ? 'Cảnh báo nghiệp vụ' : 'Khôi phục hiển thị'}
                  </p>
                  <h2 className="aodm-title" style={{ fontSize: '1.2rem' }}>
                    {confirmToggle.active ? 'Xác Nhận Ẩn Danh Mục' : 'Hiển Thị Lại Danh Mục'}
                  </h2>
                  <p className="aodm-date">
                    {confirmToggle.active ? (
                      <>
                        <AlertTriangle size={12} className="text-amber-600" />
                        Tự động chuyển các món sang trạng thái Ngừng bán
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Mở bán lại cho khách đặt trên menu
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="aodm-header-right">
                <span
                  className={`aodm-status-badge ${
                    confirmToggle.active ? 'aodm-status--amber' : 'aodm-status--emerald'
                  }`}
                >
                  <span
                    className="aodm-status-dot"
                    style={{ background: confirmToggle.active ? '#d97706' : '#059669' }}
                  />
                  {confirmToggle.active ? 'Sắp tạm ẩn' : 'Sắp mở bán'}
                </span>
                <button
                  className="aodm-close-btn"
                  onClick={() => setConfirmToggle(null)}
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="aodm-body" style={{ gap: '1rem' }}>
              {/* Category info snippet */}
              <div className="cat-confirm-snippet">
                <div className="cat-confirm-thumb">
                  {confirmToggle.image ? (
                    <img
                      src={confirmToggle.image}
                      alt={confirmToggle.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.4rem' }}>{getCategoryIcon(confirmToggle.name)}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: 0,
                      }}
                    >
                      {confirmToggle.name}
                    </h4>
                    <span
                      className="aodm-status-badge aodm-status--stone"
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      #{confirmToggle.id}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: '#64748b',
                      margin: '3px 0 0',
                    }}
                  >
                    Đang có{' '}
                    <strong style={{ color: '#0f172a' }}>
                      {confirmToggle.productCount || 0} món ăn
                    </strong>{' '}
                    trực thuộc danh mục này
                  </p>
                </div>
              </div>

              {/* Warning / Explanation Box */}
              {confirmToggle.active ? (
                <div
                  className="aodm-notice-box aodm-notice-box--amber"
                  style={{
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                    <AlertTriangle size={16} />
                    <span>Tác động liên hoàn (Cascade Warning):</span>
                  </div>
                  <ul className="cat-confirm-alert-list">
                    <li>
                      Danh mục <strong>{confirmToggle.name}</strong> sẽ <strong>ngay lập tức bị ẩn</strong> khỏi thực đơn khách hàng và màn hình bán hàng POS.
                    </li>
                    <li>
                      Toàn bộ <strong style={{ color: '#b91c1c' }}>{confirmToggle.productCount || 0} món ăn</strong> bên trong sẽ tự động chuyển sang trạng thái <strong>Ngừng bán</strong> để tránh nhận nhầm order.
                    </li>
                    <li>
                      Khách hàng không thể tìm kiếm hay đặt bất kỳ món nào thuộc danh mục này.
                    </li>
                    <li>
                      Bạn có thể mở hiển thị lại danh mục bất cứ lúc nào để tiếp tục kinh doanh.
                    </li>
                  </ul>
                </div>
              ) : (
                <div
                  className="aodm-notice-box"
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                    <CheckCircle2 size={16} />
                    <span>Khôi phục kinh doanh danh mục:</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', lineHeight: '1.55' }}>
                    Danh mục <strong>{confirmToggle.name}</strong> sẽ xuất hiện trở lại trên thực đơn của quán và toàn bộ{' '}
                    <strong>{confirmToggle.productCount || 0} món ăn</strong> trực thuộc sẽ được tự động kích hoạt <strong>Mở bán</strong> lại bình thường.
                  </p>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="aodm-footer">
              <div className="aodm-footer-left">
                <Info size={14} className="text-stone-400" />
                <span className="aodm-footer-note">
                  {confirmToggle.active
                    ? 'Thực đơn khách hàng sẽ cập nhật ngay lập tức.'
                    : 'Các món ăn sẽ sẵn sàng nhận order mới.'}
                </span>
              </div>
              <div className="aodm-footer-actions">
                <button
                  type="button"
                  className="aodm-btn-cancel"
                  onClick={() => setConfirmToggle(null)}
                  disabled={toggling}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToggle}
                  disabled={toggling}
                  className={`aodm-btn-submit ${
                    confirmToggle.active ? 'aodm-btn-submit--amber' : ''
                  }`}
                >
                  {toggling ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : confirmToggle.active ? (
                    <>
                      <EyeOff size={15} />
                      <span>Xác Nhận Ẩn Danh Mục</span>
                    </>
                  ) : (
                    <>
                      <Eye size={15} />
                      <span>Xác Nhận Mở Bán Lại</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
