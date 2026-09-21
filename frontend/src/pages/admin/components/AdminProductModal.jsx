import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Link as LinkIcon,
  Settings,
} from 'lucide-react';
import { categoryService } from '../../../services/api';

const AdminProductModal = ({ isOpen, onClose, onSave, editingProduct, submitting }) => {
  const [categories, setCategories] = useState([]);
  const [imageTab, setImageTab] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Cloudinary credentials from localStorage or .env
  const [cloudName, setCloudName] = useState(() => localStorage.getItem('mintea_cloudinary_name') || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '');
  const [uploadPreset, setUploadPreset] = useState(() => localStorage.getItem('mintea_cloudinary_preset') || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '');
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [cfgSaved, setCfgSaved] = useState(false);
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

  const handleSaveCloudinaryConfig = (e) => {
    e?.preventDefault();
    localStorage.setItem('mintea_cloudinary_name', cloudName.trim());
    localStorage.setItem('mintea_cloudinary_preset', uploadPreset.trim());
    setCfgSaved(true);
    setTimeout(() => {
      setCfgSaved(false);
      setShowCloudinaryConfig(false);
    }, 1000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (jpg, png, webp, ...).');
      return;
    }

    if (!cloudName.trim() || !uploadPreset.trim()) {
      setShowCloudinaryConfig(true);
      alert('⚠️ Chưa cấu hình Cloudinary!\nVui lòng nhập Cloud Name và Upload Preset (Unsigned) ở khung bên dưới rồi bấm Lưu.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset.trim());
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
        { method: 'POST', body: fd }
      );
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, image: data.secure_url }));
      } else {
        const errMsg = data.error?.message || 'Lỗi không xác định';
        setShowCloudinaryConfig(true);
        alert(`Lỗi Cloudinary: ${errMsg}\n\n-> Lưu ý: Upload Preset phải được tạo ở chế độ "Unsigned" trong Settings > Upload của Cloudinary.`);
      }
    } catch (err) {
      alert('Lỗi kết nối Cloudinary. Vui lòng kiểm tra lại mạng hoặc Cloud Name.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

            {/* Image Source Tabs & Settings */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div className="aodm-img-tabs" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`aodm-img-tab ${imageTab === 'url' ? 'active' : ''}`}
                  onClick={() => setImageTab('url')}
                >
                  <LinkIcon size={12} /> URL
                </button>
                <button
                  type="button"
                  className={`aodm-img-tab ${imageTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageTab('upload')}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>

              {imageTab === 'upload' && (
                <button
                  type="button"
                  onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#f59e0b',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Cài đặt Cloudinary"
                >
                  <Settings size={13} /> {cloudName ? 'Cài đặt Cloudinary' : '⚠️ Nhập key Cloudinary'}
                </button>
              )}
            </div>

            {/* Cloudinary Inline Config Box */}
            {imageTab === 'upload' && (showCloudinaryConfig || !cloudName) && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 700, color: '#f59e0b' }}>
                  <span>⚙️ Cấu hình Cloudinary (Upload Trực Tiếp)</span>
                  {cfgSaved && <span style={{ color: '#10b981' }}>✔ Đã lưu thành công!</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.2rem' }}>Cloud Name</label>
                    <input
                      type="text"
                      placeholder="VD: dxyz123abc"
                      value={cloudName}
                      onChange={(e) => setCloudName(e.target.value)}
                      className="aodm-input"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.2rem' }}>Upload Preset (Unsigned)</label>
                    <input
                      type="text"
                      placeholder="VD: mintea_preset"
                      value={uploadPreset}
                      onChange={(e) => setUploadPreset(e.target.value)}
                      className="aodm-input"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '0.68rem' }}>Lấy tại Cloudinary: Settings &gt; Upload &gt; Upload presets (Unsigned)</span>
                  <button
                    type="button"
                    onClick={handleSaveCloudinaryConfig}
                    style={{
                      background: '#f59e0b',
                      color: '#0f172a',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.3rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.72rem'
                    }}
                  >
                    Lưu thông tin
                  </button>
                </div>
              </div>
            )}

            <div className="aodm-media-row">
              <div className="aodm-media-thumb">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <ImageIcon size={22} />
                )}
              </div>
              <div className="aodm-media-input-wrap">
                {imageTab === 'url' ? (
                  <div>
                    <input
                      type="url"
                      placeholder="Dán link ảnh (Cloudinary, Unsplash, Imgur... https://...)"
                      className="aodm-input"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                    <div style={{ fontSize: '11px', color: '#78716c', marginTop: '4px' }}>
                      💡 Bạn có thể tải ảnh lên Cloudinary rồi dán trực tiếp đường dẫn link ảnh vào đây.
                    </div>
                  </div>
                ) : (
                  <div className="aodm-upload-area">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      className="aodm-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <><Loader2 size={15} className="animate-spin" /> Đang upload...</>
                      ) : (
                        <><Upload size={15} /> Chọn ảnh từ máy</>                      
                      )}
                    </button>
                    {formData.image && (
                      <p className="aodm-upload-success">✔ Đã upload thành công</p>
                    )}
                    <p className="aodm-upload-hint">Hỗ trợ JPG, PNG, WebP • Tự lưu link Cloudinary</p>
                  </div>
                )}
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
