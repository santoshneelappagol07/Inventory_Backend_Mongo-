import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Sliders, X, Tag, Check, AlertCircle } from 'lucide-react';

export const ProductModal = ({ isOpen, mode, product, onClose, onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('in_stock');
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [formError, setFormError] = useState('');

  // Populate form based on mode and selected product
  useEffect(() => {
    if (isOpen) {
      setFormError('');
      if ((mode === 'replace' || mode === 'patch') && product) {
        setName(product.name || '');
        setPrice(product.price !== undefined ? String(product.price) : '');
        setQuantity(product.quantity_in_stock !== undefined ? String(product.quantity_in_stock) : '');
        setStatus(product.status || 'in_stock');
        setIsActive(product.is_active !== undefined ? product.is_active : true);
        setTags(product.tags ? [...product.tags] : []);
        setQuantityDelta('');
      } else {
        // Create mode default
        setName('');
        setPrice('');
        setQuantity('0');
        setStatus('in_stock');
        setIsActive(true);
        setTags([]);
        setTagInput('');
        setQuantityDelta('');
      }
    }
  }, [isOpen, mode, product]);

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#|,/g, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (mode === 'create' || mode === 'replace') {
      if (!name.trim()) {
        setFormError('Product name is required.');
        return;
      }
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setFormError('Price must be greater than 0.');
        return;
      }
      const numQty = parseInt(quantity, 10);
      if (isNaN(numQty) || numQty < 0) {
        setFormError('Quantity in stock cannot be negative.');
        return;
      }

      const payload = {
        name: name.trim(),
        price: numPrice,
        quantity_in_stock: numQty,
        status,
        is_active: isActive,
        tags,
      };

      onSubmit(payload);
    } else if (mode === 'patch') {
      // For PATCH: only include fields that were provided/modified
      const patchData = {};
      if (name.trim()) patchData.name = name.trim();
      if (price !== '') {
        const p = parseFloat(price);
        if (!isNaN(p) && p > 0) patchData.price = p;
      }
      if (quantity !== '') {
        const q = parseInt(quantity, 10);
        if (!isNaN(q) && q >= 0) patchData.quantity_in_stock = q;
      }
      if (status) patchData.status = status;
      patchData.is_active = isActive;
      patchData.tags = tags;

      if (quantityDelta !== '') {
        const delta = parseInt(quantityDelta, 10);
        if (!isNaN(delta) && delta !== 0) {
          patchData.quantity_delta = delta;
        }
      }

      onSubmit(patchData);
    }
  };

  const getTitle = () => {
    if (mode === 'create') return { icon: <Plus size={20} />, text: 'Add New Product [POST]' };
    if (mode === 'replace') return { icon: <Edit3 size={20} />, text: `Full Replace: ${product?.name} [PUT]` };
    return { icon: <Sliders size={20} />, text: `Partial Update: ${product?.name} [PATCH]` };
  };

  const { icon, text } = getTitle();

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: mode === 'create' ? 'var(--gradient-primary)' : mode === 'replace' ? 'var(--gradient-emerald)' : 'var(--gradient-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {icon}
            </div>
            <span>{text}</span>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-out-stock)',
                  border: '1px solid var(--border-out-stock)',
                  color: '#fb7185',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Product Name {mode !== 'patch' && <span style={{ color: '#fb7185' }}>*</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Ergonomic Keyboard"
                required={mode !== 'patch'}
              />
            </div>

            {/* Price & Quantity Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Unit Price ($) {mode !== 'patch' && <span style={{ color: '#fb7185' }}>*</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required={mode !== 'patch'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {mode === 'patch' ? 'Direct Stock Override' : 'Quantity in Stock'} {mode !== 'patch' && <span style={{ color: '#fb7185' }}>*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required={mode !== 'patch'}
                />
              </div>
            </div>

            {/* Relative Stock Delta (for PATCH only) */}
            {mode === 'patch' && (
              <div className="form-group">
                <label className="form-label">Relative Stock Delta (Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value)}
                  placeholder="e.g. +10 to restock, -3 to sell units"
                />
                <span className="form-hint">
                  Adds or subtracts relative to current stock without overwriting the whole count.
                </span>
              </div>
            )}

            {/* Status & Active Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Inventory Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Active Visibility</label>
                <div className="toggle-wrapper">
                  <span style={{ fontSize: '0.85rem' }}>{isActive ? 'Active' : 'Inactive'}</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tags Input */}
            <div className="form-group">
              <label className="form-label">Category Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {tags.map((tag) => (
                  <span key={tag} className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    #{tag}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                  </span>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter or comma (e.g. electronics, accessories)"
                />
                <Tag size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
              <span className="form-hint">Press Enter or type a comma to add multiple tags.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                'Saving...'
              ) : mode === 'create' ? (
                'Create Product'
              ) : mode === 'replace' ? (
                'Save Full Replace'
              ) : (
                'Apply Partial Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
