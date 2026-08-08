import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to add to cart");
      return;
    }
    addToCart(product.id, 1);
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card glass-panel">
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description?.substring(0, 50)}...</p>
        <div className="product-footer">
          <span className="product-price">${product.price?.toFixed(2)}</span>
          <button className="add-cart-btn" onClick={handleAddToCart} title="Add to Cart">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
