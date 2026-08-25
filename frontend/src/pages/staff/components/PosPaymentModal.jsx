import React, { useState, useEffect } from 'react';
import {
  Banknote,
  QrCode,
  CheckCircle,
  X,
  AlertCircle,
  ArrowRight,
  Printer,
  Check,
  Receipt,
  User,
  MessageSquare
} from 'lucide-react';
import { formatPrice } from '../../../utils/format';
import './PosPaymentModal.css';

const PosPaymentModal = ({
  isOpen,
  onClose,
  cartItems = [],
  totalPrice = 0,
  customerName = '',
  tableNote = '',
  submitting = false,
  onConfirmCheckout
}) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER'
  const [cashGiven, setCashGiven] = useState(totalPrice);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  // Sync cashGiven & fixed transfer code when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashGiven(totalPrice);
      setTransferConfirmed(false);
      setOrderCode(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, [isOpen, totalPrice]);

  if (!isOpen) return null;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - totalPrice);
  const isCashValid = cashGivenNum >= totalPrice;
  const isReadyToSubmit =
    (paymentMethod === 'CASH' && isCashValid) ||
    (paymentMethod === 'TRANSFER' && transferConfirmed);

  // Generate quick cash buttons based on total
  const getQuickCashAmounts = () => {
    const amounts = new Set();
    amounts.add(totalPrice); // Đủ tiền

    // Round up increments
    const baseAmounts = [10000, 20000, 50000, 100000, 200000, 500000];
    baseAmounts.forEach(amt => {
      if (amt >= totalPrice) {
        amounts.add(amt);
      }
    });

    // Also add next round 50k, 100k if not present
    const next50k = Math.ceil(totalPrice / 50000) * 50000;
    if (next50k > totalPrice) amounts.add(next50k);
    const next100k = Math.ceil(totalPrice / 100000) * 100000;
    if (next100k > totalPrice) amounts.add(next100k);

    return Array.from(amounts).sort((a, b) => a - b).slice(0, 6);
  };

  const handleCashGivenChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCashGiven(val ? parseInt(val, 10) : 0);
  };

  const handleComplete = () => {
    if (!isReadyToSubmit || submitting) return;

    const paymentDetails = {
      paymentMethod: paymentMethod === 'CASH' ? 'TIỀN MẶT' : 'CHUYỂN KHOẢN QR',
      amountPaid: paymentMethod === 'CASH' ? cashGivenNum : totalPrice,
      changeDue: paymentMethod === 'CASH' ? changeDue : 0,
      paymentStatus: 'PAID'
    };

    onConfirmCheckout(paymentDetails);
  };

  const transferContent = `POS ${orderCode || '1234'}`;
  const qrUrl = `https://api.vietqr.io/image/970403-040099604257-compact2.jpg?amount=${totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=NGUYEN%20LY%20DOAN%20LOC`;

  return (
    <div className="pos-payment-modal-overlay">
      <div className="pos-payment-modal">
        {/* Header */}
        <div className="pos-modal-header">
          <div className="pos-modal-header-title">
            <Receipt size={22} className="text-emerald-600" />
            <div>
              <h3>Thanh Toán Đơn Tại Quầy</h3>
              <p>Khách phải thanh toán trước khi đơn được gửi cho Barista</p>
            </div>
          </div>
          <button className="pos-modal-close" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <div className="pos-modal-body">
          {/* Left Column: Order Summary */}
          <div className="pos-modal-summary">
            <div className="summary-card">
              <h4>📋 Thông tin đơn hàng</h4>
              
              <div className="summary-customer-info">
                <div className="info-row">
                  <User size={14} />
                  <span><strong>Khách:</strong> {customerName || 'Khách vãng lai'}</span>
                </div>
                {tableNote && (
                  <div className="info-row">
                    <MessageSquare size={14} />
                    <span><strong>Ghi chú:</strong> {tableNote}</span>
                  </div>
                )}
              </div>

              <div className="summary-items-list">
                {cartItems.map(item => (
                  <div key={item.product.id} className="summary-item-row">
                    <span className="item-name">{item.product.name} × {item.quantity}</span>
                    <span className="item-price">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-total-box">
                <span>Tổng thanh toán:</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Method Selection & Processing */}
          <div className="pos-modal-methods">
            <label className="method-label">Chọn phương thức thanh toán:</label>
            <div className="method-tabs">
              <button
                type="button"
                className={`method-tab ${paymentMethod === 'CASH' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote size={18} />
                <span>Tiền mặt</span>
              </button>
              <button
                type="button"
                className={`method-tab ${paymentMethod === 'TRANSFER' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('TRANSFER')}
              >
                <QrCode size={18} />
                <span>Chuyển khoản QR</span>
              </button>
            </div>

            {/* TAB 1: TIỀN MẶT */}
            {paymentMethod === 'CASH' && (
              <div className="cash-payment-form animate-fade-in">
                <div className="cash-input-group">
                  <label>Tiền khách đưa (VNĐ):</label>
                  <div className="cash-input-wrapper">
                    <input
                      type="text"
                      className={`cash-input ${!isCashValid ? 'invalid' : ''}`}
                      value={cashGiven ? cashGiven.toLocaleString('vi-VN') : ''}
                      onChange={handleCashGivenChange}
                      placeholder="Nhập số tiền khách đưa..."
                      autoFocus
                    />
                    <span className="cash-unit">₫</span>
                  </div>
                </div>

                {/* Quick amount suggestions */}
                <div className="quick-amounts-grid">
                  {getQuickCashAmounts().map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`quick-amount-btn ${cashGivenNum === amt ? 'selected' : ''}`}
                      onClick={() => setCashGiven(amt)}
                    >
                      {amt === totalPrice ? 'Đủ tiền' : formatPrice(amt)}
                    </button>
                  ))}
                </div>

                {/* Calculation row */}
                <div className="cash-calc-box">
                  <div className="calc-row">
                    <span>Tổng cần thu:</span>
                    <strong>{formatPrice(totalPrice)}</strong>
                  </div>
                  <div className="calc-row">
                    <span>Khách đưa:</span>
                    <span>{formatPrice(cashGivenNum)}</span>
                  </div>
                  <div className="calc-divider"></div>
                  <div className="calc-row highlight">
                    <span>Tiền thối lại cho khách:</span>
                    <strong className={changeDue > 0 ? 'text-emerald' : ''}>
                      {formatPrice(changeDue)}
                    </strong>
                  </div>
                </div>

                {!isCashValid && (
                  <div className="cash-warning">
                    <AlertCircle size={15} />
                    <span>Tiền khách đưa chưa đủ! Còn thiếu {formatPrice(totalPrice - cashGivenNum)}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHUYỂN KHOẢN QR */}
            {paymentMethod === 'TRANSFER' && (
              <div className="transfer-payment-form animate-fade-in">
                <div className="qr-container">
                  <div className="qr-image-wrapper">
                    <img
                      src={qrUrl}
                      alt="VietQR Chuyển Khoản"
                      className="qr-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.getElementById('qr-fallback-box');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div id="qr-fallback-box" className="qr-fallback" style={{ display: 'none' }}>
                      <QrCode size={64} className="text-gray-400" />
                      <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Mã QR Chuyển Khoản</span>
                    </div>
                  </div>

                  <div className="qr-bank-info">
                    <div className="bank-badge">Sacombank</div>
                    <div className="bank-detail-row">
                      <span>STK:</span>
                      <strong>0400 9960 4257</strong>
                    </div>
                    <div className="bank-detail-row">
                      <span>Chủ TK:</span>
                      <strong>NGUYEN LY DOAN LOC</strong>
                    </div>
                    <div className="bank-detail-row">
                      <span>Số tiền:</span>
                      <strong className="text-emerald">{formatPrice(totalPrice)}</strong>
                    </div>
                    <div className="bank-detail-row">
                      <span>Nội dung:</span>
                      <span className="font-mono">{transferContent}</span>
                    </div>
                  </div>
                </div>

                {/* Transfer confirmation check */}
                <div
                  className={`transfer-confirm-box ${transferConfirmed ? 'confirmed' : ''}`}
                  onClick={() => setTransferConfirmed(!transferConfirmed)}
                >
                  <div className={`checkbox-custom ${transferConfirmed ? 'checked' : ''}`}>
                    {transferConfirmed && <Check size={14} />}
                  </div>
                  <div>
                    <strong>Đã nhận được tiền chuyển khoản</strong>
                    <p>Xác nhận app ngân hàng / thông báo tài khoản đã nhận đủ {formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pos-modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn-modal-submit"
            onClick={handleComplete}
            disabled={!isReadyToSubmit || submitting}
          >
            <Printer size={17} />
            {submitting ? 'Đang tạo đơn...' : '✓ Xác nhận đã thu tiền & Tạo đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosPaymentModal;
