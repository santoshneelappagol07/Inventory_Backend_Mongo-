import React, { useState } from 'react';
import {
  Copy,
  Check,
  Eye,
  Edit3,
  Sliders,
  Trash2,
  PackageOpen,
  Plus,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const ProductList = ({
  products,
  onViewDetail,
  onOpenPutModal,
  onOpenPatchModal,
  onOpenDeleteModal,
  onAdjustStock,
  onSelectTag,
  onOpenCreate,
}) => {
  const [copiedId, setCopiedId] = useState(null);
  const [loadingRowId, setLoadingRowId] = useState(null);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDelta = async (id, delta) => {
    setLoadingRowId(id);
    try {
      await onAdjustStock(id, delta);
    } finally {
      setLoadingRowId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <div className="empty-icon">
          <PackageOpen size={36} />
        </div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>No Products Found</h3>
        <p style={{ maxWidth: '400px', fontSize: '0.88rem' }}>
          No inventory items match your current filter criteria, or the database is currently empty.
        </p>
        <button className="btn btn-primary" onClick={onOpenCreate} style={{ marginTop: 8 }}>
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel table-container">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product & ID</th>
            <th>Status</th>
            <th>Unit Price</th>
            <th>Stock & Quick Adjust (PATCH)</th>
            <th>Valuation</th>
            <th>Tags</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const price = Number(product.price) || 0;
            const stock = Number(product.quantity_in_stock) || 0;
            const rowValue = price * stock;
            const isRowLoading = loadingRowId === product.id;

            return (
              <tr key={product.id}>
                {/* Product Info */}
                <td style={{ minWidth: '220px' }}>
                  <div className="product-cell">
                    <span className="product-name">{product.name}</span>
                    <div className="product-id-wrapper">
                      <span className="mono">{product.id}</span>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopyId(product.id)}
                        title="Copy Product ID"
                      >
                        {copiedId === product.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </td>

                {/* Status Badge */}
                <td>
                  <span className={`pill-badge ${product.status || 'in_stock'}`}>
                    {product.status ? product.status.replace('_', ' ') : 'in stock'}
                  </span>
                </td>

                {/* Price */}
                <td className="mono" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  ${price.toFixed(2)}
                </td>

                {/* Stock & Quick Delta Stepper */}
                <td style={{ minWidth: '240px' }}>
                  <div className="stock-cell">
                    <span
                      className="stock-value mono"
                      style={{
                        color: stock === 0 ? 'var(--color-out-stock)' : stock < 10 ? '#fbbf24' : 'var(--text-main)',
                      }}
                    >
                      {stock}
                    </span>

                    <div className="delta-group">
                      <button
                        className="delta-btn decrement"
                        onClick={() => handleDelta(product.id, -5)}
                        disabled={isRowLoading || stock < 5}
                        title="Decrease stock by 5 units"
                      >
                        -5
                      </button>
                      <button
                        className="delta-btn decrement"
                        onClick={() => handleDelta(product.id, -1)}
                        disabled={isRowLoading || stock < 1}
                        title="Decrease stock by 1 unit"
                      >
                        -1
                      </button>
                      <button
                        className="delta-btn increment"
                        onClick={() => handleDelta(product.id, 1)}
                        disabled={isRowLoading}
                        title="Increase stock by 1 unit"
                      >
                        +1
                      </button>
                      <button
                        className="delta-btn increment"
                        onClick={() => handleDelta(product.id, 5)}
                        disabled={isRowLoading}
                        title="Increase stock by 5 units"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </td>

                {/* Row Valuation */}
                <td className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  ${rowValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* Tags */}
                <td style={{ maxWidth: '200px' }}>
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tag-badge"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelectTag(tag)}
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>None</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    {/* View Single GET */}
                    <button
                      className="action-btn view"
                      onClick={() => onViewDetail(product)}
                      title="Inspect Product [GET /products/{id}]"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Partial PATCH */}
                    <button
                      className="action-btn patch"
                      onClick={() => onOpenPatchModal(product)}
                      title="Partial Update [PATCH /update_partial/{id}]"
                    >
                      <Sliders size={15} />
                    </button>

                    {/* Full Replace PUT */}
                    <button
                      className="action-btn edit"
                      onClick={() => onOpenPutModal(product)}
                      title="Full Replace [PUT /update_all/{id}]"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      className="action-btn delete"
                      onClick={() => onOpenDeleteModal(product)}
                      title="Delete Product [DELETE /products/{id}]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
