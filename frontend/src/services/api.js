import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api', // Adjust if your backend port is different
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Product endpoints
export const productService = {
  getAll: () => api.get('/product'),
  getById: (id) => api.get(`/product/${id}`),
  getFiltered: (category, search) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.get(`/product?${params.toString()}`);
  },
  getCategories: () => api.get('/product/categories'),
  createProduct: (data) => api.post('/product', data),
  updateProduct: (id, data) => api.put(`/product/${id}`, data),
  deleteProduct: (id) => api.delete(`/product/${id}`),
};

// Cart endpoints
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post(`/cart/add?productId=${productId}&quantity=${quantity}`),
  updateCart: (productId, quantity) => api.put(`/cart/update?productId=${productId}&quantity=${quantity}`),
  removeItem: (itemId) => api.delete(`/cart/remove/${itemId}`),
};

// Order endpoints
export const orderService = {
  checkout: (data) => api.post('/orders/checkout', data),
  createPosOrder: (data) => api.post('/orders/pos', data),
  getMyOrders: () => api.get('/orders/my'),
  getAllOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}?status=${status}`),
  cancelOrder: (id) => api.put(`/orders/${id}?status=CANCEL`),
  markItemReady: (itemId) => api.put(`/orders/items/${itemId}/ready`),
};


export const addressService = {
  getMyAddresses: () => api.get('/addresses'),
  addAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/addresses/${id}/default`),
};

// Review endpoints
export const reviewService = {
  getReviews: (productId) => api.get(`/reviews/product/${productId}`),
  createReview: (productId, rating, comment) =>
    api.post(`/reviews/product/${productId}`, { rating, comment }),
  canReview: (productId) => api.get(`/reviews/product/${productId}/can-review`),
};

// Admin endpoints
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role?role=${role}`),
};

// Ingredient endpoints
export const ingredientService = {
  getAll: () => api.get('/ingredients'),
  getLowStock: () => api.get('/ingredients/low-stock'),
  getById: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post('/ingredients', data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
};

// Recipe endpoints
export const recipeService = {
  getRecipeByProductId: (productId) => api.get(`/recipes/product/${productId}`),
  saveRecipe: (data) => api.post('/recipes', data),
  deleteRecipeItem: (id) => api.delete(`/recipes/item/${id}`),
};

// Stock Receipt endpoints (Phiếu Nhập Kho)
export const stockReceiptService = {
  getAll: () => api.get('/stock-receipts'),
  getById: (id) => api.get(`/stock-receipts/${id}`),
  create: (data) => api.post('/stock-receipts', data),
};

// Stock Adjustment endpoints (Phiếu Điều Chỉnh Kho)
export const stockAdjustmentService = {
  getAll: () => api.get('/stock-adjustments'),
  getById: (id) => api.get(`/stock-adjustments/${id}`),
  create: (data) => api.post('/stock-adjustments', data),
};

// Inventory Transaction endpoints (Nhật ký Biến Động Kho)
export const inventoryTransactionService = {
  getAll: (ingredientId, type) => {
    const params = new URLSearchParams();
    if (ingredientId) params.append('ingredientId', ingredientId);
    if (type) params.append('type', type);
    return api.get(`/inventory-transactions?${params.toString()}`);
  },
};

export default api;
