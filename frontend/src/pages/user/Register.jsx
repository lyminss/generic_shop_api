import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!firstName.trim()) {
      setError('Vui lòng nhập Tên của bạn.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${lastName.trim()} ${firstName.trim()}`.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success('Đăng ký tài khoản MinTea thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const errMsg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper animate-fade-in">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-brand-badge">🧋</div>
          <h1 className="auth-card-title">MinTea</h1>
          <p className="auth-card-subtitle">Tạo tài khoản để nhận ưu đãi & tích lũy điểm thưởng</p>
        </div>

        {/* Tab switch */}
        <div className="auth-nav-tabs">
          <Link to="/login" className="auth-nav-tab">
            Đăng nhập
          </Link>
          <button type="button" className="auth-nav-tab is-active">
            Đăng ký
          </button>
        </div>

        {/* Alert Error Box */}
        {error && (
          <div className="auth-alert error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Sign-Up Form */}
        <form onSubmit={handleSubmit} className="auth-form-layout" noValidate={false}>
          {/* Split Name Fields: Họ & Tên */}
          <div className="auth-row-split">
            <div className="auth-field-group">
              <label htmlFor="reg-lastname">Họ & Tên đệm</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="reg-lastname"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="auth-input-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nguyễn Văn"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="reg-firstname">Tên <span style={{ color: '#EF4444' }}>*</span></label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-firstname"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="auth-input-control"
                  style={{ paddingLeft: '1rem' }}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="An"
                />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="auth-field-group">
            <label htmlFor="reg-phone">Số điện thoại</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Phone size={18} />
              </span>
              <input
                id="reg-phone"
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="auth-input-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901 234 567"
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field-group">
            <label htmlFor="reg-email">Địa chỉ Email <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={18} />
              </span>
              <input
                id="reg-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                className="auth-input-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tenban@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label htmlFor="reg-password">Mật khẩu <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reg-password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="auth-input-control has-toggle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                className="auth-pw-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="auth-field-group">
            <label htmlFor="reg-confirm-password">Xác nhận mật khẩu <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reg-confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="auth-input-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Đang khởi tạo tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng ký tài khoản</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Prompt */}
        <div className="auth-footer-prompt">
          Đã có tài khoản?
          <Link to="/login" className="auth-footer-link">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
