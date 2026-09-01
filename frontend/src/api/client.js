/**
 * client.js
 * ---------
 * Central API client for the FastAPI Inventory backend.
 * Automatically injects JWT Bearer token and X-API-Key to every request,
 * handles token expiration events, and standardizes error messages.
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';
const DEFAULT_API_KEY = '1245';

export const getApiBaseUrl = () => {
  return localStorage.getItem('api_base_url') || DEFAULT_BASE_URL;
};

export const setApiBaseUrl = (url) => {
  localStorage.setItem('api_base_url', url);
};

export const getApiKey = () => {
  return localStorage.getItem('inventory_api_key') || DEFAULT_API_KEY;
};

export const setApiKey = (key) => {
  localStorage.setItem('inventory_api_key', key);
};

export const getToken = () => {
  return localStorage.getItem('jwt_access_token');
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('jwt_access_token', token);
  } else {
    localStorage.removeItem('jwt_access_token');
  }
};

export const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Generic fetch wrapper with automatic JWT & X-API-Key header injection
async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    ...options.headers,
  };

  // Attach X-API-Key
  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // Attach JWT Bearer Token if present and not explicitly skipped
  if (!options.skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Auto-set JSON content-type if body is an object
  if (options.body && typeof options.body === 'object' && !(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || (typeof data === 'string' ? data : 'Request failed');
      
      // Emit token expired event if 401
      if (response.status === 401 && (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('token'))) {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: errorMessage }));
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const networkError = new Error(`Cannot connect to FastAPI backend at ${baseUrl}. Ensure backend is running.`);
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
}

// Auth Endpoints
export const authApi = {
  /**
   * Step 1: POST /login
   * Expects form-urlencoded { username, password }
   */
  async login(username, password) {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    return request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      skipAuth: true,
    });
  },

  /**
   * Step 2: POST /verify-otp
   * Expects JSON { username, otp }
   * Returns { access_token, token_type }
   */
  async verifyOtp(username, otp) {
    return request('/verify-otp', {
      method: 'POST',
      body: { username, otp },
      skipAuth: true,
    });
  },
};

// Products Endpoints
export const productsApi = {
  /**
   * GET /products/all_products
   * Optional query params: status, tag
   */
  async getAll({ status, tag } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (tag) params.append('tag', tag);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/products/all_products${queryString}`, { method: 'GET' });
  },

  /**
   * GET /products/{id}
   */
  async getById(id) {
    return request(`/products/${id}`, { method: 'GET' });
  },

  /**
   * POST /products/create_product/
   * Body: { name, price, quantity_in_stock, is_active, tags, status }
   */
  async create(productData) {
    return request('/products/create_product/', {
      method: 'POST',
      body: productData,
    });
  },

  /**
   * PUT /update_all/{id}
   * Full replace: { name, price, quantity_in_stock, is_active, tags, status }
   */
  async replace(id, productData) {
    return request(`/update_all/${id}`, {
      method: 'PUT',
      body: productData,
    });
  },

  /**
   * PATCH /update_partial/{id}
   * Partial update: any subset of fields or quantity_delta
   */
  async updatePartial(id, partialData) {
    return request(`/update_partial/${id}`, {
      method: 'PATCH',
      body: partialData,
    });
  },

  /**
   * Quick Stock Adjustment via PATCH
   */
  async adjustStock(id, quantityDelta) {
    return request(`/update_partial/${id}`, {
      method: 'PATCH',
      body: { quantity_delta: quantityDelta },
    });
  },

  /**
   * DELETE /products/{id}
   */
  async delete(id) {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
