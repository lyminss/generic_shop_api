import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { productService, orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import { TableSkeleton, CardSkeleton, EmptyState, ErrorState } from '../../components/common/StateViews';
import {
  BellRing, Plus, Minus, Trash2,
  CheckCircle, Clock, Search, ShoppingCart,
  Printer, Check, XCircle, RefreshCw,
} from 'lucide-react';
import './StaffDashboard.css';


// Derive active tab from URL path
const getTabFromPath = (pathname) => {
  if (pathname.includes('new-orders')) return 'new_orders';
  if (pathname.includes('all-orders')) return 'all_orders';
  return 'pos';
};

const StaffDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const toast = useToast();

  // Sync tab when URL changes (e.g., sidebar NavLink click)
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // POS State
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNote, setTableNote] = useState('');
  const [submittingPos, setSubmittingPos] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    }
  }, [toast]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await orderService.getAllOrders();
      setOrders(res.data || []);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchProducts, fetchOrders]);


  // POS Cart Operations
  const handleAddToCart = (prod) => {
    if (prod.stockQuantity === 0) { toast.error('Món này đã hết hàng'); return; }
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearPosCart = () => {
    setCartItems([]);
    setCustomerName('');
    setTableNote('');
  };

  const handleCheckoutPos = async () => {
    if (cartItems.length === 0) { toast.error('Vui lòng chọn ít nhất 1 món ăn'); return; }
    setSubmittingPos(true);
    try {
      const shippingAddress = `Đơn tại quầy POS - Khách: ${customerName || 'Khách vãng lai'}${tableNote ? ` (Ghi chú: ${tableNote})` : ''}`;
      const payload = {
        shippingAddress,
        customerName: customerName || 'Khách vãng lai',
        note: tableNote,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };
      await orderService.createPosOrder(payload);
      toast.success('Tạo đơn tại quầy thành công!');
      handleClearPosCart();
      fetchOrders();
    } catch (err) {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Không thể tạo đơn hàng tại quầy');
    } finally {
      setSubmittingPos(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatus(orderId, 'PROCESSING');
      toast.success(`Đã xác nhận đơn #${orderId} — chuyển cho Barista!`);
      fetchOrders();
    } catch {
      toast.error('Không thể cập nhật trạng thái đơn');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Xác nhận hủy đơn #${orderId}?`)) return;
    try {
      await orderService.updateOrderStatus(orderId, 'CANCEL');
      toast.success(`Đã hủy đơn #${orderId}`);
      fetchOrders();
    } catch {
      toast.error('Không thể hủy đơn hàng');
    }
  };

  const posTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const newOrdersList = orders.filter(o => o.orderStatus === 'NEW');
  const filteredProducts = products.filter(p =>
    (activeCategory === '' || p.category === activeCategory) &&
    (search === '' || p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="staff-container animate-fade-in">

      {/* ================= TAB: POS GỌI MÓN ================= */}
      {activeTab === 'pos' && (
        <>
          <div className="staff-page-header">
            <div>
              <h2 className="staff-page-title">🛒 POS Gọi Món Tại Quầy</h2>
              <p className="staff-page-sub">Chọn món, nhập thông tin khách & tạo đơn</p>
            </div>
          </div>

          <div className="pos-layout">
            {/* Left: Products */}
            <div className="pos-products-panel">
              <div className="pos-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {categories.length > 0 && (
                <div className="pos-category-pills">
                  <button
                    className={`pos-pill${activeCategory === '' ? ' active' : ''}`}
                    onClick={() => setActiveCategory('')}
                  >Tất cả</button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={`pos-pill${activeCategory === cat ? ' active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >{cat}</button>
                  ))}
                </div>
              )}

              <div className="pos-grid">
                {filteredProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddToCart(prod)}
                    className={`pos-prod-card${prod.stockQuantity === 0 ? ' out-of-stock' : ''}`}
                  >
                    <div className="pos-prod-img">
                      {prod.image ? <img src={prod.image} alt={prod.name} /> : <span>🧋</span>}
                    </div>
                    <div className="pos-prod-info">
                      <h4>{prod.name}</h4>
                      <p className="price">{formatPrice(prod.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Cart / Bill */}
            <div className="pos-cart-panel">
              <div className="pos-cart-header">
                <h3>📋 Đơn Hàng Tại Quầy</h3>
                {cartItems.length > 0 && (
                  <button onClick={handleClearPosCart} className="pos-clear-btn">Xóa tất cả</button>
                )}
              </div>

              <div className="pos-inputs">
                <input
                  type="text"
                  className="pos-input-field"
                  placeholder="Tên khách hàng (tùy chọn)..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  className="pos-input-field"
                  placeholder="Số bàn / Ghi chú (Ít đá, 50% đường)..."
                  value={tableNote}
                  onChange={e => setTableNote(e.target.value)}
                />
              </div>

              <div className="pos-cart-items">
                {cartItems.length === 0 ? (
                  <div className="pos-empty">
                    <ShoppingCart size={36} />
                    <p>Chưa có món nào</p>
                    <span>Bấm vào món bên trái để thêm</span>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.product.id} className="pos-cart-item">
                      <div className="pos-cart-item-info">
                        <p className="pos-item-name">{item.product.name}</p>
                        <p className="pos-item-price">{formatPrice(item.product.price)}</p>
                      </div>
                      <div className="pos-qty-controls">
                        <button onClick={() => handleUpdateQuantity(item.product.id, -1)}><Minus size={12} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.product.id, 1)}><Plus size={12} /></button>
                      </div>
                      <span className="pos-item-subtotal">{formatPrice(item.product.price * item.quantity)}</span>
                      <button onClick={() => handleRemoveFromCart(item.product.id)} className="pos-remove-btn">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pos-cart-footer">
                <div className="pos-total-row">
                  <span>Tổng thanh toán</span>
                  <strong>{formatPrice(posTotal)}</strong>
                </div>
                <button
                  onClick={handleCheckoutPos}
                  disabled={submittingPos || cartItems.length === 0}
                  className="pos-checkout-btn"
                >
                  <Printer size={16} />
                  {submittingPos ? 'Đang tạo đơn...' : 'Tạo Đơn & Thanh Toán'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= TAB: ĐƠN MỚI CẦN XÁC NHẬN ================= */}
      {activeTab === 'new_orders' && (
        <div className="animate-fade-in">
          <div className="staff-page-header">
            <div>
              <h2 className="staff-page-title">🛎️ Đơn Mới Cần Xác Nhận</h2>
              <p className="staff-page-sub">Xác nhận để chuyển đơn cho quầy Barista pha chế</p>
            </div>
            <button onClick={fetchOrders} className="refresh-btn">
              <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
              Làm mới ({newOrdersList.length})
            </button>
          </div>

          {loadingOrders ? (
            <CardSkeleton count={3} />
          ) : newOrdersList.length === 0 ? (
            <EmptyState
              title="Không có đơn mới cần xác nhận"
              description="Tất cả đơn hàng mới đã được xác nhận và chuyển cho Barista pha chế 🎉"
              icon={CheckCircle}
              actionText="Tải lại danh sách"
              onAction={fetchOrders}
            />
          ) : (
            <div className="orders-cards-grid">

              {newOrdersList.map(ord => (
                <div key={ord.id} className="order-card-staff">
                  <div className="order-card-header">
                    <div>
                      <span className="order-id">Đơn #{ord.id}</span>
                      <span className="order-time">{new Date(ord.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <span className="badge-new">Mới</span>
                  </div>
                  <div className="order-card-address">
                    <strong>Giao đến:</strong> {ord.shippingAddress || '—'}
                  </div>
                  <div className="order-card-items">
                    {ord.items?.map(i => (
                      <div key={i.id} className="item-row flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{i.productName} × {i.quantity}</span>
                          {i.preparedStatus === 'READY' ? (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#dcfce7', color: '#166534', borderRadius: '99px', fontWeight: 700 }}>
                              ✓ Đã pha
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '99px', fontWeight: 700 }}>
                              ⏳ Chờ pha
                            </span>
                          )}
                        </div>
                        <span>{formatPrice(i.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <div className="total-price">
                      <span>Tổng tiền:</span>
                      <strong>{formatPrice(ord.totalPrice)}</strong>
                    </div>
                    <div className="order-actions">
                      <button onClick={() => handleCancelOrder(ord.id)} className="btn-cancel">
                        <XCircle size={15} /> Hủy
                      </button>
                      <button onClick={() => handleConfirmOrder(ord.id)} className="btn-confirm">
                        <Check size={15} /> Xác nhận → Barista
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: TẤT CẢ ĐƠN HÀNG ================= */}
      {activeTab === 'all_orders' && (
        <div className="animate-fade-in">
          <div className="staff-page-header">
            <div>
              <h2 className="staff-page-title">📋 Tất Cả Đơn Hàng</h2>
              <p className="staff-page-sub">Tổng quan toàn bộ đơn hàng trong hệ thống ({orders.length} đơn)</p>
            </div>
            <button onClick={fetchOrders} className="refresh-btn">
              <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>

          <div className="staff-panel-box">
            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Thời gian</th>
                    <th>Địa chỉ / Ghi chú</th>
                    <th>Món & Tiến độ Barista</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOrders ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <EmptyState
                          title="Chưa có đơn hàng nào"
                          description="Hệ thống hiện chưa ghi nhận đơn hàng nào."
                          onAction={fetchOrders}
                          actionText="Tải lại"
                        />
                      </td>
                    </tr>
                  ) : (
                    orders.map(ord => (
                      <tr key={ord.id}>
                        <td className="font-bold">#{ord.id}</td>
                        <td className="text-muted">{new Date(ord.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="text-truncate">{ord.shippingAddress}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {(() => {
                              const readyQty = ord.items?.filter(i => i.preparedStatus === 'READY').reduce((acc, i) => acc + i.quantity, 0) || 0;
                              const totalQty = ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                              const allDone = totalQty > 0 && readyQty === totalQty;
                              return (
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px', color: allDone ? '#15803d' : '#b45309' }}>
                                  {allDone ? `✓ ${readyQty}/${totalQty} ly đã pha` : `⏳ ${readyQty}/${totalQty} ly đã pha`}
                                </div>
                              );
                            })()}
                            {ord.items?.map(i => (
                              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                                <span style={{ fontWeight: 600 }}>{i.quantity}× {i.productName}</span>
                                {i.preparedStatus === 'READY' ? (
                                  <span style={{ fontSize: '0.65rem', padding: '0px 5px', background: '#dcfce7', color: '#166534', borderRadius: '99px', fontWeight: 700 }}>
                                    ✓ Đã pha
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', padding: '0px 5px', background: '#fef3c7', color: '#92400e', borderRadius: '99px', fontWeight: 700 }}>
                                    ⏳ Chờ
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="text-green">{formatPrice(ord.totalPrice)}</td>
                        <td>
                          <span className={`status-badge badge-${ord.orderStatus?.toLowerCase()}`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td>
                          {ord.orderStatus === 'NEW' && (
                            <button
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="table-action-btn confirm"
                            >Xác nhận</button>
                          )}
                          {ord.orderStatus === 'PROCESSING' && (
                            <span className="text-amber">🍵 Đang pha chế</span>
                          )}
                          {ord.orderStatus === 'SHIPPING' && (
                            <span className="text-emerald font-semibold">🛵 Chờ giao/trả</span>
                          )}
                          {ord.orderStatus === 'COMPLETED' && (
                            <span className="text-green">✓ Hoàn thành</span>
                          )}
                          {ord.orderStatus === 'CANCEL' && (
                            <span className="text-red">✕ Đã hủy</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffDashboard;
