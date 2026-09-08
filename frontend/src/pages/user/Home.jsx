import { useState, useEffect, useRef } from 'react';
import { productService, categoryService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import './Home.css';
import { Search, X, CupSoda, ChevronRight, Sparkles, SlidersHorizontal, Leaf } from 'lucide-react';

/* ── Category emoji mapping ── */
const CAT_ICONS = {
  'Trà sữa':        '🧋',
  'Cà phê':         '☕',
  'Sinh tố':        '🥤',
  'Nước ép':        '🍊',
  'Trà trái cây':   '🍵',
  'Đá xay':         '🧊',
  'Trà':            '🍵',
  'Nước ngọt':      '🥤',
};
const getCatIcon = (cat) => CAT_ICONS[cat] ?? '🌿';

/* ── Skeleton card ── */
const ProductSkeleton = () => (
  <div className="pc-skeleton">
    <div className="pc-skeleton__img skeleton-shimmer" />
    <div className="pc-skeleton__body">
      <div className="pc-skeleton__line skeleton-shimmer" style={{ width: '70%', height: '1rem' }} />
      <div className="pc-skeleton__line skeleton-shimmer" style={{ width: '40%', height: '0.75rem' }} />
      <div className="pc-skeleton__line skeleton-shimmer" style={{ width: '55%', height: '1.25rem', marginTop: 'auto' }} />
    </div>
  </div>
);

const Home = () => {
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [debounced, setDebounced]       = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const searchRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch active categories */
  useEffect(() => {
    categoryService.getActive()
      .then(res => {
        const catNames = (res.data || []).map(c => c.name);
        setCategories(catNames);
      })
      .catch(() => {
        productService.getCategories()
          .then(res => setCategories(res.data || []))
          .catch(() => {});
      });
  }, []);

  /* Fetch products (ẩn các món có trạng thái STOPPED) */
  useEffect(() => {
    setLoading(true);
    productService.getFiltered(activeCategory, debounced)
      .then(res => {
        const list = (res.data || []).filter(p => p.status !== 'STOPPED');
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, debounced]);

  const toggleCategory = (cat) => {
    setActiveCategory(prev => prev === cat ? '' : cat);
    setSidebarOpen(false);
  };

  const clearFilters = () => { setSearch(''); setActiveCategory(''); };
  const hasFilters = activeCategory || debounced;

  return (
    <div className="menu-page animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="menu-hero">
        <div className="menu-hero__inner container">
          <div className="menu-hero__badge">
            <Leaf size={13} />
            Tươi ngon mỗi ngày
          </div>
          <h1 className="menu-hero__title">Thực Đơn MinTea</h1>
          <p className="menu-hero__sub">Trà sữa • Cà phê • Trà trái cây thủ công</p>

          {/* Search */}
          <div className="menu-hero__search-wrap">
            <Search size={18} className="menu-hero__search-icon" />
            <input
              ref={searchRef}
              id="productSearch"
              type="text"
              className="menu-hero__search-input"
              placeholder="Tìm tên đồ uống..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            {search && (
              <button
                className="menu-hero__search-clear"
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="menu-hero__blob menu-hero__blob--1" />
        <div className="menu-hero__blob menu-hero__blob--2" />
      </div>

      {/* ── Body: Sidebar + Grid ── */}
      <div className="menu-body container">

        {/* Mobile Filter Toggle */}
        <button
          className="menu-filter-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          aria-expanded={sidebarOpen}
        >
          <SlidersHorizontal size={16} />
          Danh mục
          {activeCategory && <span className="menu-filter-dot" />}
        </button>

        {/* Sidebar */}
        <aside className={`menu-sidebar ${sidebarOpen ? 'menu-sidebar--open' : ''}`}>
          <div className="menu-sidebar__header">
            <span className="menu-sidebar__title">Danh mục</span>
            {sidebarOpen && (
              <button className="menu-sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            )}
          </div>

          <ul className="menu-cat-list" role="list">
            {/* All */}
            <li>
              <button
                className={`menu-cat-item ${activeCategory === '' ? 'menu-cat-item--active' : ''}`}
                onClick={() => toggleCategory('')}
              >
                <span className="menu-cat-item__icon">🧋</span>
                <span className="menu-cat-item__label">Tất cả món</span>
                <ChevronRight size={14} className="menu-cat-item__arrow" />
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat}>
                <button
                  className={`menu-cat-item ${activeCategory === cat ? 'menu-cat-item--active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  <span className="menu-cat-item__icon">{getCatIcon(cat)}</span>
                  <span className="menu-cat-item__label">{cat}</span>
                  <ChevronRight size={14} className="menu-cat-item__arrow" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="menu-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* Main Content */}
        <main className="menu-main">

          {/* Results bar */}
          <div className="menu-results-bar">
            <div className="menu-results-bar__left">
              {activeCategory && (
                <span className="menu-active-cat">
                  {getCatIcon(activeCategory)} {activeCategory}
                </span>
              )}
              <span className="menu-results-count">
                {loading ? '…' : `${products.length} món`}
              </span>
            </div>
            {hasFilters && (
              <button className="menu-clear-btn" onClick={clearFilters}>
                <X size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="menu-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              : products.length === 0
                ? (
                  <div className="menu-empty">
                    <CupSoda size={56} className="menu-empty__icon" />
                    <h3 className="menu-empty__title">Không tìm thấy món phù hợp</h3>
                    <p className="menu-empty__sub">Thử tìm tên khác hoặc chọn lại danh mục nhé!</p>
                    {hasFilters && (
                      <button className="btn-brand" style={{ marginTop: '1.25rem' }} onClick={clearFilters}>
                        <Sparkles size={15} /> Xem tất cả
                      </button>
                    )}
                  </div>
                )
                : products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
            }
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
