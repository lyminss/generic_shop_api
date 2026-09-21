import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, AlertTriangle, ArrowRight, CupSoda, CheckCircle2, Tag, Wallet, QrCode, X, Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService, addressService, voucherService } from '../../services/api';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import './Cart.css';

const QR_CONFIG = {
  bankCode: 'MB',           // Mã ngân hàng (MB, VCB, TCB, ACB, ...)
  accountNo: '0123456789',  // Số tài khoản của quán
  accountName: 'QUAN TRA SUA',
};

const buildVietQrUrl = (amount, orderId) => {
  const desc = encodeURIComponent(`TT don ${orderId || 'MinTea'}`);
  return `https://img.vietqr.io/image/${QR_CONFIG.bankCode}-${QR_CONFIG.accountNo}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=${encodeURIComponent(QR_CONFIG.accountName)}`;
};

const Cart = () => {
  const { cart, updateQuantity, removeItem, fetchCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('TAKEAWAY'); // TAKEAWAY / DELIVERY
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH / QR_TRANSFER
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherInfo, setVoucherInfo] = useState(null); // { computedDiscount, message }
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchAddresses();
    fetchPublicVouchers();
  }, []);

  const fetchPublicVouchers = async () => {
    try {
      const res = await voucherService.getPublic();
      setAvailableVouchers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch public vouchers", err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getMyAddresses();
      setAddresses(res.data || []);
      if (res.data && res.data.length > 0) {
        const defaultAddr = res.data.find(a => a.default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setSelectedAddressId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses for checkout");
    }
  };

  const subtotal = cart?.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
  const shippingFee = fulfillmentType === 'DELIVERY' ? 15000 : 0;
  const discount = voucherInfo?.computedDiscount || 0;
  const grandTotal = subtotal + shippingFee - discount;

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await voucherService.validate(voucherInput.trim(), subtotal + shippingFee);
      setVoucherInfo(res.data);
      setVoucherCode(voucherInput.trim().toUpperCase());
      toast.success(res.data.message || 'Voucher hợp lệ!');
    } catch (err) {
      setVoucherInfo(null);
      setVoucherCode('');
      toast.error(err.response?.data || 'Mã voucher không hợp lệ.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherInfo(null);
    setVoucherCode('');
    setVoucherInput('');
  };

  const handleQuickApply = async (code) => {
    setVoucherInput(code);
    setVoucherLoading(true);
    try {
      const res = await voucherService.validate(code, subtotal + shippingFee);
      setVoucherInfo(res.data);
      setVoucherCode(code.trim().toUpperCase());
      toast.success(res.data.message || 'Voucher hợp lệ!');
    } catch (err) {
      setVoucherInfo(null);
      setVoucherCode('');
      toast.error(err.response?.data || 'Mã voucher không hợp lệ.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;

    if (fulfillmentType === 'DELIVERY' && !selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng. Nếu chưa có, hãy cập nhật trong trang Hồ sơ.');
      return;
    }

    if (paymentMethod === 'QR_TRANSFER') {
      setShowQrModal(true);
      return;
    }

    await submitOrder();
  };

  const submitOrder = async () => {
    let shippingInfo = 'Nhận tại quầy MinTea';
    if (fulfillmentType === 'DELIVERY') {
      const selectedAddr = addresses.find(a => a.id.toString() === selectedAddressId.toString());
      if (selectedAddr) {
        shippingInfo = `Giao tận nơi: ${selectedAddr.recipientName} - ${selectedAddr.phone} - ${selectedAddr.fullAddress}`;
      }
    }

    setCheckoutLoading(true);
    try {
      await orderService.checkout({
        shippingAddress: shippingInfo,
        paymentMethod,
        voucherCode: voucherCode || undefined,
      });
      await fetchCart();
      toast.success("Đặt món thành công! Barista đang chuẩn bị đồ uống cho bạn.");
      navigate('/profile?tab=orders');
    } catch (err) {
      console.error("Checkout failed", err);
      toast.error(err.response?.data || "Đặt món thất bại. Vui lòng thử lại.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQrConfirm = async () => {
    setShowQrModal(false);
    await submitOrder();
  };

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container py-16">
        <div className="cart-empty glass-card animate-fade-in">
          <CupSoda size={64} className="text-stone-400 mb-3" />
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Bạn chưa thêm ly trà nào vào giỏ. Hãy chọn cho mình những món nước thơm ngon nào!</p>
          <Link to="/menu" className="btn-brand mt-4">
            Khám phá Thực đơn ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container container animate-fade-in">
      <div className="cart-header">
        <h1 className="page-title">Giỏ Hàng Đồ Uống</h1>
        <span className="cart-item-count">{cart.items.length} món nước trong giỏ</span>
      </div>

      <div className="cart-layout">
        {/* Left Item List */}
        <div className="cart-items">
          {cart.items.map(item => (
            <div key={item.id} className="cart-item glass-card">
              <div className="item-image">
                {item.image ? (
                  <img src={item.image} alt={item.productName} />
                ) : (
                  <div className="image-placeholder">🧋</div>
                )}
              </div>

              <div className="item-details">
                <h3 className="item-name">{item.productName}</h3>
                {(item.options || item.notes) && (
                  <span className="item-notes-badge">✨ {item.options || item.notes}</span>
                )}
                <p className="item-price">{formatPrice(item.price)}</p>
              </div>

              <div className="item-actions">
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Giảm"
                  >
                    <Minus size={15} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Tăng"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                  title="Xóa ly nước này"
                  aria-label="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Checkout Summary Panel */}
        <div className="cart-summary glass-card">
          <h3>Tóm Tắt Đơn Hàng</h3>

          {/* Fulfillment method selector */}
          <div className="fulfillment-toggle">
            <button
              className={`toggle-btn ${fulfillmentType === 'TAKEAWAY' ? 'active' : ''}`}
              onClick={() => setFulfillmentType('TAKEAWAY')}
            >
              🏃 Mang Đi / Quầy
            </button>
            <button
              className={`toggle-btn ${fulfillmentType === 'DELIVERY' ? 'active' : ''}`}
              onClick={() => setFulfillmentType('DELIVERY')}
            >
              🛵 Giao Tận Nơi
            </button>
          </div>

          {/* Address select for Delivery */}
          {fulfillmentType === 'DELIVERY' && (
            <div className="shipping-address-box">
              <div className="shipping-label">
                <MapPin size={14} /> Giao Đến Địa Chỉ
              </div>
              {addresses.length > 0 ? (
                <select
                  className="address-select"
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.recipientName} - {addr.fullAddress.substring(0, 26)}...
                    </option>
                  ))}
                </select>
              ) : (
                <Link to="/profile" className="shipping-missing">
                  <AlertTriangle size={14} /> Chưa có địa chỉ saved — click để thêm
                </Link>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="payment-method-box">
            <p className="payment-label">
              <Wallet size={14} /> Phương Thức Thanh Toán
            </p>
            <div className="fulfillment-toggle">
              <button
                className={`toggle-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                💵 Tiền Mặt
              </button>
              <button
                className={`toggle-btn ${paymentMethod === 'QR_TRANSFER' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('QR_TRANSFER')}
              >
                <QrCode size={14} /> Chuyển Khoản QR
              </button>
            </div>
          </div>

          {/* Voucher Input */}
          <div className="voucher-box">
            <p className="voucher-label">
              <Tag size={14} /> Mã Giảm Giá
            </p>
            {voucherInfo ? (
              <div className="voucher-applied">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="voucher-code-tag">{voucherCode}</span>
                    <span className="voucher-discount-text">–{formatPrice(discount)}</span>
                  </div>
                  {voucherInfo.appliedCap && (
                    <div style={{ fontSize: '11px', color: '#b45309', marginTop: '3px', fontWeight: 600 }}>
                      ⚠️ Đã áp dụng mức giảm tối đa: {formatPrice(voucherInfo.maxDiscountAmount || voucherInfo.maxDiscount)}
                    </div>
                  )}
                  {voucherInfo.message && (
                    <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                      {voucherInfo.message}
                    </div>
                  )}
                </div>
                <button className="voucher-remove-btn" onClick={handleRemoveVoucher} title="Hủy mã này">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="voucher-input-row">
                  <input
                    type="text"
                    placeholder="Nhập mã (VD: MINTEA20)..."
                    className="voucher-input"
                    value={voucherInput}
                    onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                  />
                  <button
                    className="voucher-apply-btn"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading || !voucherInput.trim()}
                  >
                    {voucherLoading ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>

                {/* Available Public Vouchers List */}
                {availableVouchers.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> Mã khuyến mãi đang có:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                      {availableVouchers.map(v => {
                        const maxCap = v.maxDiscountAmount || v.maxDiscount;
                        const minOrd = v.minOrderValue != null ? v.minOrderValue : (v.minOrderAmount || 0);
                        return (
                          <div
                            key={v.id || v.code}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          >
                            <div>
                              <strong style={{ color: '#b45309', letterSpacing: '0.5px' }}>{v.code}</strong>
                              <div style={{ fontSize: '11px', color: '#78350f' }}>
                                {v.discountType === 'PERCENT'
                                  ? `Giảm ${v.discountValue}%${maxCap ? ` (tối đa ${formatPrice(maxCap)})` : ''}`
                                  : `Giảm ${formatPrice(v.discountValue)}`}
                                {minOrd > 0 ? ` • Đơn từ ${formatPrice(minOrd)}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickApply(v.code)}
                              disabled={voucherLoading}
                              style={{
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#f59e0b',
                                color: '#fff',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Dùng
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Price Summary */}
          <div className="summary-row">
            <span>Tiền nước</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Phí giao hàng</span>
            <span>{shippingFee === 0 ? <strong className="text-emerald-700">Freeship Quầy</strong> : formatPrice(shippingFee)}</span>
          </div>

          {discount > 0 && (
            <div className="summary-row discount-row">
              <span>🎟️ Giảm giá ({voucherCode})</span>
              <span className="discount-amount">–{formatPrice(discount)}</span>
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-row total">
            <span>Tổng Thanh Toán</span>
            <span className="total-amount">{formatPrice(grandTotal)}</span>
          </div>

          <button
            className="btn-brand checkout-btn"
            onClick={handleCheckout}
            disabled={checkoutLoading || (fulfillmentType === 'DELIVERY' && !selectedAddressId)}
          >
            {checkoutLoading ? 'Đang gửi đơn hàng...' : (
              <>
                {paymentMethod === 'QR_TRANSFER' ? <><QrCode size={18} /> Xem QR & Đặt Món</> : <>Xác Nhận Đặt Món <ArrowRight size={18} /></>}
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQrModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal-panel" onClick={e => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>📲 Quét QR Chuyển Khoản</h3>
              <button onClick={() => setShowQrModal(false)}><X size={20} /></button>
            </div>
            <p className="qr-modal-subtitle">
              Chuyển khoản <strong className="qr-amount">{formatPrice(grandTotal)}</strong> để xác nhận đơn hàng
            </p>
            <div className="qr-code-wrap">
              <img
                src={buildVietQrUrl(grandTotal, 'MinTea')}
                alt="QR chuyển khoản"
                className="qr-code-img"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="qr-bank-info">
              <p>🏦 Ngân hàng: <strong>{QR_CONFIG.bankCode}</strong></p>
              <p>💳 Số TK: <strong>{QR_CONFIG.accountNo}</strong></p>
              <p>👤 Tên TK: <strong>{QR_CONFIG.accountName}</strong></p>
            </div>
            <p className="qr-modal-note" style={{ fontSize: '0.78rem', color: '#b45309', background: '#fef3c7', padding: '0.5rem 0.75rem', borderRadius: '6px', textAlign: 'left', lineHeight: 1.4 }}>
              ⚠️ Vui lòng chuyển khoản đúng số tiền. Đơn hàng sẽ vào trạng thái <strong>Chờ thu ngân kiểm tra tiền</strong> trước khi chuyển cho Barista pha chế.
            </p>
            <div className="qr-modal-actions">
              <button className="qr-btn-cancel" onClick={() => setShowQrModal(false)}>
                Hủy
              </button>
              <button className="btn-brand qr-btn-confirm" onClick={handleQrConfirm} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 size={16} className="animate-spin" /> : 'Xác Nhận Đã Chuyển Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
