import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import './Auth.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnContainerRef = useRef(null);

  // Smart redirect after successful auth
  const handleRedirect = (role) => {
    const fromPath = location.state?.from?.pathname;
    if (role === 'ADMIN') {
      navigate(fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin', { replace: true });
    } else if (role === 'STAFF') {
      navigate(fromPath && fromPath.startsWith('/staff') ? fromPath : '/staff', { replace: true });
    } else if (role === 'BARISTA') {
      navigate(fromPath && fromPath.startsWith('/barista') ? fromPath : '/barista', { replace: true });
    } else {
      navigate(fromPath || '/', { replace: true });
    }
  };

  // Auto redirect if already logged in
  useEffect(() => {
    if (user) {
      handleRedirect(user.role);
    }
  }, [user]);

  // Google Identity Services (GIS) integration
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Callback called by GIS after user picks a Google account
    const handleGoogleCallback = async (response) => {
      if (!response?.credential) return;
      setLoading(true);
      setError('');
      try {
        const profile = await googleLogin(response.credential);
        toast.success(`Chào mừng bạn, ${profile?.firstName || 'Khách hàng'}!`);
        handleRedirect(profile?.role);
      } catch (err) {
        setError(err.response?.data || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    const initGoogleSignIn = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        itp_support: true,
      });

      // Render the official Google button inside the container div
      if (googleBtnContainerRef.current) {
        // Clear any previously rendered button to avoid duplicates on hot-reload
        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnContainerRef.current.offsetWidth || 380,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'vi',
        });
      }
    };

    const loadGoogleScript = () => {
      // Script already loaded — just init
      if (window.google?.accounts?.id) {
        initGoogleSignIn();
        return;
      }

      // Already injected but not ready yet — wait for onload
      const existing = document.getElementById('google-gsi-script');
      if (existing) {
        existing.addEventListener('load', initGoogleSignIn, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.head.appendChild(script);
    };

    loadGoogleScript();

    // Re-init if container is re-mounted (React Strict Mode double-invoke)
    return () => {
      if (window.google?.accounts?.id) {
        try { window.google.accounts.id.cancel(); } catch (_) {}
      }
    };
  }, [GOOGLE_CLIENT_ID]);



  // Normal email & password submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userProfile = await login(email, password);
      toast.success(`Chào mừng bạn trở lại, ${userProfile?.firstName || 'Quý khách'}!`);
      handleRedirect(userProfile?.role);
    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : 'Đăng nhập thất bại. Vui lòng kiểm tra lại email & mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Fallback Google Sign-In button (handles demo testing if no GOOGLE_CLIENT_ID configured, or opens prompt)
  const handleGoogleClick = async () => {
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // Demo Mode Google Login: simulate Google profile
    setLoading(true);
    try {
      const demoGoogleProfile = {
        email: 'google.customer@mintea.vn',
        name: 'Minh Tuấn (Google)',
        givenName: 'Tuấn',
        familyName: 'Minh',
      };
      const profile = await googleLogin('', demoGoogleProfile);
      toast.success(`Đăng nhập Google thành công! Chào ${profile?.firstName || 'Minh Tuấn'}`);
      handleRedirect(profile?.role);
    } catch (err) {
      setError('Lỗi khi đăng nhập bằng Google.');
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
          <p className="auth-card-subtitle">Hương vị trà thủ công & cà phê nguyên bản</p>
        </div>

        {/* Tab switch between Login & Register */}
        <div className="auth-nav-tabs">
          <button type="button" className="auth-nav-tab is-active">
            Đăng nhập
          </button>
          <Link to="/register" className="auth-nav-tab">
            Đăng ký
          </Link>
        </div>

        {/* Alert Error Box */}
        {error && (
          <div className="auth-alert error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Main Sign-In Form */}
        <form onSubmit={handleSubmit} className="auth-form-layout" noValidate={false}>
          <div className="auth-field-group">
            <label htmlFor="login-email">Địa chỉ Email</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
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

          <div className="auth-field-group">
            <label htmlFor="login-password">Mật khẩu</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="auth-input-control has-toggle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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

          <div className="auth-row-options">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>HOẶC ĐĂNG NHẬP BẰNG</span>
        </div>

        {/* Google Sign-In Section */}
        {GOOGLE_CLIENT_ID ? (
          /* Official Google GIS button — rendered into this div by the GIS SDK */
          <div
            ref={googleBtnContainerRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: '44px',
              marginBottom: '0.25rem',
            }}
          />
        ) : (
          /* Fallback custom button (demo/no CLIENT_ID configured) */
          <button
            type="button"
            onClick={handleGoogleClick}
            className="auth-google-btn"
            disabled={loading}
          >
            <svg className="auth-google-logo" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        )}




        {/* Footer Prompt */}
        <div className="auth-footer-prompt">
          Chưa có tài khoản?
          <Link to="/register" className="auth-footer-link">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
