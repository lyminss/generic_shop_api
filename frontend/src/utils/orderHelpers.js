import { Store, Globe } from 'lucide-react';

/* ─── Status Config (MinTea Theme: Taro, Matcha, Caramel, Rose) ─── */
export const ORDER_STATUS_CONFIG = {
  NEW: {
    label: 'Chờ duyệt',
    badgeCls: 'badge-new',
    dotCls: 'bg-amber-500',
    rowBorderCls: 'row-status-new',
  },
  PROCESSING: {
    label: 'Đang pha chế',
    badgeCls: 'badge-processing',
    dotCls: 'bg-purple-600',
    rowBorderCls: 'row-status-processing',
  },
  SHIPPING: {
    label: 'Đang giao',
    badgeCls: 'badge-shipping',
    dotCls: 'bg-teal-600',
    rowBorderCls: 'row-status-shipping',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeCls: 'badge-completed',
    dotCls: 'bg-emerald-600',
    rowBorderCls: 'row-status-completed',
  },
  CANCEL: {
    label: 'Đã hủy',
    badgeCls: 'badge-cancel',
    dotCls: 'bg-rose-500',
    rowBorderCls: 'row-status-cancel',
  },
};

export const normalizeOrderStatus = (status) => {
  if (!status) return 'NEW';
  const s = String(status).toUpperCase();
  if (s === 'PENDING') return 'NEW';
  if (s === 'CANCELLED') return 'CANCEL';
  if (s === 'DELIVERING' || s === 'READY') return 'SHIPPING';
  return s;
};

export const getOrderChannel = (addr) => {
  if (!addr) return { label: 'Online App', isPos: false, icon: Globe };
  const l = addr.toLowerCase();
  return l.includes('pos') || l.includes('tại quầy') || l.includes('quầy')
    ? { label: 'Tại quầy (POS)', isPos: true, icon: Store }
    : { label: 'Online App', isPos: false, icon: Globe };
};

/**
 * Trích xuất và phân định thông tin người đặt:
 * - Đơn tại quầy (POS): Hiển thị tên Nhân viên tạo đơn + Tên khách tại quầy
 * - Đơn trực tuyến (Online): Hiển thị tên Khách hàng đặt online + SĐT / Email
 */
export const getOrderCustomerInfo = (order) => {
  if (!order) {
    return {
      isPos: false,
      title: 'Khách hàng',
      subtitle: '—',
      badge: 'Khách online',
      staffName: null,
      customerName: 'Khách hàng',
    };
  }

  const addr = order.shippingAddress || '';
  const isPos =
    addr.toLowerCase().includes('pos') ||
    addr.toLowerCase().includes('tại quầy') ||
    addr.toLowerCase().includes('quầy') ||
    order.creatorRole === 'ROLE_STAFF';

  if (isPos) {
    // Đơn tạo tại quầy: Tên nhân viên tạo đơn
    const staffName = order.customerName || order.customerEmail?.split('@')[0] || 'Nhân viên thu ngân';
    let customerAtPos = 'Khách vãng lai';
    const match = addr.match(/Khách:\s*([^(\]]+)/i);
    if (match && match[1]?.trim()) {
      customerAtPos = match[1].trim();
    }

    return {
      isPos: true,
      title: `NV: ${staffName}`,
      subtitle: `Khách: ${customerAtPos}`,
      badge: 'Nhân viên tạo (POS)',
      staffName,
      customerName: customerAtPos,
    };
  }

  // Đơn đặt trực tuyến: Tên khách hàng đặt online
  const onlineCustomer = order.customerName || order.customerEmail?.split('@')[0] || 'Khách đặt online';
  const contact = order.customerPhone
    ? `${order.customerPhone} · ${order.customerEmail || ''}`
    : (order.customerEmail || 'Online App');

  return {
    isPos: false,
    title: onlineCustomer,
    subtitle: contact,
    badge: 'Khách online',
    staffName: null,
    customerName: onlineCustomer,
  };
};
