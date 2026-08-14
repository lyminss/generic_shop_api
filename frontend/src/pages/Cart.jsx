import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, AlertTriangle } from 'lucide-react';
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
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getMyAddresses();
      setAddresses(res.data);
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

    if (!selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng. Nếu chưa có, hãy cập nhật trong trang Cá nhân.');
      return;
    }

    const selectedAddr = addresses.find(a => a.id.toString() === selectedAddressId.toString());
    if (!selectedAddr) return;

    setCheckoutLoading(true);
    try {
      await orderService.checkout({
        shippingAddress: `${selectedAddr.recipientName} - ${selectedAddr.phone} - ${selectedAddr.fullAddress}`,
      });
      await fetchCart();
      toast.success("Đặt món thành công! Đơn hàng đang được chuẩn bị.");
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
      <div className="cart-empty animate-fade-in">
        <ShoppingBag size={64} className="empty-icon" />
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Bạn chưa thêm món ăn nào vào giỏ hàng.</p>
        <Link to="/" className="btn-primary mt-4">Xem thực đơn ngay</Link>
      </div>
    );
  }

  const total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="cart-container animate-fade-in">
      <h1 className="page-title">Giỏ hàng</h1>
      
      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map(item => (
            <div key={item.id} className="cart-item glass-panel">
              <div className="item-image">
                {item.image ? (
                  <img src={item.image} alt={item.productName} />
                ) : (
                  <div className="image-placeholder">Chưa có ảnh</div>
                )}
              </div>
              <div className="item-details">
                <h3>{item.productName}</h3>
                <p className="item-price">{formatPrice(item.price)}</p>
              </div>
              
              <div className="item-actions">
                <div className="quantity-controls">
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  ><Minus size={16} /></button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  ><Plus size={16} /></button>
                </div>
                
                <button 
                  className="remove-btn" 
                  onClick={() => removeItem(item.id)}
                  title="Xóa món ăn"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary glass-panel">
          <h3>Tóm tắt đơn hàng</h3>
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-row">
            <span>Phí giao hàng</span>
            <span style={{ color: 'var(--success-color)' }}>Miễn phí</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Tổng cộng</span>
            <span>{formatPrice(total)}</span>
          </div>

          {/* Shipping address display */}
          <div className="shipping-address-box">
            <div className="shipping-label">
              <MapPin size={14} /> Giao hàng đến
            </div>
            {addresses.length > 0 ? (
              <select 
                className="input-field address-select"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {addr.recipientName} - {addr.fullAddress.substring(0, 30)}...
                  </option>
                ))}
              </select>
            ) : (
              <Link to="/profile" className="shipping-missing">
                <AlertTriangle size={14} />
                Chưa thiết lập địa chỉ — click để thêm
              </Link>
            )}
          </div>

          <button 
            className="btn-primary checkout-btn" 
            onClick={handleCheckout}
            disabled={checkoutLoading || !selectedAddressId}
          >
            {checkoutLoading ? 'Đang xử lý...' : 'Đặt món ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
