import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { formatPrice } from '../utils/format';
import { 
  ShoppingBag, Star, Clock, Truck, ShieldCheck, ArrowRight, 
  Sparkles, CupSoda, Coffee, Flame, Heart, CheckCircle2, 
  ChevronRight, MapPin, Phone, Award, 
  Percent, Leaf, Zap
} from 'lucide-react';
import heroImage from '../assets/hero-food.jpg';
import './LandingPage.css';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả món', icon: '🧋' },
  { id: 'Tea', name: 'Trà Sữa & Trà Vị', icon: '🍃' },
  { id: 'Coffee', name: 'Cà Phê Muối & Espresso', icon: '☕' },
  { id: 'Fruit', name: 'Trà Hoa Quả Tươi', icon: '🍓' },
  { id: 'Food', name: 'Bánh Ngọt & Topping', icon: '🥐' },
];

const PILLARS = [
  {
    icon: <Leaf className="w-6 h-6 text-emerald-600" />,
    badge: '100% Tự Nhiên',
    title: 'Lá Trà Cao Nguyên Tuyển Chọn',
    desc: 'Lá trà Oolong, Lài và Sen được hái thủ công từ vùng cao nguyên Bảo Lộc & Cầu Đất, ủ nhiệt chuẩn giữ trọn vị thanh tao thuần khiết.',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    badge: 'Tươi Sạch Mỗi Ngày',
    title: 'Sữa Tươi Thanh Trùng 100%',
    desc: 'Tuyệt đối không dùng bột béo công nghiệp hay hóa chất bảo quản. Vị béo bùi, ngậy dịu hoàn toàn từ sữa tươi thanh trùng loại 1.',
  },
  {
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    badge: 'Siêu Tốc',
    title: 'Giao Nhanh 15-20 Phút',
    desc: 'Đóng nắp công nghệ nhiệt chống tràn, giữ nhiệt lạnh sâu tới 2 tiếng. Đồ uống đến tay luôn nguyên vẹn độ tươi ngon như tại quầy.',
  },
  {
    icon: <Heart className="w-6 h-6 text-rose-500" />,
    badge: 'Cá Nhân Hóa',
    title: 'Tùy Biến Đường Đá & 10+ Topping',
    desc: 'Tự do chọn 0% - 100% đường đá theo gu riêng. Topping trân châu hoàng kim, thạch củ năng, pudding trứng nấu mới mỗi sáng.',
  },
];

const RITUAL_STEPS = [
  {
    step: '01',
    title: 'Tuyển Chọn Nông Sản Tươi',
    desc: 'Lá trà hái đúng độ non, hoa quả tươi gọt mới trong ngày, không sử dụng hương liệu nhân tạo.',
    icon: '🍃',
  },
  {
    step: '02',
    title: 'Ủ Trà Ở Nhiệt Độ Vàng 88°C - 92°C',
    desc: 'Căn chuẩn từng giây theo từng loại trà để chiết xuất trọn vẹn tinh dầu và hậu vị ngọt sâu.',
    icon: '⏱️',
  },
  {
    step: '03',
    title: 'Pha Chế Thủ Công Theo Gu',
    desc: 'Barista tay nghề cao tinh chỉnh chính xác lượng đường, đá, sữa theo đúng sở thích của bạn.',
    icon: '✨',
  },
];

const TESTIMONIALS = [
  {
    name: 'Bảo Trân',
    avatar: 'BT',
    role: 'Khách hàng thân thiết',
    drink: 'Cà Phê Muối Hoàng Gia',
    rating: 5,
    comment: 'Lớp kem muối béo bùi, mặn nhẹ cực kỳ hài hòa với vị cà phê đậm đà. Mình uống ở đây 4-5 lần một tuần mà không biết chán!',
  },
  {
    name: 'Minh Anh',
    avatar: 'MA',
    role: 'Tín đồ Trà Oolong',
    drink: 'Trà Sữa Oolong Nướng',
    rating: 5,
    comment: 'Đậm vị trà, thơm mùi khói nướng nhẹ nhàng chứ không bị ngọt gắt hay ngấy mùi bột béo. Trân châu dẻo dai vừa miệng.',
  },
  {
    name: 'Hoàng Nam',
    avatar: 'HN',
    role: 'Đánh giá 5 sao Google Maps',
    drink: 'Trà Đào Cam Sả Tươi',
    rating: 5,
    comment: 'Trưa nắng làm một ly trà đào cam sả giải nhiệt cực đã! Đóng gói chỉn chu, giao hàng nhanh tầm 15 phút là nhận được.',
  },
];

const FAQS = [
  {
    q: 'MinTea có giao hàng tận nơi không và phí ship như thế nào?',
    a: 'MinTea hỗ trợ giao hàng tận nơi siêu tốc trong 15-25 phút qua đội ngũ vận chuyển chuyên nghiệp. Phí ship được tính theo khoảng cách thực tế và thường xuyên có mã miễn phí vận chuyển cho đơn từ 100.000đ.',
  },
  {
    q: 'Tôi có thể điều chỉnh mức đường và đá theo khẩu vị được không?',
    a: 'Hoàn toàn được! Bạn có thể tùy chỉnh từ 0%, 30%, 50%, 70% đến 100% đường và đá, kèm theo nhiều loại topping hấp dẫn như Trân châu hoàng kim, Thạch dừa, Pudding trứng.',
  },
  {
    q: 'Đồ uống của MinTea có thể bảo quản được bao lâu?',
    a: 'Để cảm nhận hương vị tươi ngon nhất, bạn nên dùng trong vòng 2 giờ sau khi pha. Nếu bảo quản trong ngăn mát tủ lạnh (đặc biệt các dòng trà sữa và cà phê ủ lạnh), bạn có thể dùng trong ngày.',
  },
];

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    productService.getAll()
      .then((res) => {
        setFeaturedProducts(res.data || []);
      })
      .catch(() => {
        setFeaturedProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  const filtered = selectedCat === 'all' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category?.toLowerCase().includes(selectedCat.toLowerCase()));

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="landing-page">
      {/* =========================================================================
          HERO SECTION — Premium Artisanal Botanical Masterpiece
         ========================================================================= */}
      <section className="hero-landing" aria-label="MinTea Banner">
        <div className="hero-backdrop" />
        <img src={heroImage} alt="MinTea Artisanal Brews & Tea" className="hero-bg-img" />
        <div className="hero-ambient-glow" />

        <div className="container hero-container">
          <div className="hero-grid">
            {/* Left Content Column */}
            <div className="hero-content">
              <div className="hero-eyebrow animate-fade-in">
                <Sparkles size={15} className="text-amber-400 animate-pulse" />
                <span>MinTea — Trà Tươi & Cà Phê Thủ Công</span>
              </div>

              <h1 className="hero-heading animate-slide-up">
                Đậm Đà Từng Giọt Trà.<br />
                <span className="hero-gradient-text">Trọn Vẹn Vị Tươi Mới.</span>
              </h1>

              <p className="hero-desc animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Hương trà cao nguyên Bảo Lộc chắt lọc tinh túy kết hợp cùng sữa tươi thanh trùng 100%. 
                Pha chế thủ công tỉ mỉ cho từng khoảnh khắc ngọt ngào của bạn.
              </p>

              <div className="hero-actions animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/menu" className="hero-btn-primary">
                  <ShoppingBag size={20} />
                  <span>Khám Phá Thực Đơn</span>
                </Link>
                <a href="#why-mintea" className="hero-btn-secondary">
                  <span>Câu Chuyện MinTea</span>
                  <ChevronRight size={18} />
                </a>
              </div>

              {/* Live Metric Badges */}
              <div className="hero-metrics-grid animate-fade-in" style={{ animationDelay: '0.35s' }}>
                <div className="metric-box">
                  <span className="metric-value">4.9<Star size={16} className="inline fill-amber-400 text-amber-400 ml-0.5 -mt-1" /></span>
                  <span className="metric-label">1,500+ Đánh giá 5 sao</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-box">
                  <span className="metric-value">15’</span>
                  <span className="metric-label">Giao nhanh giữ nhiệt</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-box">
                  <span className="metric-value">100%</span>
                  <span className="metric-label">Lá trà cao nguyên tươi</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Hero Card (Floating Signature Drink) */}
            <div className="hero-card-col animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <div className="hero-floating-card glass-card">
                <div className="floating-card-badge">
                  <Flame size={14} className="text-amber-500 fill-amber-500" />
                  <span>Món Signature Bán Chạy</span>
                </div>

                <div className="floating-card-visual">
                  <img src={heroImage} alt="Signature MinTea Drink" className="floating-card-img" />
                  <div className="floating-card-tag">🔥 Đang Ưa Chuộng</div>
                </div>

                <div className="floating-card-body">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="floating-card-category">Trà Sữa Thủ Công</span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>5.0 (480+)</span>
                    </div>
                  </div>

                  <h3 className="floating-card-title">Trà Sữa Oolong Nướng Kem Muối</h3>
                  <p className="floating-card-desc">
                    Lá trà Oolong rang nướng thơm dịu, hòa quyện kem trứng cháy và kem muối béo ngậy.
                  </p>

                  <div className="floating-card-footer">
                    <div>
                      <span className="floating-card-subtext">Giá chỉ từ</span>
                      <div className="floating-card-price">39.000 đ</div>
                    </div>
                    <Link to="/menu" className="floating-card-btn">
                      <span>Đặt Ngay</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PILLARS SECTION — Why Choose MinTea Bento Grid
         ========================================================================= */}
      <section id="why-mintea" className="pillars-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Cam Kết Chất Lượng Độc Bản</span>
            <h2 className="section-title">Tại Sao Khách Hàng Yêu Thích MinTea?</h2>
            <p className="section-subtitle">
              Mỗi ly nước tại MinTea là sự kết hợp hoàn hảo giữa nguồn nguyên liệu thuần khiết và kỹ nghệ pha chế tận tâm.
            </p>
          </div>

          <div className="pillars-grid">
            {PILLARS.map((pillar, i) => (
              <div key={i} className="pillar-card glass-card">
                <div className="pillar-top">
                  <div className="pillar-icon-box">{pillar.icon}</div>
                  <span className="pillar-badge">{pillar.badge}</span>
                </div>
                <h3 className="pillar-title">{pillar.title}</h3>
                <p className="pillar-desc">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE BEST SELLERS SHOWCASE WITH CATEGORY TABS
         ========================================================================= */}
      <section className="menu-showcase-section">
        <div className="container">
          <div className="section-header flex-header">
            <div>
              <span className="section-eyebrow">
                <Flame size={14} className="inline mr-1 text-amber-500" /> Thực Đơn Tuyển Chọn
              </span>
              <h2 className="section-title">Món Ngon Đáng Thử Hôm Nay</h2>
            </div>
            <Link to="/menu" className="view-all-link">
              <span>Xem tất cả ({featuredProducts.length} món)</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Category Switcher Pills */}
          <div className="category-pills-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`category-tab-btn ${selectedCat === cat.id ? 'active' : ''}`}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="showcase-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="product-skeleton-card skeleton-loader" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state-box glass-card">
              <CupSoda size={48} className="text-stone-400 mx-auto mb-3" />
              <h3>Chưa có món nào thuộc danh mục này</h3>
              <p>Mời bạn chọn danh mục khác hoặc khám phá toàn bộ thực đơn MinTea.</p>
              <Link to="/menu" className="btn-brand mt-4 inline-flex">
                Xem Toàn Bộ Menu
              </Link>
            </div>
          ) : (
            <div className="showcase-grid">
              {filtered.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="product-card-modern glass-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="product-img-box">
                    {product.image ? (
                      <img src={product.image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="product-fallback-icon">🧋</div>
                    )}
                    <span className="product-status-tag">Signature</span>
                  </div>

                  <div className="product-info-box">
                    <span className="product-category-label">{product.category || 'Đồ uống tươi'}</span>
                    <h3 className="product-name-modern">{product.name}</h3>
                    <p className="product-desc-modern">
                      {product.description || 'Pha chế thủ công thơm ngon mát lạnh, nguyên liệu tươi sạch.'}
                    </p>

                    <div className="product-bottom-row">
                      <div className="product-price-box">
                        <span className="price-tag">{formatPrice(product.price)}</span>
                      </div>
                      <button
                        type="button"
                        className="product-order-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <span>Đặt món</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/menu" className="btn-brand py-3.5 px-8 text-base shadow-md">
              <ShoppingBag size={18} />
              <span>Khám Phá Toàn Bộ Thực Đơn MinTea</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE MINTEA RITUAL — 3 Steps Brewing Craft
         ========================================================================= */}
      <section className="ritual-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Nghệ Thuật Pha Chế</span>
            <h2 className="section-title">Quy Trình Chắt Lọc Hương Vị MinTea</h2>
            <p className="section-subtitle">
              Sự chỉn chu trong từng công đoạn tạo nên dấu ấn vị giác khác biệt mà bạn chỉ có thể tìm thấy tại MinTea.
            </p>
          </div>

          <div className="ritual-grid">
            {RITUAL_STEPS.map((step, idx) => (
              <div key={idx} className="ritual-card glass-card">
                <div className="ritual-number">{step.step}</div>
                <div className="ritual-icon-bubble">{step.icon}</div>
                <h3 className="ritual-title">{step.title}</h3>
                <p className="ritual-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          WALL OF LOVE — Customer Testimonials
         ========================================================================= */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Khách Hàng Nói Về MinTea</span>
            <h2 className="section-title">Hơn 10.000+ Ly Trà Trao Tay Mỗi Tháng</h2>
            <p className="section-subtitle">
              Sự hài lòng và tin yêu của quý khách là nguồn cảm hứng lớn nhất để MinTea không ngừng hoàn thiện.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="testimonial-box glass-card">
                <div className="testimonial-header">
                  <div className="flex items-center gap-3">
                    <div className="avatar-circle">{t.avatar}</div>
                    <div>
                      <h4 className="user-name">{t.name}</h4>
                      <span className="user-role">{t.role}</span>
                    </div>
                  </div>
                  <div className="star-rating">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="testimonial-quote">"{t.comment}"</p>

                <div className="testimonial-footer">
                  <span className="favorite-drink">❤️ Món yêu thích: <strong>{t.drink}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION SECTION
         ========================================================================= */}
      <section className="faq-section">
        <div className="container max-w-3xl">
          <div className="section-header text-center">
            <span className="section-eyebrow">Giải Đáp Thắc Mắc</span>
            <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className={`faq-item glass-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronRight size={18} className={`faq-arrow ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          PROMOTIONAL BANNER & CTA
         ========================================================================= */}
      <section id="promo-banner" className="cta-banner-section">
        <div className="container">
          <div className="cta-card-modern">
            <div className="cta-glow-circle" />
            <div className="cta-content-wrapper">
              <div className="cta-badge">
                <Percent size={14} />
                <span>Ưu đãi thành viên mới</span>
              </div>
              <h2 className="cta-main-title">
                Sẵn Sàng Cho Một Ly Trà Bật Mood Ngày Mới? 🧋
              </h2>
              <p className="cta-subtitle">
                Đăng ký tài khoản hoặc đặt món trực tuyến ngay hôm nay để nhận mã giảm giá <strong>20%</strong> cho toàn bộ thực đơn!
              </p>
              
              <div className="cta-promo-box">
                <div className="promo-code-pill">
                  <span>MÃ:</span>
                  <strong>MINTEA20</strong>
                </div>
                <Link to="/menu" className="cta-order-btn">
                  <span>Đặt Món Ngay</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER SECTION
         ========================================================================= */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <div className="footer-logo">
                <span className="logo-icon">🧋</span>
                <span className="logo-text">MinTea</span>
              </div>
              <p className="footer-desc">
                Thương hiệu trà tươi, trà sữa cao nguyên và cà phê muối thủ công thơm ngon, chuẩn vị và tốt cho sức khỏe.
              </p>
              <div className="footer-socials">
                <a href="#" aria-label="Facebook MinTea" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" aria-label="Instagram MinTea" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Thực Đơn Nổi Bật</h4>
              <ul className="footer-links">
                <li><Link to="/menu">Trà Sữa Oolong Nướng</Link></li>
                <li><Link to="/menu">Cà Phê Muối Hoàng Gia</Link></li>
                <li><Link to="/menu">Trà Đào Cam Sả Tươi</Link></li>
                <li><Link to="/menu">Trà Hoa Quả Nhiệt Đới</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Liên Kết Nhanh</h4>
              <ul className="footer-links">
                <li><Link to="/menu">Thực Đơn Đầy Đủ</Link></li>
                <li><Link to="/login">Đăng Nhập Tài Khoản</Link></li>
                <li><Link to="/register">Đăng Ký Thành Viên</Link></li>
                <li><a href="#why-mintea">Về Chúng Tôi</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Thông Tin Quán</h4>
              <ul className="footer-contact">
                <li>
                  <MapPin size={16} className="text-amber-500 shrink-0" />
                  <span>123 Đường Hoa Hồng, Phường 2, TP. Hồ Chí Minh</span>
                </li>
                <li>
                  <Phone size={16} className="text-amber-500 shrink-0" />
                  <span>Hotline: 1900 6868 (07:30 - 22:30)</span>
                </li>
                <li>
                  <Clock size={16} className="text-amber-500 shrink-0" />
                  <span>Mở cửa: 07:30 - 22:30 (Cả tuần)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} MinTea — All rights reserved. Artisanal Brews & Tea.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
