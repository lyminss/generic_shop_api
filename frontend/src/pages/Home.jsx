import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const ProductSkeleton = () => (
  <div className="product-skeleton">
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
    const timer = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories once
  useEffect(() => {
    productService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch products when filter changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getFiltered(activeCategory, debounced);
        setProducts(res.data);
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
    <div className="menu-container animate-fade-in">
      {/* Menu Header */}
      <div className="menu-header">
        <div className="menu-header-text">
          <h1 className="menu-title">🍽️ Thực đơn</h1>
          <p className="menu-subtitle">Khám phá những món ngon của Túc Tắc Tea</p>
        </div>

        {/* Search Bar */}
        <div className="menu-search-wrap">
          <Search size={16} className="menu-search-icon" />
          <input
            id="productSearch"
            type="text"
            className="menu-search-input"
            placeholder="Tìm kiếm món ăn..."
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
      {categories.length > 0 && (
        <div className="category-strip">
          <SlidersHorizontal size={15} className="strip-icon" />
          <div className="category-pills">
            <button
              className={`category-pill ${activeCategory === '' ? 'active' : ''}`}
              onClick={() => setActiveCategory('')}
            >
              Tất cả
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
      )}

      {/* Results Info */}
      {!loading && (
        <div className="results-bar">
          <span className="results-count">
            {products.length === 0
              ? 'Không tìm thấy món nào'
              : `${products.length} món`}
          </span>
          {hasFilters && (
            <button className="clear-all-btn" onClick={clearFilters}>
              <X size={13} /> Xóa bộ lọc
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
              <div className="menu-empty">
                <div className="empty-icon">🔍</div>
                <h3>Không tìm thấy món nào</h3>
                <p>Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác nhé</p>
                {hasFilters && (
                  <button className="btn-secondary mt-4" onClick={clearFilters}>Xóa bộ lọc</button>
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
