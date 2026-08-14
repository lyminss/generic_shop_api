import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { ShoppingCart, ArrowLeft, Plus, Minus, Tag, CheckCircle, XCircle } from 'lucide-react';
import ReviewSection from '../components/ReviewSection';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productService.getById(id);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    if (product.stockQuantity === 0) {
      toast.error("Món ăn này đã hết hàng");
      return;
    }
    addToCart(product.id, quantity);
    toast.success(`Đã thêm ${quantity} suất "${product.name}" vào giỏ hàng!`);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <p className="text-gray-500">Đang tải thông tin món ăn...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy món ăn</h2>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-4">
            <ArrowLeft size={16} /> Quay lại Thực đơn
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <div className="product-detail-container animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/menu" className="back-link inline-flex items-center gap-2 mb-6 text-green-700 hover:text-green-900 font-medium transition-colors">
        <ArrowLeft size={18} /> Quay lại Thực đơn
      </Link>

      {/* Product Layout */}
      <div className="product-detail-layout">
        {/* Image */}
        <div className="product-detail-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="image-placeholder-large">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          {/* Category badge on image */}
          {product.category && (
            <span className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-green-700 shadow-sm backdrop-blur-sm">
              <Tag size={11} /> {product.category}
            </span>
          )}
        </div>

        {/* Info Panel */}
        <div className="product-detail-info">
          <h1 className="product-title">{product.name}</h1>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-4">
            {inStock ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle size={16} />
                {lowStock ? `Chỉ còn ${product.stockQuantity} suất` : 'Còn hàng'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-rose-500">
                <XCircle size={16} /> Hết hàng
              </span>
            )}
          </div>

          <p className="product-price">{formatPrice(product.price)}</p>

          {product.description && (
            <div className="product-description">
              <h3>Mô tả</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="add-to-cart-section">
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Giảm số lượng"
              >
                <Minus size={16} />
              </button>
              <span className="font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                disabled={!inStock}
                aria-label="Tăng số lượng"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className={`btn-primary add-to-cart-lg transition-all duration-300 ${addedToCart ? 'scale-95' : ''}`}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart size={20} />
              {!inStock ? 'Hết hàng' : addedToCart ? 'Đã thêm! ✓' : 'Thêm vào Giỏ hàng'}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-10 border-gray-100" />

      {/* Review Section */}
      <ReviewSection productId={id} />
    </div>
  );
};

export default ProductDetail;
