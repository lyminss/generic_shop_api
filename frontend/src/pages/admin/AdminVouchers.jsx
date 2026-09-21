import { useState, useEffect, useMemo } from 'react';
import { voucherService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Power,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Sparkles,
  Percent,
  Coins,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import './AdminVouchers.css';

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRED'
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Form State for Create
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENT', // 'PERCENT' | 'FIXED'
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    maxUsage: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    active: true,
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getAll();
      setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to load vouchers', err);
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleToggleActive = async (id, currentActive) => {
    try {
      await voucherService.toggle(id);
      toast.success(currentActive ? 'Đã tạm dừng áp dụng voucher' : 'Đã kích hoạt voucher');
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, active: !v.active } : v))
      );
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã "${code}" không?`)) return;
    try {
      await voucherService.delete(id);
      toast.success(`Đã xóa voucher ${code}`);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      toast.error('Không thể xóa voucher');
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ['MINTEA', 'SALE', 'DEAL', 'VIP', 'OFF'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({
      ...prev,
      code: `${randomPrefix}${randomNum}`,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const numDiscount = Number(formData.discountValue);
      const numMaxDiscount = formData.maxDiscount ? Number(formData.maxDiscount) : null;
      const numMinOrder = formData.minOrderAmount ? Number(formData.minOrderAmount) : 0;
      const numMaxUsage = formData.maxUsage ? Number(formData.maxUsage) : null;

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: numDiscount,
        maxDiscountAmount: numMaxDiscount,
        maxDiscount: numMaxDiscount,
        minOrderValue: numMinOrder,
        minOrderAmount: numMinOrder,
        maxUsage: numMaxUsage,
        expiryDate: formData.endDate || null,
        endDate: formData.endDate || null,
        startDate: formData.startDate || null,
        description: formData.description.trim(),
        active: formData.active,
      };

      await voucherService.create(payload);
      toast.success(`Đã tạo voucher ${payload.code} thành công!`);
      setShowModal(false);
      // Reset form
      setFormData({
        code: '',
        discountType: 'PERCENT',
        discountValue: '',
        maxDiscount: '',
        minOrderAmount: '',
        maxUsage: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
        active: true,
      });
      fetchVouchers();
    } catch (err) {
      const msg = err.response?.data || 'Không thể tạo mã voucher';
      toast.error(typeof msg === 'string' ? msg : 'Lỗi khi tạo mã voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date(new Date().toDateString());
  };

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchSearch =
        v.code?.toLowerCase().includes(search.toLowerCase()) ||
        v.description?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      const expired = isExpired(v.endDate);
      if (statusFilter === 'ACTIVE') return v.active && !expired;
      if (statusFilter === 'EXPIRED') return expired || !v.active;
      return true;
    });
  }, [vouchers, search, statusFilter]);

  return (
    <div className="admin-vouchers-container animate-fade-in">
      {/* Header */}
      <div className="av-header">
        <div>
          <h1 className="av-title">
            <Ticket className="av-title-icon" size={26} /> Quản lý Mã Giảm Giá
          </h1>
          <p className="av-subtitle">
            Tạo và cấu hình voucher khuyến mãi, giảm giá % hoặc tiền cố định cho khách hàng
          </p>
        </div>
        <button
          type="button"
          className="av-btn-create"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Tạo mã voucher mới
        </button>
      </div>

      {/* Toolbar: Search + Filter tabs */}
      <div className="av-toolbar">
        <div className="av-search-box">
          <Search size={16} className="av-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="av-search-input"
          />
          {search && (
            <button
              type="button"
              className="av-search-clear"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="av-filter-tabs">
          <button
            type="button"
            className={`av-filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả ({vouchers.length})
          </button>
          <button
            type="button"
            className={`av-filter-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Đang hoạt động ({vouchers.filter((v) => v.active && !isExpired(v.endDate)).length})
          </button>
          <button
            type="button"
            className={`av-filter-tab ${statusFilter === 'EXPIRED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('EXPIRED')}
          >
            Hết hạn / Tạm dừng
          </button>
        </div>
      </div>

      {/* Content list / table */}
      {loading ? (
        <div className="av-loading">
          <Loader2 size={32} className="animate-spin text-amber-500" />
          <p>Đang tải danh sách voucher...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="av-empty">
          <Ticket size={48} className="av-empty-icon" />
          <h3>Không tìm thấy mã giảm giá nào</h3>
          <p>Hãy tạo mã đầu tiên để kích cầu mua sắm cho MinTea!</p>
          <button
            type="button"
            className="av-btn-create-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={15} /> Tạo ngay
          </button>
        </div>
      ) : (
        <div className="av-grid">
          {filteredVouchers.map((v) => {
            const expiry = v.endDate || v.expiryDate;
            const expired = isExpired(expiry);
            const maxUse = v.maxUsage;
            const used = v.usedCount != null ? v.usedCount : (v.usageCount || 0);
            const usagePercent =
              maxUse > 0
                ? Math.min(100, Math.round((used / maxUse) * 100))
                : 0;
            const maxDisc = v.maxDiscount || v.maxDiscountAmount;
            const minOrd = v.minOrderAmount != null ? v.minOrderAmount : (v.minOrderValue || 0);

            return (
              <div
                key={v.id}
                className={`av-card ${!v.active ? 'is-inactive' : expired ? 'is-expired' : ''}`}
              >
                {/* Card Top */}
                <div className="av-card-top">
                  <div className="av-code-badge" onClick={() => handleCopy(v.code)} title="Click để sao chép">
                    <span className="av-code-text">{v.code}</span>
                    <Copy size={13} className="av-copy-icon" />
                  </div>

                  <div className="av-status-pills">
                    {expired ? (
                      <span className="av-badge-expired">Hết hạn</span>
                    ) : v.active ? (
                      <span className="av-badge-active">Hoạt động</span>
                    ) : (
                      <span className="av-badge-paused">Tạm dừng</span>
                    )}
                  </div>
                </div>

                {/* Card Discount Info */}
                <div className="av-discount-row">
                  <div className="av-discount-main">
                    {v.discountType === 'PERCENT' ? (
                      <>
                        <Percent size={18} className="text-amber-500" />
                        <span className="av-val-highlight">{v.discountValue}%</span>
                      </>
                    ) : (
                      <>
                        <Coins size={18} className="text-emerald-500" />
                        <span className="av-val-highlight">{formatPrice(v.discountValue)}</span>
                      </>
                    )}
                  </div>
                  <span className="av-type-label">
                    {v.discountType === 'PERCENT' ? 'Giảm theo %' : 'Giảm tiền mặt'}
                  </span>
                </div>

                {/* Rules / Constraints */}
                <div className="av-rules-list">
                  {v.discountType === 'PERCENT' && maxDisc && (
                    <div className="av-rule-item">
                      <span className="rule-label">Tối đa:</span>
                      <span className="rule-val">{formatPrice(maxDisc)}</span>
                    </div>
                  )}
                  <div className="av-rule-item">
                    <span className="rule-label">Đơn tối thiểu:</span>
                    <span className="rule-val">{minOrd ? formatPrice(minOrd) : '0₫'}</span>
                  </div>
                  <div className="av-rule-item">
                    <span className="rule-label">Thời hạn:</span>
                    <span className="rule-val">
                      {expiry ? expiry : 'Vô thời hạn'}
                    </span>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="av-usage-box">
                  <div className="av-usage-header">
                    <span>Đã dùng</span>
                    <span>
                      {used} / {maxUse ? `${maxUse} lượt` : '∞'}
                    </span>
                  </div>
                  {maxUse > 0 && (
                    <div className="av-progress-track">
                      <div
                        className="av-progress-bar"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {v.description && (
                  <p className="av-desc" title={v.description}>
                    {v.description}
                  </p>
                )}

                {/* Card Footer Actions */}
                <div className="av-card-actions">
                  <button
                    type="button"
                    className={`av-btn-toggle ${v.active ? 'active' : ''}`}
                    onClick={() => handleToggleActive(v.id, v.active)}
                    title={v.active ? 'Tạm dừng mã này' : 'Kích hoạt mã này'}
                  >
                    <Power size={14} />
                    <span>{v.active ? 'Tắt' : 'Bật'}</span>
                  </button>

                  <button
                    type="button"
                    className="av-btn-delete"
                    onClick={() => handleDelete(v.id, v.code)}
                    title="Xóa voucher"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Create Voucher ── */}
      {showModal && (
        <div className="av-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="av-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="av-modal-header">
              <div className="flex items-center gap-2">
                <Ticket className="text-amber-500" size={20} />
                <h2 className="av-modal-title">Tạo Mã Giảm Giá Mới</h2>
              </div>
              <button
                type="button"
                className="av-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="av-modal-form">
              {/* Code + Random generator */}
              <div className="av-form-group">
                <label className="av-label">
                  Mã Voucher <span className="text-rose-500">*</span>
                </label>
                <div className="av-input-inline-btn">
                  <input
                    type="text"
                    required
                    placeholder="VD: MINTEA20"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })
                    }
                    className="av-input font-mono uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="av-btn-random"
                    title="Tạo mã ngẫu nhiên"
                  >
                    <Sparkles size={14} /> Tự sinh
                  </button>
                </div>
              </div>

              {/* Discount Type */}
              <div className="av-form-group">
                <label className="av-label">Loại khuyến mãi</label>
                <div className="av-segmented">
                  <button
                    type="button"
                    className={`av-seg-btn ${formData.discountType === 'PERCENT' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, discountType: 'PERCENT' })}
                  >
                    <Percent size={14} /> Giảm theo phần trăm (%)
                  </button>
                  <button
                    type="button"
                    className={`av-seg-btn ${formData.discountType === 'FIXED' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, discountType: 'FIXED' })}
                  >
                    <Coins size={14} /> Giảm tiền cố định (₫)
                  </button>
                </div>
              </div>

              {/* Value & Max Discount Grid */}
              <div className="av-grid-2">
                <div className="av-form-group">
                  <label className="av-label">
                    {formData.discountType === 'PERCENT' ? 'Mức giảm (%)' : 'Số tiền giảm (₫)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'PERCENT' ? '100' : '10000000'}
                    placeholder={formData.discountType === 'PERCENT' ? '20' : '30000'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="av-input"
                  />
                </div>

                {formData.discountType === 'PERCENT' ? (
                  <div className="av-form-group">
                    <label className="av-label">Giảm tối đa (₫)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="VD: 50000 (để trống nếu không giới hạn)"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="av-input"
                    />
                  </div>
                ) : (
                  <div className="av-form-group">
                    <label className="av-label">Đơn tối thiểu (₫)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="VD: 80000"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      className="av-input"
                    />
                  </div>
                )}
              </div>

              {formData.discountType === 'PERCENT' && (
                <div className="av-form-group">
                  <label className="av-label">Đơn tối thiểu (₫)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="VD: 30000 (để trống nếu không yêu cầu)"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="av-input"
                  />
                </div>
              )}

              {/* Live Preview / Explanation for Capping */}
              {formData.discountType === 'PERCENT' && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '10px',
                  border: '1px dashed #f59e0b',
                  fontSize: '12px',
                  color: '#92400e',
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#b45309' }}>
                    <Sparkles size={15} /> Minh họa cơ chế giảm % có mức trần tối đa:
                  </div>
                  {formData.discountValue ? (
                    <div>
                      • Thiết lập: Giảm <strong>{formData.discountValue}%</strong>
                      {formData.maxDiscount ? <> (tối đa <strong>{formatPrice(Number(formData.maxDiscount))}</strong>)</> : ' (không giới hạn trần)'}
                      {formData.minOrderAmount ? <>, áp dụng cho đơn từ <strong>{formatPrice(Number(formData.minOrderAmount))}</strong></> : ''}.
                      <br />
                      • <strong>Đơn 30.000₫:</strong> Giảm {formData.discountValue}% = {formatPrice(30000 * (Number(formData.discountValue) / 100))}
                      {formData.maxDiscount && (30000 * (Number(formData.discountValue) / 100)) > Number(formData.maxDiscount)
                        ? ` ➔ Chặn ở mức tối đa ${formatPrice(Number(formData.maxDiscount))}`
                        : ' (hưởng trọn)'}
                      <br />
                      • <strong>Đơn 100.000₫:</strong> Giảm {formData.discountValue}% = {formatPrice(100000 * (Number(formData.discountValue) / 100))}
                      {formData.maxDiscount && (100000 * (Number(formData.discountValue) / 100)) > Number(formData.maxDiscount)
                        ? ` ➔ Chặn ở mức tối đa ${formatPrice(Number(formData.maxDiscount))}`
                        : ' (hưởng trọn)'}
                    </div>
                  ) : (
                    <div>Ví dụ: Giảm 20% tối đa 10k ➔ Đơn 30k được giảm 6k; Đơn 100k (20% là 20k) nhưng bị giới hạn trần nên chỉ giảm tối đa 10k!</div>
                  )}
                </div>
              )}

              {/* Max Usage & Validity Dates */}
              <div className="av-grid-3">
                <div className="av-form-group">
                  <label className="av-label">Số lượt tối đa</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    className="av-input"
                  />
                </div>

                <div className="av-form-group">
                  <label className="av-label">Bắt đầu từ</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="av-input"
                  />
                </div>

                <div className="av-form-group">
                  <label className="av-label">Hết hạn vào</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="av-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="av-form-group">
                <label className="av-label">Mô tả chương trình</label>
                <textarea
                  rows={2}
                  placeholder="VD: Ưu đãi 20% chào hè cho tất cả hóa đơn từ 100k"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="av-input"
                />
              </div>

              {/* Modal footer */}
              <div className="av-modal-footer">
                <button
                  type="button"
                  className="av-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="av-btn-submit"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Đang tạo...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Lưu & Kích hoạt</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVouchers;
