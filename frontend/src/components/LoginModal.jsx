import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, ArrowRight, KeyRound, AlertCircle, RefreshCw, X } from 'lucide-react';

export const LoginModal = () => {
  const {
    isLoginModalOpen,
    loginStep,
    pendingUsername,
    loginMessage,
    authLoading,
    authError,
    startLogin,
    verifyOtp,
    closeLoginModal,
    setLoginStep,
    token,
  } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Auto-focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (loginStep === 'otp') {
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [loginStep]);

  if (!isLoginModalOpen) return null;

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await startLogin(username, password);
  };

  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanValue.length > 1) {
      // Handle paste of multiple digits into one field
      const pasted = cleanValue.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();

      // If full 6 digits filled, auto-submit!
      if (newDigits.every((d) => d !== '')) {
        verifyOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);

    // Auto advance focus to next box
    if (cleanValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto submit when 6th digit entered
    if (cleanValue && index === 5 && newDigits.every((d) => d !== '')) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);

    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    } else {
      otpInputsRef.current[pastedData.length]?.focus();
    }
  };

  const handleManualOtpSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length === 6) {
      verifyOtp(fullOtp);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {loginStep === 'credentials' ? <Lock size={18} /> : <ShieldCheck size={18} />}
            </div>
            <span>{loginStep === 'credentials' ? 'Admin 2FA Login' : 'Enter Verification OTP'}</span>
          </div>

          {token && (
            <button className="modal-close" onClick={closeLoginModal}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {authError && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-out-stock)',
                border: '1px solid var(--border-out-stock)',
                color: '#fb7185',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{authError}</div>
            </div>
          )}

          {loginStep === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Sign in with your Admin credentials to generate a secure One-Time Passcode (OTP) sent to your email.
              </p>

              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading || !username || !password}
                style={{ width: '100%', marginTop: 8 }}
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Sending OTP to Email...
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid var(--border-accent)',
                  color: 'var(--text-accent)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Mail size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                <div>
                  <strong>OTP sent to registered email!</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Please check your Gmail inbox or spam folder.
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Enter the 6-digit code below. Once entered, your JWT token will be <strong>automatically verified and saved</strong>.
              </p>

              <div className="otp-container" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={authLoading}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading || otpDigits.some((d) => d === '')}
                style={{ width: '100%' }}
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Verifying & Authenticating...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Verify & Access Dashboard</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setLoginStep('credentials')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  ← Back to credentials
                </button>

                <button
                  type="button"
                  onClick={() => startLogin(pendingUsername || username, password)}
                  disabled={authLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={12} /> Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
