import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  PackagePlus,
  Boxes,
  Building2,
  CalendarDays,
  CreditCard,
  CheckCircle,
  PackageCheck,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '../../../utils/format';

const CreateStockReceiptModal = ({
  isOpen,
  onClose,
  onSave,
  ingredients = [],
  submitting = false,
}) => {
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');

  const getInitialRow = (ing) => {
    const hasConv = Boolean(ing?.purchaseUnit && ing.purchaseUnit.trim() !== ing.unit?.trim());
    const rate = (hasConv && ing.conversionRate) ? ing.conversionRate : 1;
    return {
      ingredientId: ing?.id || '',
      quantity: 1,
      unitType: hasConv ? 'purchase' : 'base',
      unitPrice: hasConv ? ((ing?.costPrice || 0) * rate) : (ing?.costPrice || 0),
    };
  };

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSupplier('');
      setNote('');
      setItems([getInitialRow(ingredients[0])]);
    }
  }, [isOpen, ingredients]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setItems([
      ...items,
      getInitialRow(ingredients[0]),
    ]);
  };

  const handleRemoveRow = (idx) => {
    if (items.length <= 1) return;
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  const handleRowChange = (idx, field, val) => {
    const next = [...items];
    next[idx][field] = val;

    if (field === 'ingredientId') {
      const selected = ingredients.find((i) => String(i.id) === String(val));
      const hasConv = Boolean(selected?.purchaseUnit && selected.purchaseUnit.trim() !== selected.unit?.trim());
      next[idx].unitType = hasConv ? 'purchase' : 'base';
      const rate = (hasConv && selected.conversionRate) ? selected.conversionRate : 1;
      next[idx].unitPrice = (selected?.costPrice || 0) * (hasConv ? rate : 1);
    }

    if (field === 'unitType') {
      const selected = ingredients.find((i) => String(i.id) === String(next[idx].ingredientId));
      const rate = (selected && selected.conversionRate) ? selected.conversionRate : 1;
      if (val === 'purchase' && rate > 0) {
        next[idx].unitPrice = (Number(next[idx].unitPrice) || 0) * rate;
      } else if (val === 'base' && rate > 0) {
        next[idx].unitPrice = Math.round((Number(next[idx].unitPrice) || 0) / rate);
      }
    }

    setItems(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.some((i) => !i.ingredientId || Number(i.quantity) <= 0)) {
      alert('Vui lòng chọn nguyên liệu và số lượng hợp lệ cho tất cả các dòng.');
      return;
    }

    onSave({
      supplier: supplier.trim(),
      note: note.trim(),
      items: items.map((i) => {
        const selected = ingredients.find((ing) => String(ing.id) === String(i.ingredientId));
        const hasConv = Boolean(selected?.purchaseUnit && selected.purchaseUnit.trim() !== selected.unit?.trim());
        const isPurchase = i.unitType === 'purchase' && hasConv;
        const rate = isPurchase ? (selected?.conversionRate || 1) : 1;

        const qtyBase = Number(i.quantity) * rate;
        const unitPriceBase = rate > 0 ? Number(i.unitPrice || 0) / rate : Number(i.unitPrice || 0);

        return {
          ingredientId: Number(i.ingredientId),
          quantity: qtyBase,
          unitPrice: unitPriceBase,
        };
      }),
    });
  };

  const totalAmount = items.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0),
    0
  );

  return createPortal(
    <div className="aodm-overlay" onClick={onClose}>
      <div className="aodm-panel" style={{ maxWidth: '860px', maxHeight: 'calc(100vh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="aodm-header">
          <div className="aodm-header-left">
            <div className="aodm-header-icon" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
              <PackagePlus size={20} />
            </div>
            <div>
              <p className="aodm-eyebrow">Quản lý tồn kho nguyên liệu</p>
              <h2 className="aodm-title">Tạo Phiếu Nhập Kho Mới</h2>
              <p className="aodm-date">
                <CalendarDays size={12} />
                Nhập kho từ nhà cung cấp & cập nhật tự động số lượng tồn
              </p>
            </div>
          </div>

          <div className="aodm-header-right">
            <span className="aodm-status-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              <span className="aodm-status-dot" style={{ background: '#2563eb' }} />
              Phiếu mới
            </span>
            <button className="aodm-close-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <form id="create-receipt-form" onSubmit={handleSubmit} className="aodm-body">
          {/* Section 1: Thông tin phiếu nhập */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <Building2 size={13} /> Nguồn nhập & Ghi chú
            </p>
            <div className="aodm-info-grid">
              <div className="aodm-info-cell">
                <label className="aodm-info-label">Nhà Cung Cấp / Đối Tác (*)</label>
                <input
                  type="text"
                  placeholder="VD: Công ty TNHH Nguyên Liệu Mintea..."
                  className="aodm-input"
                  value={supplier}
                  required
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>

              <div className="aodm-info-cell">
                <label className="aodm-info-label">Ghi Chú Chi Tiết</label>
                <input
                  type="text"
                  placeholder="Ghi chú số hóa đơn, kiểm tra hạn dùng..."
                  className="aodm-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Danh sách nguyên liệu */}
          <div className="aodm-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <p className="aodm-section-label" style={{ margin: 0 }}>
                <Boxes size={13} /> Danh sách nguyên liệu nhập ({items.length} dòng)
              </p>
              <button type="button" className="aodm-receipt-add-btn" onClick={handleAddRow}>
                <Plus size={13} /> Thêm dòng
              </button>
            </div>

            <div className="aodm-receipt-table-wrap">
              <table className="aodm-receipt-table">
                <thead>
                  <tr>
                    <th style={{ width: '36%' }}>Nguyên Liệu</th>
                    <th style={{ width: '20%' }}>Số Lượng Nhập</th>
                    <th style={{ width: '22%' }}>Đơn Giá Nhập (VNĐ)</th>
                    <th style={{ width: '18%', textAlign: 'right' }}>Thành Tiền</th>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const rowTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
                    const selectedIng = ingredients.find((i) => String(i.id) === String(row.ingredientId));

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            required
                            className="aodm-select"
                            value={row.ingredientId}
                            onChange={(e) => handleRowChange(idx, 'ingredientId', e.target.value)}
                          >
                            <option value="">-- Chọn nguyên liệu --</option>
                            {ingredients.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.code} - {i.name} ({i.unit}{i.purchaseUnit && i.purchaseUnit.trim() !== i.unit?.trim() ? ` | nhập ${i.purchaseUnit}` : ''})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <div className="aodm-input-affix-wrap" style={{ display: 'flex', alignItems: 'stretch' }}>
                            <input
                              type="number"
                              step="any"
                              min="0.0001"
                              required
                              placeholder="1"
                              className="aodm-input"
                              style={{ flex: 1 }}
                              value={row.quantity}
                              onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                            />
                            {selectedIng?.purchaseUnit && selectedIng.purchaseUnit.trim() !== selectedIng.unit?.trim() ? (
                              <select
                                className="aodm-select"
                                value={row.unitType || 'purchase'}
                                onChange={(e) => handleRowChange(idx, 'unitType', e.target.value)}
                                style={{
                                  width: 'auto',
                                  minWidth: '58px',
                                  borderLeft: '1px solid #cbd5e1',
                                  borderRadius: '0 8px 8px 0',
                                  background: '#f1f5f9',
                                  fontWeight: 700,
                                  color: '#15803d',
                                  padding: '0 8px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                                title="Chọn đơn vị nhập"
                              >
                                <option value="purchase">{selectedIng.purchaseUnit}</option>
                                <option value="base">{selectedIng.unit}</option>
                              </select>
                            ) : (
                              <span className="aodm-input-affix">{selectedIng?.unit || ''}</span>
                            )}
                          </div>
                          {selectedIng?.purchaseUnit && selectedIng.purchaseUnit.trim() !== selectedIng.unit?.trim() && row.unitType !== 'base' && (
                            <small style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                              ↳ Quy đổi: {(Number(row.quantity || 0) * (selectedIng.conversionRate || 1)).toLocaleString('vi-VN')} {selectedIng.unit}
                            </small>
                          )}
                        </td>

                        <td>
                          <div className="aodm-input-affix-wrap">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              placeholder="0"
                              className="aodm-input"
                              value={row.unitPrice}
                              onChange={(e) => handleRowChange(idx, 'unitPrice', e.target.value)}
                            />
                            <span className="aodm-input-affix" style={{ fontSize: '0.75rem' }}>
                              ₫/{selectedIng?.purchaseUnit && selectedIng.purchaseUnit.trim() !== selectedIng.unit?.trim() && row.unitType !== 'base' ? selectedIng.purchaseUnit : (selectedIng?.unit || '')}
                            </span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#065f46' }}>
                          {formatPrice(rowTotal)}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="aodm-row-del-btn"
                              onClick={() => handleRemoveRow(idx)}
                              title="Xóa dòng"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Tổng kết phiếu nhập (AODM Payment Box style) */}
          <div className="aodm-payment-box">
            <div className="aodm-payment-row">
              <span>
                <Boxes size={13} /> Số nguyên liệu nhập
              </span>
              <span>{items.length} nguyên liệu</span>
            </div>
            <div className="aodm-payment-row">
              <span>
                <PackageCheck size={13} /> Tổng số lượng
              </span>
              <span>
                {items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)} đơn vị
              </span>
            </div>
            <div className="aodm-payment-divider" />
            <div className="aodm-payment-row aodm-payment-total">
              <span>
                <CreditCard size={15} /> Tổng tiền phiếu nhập
              </span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="aodm-footer">
          <div className="aodm-footer-left">
            <CheckCircle size={14} className="text-stone-400" />
            <p className="aodm-footer-note">
              Tồn kho và giá vốn sẽ được cập nhật tự động sau khi tạo phiếu nhập kho.
            </p>
          </div>
          <div className="aodm-footer-actions">
            <button type="button" className="aodm-btn-cancel" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button
              type="submit"
              form="create-receipt-form"
              disabled={submitting}
              className="aodm-btn-submit"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang tạo phiếu...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Xác Nhận Nhập Kho</span>
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

export default CreateStockReceiptModal;
