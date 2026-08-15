import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';
import { Search, SlidersHorizontal, X, CupSoda, Sparkles } from 'lucide-react';

const ProductSkeleton = () => (
  <div className="product-skeleton glass-card">
    <div className="skeleton-img skeleton-shimmer" />
    <div className="skeleton-body">
      <div className="skeleton-line skeleton-shimmer" style={{ width: '65%' }} />
      <div className="skeleton-line skeleton-shimmer" style={{ width: '40%', height: '1.2rem' }} />
      <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: '0.7rem' }} />
    </div>
  </div>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  useEffect(() => {
    productService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getFiltered(activeCategory, debounced);
        setProducts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory, debounced]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(prev => prev === cat ? '' : cat);
  };

  const clearFilters = () => { setSearch(''); setActiveCategory(''); };
  const hasFilters = activeCategory || debounced;

  return (
    <div className="menu-container container animate-fade-in">
      {/* Menu Header */}
      <div className="menu-header">
        <div className="menu-header-text">
          <span className="section-eyebrow">
            <Sparkles size={14} className="inline mr-1 text-amber-500" /> Túc Tắc Menu
          </span>
          <h1 className="menu-title">Thực Đơn Đồ Uống Tươi</h1>
          <p className="menu-subtitle">Trà sữa, Cà phê muối, Trà trái cây thủ công chắt lọc hương vị tự nhiên</p>
        </div>

        {/* Search Bar */}
        <div className="menu-search-wrap">
          <Search size={18} className="menu-search-icon" />
          <input
            id="productSearch"
            type="text"
            className="menu-search-input"
            placeholder="Tìm trà sữa, cà phê..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Tìm kiếm sản phẩm"
          />
          {search && (
            <button className="menu-search-clear" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="category-strip">
        <div className="category-pills">
          <button
            className={`category-pill ${activeCategory === '' ? 'active' : ''}`}
            onClick={() => setActiveCategory('')}
          >
            🧋 Tất cả món
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      {!loading && (
        <div className="results-bar">
          <span className="results-count">
            {products.length === 0
              ? 'Chưa tìm thấy món nước nào'
              : `Hiển thị ${products.length} món ngon`}
          </span>
          {hasFilters && (
            <button className="clear-all-btn" onClick={clearFilters}>
              <X size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="menu-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="menu-empty glass-card">
                <CupSoda size={54} className="mx-auto mb-3 text-stone-400" />
                <h3>Không tìm thấy món nước phù hợp</h3>
                <p>Bạn thử tìm bằng tên đồ uống khác hoặc chọn lại danh mục nhé!</p>
                {hasFilters && (
                  <button className="btn-brand mt-4 text-sm" onClick={clearFilters}>Xóa bộ lọc</button>
                )}
              </div>
            )
            : products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
        }
      </div>
    </div>
  );
};

export default Home;

