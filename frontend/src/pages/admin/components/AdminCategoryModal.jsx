import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Layers,
  ArrowUpDown,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

const AdminCategoryModal = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
  submitting,
  defaultOrder = 1,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    displayOrder: 1,
    active: true,
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
        image: editingCategory.image || '',
        displayOrder: editingCategory.displayOrder ?? 1,
        active: editingCategory.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        displayOrder: defaultOrder,
        active: true,
      });
    }
  }, [editingCategory, isOpen, defaultOrder]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isCategoryActive = formData.active === true;

  return createPortal(
    <div className="aodm-overlay" onClick={onClose}>
      <div className="aodm-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="aodm-header">
          <div className="aodm-header-left">
            <div className={`aodm-header-icon ${isCategoryActive ? 'aodm-icon--emerald' : 'aodm-icon--amber'}`}>
              <Layers size={20} />
            </div>
            <div>
              <p className="aodm-eyebrow">Quản lý danh mục</p>
              <h2 className="aodm-title">
                {editingCategory ? (formData.name || `Danh mục #${editingCategory.id}`) : 'Thêm danh mục mới'}
              </h2>
              <p className="aodm-date">
                <FolderPlus size={12} />
                {editingCategory ? `Mã danh mục #${editingCategory.id}` : 'Nhóm phân loại thực đơn Mintea'}
              </p>
            </div>
          </div>

          <div className="aodm-header-right">
            <span className={`aodm-status-badge ${isCategoryActive ? 'aodm-status--emerald' : 'aodm-status--amber'}`}>
              <span
                className="aodm-status-dot"
                style={{ background: isCategoryActive ? '#10b981' : '#f59e0b' }}
              />
              {isCategoryActive ? 'Đang hiển thị' : 'Đang tạm ẩn'}
            </span>
            <button className="aodm-close-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <form id="admin-category-form" onSubmit={handleSubmit} className="aodm-body">
          {/* Section 1: Thông tin danh mục */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <Layers size={13} /> Thông tin nhóm món
            </p>
            <div className="aodm-info-grid">
              {/* Tên danh mục */}
              <div className="aodm-info-cell aodm-info-cell--full">
                <label className="aodm-info-label">
                  Tên danh mục <span className="aodm-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trà Sữa, Cà Phê, Trà Trái Cây..."
                  className="aodm-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Thứ tự hiển thị */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">
                  <ArrowUpDown size={12} /> Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="1"
                  className="aodm-input"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                />
              </div>

              {/* Trạng thái hiển thị */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">Trạng thái trên menu</label>
                <div className="aodm-segmented">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: true })}
                    className={`aodm-segmented-btn ${isCategoryActive ? 'active-emerald' : ''}`}
                  >
                    <Eye size={13} />
                    <span>Hiển thị</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: false })}
                    className={`aodm-segmented-btn ${!isCategoryActive ? 'active-amber' : ''}`}
                  >
                    <EyeOff size={13} />
                    <span>Tạm ẩn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cảnh báo khi tạm ẩn */}
            {!isCategoryActive && (
              <div className="aodm-notice-box aodm-notice-box--amber">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  <strong>Lưu ý:</strong> Khi tạm ẩn danh mục này, toàn bộ các món ăn bên trong sẽ tự động chuyển sang trạng thái <strong>Ngừng bán</strong> để khách không gọi nhầm.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Hình ảnh & Giới thiệu */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <ImageIcon size={13} /> Hình ảnh đại diện & Mô tả
            </p>
            <div className="aodm-media-row">
              <div className="aodm-media-thumb">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Category preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Layers size={22} />
                )}
              </div>
              <div className="aodm-media-input-wrap">
                <input
                  type="url"
                  placeholder="Dán đường dẫn ảnh đại diện nhóm (https://...)"
                  className="aodm-input"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>

            <div className="aodm-info-cell" style={{ marginTop: '0.5rem' }}>
              <label className="aodm-info-label">
                <FileText size={12} /> Giới thiệu ngắn về nhóm món
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả nét đặc trưng, hương vị của nhóm đồ uống này..."
                className="aodm-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="aodm-footer">
          <div className="aodm-footer-left">
            <CheckCircle2 size={14} className="text-stone-400" />
            <p className="aodm-footer-note">
              {editingCategory
                ? 'Cập nhật phân loại cho thực đơn hệ thống.'
                : 'Danh mục mới sẽ hiển thị trên thanh menu theo thứ tự sắp xếp.'}
            </p>
          </div>
          <div className="aodm-footer-actions">
            <button type="button" className="aodm-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              form="admin-category-form"
              disabled={submitting}
              className="aodm-btn-submit"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminCategoryModal;
