import React, { useState, useEffect } from 'react';
import { productsApi } from '../api/client';
import { Eye, Calendar, Tag, DollarSign, Package, Check, Copy, X, Edit3, Sliders, Trash2, Code } from 'lucide-react';

export const ProductDetailModal = ({
  isOpen,
  productId,
  onClose,
  onOpenPutModal,
  onOpenPatchModal,
  onOpenDeleteModal,
}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      fetchDetails(productId);
    } else {
      setProduct(null);
      setError('');
      setShowJson(false);
    }
  }, [isOpen, productId]);

  const fetchDetails = async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await productsApi.getById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (product?.id) {
      navigator.clipboard.writeText(product.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Eye size={18} />
            </div>
            <span>Product Details [GET /products/&#123;id&#125;]</span>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading product data from MongoDB...
            </div>
          ) : error ? (
            <div style={{ padding: '20px', color: '#fb7185', textAlign: 'center' }}>{error}</div>
          ) : product ? (
            <>
              {/* Product Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>{product.name}</h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 4,
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                    }}
                  >
                    <span>MongoDB _id:</span>
                    <span className="mono" style={{ color: 'var(--text-accent)' }}>{product.id}</span>
                    <button
                      className="copy-btn"
                      onClick={handleCopyId}
                      title="Copy ID"
                    >
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <span className={`pill-badge ${product.status || 'in_stock'}`}>
                  {product.status ? product.status.replace('_', ' ') : 'in stock'}
                </span>
              </div>

              {/* Key Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Unit Price</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                    ${Number(product.price).toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>In Stock</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2, color: product.quantity_in_stock === 0 ? 'var(--color-out-stock)' : 'var(--color-in-stock)' }}>
                    {product.quantity_in_stock}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Valuation</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2, color: 'var(--text-accent)' }}>
                    ${(Number(product.price) * Number(product.quantity_in_stock)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Timestamp & Visibility */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  <span>Added: {product.added_on ? new Date(product.added_on).toLocaleString() : 'N/A'}</span>
                </div>

                <div style={{ color: product.is_active ? '#10b981' : '#fb7185' }}>
                  {product.is_active ? '● Active in Catalog' : '○ Inactive / Hidden'}
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Category Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <span key={tag} className="tag-badge">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Raw JSON Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Code size={14} />
                  <span>{showJson ? 'Hide Raw JSON' : 'View Raw API Response'}</span>
                </button>

                {showJson && (
                  <pre
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      overflowX: 'auto',
                      border: '1px solid var(--border-subtle)',
                      color: '#a5b4fc',
                    }}
                  >
                    {JSON.stringify(product, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {product && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onClose();
                    onOpenPatchModal(product);
                  }}
                  title="Quick PATCH"
                >
                  <Sliders size={14} />
                  <span>PATCH</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onClose();
                    onOpenPutModal(product);
                  }}
                  title="Full Replace PUT"
                >
                  <Edit3 size={14} />
                  <span>PUT</span>
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => {
                    onClose();
                    onOpenDeleteModal(product);
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
