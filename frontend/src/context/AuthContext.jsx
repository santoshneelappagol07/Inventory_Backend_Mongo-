import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  getToken,
  setToken,
  getApiKey,
  setApiKey as storeApiKey,
  parseJwt,
} from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken());
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [user, setUser] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  
  // Login wizard state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'otp'
  const [pendingUsername, setPendingUsername] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Update decoded user and token exp info whenever token changes
  const evaluateToken = useCallback((jwtToken) => {
    if (!jwtToken) {
      setUser(null);
      setTokenInfo(null);
      return false;
    }
    const decoded = parseJwt(jwtToken);
    if (!decoded) {
      setUser(null);
      setTokenInfo(null);
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp && decoded.exp < nowSeconds;

    if (isExpired) {
      setUser(null);
      setTokenInfo({ ...decoded, isExpired: true, minutesLeft: 0 });
      return false;
    }

    const minutesLeft = Math.max(0, Math.round((decoded.exp - nowSeconds) / 60));
    setUser({ username: decoded.sub || 'Admin' });
    setTokenInfo({
      ...decoded,
      isExpired: false,
      minutesLeft,
      expDate: new Date(decoded.exp * 1000).toLocaleString(),
    });
    return true;
  }, []);

  // Initial check on load
  useEffect(() => {
    const currentToken = getToken();
    const isValid = evaluateToken(currentToken);
    if (!isValid && !currentToken) {
      // If no token exists, open the login modal automatically
      setIsLoginModalOpen(true);
    }
  }, [evaluateToken]);

  // Periodic token expiration check (every 30 seconds)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      evaluateToken(token);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, evaluateToken]);

  // Listen for 401 events from the API client
  useEffect(() => {
    const handleExpired = (event) => {
      setAuthError(event.detail || 'Your session has expired. Please log in again.');
      setToken(null);
      setTokenState(null);
      setUser(null);
      setTokenInfo(null);
      setLoginStep('credentials');
      setIsLoginModalOpen(true);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  /**
   * Step 1: Submit username & password to receive OTP
   */
  const startLogin = async (username, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await authApi.login(username, password);
      setPendingUsername(username);
      setLoginMessage(response.message || 'OTP sent to your registered email.');
      setLoginStep('otp');
      return { success: true, message: response.message };
    } catch (err) {
      setAuthError(err.message || 'Failed to authenticate. Check your credentials.');
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Step 2: Submit 6-digit OTP to automatically get & save the JWT token
   */
  const verifyOtp = async (otp) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await authApi.verifyOtp(pendingUsername, otp);
      if (response && response.access_token) {
        const receivedToken = response.access_token;
        // Save to localStorage and state
        setToken(receivedToken);
        setTokenState(receivedToken);
        evaluateToken(receivedToken);

        // Reset login state & close modal
        setIsLoginModalOpen(false);
        setLoginStep('credentials');
        setPendingUsername('');
        setLoginMessage('');
        return { success: true, token: receivedToken };
      } else {
        throw new Error('No access token received in server response.');
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired OTP. Please try again.');
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setTokenInfo(null);
    setLoginStep('credentials');
    setIsLoginModalOpen(true);
  };

  const updateApiKey = (newKey) => {
    storeApiKey(newKey);
    setApiKeyState(newKey);
  };

  const openLoginModal = () => {
    setAuthError('');
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    if (token) {
      setIsLoginModalOpen(false);
      setLoginStep('credentials');
      setAuthError('');
    }
  };

  const isAuthenticated = !!token && !tokenInfo?.isExpired;

  return (
    <AuthContext.Provider
      value={{
        token,
        apiKey,
        user,
        tokenInfo,
        isAuthenticated,
        isLoginModalOpen,
        loginStep,
        pendingUsername,
        loginMessage,
        authLoading,
        authError,
        startLogin,
        verifyOtp,
        logout,
        updateApiKey,
        openLoginModal,
        closeLoginModal,
        setLoginStep,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
