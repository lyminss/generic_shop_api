import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { ShoppingCart, ArrowLeft, Plus, Minus, Tag, CheckCircle, XCircle, Sparkles, Snowflake, Flame } from 'lucide-react';
import ReviewSection from '../../components/ReviewSection';
import './ProductDetail.css';

const SIZES = [
  { id: 'M', name: 'Size Vừa (M)', priceExtra: 0 },
  { id: 'L', name: 'Size Lớn (L)', priceExtra: 8000 },
];

const ICE_LEVELS = ['100% Đá', '50% Ít Đá', 'Không Đá (0%)'];
const SUGAR_LEVELS = ['100% Đường', '70% Đường', '50% Ít Đường', '0% Không Đường'];
const TOPPINGS = [
  { id: 't1', name: 'Trân Châu Hoàng Kim', price: 6000 },
  { id: 't2', name: 'Thạch Dừa Giòn', price: 5000 },
  { id: 't3', name: 'Kem Phô Mai Béo', price: 10000 },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedIce, setSelectedIce] = useState(ICE_LEVELS[0]);
  const [selectedSugar, setSelectedSugar] = useState(SUGAR_LEVELS[0]);
  const [selectedToppings, setSelectedToppings] = useState([]);
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

  const toggleTopping = (topping) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculateUnitPrice = () => {
    if (!product) return 0;
    const toppingTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
    return product.price + selectedSize.priceExtra + toppingTotal;
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm món vào giỏ hàng");
      return;
    }
    if (product.stockQuantity === 0) {
      toast.error("Món này hiện đã hết hàng");
      return;
    }
    
    // Customization notes string
    const notes = `${selectedSize.name}, ${selectedIce}, ${selectedSugar}` + 
      (selectedToppings.length > 0 ? `, Topping: ${selectedToppings.map(t => t.name).join(', ')}` : '');

    addToCart(product.id, quantity, notes);
    toast.success(`Đã thêm ${quantity}x "${product.name}" (${selectedSize.id}) vào giỏ hàng!`);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin" />
          <p className="text-stone-500 font-medium">Đang tải hương vị món nước...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧋</div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Không tìm thấy đồ uống này</h2>
          <Link to="/menu" className="btn-brand inline-flex items-center gap-2 mt-4">
            <ArrowLeft size={16} /> Quay lại Thực đơn
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const unitPrice = calculateUnitPrice();
  const totalPrice = unitPrice * quantity;

  return (
    <div className="product-detail-container animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/menu" className="back-link">
        <ArrowLeft size={18} /> Quay lại Thực đơn
      </Link>

      {/* Product Layout */}
      <div className="product-detail-layout glass-card">
        {/* Image */}
        <div className="product-detail-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="image-placeholder-large">
              <span className="text-6xl">🧋</span>
            </div>
          )}
          {product.category && (
            <span className="category-tag-floating">
              <Tag size={12} /> {product.category}
            </span>
          )}
        </div>

        {/* Info & Customization Options */}
        <div className="product-detail-info">
          <h1 className="product-title">{product.name}</h1>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-3">
            {inStock ? (
              <span className="stock-tag-ok">
                <CheckCircle size={15} /> Sẵn sàng pha chế ({product.stockQuantity} ly)
              </span>
            ) : (
              <span className="stock-tag-out">
                <XCircle size={15} /> Tạm hết hàng
              </span>
            )}
          </div>

          <p className="product-price">{formatPrice(unitPrice)}</p>

          {product.description && (
            <div className="product-description">
              <h3>Mô tả đồ uống</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Beverage Customization Options */}
          <div className="customization-section">
            {/* Size selection */}
            <div className="custom-group">
              <label className="group-title">1. Chọn Size</label>
              <div className="option-pills">
                {SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`option-pill ${selectedSize.id === size.id ? 'active' : ''}`}
                  >
                    <span>{size.name}</span>
                    {size.priceExtra > 0 && <span className="extra-price">+{formatPrice(size.priceExtra)}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Ice Level */}
            <div className="custom-group">
              <label className="group-title"><Snowflake size={14} className="inline mr-1 text-sky-500" /> 2. Lượng Đá</label>
              <div className="option-pills">
                {ICE_LEVELS.map((ice) => (
                  <button
                    key={ice}
                    onClick={() => setSelectedIce(ice)}
                    className={`option-pill ${selectedIce === ice ? 'active' : ''}`}
                  >
                    {ice}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div className="custom-group">
              <label className="group-title"><Sparkles size={14} className="inline mr-1 text-amber-500" /> 3. Lượng Đường</label>
              <div className="option-pills">
                {SUGAR_LEVELS.map((sugar) => (
                  <button
                    key={sugar}
                    onClick={() => setSelectedSugar(sugar)}
                    className={`option-pill ${selectedSugar === sugar ? 'active' : ''}`}
                  >
                    {sugar}
                  </button>
                ))}
              </div>
            </div>

            {/* Topping choices */}
            <div className="custom-group">
              <label className="group-title">4. Thêm Topping</label>
              <div className="option-pills">
                {TOPPINGS.map((topping) => {
                  const isSelected = !!selectedToppings.find(t => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      onClick={() => toggleTopping(topping)}
                      className={`option-pill ${isSelected ? 'active' : ''}`}
                    >
                      <span>{topping.name}</span>
                      <span className="extra-price">+{formatPrice(topping.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
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
              className="btn-brand add-to-cart-lg"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart size={20} />
              <span>{!inStock ? 'Hết hàng' : addedToCart ? 'Đã Thêm! ✓' : `Thêm Vào Giỏ • ${formatPrice(totalPrice)}`}</span>
            </button>
          </div>
        </div>
      </div>

      <hr className="my-12 border-stone-200" />

      {/* Review Section */}
      <ReviewSection productId={id} />
    </div>
  );
};

export default ProductDetail;

