import React from 'react';
import { Package, DollarSign, CheckCircle, AlertTriangle, Ban } from 'lucide-react';

export const StatsCards = ({ products, activeStatusFilter, onSelectStatusFilter }) => {
  const totalProducts = products.length;
  
  const totalValuation = products.reduce((acc, p) => {
    const price = Number(p.price) || 0;
    const qty = Number(p.quantity_in_stock) || 0;
    return acc + price * qty;
  }, 0);

  const inStockCount = products.filter((p) => p.status === 'in_stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock' || p.quantity_in_stock === 0).length;
  const discontinuedCount = products.filter((p) => p.status === 'discontinued').length;

  return (
    <div className="stats-grid">
      {/* Total Items */}
      <div className="stat-card">
        <div className="stat-icon-wrapper indigo">
          <Package size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total SKUs</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
      </div>

      {/* Inventory Valuation */}
      <div className="stat-card">
        <div className="stat-icon-wrapper emerald">
          <DollarSign size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total Valuation</span>
          <span className="stat-value">
            ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* In Stock */}
      <div
        className="stat-card"
        style={{ cursor: 'pointer', borderColor: activeStatusFilter === 'in_stock' ? 'var(--color-in-stock)' : undefined }}
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'in_stock' ? 'all' : 'in_stock')}
      >
        <div className="stat-icon-wrapper emerald">
          <CheckCircle size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">In Stock</span>
          <span className="stat-value" style={{ color: 'var(--color-in-stock)' }}>
            {inStockCount}
          </span>
        </div>
      </div>

      {/* Out of Stock */}
      <div
        className="stat-card"
        style={{ cursor: 'pointer', borderColor: activeStatusFilter === 'out_of_stock' ? 'var(--color-out-stock)' : undefined }}
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
      >
        <div className="stat-icon-wrapper rose">
          <AlertTriangle size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Out of Stock</span>
          <span className="stat-value" style={{ color: 'var(--color-out-stock)' }}>
            {outOfStockCount}
          </span>
        </div>
      </div>

      {/* Discontinued */}
      <div
        className="stat-card"
        style={{ cursor: 'pointer', borderColor: activeStatusFilter === 'discontinued' ? 'var(--color-discontinued)' : undefined }}
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'discontinued' ? 'all' : 'discontinued')}
      >
        <div className="stat-icon-wrapper purple">
          <Ban size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Discontinued</span>
          <span className="stat-value" style={{ color: 'var(--color-discontinued)' }}>
            {discontinuedCount}
          </span>
        </div>
      </div>
    </div>
  );
};
