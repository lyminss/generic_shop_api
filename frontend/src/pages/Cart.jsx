import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, AlertTriangle, ArrowRight, CupSoda, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService, addressService } from '../services/api';
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeItem, fetchCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('TAKEAWAY'); // TAKEAWAY / DELIVERY
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchAddresses();
  }, []);

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

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;

    if (fulfillmentType === 'DELIVERY' && !selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng. Nếu chưa có, hãy cập nhật trong trang Hồ sơ.');
      return;
    }

    let shippingInfo = 'Nhận tại quầy Túc Tắc Tea';
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

  const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = fulfillmentType === 'DELIVERY' ? 15000 : 0;
  const grandTotal = subtotal + shippingFee;

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
                {item.notes && (
                  <span className="item-notes-badge">📝 {item.notes}</span>
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

          <div className="summary-row">
            <span>Tiền nước</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Phí giao hàng</span>
            <span>{shippingFee === 0 ? <strong className="text-emerald-700">Freeship Quầy</strong> : formatPrice(shippingFee)}</span>
          </div>

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
                Xác Nhận Đặt Món <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

