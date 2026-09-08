import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UtensilsCrossed,
  Layers,
  CreditCard,
  Package,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Loader2,
  Tag,
} from 'lucide-react';
import { categoryService } from '../../../services/api';

const AdminProductModal = ({ isOpen, onClose, onSave, editingProduct, submitting }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stockQuantity: 100,
    image: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isOpen) {
      categoryService
        .getAll()
        .then((res) => {
          setCategories(res.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        price: editingProduct.price || '',
        stockQuantity: editingProduct.stockQuantity ?? 100,
        image: editingProduct.image || '',
        description: editingProduct.description || '',
        status: editingProduct.status || 'ACTIVE',
      });
    } else {
      setFormData({
        name: '',
        category: 'Trà Sữa',
        price: '',
        stockQuantity: 100,
        image: '',
        description: '',
        status: 'ACTIVE',
      });
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isStatusActive = formData.status === 'ACTIVE';

  return createPortal(
    <div className="aodm-overlay" onClick={onClose}>
      <div className="aodm-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="aodm-header">
          <div className="aodm-header-left">
            <div className={`aodm-header-icon ${isStatusActive ? 'aodm-icon--emerald' : 'aodm-icon--rose'}`}>
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <p className="aodm-eyebrow">Quản lý thực đơn</p>
              <h2 className="aodm-title">
                {editingProduct ? (formData.name || `Món #${editingProduct.id}`) : 'Thêm món ăn mới'}
              </h2>
              <p className="aodm-date">
                <Tag size={12} />
                {editingProduct ? `Mã định danh #${editingProduct.id}` : 'Thực đơn đồ uống Mintea'}
              </p>
            </div>
          </div>

          <div className="aodm-header-right">
            <span className={`aodm-status-badge ${isStatusActive ? 'aodm-status--emerald' : 'aodm-status--rose'}`}>
              <span
                className="aodm-status-dot"
                style={{ background: isStatusActive ? '#10b981' : '#f43f5e' }}
              />
              {isStatusActive ? 'Đang mở bán' : 'Tạm ngừng bán'}
            </span>
            <button className="aodm-close-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <form id="admin-product-form" onSubmit={handleSubmit} className="aodm-body">
          {/* Section 1: Thông tin cơ bản */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <UtensilsCrossed size={13} /> Thông tin món ăn
            </p>
            <div className="aodm-info-grid">
              {/* Tên món */}
              <div className="aodm-info-cell aodm-info-cell--full">
                <label className="aodm-info-label">
                  Tên món ăn <span className="aodm-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trà sữa ô long nướng"
                  className="aodm-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Danh mục */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">
                  <Layers size={12} /> Danh mục <span className="aodm-required">*</span>
                </label>
                {categories.length > 0 ? (
                  <select
                    required
                    className="aodm-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {!c.active ? '(Tạm ẩn)' : ''}
                      </option>
                    ))}
                    {formData.category && !categories.some((c) => c.name === formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trà Sữa"
                    className="aodm-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                )}
              </div>

              {/* Trạng thái bán */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">Trạng thái bán</label>
                <div className="aodm-segmented">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    className={`aodm-segmented-btn ${isStatusActive ? 'active-emerald' : ''}`}
                  >
                    Đang mở bán
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'STOPPED' })}
                    className={`aodm-segmented-btn ${!isStatusActive ? 'active-rose' : ''}`}
                  >
                    Ngừng bán
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Giá & Phục vụ */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <CreditCard size={13} /> Giá bán & Suất phục vụ
            </p>
            <div className="aodm-info-grid">
              {/* Giá bán */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">
                  Giá bán niêm yết <span className="aodm-required">*</span>
                </label>
                <div className="aodm-input-affix-wrap">
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    placeholder="35000"
                    className="aodm-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <span className="aodm-input-affix">₫</span>
                </div>
              </div>

              {/* Suất phục vụ */}
              <div className="aodm-info-cell">
                <label className="aodm-info-label">
                  <Package size={12} /> Suất phục vụ dự phòng
                </label>
                <div className="aodm-input-affix-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    className="aodm-input"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  />
                  <span className="aodm-input-affix">suất</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hình ảnh & Mô tả */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <ImageIcon size={13} /> Hình ảnh & Ghi chú
            </p>
            <div className="aodm-media-row">
              <div className="aodm-media-thumb">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon size={22} />
                )}
              </div>
              <div className="aodm-media-input-wrap">
                <input
                  type="url"
                  placeholder="Dán đường dẫn ảnh món (https://...)"
                  className="aodm-input"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>

            <div className="aodm-info-cell" style={{ marginTop: '0.5rem' }}>
              <label className="aodm-info-label">
                <FileText size={12} /> Mô tả & Thành phần
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thành phần, hương vị đặc trưng, mức đường đá khuyên dùng..."
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
              {editingProduct
                ? 'Cập nhật thay đổi vào thực đơn hệ thống.'
                : 'Món mới sẽ được mở bán ngay sau khi lưu.'}
            </p>
          </div>
          <div className="aodm-footer-actions">
            <button type="button" className="aodm-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              form="admin-product-form"
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
                  <span>{editingProduct ? 'Lưu thay đổi' : 'Thêm món mới'}</span>
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

export default AdminProductModal;
