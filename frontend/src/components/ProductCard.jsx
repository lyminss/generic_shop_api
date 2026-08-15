import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { useEffect, useState } from 'react';
import { reviewService } from '../services/api';
import './ProductCard.css';

const getStockStatus = (qty) => {
  if (qty === 0) return { label: 'Hết hàng', cls: 'stock-out' };
  if (qty <= 5) return { label: `Còn ${qty} ly`, cls: 'stock-low' };
  return { label: 'Sẵn sàng', cls: 'stock-ok' };
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const stock = getStockStatus(product.stockQuantity ?? 999);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    reviewService.getReviews(product.id)
      .then(res => {
        setAvgRating(res.data.avgRating || 0);
        setReviewCount(res.data.totalReviews || 0);
      })
      .catch(() => {});
  }, [product.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm món vào giỏ hàng");
      return;
    }
    if (product.stockQuantity === 0) {
      toast.error("Món này hiện đã hết hàng");
      return;
    }
    addToCart(product.id, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card glass-card">
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-emoji">🧋</span>
          </div>
        )}
        {product.category && (
          <span className="category-badge">
            <Tag size={11} /> {product.category}
          </span>
        )}
        <span className={`stock-badge ${stock.cls}`}>{stock.label}</span>
      </div>

      <div className="product-info">
        <div className="title-row">
          <h3 className="product-name">{product.name}</h3>
        </div>

        {/* Rating display */}
        {reviewCount > 0 ? (
          <div className="product-rating">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="rating-value">{avgRating?.toFixed(1)}</span>
            <span className="rating-count">({reviewCount} đánh giá)</span>
          </div>
        ) : (
          <div className="product-rating">
            <Sparkles size={12} className="text-amber-500" />
            <span className="rating-count">Món nước được yêu thích</span>
          </div>
        )}

        {product.description && (
          <p className="product-desc">
            {product.description.length > 55
              ? product.description.substring(0, 55) + '…'
              : product.description}
          </p>
        )}

        <div className="product-footer">
          <span className="product-price">
            {formatPrice(product.price)}
          </span>
          <button
            className={`add-cart-btn ${product.stockQuantity === 0 ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            title={product.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            disabled={product.stockQuantity === 0}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
          >
            <ShoppingCart size={17} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

