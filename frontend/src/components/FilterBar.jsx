import React from 'react';
import { Search, Plus, RefreshCw, Filter, Tag, X } from 'lucide-react';

export const FilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectedTag,
  setSelectedTag,
  availableTags,
  onOpenCreate,
  onRefresh,
  loading,
}) => {
  return (
    <div className="glass-panel toolbar">
      <div className="toolbar-left">
        {/* Search Input */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, ID, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="filter-pills">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === 'in_stock' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_stock')}
          >
            In Stock
          </button>
          <button
            className={`filter-btn ${statusFilter === 'out_of_stock' ? 'active' : ''}`}
            onClick={() => setStatusFilter('out_of_stock')}
          >
            Out of Stock
          </button>
          <button
            className={`filter-btn ${statusFilter === 'discontinued' ? 'active' : ''}`}
            onClick={() => setStatusFilter('discontinued')}
          >
            Discontinued
          </button>
        </div>

        {/* Tag Filter Dropdown */}
        {availableTags.length > 0 && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                width: 'auto',
                minWidth: '130px',
                background: selectedTag ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                borderColor: selectedTag ? 'var(--primary)' : 'var(--border-subtle)',
              }}
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={loading}
          title="Reload products from MongoDB"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        <button className="btn btn-primary" onClick={onOpenCreate}>
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>
    </div>
  );
};
