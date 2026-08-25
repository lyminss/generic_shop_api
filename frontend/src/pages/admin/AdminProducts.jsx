import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  LayoutGrid,
  List,
  AlertTriangle,
  UtensilsCrossed,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { TableSkeleton, EmptyState } from '../../components/common/StateViews';
import AdminProductModal from './components/AdminProductModal';
import './AdminProducts.css';

const AdminProducts = ({
  products = [],
  loading = false,
  onSaveProduct,
  onDeleteProduct,
  submittingProduct = false,
}) => {
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [view, setView]             = useState('table'); // 'table' | 'grid'
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);

  const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const available = products.filter(p => p.available !== false && p.stockQuantity > 0).length;
  const unavail   = products.filter(p => p.available === false || p.stockQuantity === 0).length;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
      && (!category || p.category === category);
  });

  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p);   setShowModal(true); };
  const handleSave = async (data) => {
    const ok = await onSaveProduct(data, editing?.id);
    if (ok) setShowModal(false);
  };
  const handleDelete = (p) => {
    if (window.confirm(`Xóa món "${p.name}" khỏi thực đơn?`)) onDeleteProduct(p.id);
  };

  return (
    <div className="admin-tab-content animate-fade-in">
      {/* ── Hero Banner (Matching AdminStats) ── */}
      <div className="admin-hero-banner">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider rounded-full border border-amber-500/30 mb-2.5">
            <Sparkles size={13} /> Thực đơn & Công thức quán
          </div>
          <h1 className="admin-hero-title">
            Quản Lý Thực Đơn
          </h1>
          <p className="admin-hero-subtitle">
            Thiết lập danh mục đồ uống, điều chỉnh giá bán và theo dõi trạng thái sẵn sàng phục vụ của từng món.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAdd}
            className="stats-action-btn"
            style={{ background: '#d97706', color: '#ffffff' }}
          >
            <Plus size={17} /> Thêm Món Mới
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards Grid ── */}
      <div className="stats-cards-grid">
        {/* Card 1: Tổng số món */}
        <div className="stat-tile accent-taro flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng số món</p>
            <div className="icon-tile ml-2">
              <UtensilsCrossed size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{products.length}</h3>
            <div className="stats-card-caption">
              Toàn bộ đồ uống trong menu
            </div>
          </div>
        </div>

        {/* Card 2: Sẵn bán */}
        <div className="stat-tile accent-matcha flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Sẵn sàng phục vụ</p>
            <div className="icon-tile ml-2">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{available}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Đầy đủ nguyên liệu</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Sẵn sàng
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Tạm ngưng */}
        <div className="stat-tile accent-caramel flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tạm ngưng bán</p>
            <div className="icon-tile ml-2">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{unavail}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Thiếu nguyên liệu</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Tạm dừng
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Danh mục */}
        <div className="stat-tile accent-teal flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Danh mục món</p>
            <div className="icon-tile ml-2">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{cats.length}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Phân loại thức uống</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Nhóm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Utility Filter Bar ── */}
      <div className="admin-utility-bar">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1">Danh mục:</span>
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`filter-pill ${category === '' ? 'active' : ''}`}
          >
            Tất cả ({products.length})
          </button>
          {cats.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`filter-pill ${category === c ? 'active' : ''}`}
            >
              {c} ({products.filter(p => p.category === c).length})
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="admin-search-input-group">
            <Search size={15} className="text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm món theo tên hoặc danh mục..."
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

      {/* ── Content: Bento Table or Bento Grid ── */}
      {view === 'grid' ? (
        <div className="prod-grid-layout">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="prod-grid-card prod-grid-card--skeleton animate-pulse">
                <div className="prod-card-media-skeleton" />
                <div className="prod-card-body-skeleton">
                  <div className="skeleton-line w-20 h-4 mb-2 rounded-full" />
                  <div className="skeleton-line w-3/4 h-5 mb-2 rounded-lg" />
                  <div className="skeleton-line w-full h-3 mb-1 rounded" />
                  <div className="skeleton-line w-2/3 h-3 mb-4 rounded" />
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <div className="skeleton-line w-24 h-6 rounded-lg" />
                    <div className="skeleton-line w-16 h-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full stats-bento-panel py-20 text-center">
              <EmptyState
                title="Chưa có món nào phù hợp"
                description="Thay đổi bộ lọc hoặc thêm món mới để bắt đầu."
                actionText="Thêm món mới"
                onAction={openAdd}
              />
            </div>
          ) : (
            filtered.map((p) => {
              const isOff = p.available === false;
              const isLow = !isOff && p.stockQuantity <= 5;
              return (
                <div key={p.id} className={`prod-grid-card ${isOff ? 'is-disabled' : ''}`}>
                  {/* Media Wrap */}
                  <div className="prod-card-media">
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="prod-card-placeholder">
                        <span className="text-4xl">🧋</span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay for Text Legibility */}
                    <div className="prod-card-media-gradient" />

                    {/* Top-Left Category Badge */}
                    <span className="prod-card-cat-badge">
                      {p.category || 'Đồ uống'}
                    </span>

                    {/* Top-Right ID Chip */}
                    <span className="prod-card-id-chip">
                      #{String(p.id).padStart(3, '0')}
                    </span>

                    {/* Disabled Overlay */}
                    {isOff && (
                      <div className="prod-card-disabled-overlay">
                        <div className="prod-card-disabled-badge">
                          <AlertTriangle size={13} /> Tạm ngưng bán
                        </div>
                        <p className="prod-card-disabled-reason">
                          {p.unavailableReason || 'Hết hoặc quá hạn nguyên liệu'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="prod-card-body">
                    <div className="prod-card-main-info">
                      <h3 className="prod-card-title" title={p.name}>
                        {p.name}
                      </h3>
                      {p.description ? (
                        <p className="prod-card-desc" title={p.description}>
                          {p.description}
                        </p>
                      ) : (
                        <p className="prod-card-desc prod-card-desc--empty">
                          Chưa có mô tả chi tiết cho món này.
                        </p>
                      )}
                    </div>

                    {/* Price & Stock Row */}
                    <div className="prod-card-pricing-row">
                      <div className="prod-card-price-group">
                        <span className="prod-card-price-label">Giá bán</span>
                        <span className="prod-card-price-val">
                          {formatPrice(p.price)}
                        </span>
                      </div>

                      <div className="prod-card-stock-group">
                        {isOff ? (
                          <span className="prod-stock-pill prod-stock-pill--out">
                            Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="prod-stock-pill prod-stock-pill--low">
                            <span className="prod-stock-dot amber" /> Còn {p.stockQuantity} suất
                          </span>
                        ) : (
                          <span className="prod-stock-pill prod-stock-pill--ok">
                            <span className="prod-stock-dot green" /> Còn {p.stockQuantity} suất
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="prod-card-footer">
                    <span className="prod-card-status-indicator">
                      {isOff ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Tạm dừng
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sẵn bán
                        </span>
                      )}
                    </span>

                    <div className="prod-card-actions">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="prod-action-btn prod-action-btn--edit"
                        title="Chỉnh sửa món"
                      >
                        <Edit size={14} />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="prod-action-btn prod-action-btn--delete"
                        title="Xóa món"
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
                <UtensilsCrossed size={18} className="text-purple-700" />
                Danh Sách Món Ăn Trong Thực Đơn
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Hiển thị {filtered.length} món ăn phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          </div>

          <div className="stats-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Món ăn / Đồ uống</th>
                  <th>Danh mục</th>
                  <th style={{ textAlign: 'right' }}>Giá bán</th>
                  <th>Tình trạng phục vụ</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <EmptyState
                        title="Chưa có món nào"
                        description="Thêm món ăn/đồ uống vào thực đơn để bắt đầu."
                        actionText="Thêm món mới"
                        onAction={openAdd}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isOff = p.available === false;
                    return (
                      <tr key={p.id}>
                        {/* Món ăn + Thumbnail */}
                        <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                          <div className="flex items-center gap-3.5">
                            <div className="admin-prod-thumb">
                              {p.image ? (
                                <img src={p.image} alt={p.name} />
                              ) : (
                                <span className="text-lg">🍵</span>
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-stone-900">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-stone-400 truncate max-w-xs">{p.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Danh mục */}
                        <td>
                          <span className="cat-pill">
                            {p.category || 'Đồ uống'}
                          </span>
                        </td>

                        {/* Giá bán */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-sm font-black text-amber-800">
                            {formatPrice(p.price)}
                          </span>
                        </td>

                        {/* Tình trạng */}
                        <td>
                          {isOff ? (
                            <span className="stock-indicator out inline-flex items-center gap-1">
                              <AlertTriangle size={12} /> Tạm ngưng ({p.unavailableReason || 'Hết NL'})
                            </span>
                          ) : (
                            <span className={`stock-indicator ${p.stockQuantity <= 5 ? 'low' : 'ok'}`}>
                              Sẵn sàng · {p.stockQuantity} suất
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="action-icon-btn edit"
                              title="Chỉnh sửa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="action-icon-btn delete"
                              title="Xóa món"
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

      {/* Product Add / Edit Modal */}
      <AdminProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        editingProduct={editing}
        submitting={submittingProduct}
      />
    </div>
  );
};

export default AdminProducts;
