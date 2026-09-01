import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export const DeleteModal = ({ isOpen, product, onClose, onConfirm, loading }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: '#fb7185' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-out-stock)',
                border: '1px solid var(--border-out-stock)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
              }}
            >
              <Trash2 size={18} />
            </div>
            <span>Delete Product [DELETE]</span>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
            Are you sure you want to delete <strong>{product.name}</strong> from MongoDB?
          </p>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Product ID: </span>
              <span className="mono" style={{ color: 'var(--text-accent)' }}>{product.id}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Current Stock: </span>
              <span>{product.quantity_in_stock} units</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Unit Price: </span>
              <span>${Number(product.price).toFixed(2)}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              color: '#fb7185',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>This action is permanent and cannot be undone.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(product.id)}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
