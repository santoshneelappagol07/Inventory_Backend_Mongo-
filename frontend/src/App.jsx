import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { productsApi } from './api/client';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { ProductList } from './components/ProductList';
import { ProductModal } from './components/ProductModal';
import { DeleteModal } from './components/DeleteModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { LoginModal } from './components/LoginModal';
import { Toast } from './components/Toast';
import { ShieldAlert, LogIn, Sparkles, Database, Lock, RefreshCw } from 'lucide-react';

function Dashboard() {
  const { isAuthenticated, openLoginModal } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');

  // Modals
  const [productModal, setProductModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'replace' | 'patch'
    product: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
  });
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    productId: null,
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await productsApi.getAll({
        status: statusFilter,
        tag: selectedTag,
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch products from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter, selectedTag, addToast]);

  // Load when auth state or server filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [isAuthenticated, fetchProducts]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [products]);

  // Client-side search filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchStatus =
        statusFilter === 'all' || p.status === statusFilter;

      const matchTag =
        !selectedTag || (Array.isArray(p.tags) && p.tags.includes(selectedTag));

      return matchSearch && matchStatus && matchTag;
    });
  }, [products, searchTerm, statusFilter, selectedTag]);

  // --- CRUD Handlers ---

  // POST: Create
  const handleCreateProduct = async (formData) => {
    setActionLoading(true);
    try {
      const newProduct = await productsApi.create(formData);
      addToast(`Product "${newProduct.name}" created successfully!`, 'success');
      setProductModal({ isOpen: false, mode: 'create', product: null });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to create product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // PUT: Full Replace
  const handleReplaceProduct = async (formData) => {
    if (!productModal.product) return;
    setActionLoading(true);
    try {
      const updated = await productsApi.replace(productModal.product.id, formData);
      addToast(`Product "${updated.name}" replaced successfully!`, 'success');
      setProductModal({ isOpen: false, mode: 'replace', product: null });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to replace product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // PATCH: Partial Update
  const handlePatchProduct = async (formData) => {
    if (!productModal.product) return;
    setActionLoading(true);
    try {
      const updated = await productsApi.updatePartial(productModal.product.id, formData);
      addToast(`Product "${updated.name}" updated successfully!`, 'success');
      setProductModal({ isOpen: false, mode: 'patch', product: null });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to update product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // PATCH: Quick Stock Adjustment (Delta)
  const handleAdjustStock = async (id, delta) => {
    try {
      const updated = await productsApi.adjustStock(id, delta);
      addToast(
        `Stock for "${updated.name}" ${delta > 0 ? `increased by +${delta}` : `decreased by ${delta}`} (Now: ${updated.quantity_in_stock})`,
        'success'
      );
      // Optimistically update list
      setProducts((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    } catch (err) {
      addToast(err.message || 'Failed to adjust stock.', 'error');
    }
  };

  // DELETE: Remove product
  const handleDeleteProduct = async (id) => {
    setActionLoading(true);
    try {
      await productsApi.delete(id);
      addToast('Product permanently deleted from MongoDB.', 'success');
      setDeleteModal({ isOpen: false, product: null });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <Toast toasts={toasts} removeToast={removeToast} />

      {isAuthenticated ? (
        <>
          {/* Top Statistics Cards */}
          <StatsCards
            products={products}
            activeStatusFilter={statusFilter}
            onSelectStatusFilter={setStatusFilter}
          />

          {/* Action Toolbar & Search */}
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            availableTags={availableTags}
            onOpenCreate={() => setProductModal({ isOpen: true, mode: 'create', product: null })}
            onRefresh={fetchProducts}
            loading={loading}
          />

          {/* Product Data Table */}
          <ProductList
            products={filteredProducts}
            onViewDetail={(p) => setDetailModal({ isOpen: true, productId: p.id })}
            onOpenPutModal={(p) => setProductModal({ isOpen: true, mode: 'replace', product: p })}
            onOpenPatchModal={(p) => setProductModal({ isOpen: true, mode: 'patch', product: p })}
            onOpenDeleteModal={(p) => setDeleteModal({ isOpen: true, product: p })}
            onAdjustStock={handleAdjustStock}
            onSelectTag={(tag) => setSelectedTag(tag === selectedTag ? '' : tag)}
            onOpenCreate={() => setProductModal({ isOpen: true, mode: 'create', product: null })}
          />
        </>
      ) : (
        /* Unauthenticated Landing / Hero Card */
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', margin: '40px auto', maxWidth: '640px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#fff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>
            Secure Inventory Management
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 28 }}>
            Protected by two-factor authentication (2FA) with automated JWT token issuance and MongoDB persistence.
            Sign in with your Admin credentials to generate a secure OTP and access the dashboard.
          </p>

          <button
            className="btn btn-primary"
            onClick={openLoginModal}
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            <LogIn size={18} />
            <span>Sign In with 2FA & Access Dashboard</span>
          </button>
        </div>
      )}

      {/* Product Create / Replace (PUT) / Update (PATCH) Modal */}
      <ProductModal
        isOpen={productModal.isOpen}
        mode={productModal.mode}
        product={productModal.product}
        onClose={() => setProductModal({ isOpen: false, mode: 'create', product: null })}
        onSubmit={
          productModal.mode === 'create'
            ? handleCreateProduct
            : productModal.mode === 'replace'
            ? handleReplaceProduct
            : handlePatchProduct
        }
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        product={deleteModal.product}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleDeleteProduct}
        loading={actionLoading}
      />

      {/* Single Product Details (GET /products/{id}) Inspector */}
      <ProductDetailModal
        isOpen={detailModal.isOpen}
        productId={detailModal.productId}
        onClose={() => setDetailModal({ isOpen: false, productId: null })}
        onOpenPutModal={(p) => setProductModal({ isOpen: true, mode: 'replace', product: p })}
        onOpenPatchModal={(p) => setProductModal({ isOpen: true, mode: 'patch', product: p })}
        onOpenDeleteModal={(p) => setDeleteModal({ isOpen: true, product: p })}
      />

      {/* 2FA Login & OTP Modal */}
      <LoginModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
