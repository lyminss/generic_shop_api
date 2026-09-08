import { useState, useEffect } from 'react';
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
  Cpu,
  Eye,
  EyeOff,
  RotateCcw,
  Trash,
  ShieldAlert,
} from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { TableSkeleton, EmptyState } from '../../components/common/StateViews';
import AdminProductModal from './components/AdminProductModal';
import ProductionCapacityModal from './components/ProductionCapacityModal';
import './AdminProducts.css';

const AdminProducts = ({
  products = [],
  trashedProducts = [],
  trashLoading = false,
  loading = false,
  onSaveProduct,
  onDeleteProduct,
  onToggleProductStatus,
  onRestoreProduct,
  onPermanentDelete,
  onLoadTrash,
  submittingProduct = false,
}) => {
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [view, setView]             = useState('table'); // 'table' | 'grid'
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showTrash, setShowTrash]   = useState(false);

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
    if (window.confirm(`Xóa món "${p.name}" khỏi thực đơn?\n\nLưu ý: Nếu món đã có đơn hàng, món sẽ được chuyển vào Thùng rác thay vì xóa vĩnh viễn.`)) {
      onDeleteProduct(p.id, p.name);
    }
  };

  const handleOpenTrash = () => {
    setShowTrash(true);
    onLoadTrash?.();
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
            onClick={() => setShowCapacityModal(true)}
            className="stats-action-btn"
            style={{ background: '#47275a', color: '#ffffff' }}
          >
            <Cpu size={17} /> Ước Tính Công Suất Kho
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="stats-action-btn"
            style={{ background: '#d97706', color: '#ffffff' }}
          >
            <Plus size={17} /> Thêm Món Mới
          </button>
          <button
            type="button"
            onClick={handleOpenTrash}
            className="stats-action-btn"
            style={{ background: '#6b7280', color: '#ffffff', position: 'relative' }}
          >
            <Trash size={17} /> Thùng Rác
            {trashedProducts.length > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                fontSize: '10px', fontWeight: 800, width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {trashedProducts.length}
              </span>
            )}
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
                      {p.status === 'STOPPED' ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Ngừng bán
                        </span>
                      ) : isOff ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Hết NL
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
                        onClick={() => onToggleProductStatus?.(p)}
                        className={`prod-action-btn ${p.status === 'STOPPED' ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                        title={p.status === 'STOPPED' ? 'Mở bán lại món này' : 'Ngừng bán món này'}
                      >
                        {p.status === 'STOPPED' ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{p.status === 'STOPPED' ? 'Mở bán' : 'Ngừng'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="prod-action-btn prod-action-btn--edit"
                        title="Chỉnh sửa món"
                      >
                        <Edit size={13} />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="prod-action-btn prod-action-btn--delete"
                        title="Xóa món"
                      >
                        <Trash2 size={13} />
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
                  <th style={{ textAlign: 'center' }}>Trạng thái bán</th>
                  <th>Tình trạng phục vụ</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
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
                    const isStopped = p.status === 'STOPPED';
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

                        {/* Trạng thái bán */}
                        <td style={{ textAlign: 'center' }}>
                          {isStopped ? (
                            <span className="cat-status-badge hidden">
                              <span className="cat-status-dot hidden" /> Ngừng bán
                            </span>
                          ) : (
                            <span className="cat-status-badge active">
                              <span className="cat-status-dot active" /> Đang bán
                            </span>
                          )}
                        </td>

                        {/* Tình trạng */}
                        <td>
                          {isStopped ? (
                            <span className="stock-indicator out inline-flex items-center gap-1">
                              <AlertTriangle size={12} /> Tạm ngưng (Ngừng bán)
                            </span>
                          ) : isOff ? (
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
                              onClick={() => onToggleProductStatus?.(p)}
                              className={`action-icon-btn ${isStopped ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                              title={isStopped ? 'Mở bán lại món này' : 'Tạm ngừng bán món này'}
                            >
                              {isStopped ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
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

      {/* Production Capacity Estimator Modal */}
      <ProductionCapacityModal
        isOpen={showCapacityModal}
        onClose={() => setShowCapacityModal(false)}
      />

      {/* ── THÙNG RÁC MODAL ── */}
      {showTrash && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowTrash(false)}
        >
          <div style={{
            background: '#1c1917', borderRadius: '16px', width: '100%', maxWidth: '780px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            border: '1px solid #44403c', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #44403c',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #292524, #1c1917)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #ef444440',
                }}>
                  <Trash size={18} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h2 style={{ color: '#fafaf9', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                    Thùng Rác Sản Phẩm
                  </h2>
                  <p style={{ color: '#78716c', fontSize: '0.75rem', margin: 0 }}>
                    {trashedProducts.length} món đã xóa mềm · Có thể khôi phục hoặc xóa vĩnh viễn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrash(false)}
                style={{
                  background: '#292524', border: '1px solid #44403c', borderRadius: '8px',
                  color: '#a8a29e', cursor: 'pointer', padding: '0.4rem 0.6rem',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning banner */}
            <div style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(239,68,68,0.1)',
              borderBottom: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <ShieldAlert size={15} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600 }}>
                Sản phẩm trong Thùng rác đã ẩn hoàn toàn khỏi thực đơn.
                Xóa vĩnh viễn sẽ không thể hoàn tác. Lịch sử đơn hàng vẫn được giữ nguyên.
              </span>
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
              {trashLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#78716c' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                  Đang tải Thùng rác...
                </div>
              ) : trashedProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#78716c' }}>
                  <Trash size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontWeight: 700, color: '#a8a29e', marginBottom: '0.5rem' }}>Thùng rác trống</p>
                  <p style={{ fontSize: '0.8rem' }}>Không có sản phẩm nào trong Thùng rác.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {trashedProducts.map((p) => (
                    <div key={p.id} style={{
                      background: '#292524', borderRadius: '12px', border: '1px solid #44403c',
                      padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden',
                        background: '#3c2a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>🍵</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#e7e5e4', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {p.category && (
                            <span style={{ fontSize: '0.7rem', color: '#a78bfa', background: '#4c1d9520', padding: '0.15rem 0.5rem', borderRadius: '20px', border: '1px solid #4c1d9540' }}>
                              {p.category}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                            {formatPrice(p.price)}
                          </span>
                          {p.deletedAt && (
                            <span style={{ fontSize: '0.7rem', color: '#78716c' }}>
                              Xóa: {new Date(p.deletedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onRestoreProduct?.(p.id, p.name)}
                          title="Khôi phục về Ngừng bán"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid #065f4640',
                            background: '#065f4620', color: '#34d399', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#065f4640'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#065f4620'; }}
                        >
                          <RotateCcw size={13} /> Khôi phục
                        </button>
                        <button
                          type="button"
                          onClick={() => onPermanentDelete?.(p.id, p.name)}
                          title="Xóa vĩnh viễn khỏi hệ thống"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid #7f1d1d40',
                            background: '#7f1d1d20', color: '#f87171', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#7f1d1d40'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#7f1d1d20'; }}
                        >
                          <Trash2 size={13} /> Xóa vĩnh viễn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
