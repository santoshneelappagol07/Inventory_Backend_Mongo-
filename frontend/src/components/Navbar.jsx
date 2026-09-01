import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  ShieldCheck,
  KeyRound,
  LogOut,
  LogIn,
  Clock,
  Settings2,
  Check,
  Zap,
} from 'lucide-react';

export const Navbar = ({ onOpenSettings }) => {
  const {
    user,
    tokenInfo,
    isAuthenticated,
    logout,
    openLoginModal,
    apiKey,
    updateApiKey,
  } = useAuth();

  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '1245');

  const handleSaveKey = () => {
    updateApiKey(tempKey.trim());
    setIsEditingKey(false);
  };

  return (
    <header className="glass-panel navbar">
      <div className="brand-badge">
        <div className="brand-icon">
          <Boxes size={24} />
        </div>
        <div>
          <div className="brand-title">Inventory OS</div>
          <div className="brand-subtitle">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            FastAPI + MongoDB Engine
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Token Expiry Status */}
        {isAuthenticated && tokenInfo && (
          <div
            className="pill-badge online"
            title={`Token issued for ${tokenInfo.sub}. Expires at ${tokenInfo.expDate}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
          >
            <Clock size={14} color="#10b981" />
            <span>JWT Active: {tokenInfo.minutesLeft > 60 ? `${Math.floor(tokenInfo.minutesLeft / 60)}h ${tokenInfo.minutesLeft % 60}m` : `${tokenInfo.minutesLeft}m`}</span>
          </div>
        )}

        {/* API Key Manager Quick Tool */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isEditingKey ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--bg-input)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '2px 4px 2px 8px',
              }}
            >
              <KeyRound size={14} color="var(--primary)" />
              <input
                type="text"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="X-API-Key"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  width: '90px',
                  outline: 'none',
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSaveKey}
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: '24px' }}
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setTempKey(apiKey);
                setIsEditingKey(true);
              }}
              title="Click to change X-API-Key header"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <KeyRound size={14} color="var(--text-accent)" />
              <span>X-API-Key: <span className="mono" style={{ color: 'var(--text-main)' }}>{apiKey}</span></span>
            </button>
          )}
        </div>

        {/* Auth Status / Action */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {(user?.username || 'A')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.username || 'Admin'}</span>
            </div>

            <button
              className="btn btn-secondary btn-icon"
              onClick={logout}
              title="Log out and clear JWT token"
              style={{ color: '#fb7185' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={openLoginModal}>
            <LogIn size={16} />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
