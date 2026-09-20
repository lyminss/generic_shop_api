import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShoppingBag, Star, Clock, Truck, ShieldCheck, ArrowRight, 
  Sparkles, CupSoda, Flame, Heart, ChevronRight, 
  MapPin, Phone, Award, Percent, Leaf, Check, Copy, Search, X
} from 'lucide-react';
import heroImage from '../assets/hero-food.jpg';
import './LandingPage.css';

const BENTO_STORIES = [
  {
    tag: 'Nguồn Cội',
    title: 'Nông Trường Bảo Lộc & Cầu Đất 1.600m',
    desc: 'Búp trà Oolong và Lài được thu hái thủ công vào rạng sáng khi sương chưa tan, giữ nguyên vẹn lớp sáp tinh dầu thơm ngọt tự nhiên.',
    metric: '1.600m',
    metricLabel: 'Độ cao cao nguyên lý tưởng',
    badge: '100% Tự Nhiên',
    icon: <Leaf className="w-5 h-5 text-emerald-500" />,
  },
  {
    tag: 'Chất Lượng',
    title: 'Sữa Tươi Thanh Trùng Nguyên Bản 100%',
    desc: 'Cam kết không sử dụng bột béo công nghiệp hay hương liệu tổng hợp. Vị béo ngọt dịu lành hoàn toàn từ nguồn sữa tươi chuẩn loại 1.',
    metric: '0%',
    metricLabel: 'Không bột béo & phụ gia',
    badge: 'An Toàn Sức Khỏe',
    icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
  },
  {
    tag: 'Tay Nghề',
    title: 'Nhiệt Độ Ủ Vàng Chuẩn 88°C - 92°C',
    desc: 'Mỗi mẻ trà được kiểm soát đồng hồ nhiệt chính xác từng giây. Chiết xuất trọn vẹn vị chát êm ái đầu lưỡi và hậu vị ngọt sâu lan tỏa.',
    metric: '92°C',
    metricLabel: 'Nhiệt độ ủ vàng hoàn hảo',
    badge: 'Thủ Công Tỉ Mỉ',
    icon: <Award className="w-5 h-5 text-rose-500" />,
  },
  {
    tag: 'Giao Nhận',
    title: 'Nắp Ép Nhiệt & Bảo Ôn Lạnh Sâu 2 Giờ',
    desc: 'Đóng gói chuyên dụng giữ nguyên lớp foam kem béo và độ giòn của đá suốt hành trình. Đồ uống đến tay tươi ngon như vừa pha tại quầy.',
    metric: '15-20’',
    metricLabel: 'Thời gian giao trung bình',
    badge: 'Hỏa Tốc',
    icon: <Truck className="w-5 h-5 text-blue-500" />,
  },
];

const TESTIMONIALS = [
  {
    name: 'Phương Linh',
    avatar: 'PL',
    role: 'Food Blogger & Khách quen',
    drink: 'Trà Sữa Oolong Nướng Kem Muối',
    rating: 5,
    comment: 'Vị trà đậm, thơm mùi khói nướng rất có chiều sâu. Lớp kem muối béo nhẹ mặn mà cực kỳ cuốn, uống hoài không thấy ngấy!',
  },
  {
    name: 'Quốc Bảo',
    avatar: 'QB',
    role: 'Nhân viên văn phòng',
    drink: 'Cà Phê Muối Hoàng Gia',
    rating: 5,
    comment: 'Sáng nào đến công ty cũng phải đặt 1 ly cà phê muối MinTea. Giao hàng cực nhanh tầm 15 phút, đá không bị tan loãng.',
  },
  {
    name: 'Khánh Vy',
    avatar: 'KV',
    role: 'Sinh viên RMIT',
    drink: 'Trà Đào Cam Sả Tươi',
    rating: 5,
    comment: 'Trà thanh mát, miếng đào giòn ngọt và mùi sả thơm tự nhiên chứ không phải vị siro hóa chất. Giá cả rất hợp lý so với chất lượng.',
  },
];

const FAQS = [
  {
    q: 'MinTea có giao hàng tận nơi không và phí giao như thế nào?',
    a: 'MinTea hỗ trợ giao hàng tận nơi nhanh chóng trong vòng 15-25 phút qua đội ngũ đối tác chuyên nghiệp. Đặc biệt miễn phí vận chuyển cho đơn hàng từ 100.000đ khi nhập mã voucher.',
  },
  {
    q: 'Tôi có thể điều chỉnh lượng đường và đá theo khẩu vị cá nhân không?',
    a: 'Hoàn toàn được! Bạn có thể tùy chọn từ 0%, 30%, 50%, 70% đến 100% đường và đá, kết hợp cùng nhiều loại topping cao cấp nấu mới mỗi ngày.',
  },
  {
    q: 'Sản phẩm của MinTea có chứa bột béo công nghiệp không?',
    a: 'MinTea cam kết 100% sử dụng sữa tươi thanh trùng thanh khiết và lá trà tự nhiên tuyển chọn từ Bảo Lộc. Hoàn toàn nói không với bột béo công nghiệp và chất bảo quản.',
  },
  {
    q: 'Bảo quản đồ uống như thế nào nếu chưa dùng ngay?',
    a: 'Đồ uống ngon nhất khi dùng trong vòng 2 giờ. Nếu chưa dùng ngay, bạn nên bảo quản trong ngăn mát tủ lạnh (đặc biệt dòng cà phê và trà sữa), và dùng hết trong ngày.',
  },
];

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Load products
  useEffect(() => {
    productService.getAll()
      .then((res) => {
        const list = (res.data || []).filter(p => p.status !== 'STOPPED');
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Filter categories list
  const categoryTabs = useMemo(() => {
    const rawCategories = products.map(p => p.category).filter(Boolean);
    const unique = Array.from(new Set(rawCategories));
    return ['ALL', ...unique];
  }, [products]);

  // Filtered showcase products
  const displayedProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
      const matchSearch = !searchQuery.trim() || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Quick add to cart handler
  const handleQuickAdd = async (product) => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để thêm món vào giỏ hàng nhé!');
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    setAddingId(product.id);
    try {
      const success = await addToCart(product.id, 1);
      if (success) {
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng! 🧋`);
      } else {
        toast.error('Không thể thêm vào giỏ. Vui lòng thử lại.');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi thêm giỏ hàng.');
    } finally {
      setAddingId(null);
    }
  };

  // Copy coupon
  const handleCopyVoucher = () => {
    navigator.clipboard.writeText('MINTEA20');
    setCopiedVoucher(true);
    toast.success('Đã sao chép mã MINTEA20 thành công! 🎉');
    setTimeout(() => setCopiedVoucher(false), 3000);
  };

  // Check store operating status (07:30 - 22:30)
  const isStoreOpen = useMemo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= 7 * 60 + 30 && minutes <= 22 * 60 + 30;
  }, []);

  return (
    <div className="landing-page">
      {/* ─────────────────────────────────────────────────────────────
          1. LIVE STORE STATUS & ANNOUNCEMENT BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="landing-topbar" role="region" aria-label="Thông báo cửa hàng">
        <div className="container topbar-inner">
          <div className="topbar-status">
            <span className={`status-dot ${isStoreOpen ? 'is-open' : 'is-closed'}`} />
            <span className="status-text">
              {isStoreOpen ? 'Đang mở cửa đón khách (07:30 - 22:30)' : 'Cửa hàng mở lại lúc 07:30 sáng'}
            </span>
          </div>
          <div className="topbar-announcement">
            <Sparkles size={14} className="text-amber-400" />
            <span>Ưu đãi thành viên: Giảm ngay 20% đơn đầu tiên với mã <strong>MINTEA20</strong></span>
          </div>
          <div className="topbar-hotline">
            <Phone size={13} />
            <span>Hotline: 1900 6868</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION — BOTANICAL ARTISANAL IMPACT
          ───────────────────────────────────────────────────────────── */}
      <section className="hero-landing" aria-label="Giới thiệu MinTea">
        <div className="hero-backdrop" />
        <img src={heroImage} alt="Trà sữa & Cà phê thủ công MinTea" className="hero-bg-img" />
        <div className="hero-ambient-glow" />

        <div className="container hero-container">
          <div className="hero-grid">
            {/* Left Content */}
            <div className="hero-content">
              <div className="hero-eyebrow">
                <Leaf size={14} className="text-emerald-400" />
                <span>Nghệ Thuật Trà Tươi & Sữa Thanh Trùng</span>
              </div>

              <h1 className="hero-heading">
                Đậm Đà Từng Búp Trà.<br />
                <span className="hero-gradient-text">Trọn Vẹn Vị Tươi Mới.</span>
              </h1>

              <p className="hero-desc">
                Chắt lọc tinh hoa từ những búp trà non cao nguyên Bảo Lộc 1.600m, hòa quyện sữa tươi thanh trùng 100%. 
                Mỗi ly trà là một tác phẩm được pha chế thủ công chuẩn xác cho từng gu thưởng thức.
              </p>

              <div className="hero-actions">
                <Link to="/menu" className="hero-btn-primary">
                  <ShoppingBag size={18} />
                  <span>Khám Phá Thực Đơn</span>
                </Link>
                <a href="#why-mintea" className="hero-btn-secondary">
                  <span>Câu Chuyện MinTea</span>
                  <ChevronRight size={16} />
                </a>
              </div>

              {/* Verified Metrics Badges */}
              <div className="hero-metrics-grid">
                <div className="metric-box">
                  <span className="metric-value">
                    4.9 <Star size={16} className="inline fill-amber-400 text-amber-400" />
                  </span>
                  <span className="metric-label">1.500+ Đánh giá 5 sao</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-box">
                  <span className="metric-value">15-20’</span>
                  <span className="metric-label">Giao nhanh giữ nhiệt</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-box">
                  <span className="metric-value">100%</span>
                  <span className="metric-label">Lá trà non cao nguyên</span>
                </div>
              </div>
            </div>

            {/* Right Hero Spotlight Card */}
            <div className="hero-spotlight-col">
              <div className="spotlight-card glass-card">
                <div className="spotlight-badge">
                  <Flame size={14} className="text-amber-500 fill-amber-500" />
                  <span>Món Signature Bán Chạy Nhất</span>
                </div>

                <div className="spotlight-img-wrap">
                  <img src={heroImage} alt="Trà Sữa Oolong Nướng Kem Muối" className="spotlight-img" />
                  <span className="spotlight-live-tag">🔥 Đang được gọi nhiều</span>
                </div>

                <div className="spotlight-details">
                  <div className="spotlight-meta">
                    <span className="spotlight-cat">Trà Sữa Thủ Công</span>
                    <div className="spotlight-rating">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>5.0 (520+ reviews)</span>
                    </div>
                  </div>

                  <h3 className="spotlight-title">Trà Sữa Oolong Nướng Kem Muối</h3>
                  <p className="spotlight-desc">
                    Lá Oolong sao than hồng đượm khói, quyện kem muối béo ngậy và trân châu hoàng kim dẻo mềm.
                  </p>

                  <div className="spotlight-footer">
                    <div>
                      <span className="spotlight-price-label">Giá chỉ từ</span>
                      <div className="spotlight-price">39.000 đ</div>
                    </div>
                    <Link to="/menu" className="spotlight-action-btn">
                      <span>Đặt Thưởng Thức</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INFINITE MARQUEE BRAND TICKER
          ───────────────────────────────────────────────────────────── */}
      <div className="marquee-container" aria-hidden="true">
        <div className="marquee-track">
          {[...Array(2)].map((_, groupIdx) => (
            <div key={groupIdx} className="marquee-group">
              <span className="marquee-item">🍃 LÁ TRÀ BẢO LỘC CAO NGUYÊN 1.600M</span>
              <span className="marquee-sep">•</span>
              <span className="marquee-item">🥛 100% SỮA TƯƠI THANH TRÙNG NGUYÊN BẢN</span>
              <span className="marquee-sep">•</span>
              <span className="marquee-item">⏱️ Ủ TRÀ NHIỆT ĐỘ VÀNG 88°C - 92°C</span>
              <span className="marquee-sep">•</span>
              <span className="marquee-item">🚫 KHÔNG BỘT BÉO CÔNG NGHIỆP</span>
              <span className="marquee-sep">•</span>
              <span className="marquee-item">⚡ GIAO HỎA TỐC 15-20 PHÚT GIỮ NHIỆT</span>
              <span className="marquee-sep">•</span>
              <span className="marquee-item">🧋 10+ TOPPING TƯƠI NẤU MỚI MỖI SÁNG</span>
              <span className="marquee-sep">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BENTO GRID — THE MINTEA BOTANICAL CRAFT
          ───────────────────────────────────────────────────────────── */}
      <section id="why-mintea" className="bento-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-eyebrow">
              <Leaf size={14} className="text-emerald-600" />
              <span>Cam Kết Chất Lượng Độc Bản</span>
            </div>
            <h2 className="section-title">Tại Sao MinTea Khác Biệt?</h2>
            <p className="section-subtitle">
              Không chạy theo xu hướng công nghiệp, chúng tôi gìn giữ trọn vẹn văn hóa trà mộc và sự thuần khiết trong từng nguyên liệu.
            </p>
          </div>

          <div className="bento-grid">
            {BENTO_STORIES.map((item, idx) => (
              <div key={idx} className="bento-card glass-card">
                <div className="bento-card-top">
                  <div className="bento-icon-box">{item.icon}</div>
                  <span className="bento-tag">{item.badge}</span>
                </div>
                <h3 className="bento-title">{item.title}</h3>
                <p className="bento-desc">{item.desc}</p>
                <div className="bento-metric-box">
                  <span className="bento-metric">{item.metric}</span>
                  <span className="bento-metric-label">{item.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CURATED MENU SHOWCASE WITH INSTANT FILTER & SEARCH
          ───────────────────────────────────────────────────────────── */}
      <section className="showcase-section">
        <div className="container">
          <div className="showcase-header">
            <div>
              <div className="section-eyebrow">
                <Flame size={14} className="text-amber-500" />
                <span>Thực Đơn Tuyển Chọn</span>
              </div>
              <h2 className="section-title">Món Ngon Đáng Thử Hôm Nay</h2>
            </div>
            <Link to="/menu" className="view-all-link">
              <span>Xem toàn bộ menu ({products.length} món)</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Interactive Filters Bar */}
          <div className="showcase-controls-bar">
            {/* Category Pills */}
            <div className="category-scroll-tabs">
              {categoryTabs.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'ALL' ? 'Tất cả món' : cat}
                </button>
              ))}
            </div>

            {/* Instant Search Bar */}
            <div className="showcase-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm tên món yêu thích..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="showcase-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="products-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="product-skeleton skeleton-loader" />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="empty-showcase glass-card">
              <CupSoda size={48} className="text-stone-400 mx-auto mb-3" />
              <h3>Không tìm thấy món phù hợp</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc bấm xem toàn bộ danh mục nhé!</p>
              <button
                type="button"
                className="btn-brand mt-4 inline-flex items-center gap-2"
                onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
              >
                <Sparkles size={16} /> Xem tất cả món
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {displayedProducts.slice(0, 6).map(product => (
                <div
                  key={product.id}
                  className="product-card glass-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="product-visual">
                    {product.image ? (
                      <img src={product.image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="product-img-fallback">🧋</div>
                    )}
                    <span className="product-tag-float">Bán chạy</span>
                  </div>

                  <div className="product-content">
                    <span className="product-cat-tag">{product.category || 'Đồ uống tươi'}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">
                      {product.description || 'Pha chế thủ công thơm ngon thanh mát, 100% nguyên liệu tươi sạch.'}
                    </p>

                    <div className="product-footer-row">
                      <div className="product-price">{formatPrice(product.price)}</div>
                      <button
                        type="button"
                        className="quick-add-btn"
                        disabled={addingId === product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(product);
                        }}
                        aria-label={`Thêm ${product.name} vào giỏ`}
                      >
                        {addingId === product.id ? (
                          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        ) : (
                          <>
                            <ShoppingBag size={14} />
                            <span>Thêm món</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="showcase-cta-row">
            <Link to="/menu" className="btn-brand py-3.5 px-8 text-base shadow-md">
              <ShoppingBag size={18} />
              <span>Khám Phá Toàn Bộ Thực Đơn ({products.length} món)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. WALL OF LOVE — VERIFIED CUSTOMER REVIEWS
          ───────────────────────────────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-eyebrow">
              <Heart size={14} className="text-rose-500" />
              <span>Bức Tường Yêu Thích</span>
            </div>
            <h2 className="section-title">Hơn 10.000+ Ly Trà Trao Tay Mỗi Tháng</h2>
            <p className="section-subtitle">
              Lắng nghe cảm nhận thực tế từ những khách hàng đã tin yêu và đồng hành cùng MinTea mỗi ngày.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="testimonial-card glass-card">
                <div className="testimonial-top">
                  <div className="user-profile">
                    <div className="user-avatar">{t.avatar}</div>
                    <div>
                      <h4 className="user-name">{t.name}</h4>
                      <span className="user-role">{t.role}</span>
                    </div>
                  </div>
                  <div className="star-rating">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="testimonial-comment">"{t.comment}"</p>

                <div className="testimonial-drink">
                  <span className="drink-pill">❤️ Gu uống: <strong>{t.drink}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FAQ ACCORDION SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="container faq-container">
          <div className="section-header text-center">
            <div className="section-eyebrow">
              <Sparkles size={14} className="text-amber-500" />
              <span>Giải Đáp Thắc Mắc</span>
            </div>
            <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`faq-card glass-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question">{faq.q}</span>
                    <ChevronRight size={18} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-content">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. PROMOTIONAL CALL TO ACTION BANNER (WITH 1-CLICK COPY)
          ───────────────────────────────────────────────────────────── */}
      <section className="promo-cta-section">
        <div className="container">
          <div className="promo-cta-card">
            <div className="promo-glow" />
            <div className="promo-content">
              <div className="promo-badge">
                <Percent size={14} />
                <span>Đặc quyền thành viên mới</span>
              </div>
              <h2 className="promo-heading">Sẵn Sàng Cho Một Ly Trà Bật Mood Hôm Nay? 🧋</h2>
              <p className="promo-desc">
                Đăng ký thành viên hoặc đặt hàng online ngay bây giờ để nhận voucher giảm trực tiếp <strong>20%</strong> cho toàn bộ thực đơn MinTea.
              </p>

              <div className="promo-action-box">
                <button
                  type="button"
                  className="voucher-pill-btn"
                  onClick={handleCopyVoucher}
                  title="Bấm để sao chép mã"
                >
                  <span className="voucher-tag">MÃ GIẢM:</span>
                  <strong className="voucher-code">MINTEA20</strong>
                  {copiedVoucher ? (
                    <span className="copied-text"><Check size={14} /> Đã chép!</span>
                  ) : (
                    <Copy size={14} className="copy-icon" />
                  )}
                </button>

                <Link to="/menu" className="promo-order-btn">
                  <span>Đặt Món Ngay</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. RICH ARTISANAL FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            {/* Brand column */}
            <div className="footer-col brand-col">
              <div className="footer-brand">
                <span className="brand-emoji">🧋</span>
                <div className="brand-text">
                  <span className="brand-title">MinTea</span>
                  <span className="brand-subtitle">Artisanal Brews & Tea</span>
                </div>
              </div>
              <p className="footer-about">
                Thương hiệu trà mộc cao nguyên, trà sữa thủ công và cà phê muối trứ danh. 
                Gìn giữ vị thanh khiết tự nhiên, chăm chút cho sức khỏe của bạn mỗi ngày.
              </p>
              <div className="footer-social-links">
                <a href="#" aria-label="Facebook MinTea" className="social-pill">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" aria-label="Instagram MinTea" className="social-pill">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Highlights */}
            <div className="footer-col">
              <h4 className="footer-title">Món Được Yêu Thích</h4>
              <ul className="footer-links">
                <li><Link to="/menu">Trà Sữa Oolong Nướng Kem Muối</Link></li>
                <li><Link to="/menu">Cà Phê Muối Đắk Lắk Hoàng Gia</Link></li>
                <li><Link to="/menu">Trà Lài Tuyết Sơn Macchiato</Link></li>
                <li><Link to="/menu">Trà Đào Cam Sả Tươi Mát</Link></li>
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div className="footer-col">
              <h4 className="footer-title">Liên Kết Nhanh</h4>
              <ul className="footer-links">
                <li><Link to="/menu">Thực Đơn Đầy Đủ</Link></li>
                <li><a href="#why-mintea">Về Chúng Tôi</a></li>
                <li><Link to="/login">Đăng Nhập Tài Khoản</Link></li>
                <li><Link to="/register">Đăng Ký Thành Viên</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="footer-col">
              <h4 className="footer-title">Thông Tin Quán</h4>
              <ul className="footer-contact-list">
                <li>
                  <MapPin size={16} className="contact-icon" />
                  <span>123 Đường Hoa Hồng, Phường 2, TP. Hồ Chí Minh</span>
                </li>
                <li>
                  <Phone size={16} className="contact-icon" />
                  <span>Tổng đài đặt món: <strong>1900 6868</strong></span>
                </li>
                <li>
                  <Clock size={16} className="contact-icon" />
                  <span>Giờ phục vụ: <strong>07:30 - 22:30</strong> (Tất cả các ngày)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© {new Date().getFullYear()} MinTea Artisanal Brews. Bản quyền thuộc về MinTea.</p>
            <div className="footer-badges">
              <span className="trust-badge">🌿 100% Nguyên Liệu Sạch</span>
              <span className="trust-badge">⚡ Giao Hàng Siêu Tốc</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
