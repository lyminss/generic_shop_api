import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { formatPrice } from '../utils/format';
import { ShoppingBag, Star, Clock, Truck, Gift, ChevronRight, ArrowRight, Sparkles, CupSoda, Coffee, Flame, Heart } from 'lucide-react';
import heroImage from '../assets/hero-food.jpg';
import './LandingPage.css';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả món', icon: '🧋' },
  { id: 'Tea', name: 'Trà Sữa & Trà Vị', icon: '🍃' },
  { id: 'Coffee', name: 'Cà Phê Muối & Espresso', icon: '☕' },
  { id: 'Fruit', name: 'Trà Hoa Quả Tươi', icon: '🍓' },
  { id: 'Food', name: 'Bánh Ngọt & Ăn Vặt', icon: '🥐' },
];

const FEATURES = [
  {
    icon: '🌿',
    title: 'Trà Tươi & Lá Thô Chắt Lọc',
    desc: 'Lá trà hái thủ công từ vùng cao nguyên, ủ nhiệt độ chuẩn giữ trọn vị thanh thuần.',
  },
  {
    icon: '⚡',
    title: 'Giao Nhanh 15-20 Phút',
    desc: 'Pha chế siêu tốc, đóng nắp chống tràn đảm bảo đồ uống luôn mát lạnh thơm ngon.',
  },
  {
    icon: '🥛',
    title: 'Sữa Tươi Thanh Trùng 100%',
    desc: 'Không sử dụng bột béo công nghiệp, đảm bảo sức khỏe và hương vị béo thơm tự nhiên.',
  },
  {
    icon: '⭐',
    title: 'Công Thức Tùy Chỉnh Size & Đá',
    desc: 'Tự do chọn 0% - 100% đường đá, thêm topping trân châu hoàng kim, thạch dừa giòn.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Minh Anh',
    avatar: 'M',
    rating: 5,
    tag: 'Tín đồ Trà Sữa Oolong',
    text: 'Trà sữa Oolong Nướng đậm vị trà, trân châu dẻo quánh béo ngậy. Đóng gói rất chỉn chu!',
  },
  {
    name: 'Bảo Thy',
    avatar: 'B',
    rating: 5,
    tag: 'Khách hàng thân thiết',
    text: 'Ghé Túc Tắc lần đầu là nghiện Cà Phê Muối luôn. Lớp kem muối béo mặn hoàn hảo!',
  },
  {
    name: 'Hoàng Nam',
    avatar: 'H',
    rating: 5,
    tag: 'Đánh giá Google Maps',
    text: 'Trà Đào Cam Sả giải nhiệt siêu đã. Đồ uống ngon, nhân viên nhiệt tình, giao hàng rất đúng giờ.',
  },
];

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    productService.getAll()
      .then((res) => setFeaturedProducts(res.data || []))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  const filtered = selectedCat === 'all' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category?.toLowerCase().includes(selectedCat.toLowerCase()));

  return (
    <div className="landing-page">
      {/* ============ HERO ============ */}
      <section className="hero-landing" aria-label="Túc Tắc Tea Banner">
        <div className="hero-overlay" />
        <img src={heroImage} alt="Túc Tắc Tea & Drinks" className="hero-bg-img" />
        
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow animate-fade-in">
              <Sparkles size={14} className="text-amber-400" />
              <span>Thương hiệu đồ uống thủ công hàng đầu</span>
            </div>
            
            <h1 className="hero-heading animate-slide-up">
              Thưởng Thức Trà Tươi<br />
              <span className="hero-accent">Túc Tắc Đậm Vị Mới!</span>
            </h1>
            
            <p className="hero-desc animate-slide-up" style={{ animationDelay: '0.15s' }}>
              Trà sữa béo thơm, cà phê muối nồng nàn cùng trà hoa quả thanh nhiệt mát lạnh.
              Pha chế thủ công tỉ mỉ cho từng khoảnh khắc ngọt ngào của bạn.
            </p>
            
            <div className="hero-cta animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <Link to="/menu" className="btn-brand text-lg py-3.5 px-8">
                <ShoppingBag size={20} /> Khám Phá Thực Đơn
              </Link>
              <Link to="/register" className="btn-outline text-lg py-3.5 px-8 text-white border-white/40 hover:bg-white/10">
                Đăng ký thành viên <ArrowRight size={18} />
              </Link>
            </div>

            {/* Stats */}
            <div className="hero-stats animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { num: '5,000+', label: 'Ly trà trao tay' },
                { num: '40+', label: 'Món nước độc quyền' },
                { num: '4.9★', label: 'Đánh giá hài lòng' }
              ].map((stat) => (
                <div key={stat.label} className="stat-card glass-panel">
                  <strong>{stat.num}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUICK CATEGORY BAR ============ */}
      <section className="category-quick-section">
        <div className="container">
          <div className="category-pill-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`category-pill-btn ${selectedCat === cat.id ? 'active' : ''}`}
              >
                <span className="pill-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BEST SELLERS SHOWCASE ============ */}
      <section className="bestsellers-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">
              <Flame size={15} className="inline text-amber-500 mr-1" /> Món Nước Signature
            </span>
            <h2 className="section-title">Được Yêu Thích Nhất Hôm Nay</h2>
          </div>

          {loadingProducts ? (
            <div className="products-preview-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-preview-skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-products-notice glass-card">
              <CupSoda size={48} className="text-stone-400 mx-auto mb-2" />
              <p>Chưa có món nào thuộc danh mục này.</p>
            </div>
          ) : (
            <div className="products-preview-grid">
              {filtered.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="product-preview-card glass-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="product-preview-img-wrapper">
                    {product.image ? (
                      <img src={product.image} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="placeholder-icon">🧋</div>
                    )}
                    <span className="tag-badge">Best Seller</span>
                  </div>
                  
                  <div className="product-preview-body">
                    <span className="product-cat-tag">{product.category || 'Đồ uống'}</span>
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-desc">{product.description || 'Thơm ngon mát lạnh, nguyên liệu tươi sạch.'}</p>
                    
                    <div className="product-card-footer">
                      <span className="product-price">{formatPrice(product.price)}</span>
                      <button 
                        className="quick-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        Tùy chỉnh ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu" className="btn-brand py-3 px-8 text-base">
              Xem Toàn Bộ Thực Đơn <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Cam Kết Chất Lượng</span>
            <h2 className="section-title">Tại Sao Khách Hàng Yêu Thích Túc Tắc?</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card glass-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Cảm Nhận Khách Hàng</span>
            <h2 className="section-title">Hàng Ngàn Đánh Giá 5 Sao</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card glass-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="testimonial-tag-badge">{t.tag}</span>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <h4 className="author-name">{t.name}</h4>
                    <span className="author-status">Đã xác minh mua hàng</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Muốn Làm Ly Trà Sữa Mát Lạnh Bật Mood? 🧋</h2>
              <p>Đặt hàng online ngay hôm nay để nhận ưu đãi giảm 20% cho đơn hàng đầu tiên!</p>
            </div>
            <div className="cta-actions">
              <Link to="/menu" className="btn-accent text-lg py-3.5 px-8">
                Đặt Hàng Ngay <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

