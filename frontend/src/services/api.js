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
  getMyOrders: () => api.get('/orders/my'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}?status=CANCEL`),
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

export default api;
