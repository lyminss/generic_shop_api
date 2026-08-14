import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import { formatPrice } from '../utils/format';
import { ShoppingBag, Star, Clock, Truck, Gift, ChevronRight, ArrowRight } from 'lucide-react';
import heroImage from '../assets/hero-food.jpg';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '🌿',
    title: 'Nguyên liệu tươi sạch',
    desc: 'Chúng tôi chọn lọc kỹ lưỡng từng nguyên liệu, đảm bảo chất lượng tươi ngon mỗi ngày.',
  },
  {
    icon: '⚡',
    title: 'Chuẩn bị nhanh chóng',
    desc: 'Đơn hàng được chuẩn bị trong vòng 15 phút. Bạn không cần phải chờ đợi lâu.',
  },
  {
    icon: '🎁',
    title: 'Ưu đãi thành viên',
    desc: 'Đăng ký thành viên để nhận nhiều ưu đãi hấp dẫn và điểm thưởng mỗi khi mua hàng.',
  },
  {
    icon: '⭐',
    title: 'Chất lượng đảm bảo',
    desc: 'Hàng trăm đánh giá 5 sao từ khách hàng là niềm tự hào lớn nhất của chúng tôi.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Minh Anh',
    avatar: 'M',
    rating: 5,
    text: 'Trà sữa matcha ở đây ngon cực! Vị trà đậm nhưng không đắng, trân châu mềm dẻo vừa phải. Sẽ quay lại thường xuyên!',
  },
  {
    name: 'Bảo Thy',
    avatar: 'B',
    rating: 5,
    text: 'Ghé Túc Tắc lần đầu là nghiện ngay. Không gian chill, đồ uống ngon, nhân viên thân thiện. Recommended!',
  },
  {
    name: 'Hoàng Nam',
    avatar: 'H',
    rating: 5,
    text: 'Order online siêu tiện, nhận hàng nhanh. Trái cây tươi, trà hoa quả thanh mát, đúng vị mình thích!',
  },
];

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    productService.getAll()
      .then((res) => setFeaturedProducts((res.data || []).slice(0, 6)))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div className="landing-page">

      {/* ============ HERO ============ */}
      <section className="hero-landing" aria-label="Túc Tắc Tea Banner">
        <div className="hero-overlay" />
        <img src={heroImage} alt="Túc Tắc Tea & Food" className="hero-bg-img" />
        <div className="hero-content">
          <span className="hero-eyebrow animate-fade-in">✦ Túc Tắc Tea &amp; Coffee</span>
          <h1 className="hero-heading animate-slide-up">
            Ghé Túc Tắc<br />
            <span className="hero-accent">làm ngụm niềm vui!</span>
          </h1>
          <p className="hero-desc animate-slide-up" style={{ animationDelay: '0.15s' }}>
            Trà sữa thơm béo, trà hoa quả thanh mát cùng những phần ăn vặt cực ngon.
            Mang niềm vui vào từng ngụm, từng miếng.
          </p>
          <div className="hero-cta animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <Link to="/menu" className="hero-btn-primary">
              <ShoppingBag size={18} /> Xem Thực đơn
            </Link>
            <Link to="/register" className="hero-btn-secondary">
              Đăng ký thành viên <ArrowRight size={16} />
            </Link>
          </div>
          {/* Stats */}
          <div className="hero-stats animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[['500+', 'Khách hàng'], ['50+', 'Món ngon'], ['4.9★', 'Đánh giá']].map(([num, label]) => (
              <div key={label} className="stat-item">
                <strong>{num}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">Tại sao chọn Túc Tắc?</span>
            <h2 className="section-title">Chất lượng trong từng chi tiết</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="about-section">
        <div className="section-container about-layout">
          <div className="about-image-wrap">
            <div className="about-img-card">
              <span className="about-img-emoji">🧋</span>
            </div>
            <div className="about-badge">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              <span>Thương hiệu yêu thích 2024</span>
            </div>
          </div>
          <div className="about-content">
            <span className="section-eyebrow">Câu chuyện của chúng tôi</span>
            <h2 className="section-title">Từ niềm đam mê đến thương hiệu</h2>
            <p>
              Túc Tắc Tea ra đời từ tình yêu với những ngụm trà thơm ngon và khát vọng mang lại
              trải nghiệm ẩm thực đặc biệt cho mọi người. Chúng tôi không chỉ bán đồ uống —
              chúng tôi tạo ra những khoảnh khắc vui vẻ, thư giãn bên bạn bè và gia đình.
            </p>
            <p>
              Mỗi ly trà, mỗi phần ăn vặt đều được chuẩn bị với sự tận tâm và nguyên liệu
              tươi sạch nhất. Vì chúng tôi tin rằng chất lượng là điều không thể thỏa hiệp.
            </p>
            <div className="about-facts">
              {[
                { icon: <Clock size={18} />, text: 'Mở cửa 7:00 - 22:00 hằng ngày' },
                { icon: <Truck size={18} />, text: 'Giao hàng tận nơi nhanh chóng' },
                { icon: <Gift size={18} />, text: 'Chương trình tích điểm hấp dẫn' },
              ].map((f, i) => (
                <div key={i} className="about-fact-item">
                  <span className="about-fact-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ BEST SELLERS ============ */}
      <section className="bestsellers-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">🔥 Được yêu thích nhất</span>
            <h2 className="section-title">Món ngon không thể bỏ lỡ</h2>
          </div>

          {loadingProducts ? (
            <div className="products-preview-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-preview-skeleton" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có sản phẩm nào.</div>
          ) : (
            <div className="products-preview-grid">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="product-preview-card"
                >
                  <div className="product-preview-img">
                    {product.image ? (
                      <img src={product.image} alt={product.name} loading="lazy" />
                    ) : (
                      <span className="product-preview-placeholder">🍽️</span>
                    )}
                  </div>
                  <div className="product-preview-body">
                    <h3>{product.name}</h3>
                    <p>{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/menu" className="view-all-btn">
              Xem toàn bộ thực đơn <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">💬 Khách hàng nói gì?</span>
            <h2 className="section-title">Hàng trăm trái tim hài lòng</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <span>{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Sẵn sàng thưởng thức chưa? 🧋</h2>
              <p>Đặt hàng ngay hôm nay và nhận ưu đãi cho lần đầu đặt hàng!</p>
            </div>
            <div className="cta-actions">
              <Link to="/menu" className="cta-btn-primary">
                Đặt hàng ngay <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="cta-btn-secondary">
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
