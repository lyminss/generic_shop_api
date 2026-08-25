import { X } from 'lucide-react';
import { formatPrice } from '../../../utils/format';

const STATUS_BADGES = {
  NEW: { label: 'Đơn mới', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'Đang chuẩn bị', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  SHIPPING: { label: 'Đang giao', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCEL: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const getOrderChannel = (address) => {
  if (!address) return { label: 'Online', isPos: false, icon: '🌐', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  const lower = address.toLowerCase();
  if (lower.includes('pos') || lower.includes('tại quầy') || lower.includes('quầy')) {
    return { label: 'Tại quầy (POS)', isPos: true, icon: '🏪', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  return { label: 'Online', isPos: false, icon: '🌐', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
};

const AdminOrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const channel = getOrderChannel(order.shippingAddress);
  const statusBadge = STATUS_BADGES[order.orderStatus] || { label: order.orderStatus, cls: 'bg-stone-50 text-stone-700 border-stone-200' };
  const readyCount = order.items?.filter((i) => i.preparedStatus === 'READY').reduce((acc, i) => acc + i.quantity, 0) || 0;
  const totalCount = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const allItemsReady = totalCount > 0 && readyCount === totalCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100 bg-stone-50/90">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-lg shadow-2xs">
              #{order.id}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">Chi tiết đơn hàng #{order.id}</h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Tạo lúc {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-7">
          {/* Order Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
            <div className="flex justify-between items-center sm:block space-y-1.5">
              <span className="text-stone-500 font-medium">Kênh đặt hàng</span>
              <div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold border ${channel.cls}`}>
                  <span>{channel.icon}</span> {channel.label}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center sm:block space-y-1.5">
              <span className="text-stone-500 font-medium">Trạng thái đơn</span>
              <div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl font-bold border ${statusBadge.cls}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-stone-200/70 space-y-1.5">
              <span className="text-stone-500 font-medium block">Địa chỉ nhận hàng / Ghi chú</span>
              <p className="text-sm font-semibold text-stone-900 break-words leading-relaxed">
                {order.shippingAddress || '—'}
              </p>
            </div>
          </div>

          {/* Items & Barista progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Danh sách món ({totalCount} phần)
              </h4>
              {order.items && totalCount > 0 && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    allItemsReady
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  Barista: {readyCount}/{totalCount} ly đã pha
                </span>
              )}
            </div>

            <div className="space-y-3">
              {order.items?.map((item) => {
                const isReady = item.preparedStatus === 'READY';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-stone-50/80 hover:bg-stone-50 rounded-2xl border border-stone-200/80 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-stone-200 overflow-hidden flex-shrink-0 border border-stone-300 flex items-center justify-center text-xl shadow-2xs">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span>🧋</span>
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-stone-900 truncate">{item.productName}</p>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                              isReady
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isReady ? '✓ Đã pha' : '⏳ Chờ pha'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {formatPrice(item.price)} × <span className="font-bold text-stone-800">{item.quantity}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-stone-900 flex-shrink-0">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Total Breakdown */}
          <div className="p-5 bg-stone-900 text-white rounded-2xl flex items-center justify-between shadow-xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400">Tổng thanh toán</span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-8 py-5 border-t border-stone-100 bg-stone-50/80">
          <button
            onClick={onClose}
            className="px-7 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 text-sm font-bold rounded-2xl transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailModal;
