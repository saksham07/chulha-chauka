/**
 * API client for Chulha Chauka backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cc_access_token') || null;
    this.onAuthError = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cc_access_token', token);
    } else {
      localStorage.removeItem('cc_access_token');
    }
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders(options.headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const resData = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.setToken(null);
        localStorage.removeItem('cc_user');
        if (this.onAuthError) {
          try { this.onAuthError(); } catch (e) { /* ignore */ }
        }
      }
      const errorMsg = resData?.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMsg);
    }

    return resData?.data ?? resData;
  }

  // ── Auth Endpoints ──────────────────────────────────────────
  async register(name, phone, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    });
    if (data?.accessToken) this.setToken(data.accessToken);
    return data;
  }

  async login(phone, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    if (data?.accessToken) this.setToken(data.accessToken);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // ── Menu Endpoints ──────────────────────────────────────────
  async getCategories() {
    return this.request('/menu/categories');
  }

  async getMenuItems(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    if (params.bestseller) searchParams.append('bestseller', 'true');

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/menu/items${query}`);
  }

  // ── Cart Endpoints ──────────────────────────────────────────
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(menuItemId, quantity = 1) {
    return this.request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity }),
    });
  }

  async updateCartItem(menuItemId, quantity) {
    return this.request(`/cart/items/${menuItemId}?quantity=${quantity}`, {
      method: 'PUT',
    });
  }

  async removeFromCart(menuItemId) {
    return this.request(`/cart/items/${menuItemId}`, {
      method: 'DELETE',
    });
  }

  // ── Order & Checkout Endpoints ──────────────────────────────
  async placeOrder(deliveryAddress, paymentMethod, specialNote) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        deliveryAddress,
        paymentMethod,
        specialNote,
      }),
    });
  }

  async getMyOrders() {
    return this.request('/orders/me');
  }

  async getOrder(orderId) {
    return this.request(`/orders/me/${orderId}`);
  }

  async cancelOrder(orderId) {
    return this.request(`/orders/me/${orderId}/cancel`, {
      method: 'PATCH',
    });
  }

  // ── Payment Endpoints ──────────────────────────────────────
  async createRazorpayOrder(amount, currency = 'INR', receipt = null) {
    return this.request('/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        receipt,
      }),
    });
  }

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
    });
  }

  // ── Delivery Config ─────────────────────────────────────────
  async getDeliveryConfig() {
    return this.request('/config/delivery');
  }
}

export const api = new ApiClient();
export default api;
