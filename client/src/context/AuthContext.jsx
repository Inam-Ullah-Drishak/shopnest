/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext();

// Anything written by an older build, a half-finished write, or a user poking
// at devtools would otherwise throw inside useState and take the whole app
// down with a blank screen. A bad value is treated as "signed out".
const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('userInfo');

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    localStorage.removeItem('userInfo');
    return null;
  }
};

// A 401 from these means "wrong password", not "your session ended", so they
// must not trigger a sign-out. Everything else that comes back 401 or 403
// while we believe we're signed in means the cookie is gone or the account
// was suspended.
const CREDENTIAL_ENDPOINTS = [
  { method: 'post', path: '/api/users/login' },
  { method: 'post', path: '/api/users' },
  { method: 'put', path: '/api/users/profile' },
];

const isCredentialCheck = (config) => {
  if (!config) return false;

  const method = String(config.method || '').toLowerCase();
  const url = String(config.url || '');

  return CREDENTIAL_ENDPOINTS.some(
    (entry) => entry.method === method && url.endsWith(entry.path)
  );
};

export function AuthProvider({ children }) {
  const [userInfo, setUserInfo] = useState(readStoredUser);
  const toast = useToast();

  // Read inside the interceptor without re-registering it on every change.
  // Written in an effect, not during render: React treats a render-time ref
  // write as a side effect and it can be lost under concurrent rendering.
  const userRef = useRef(userInfo);

  useEffect(() => {
    userRef.current = userInfo;
  }, [userInfo]);

  const login = (data) => {
    setUserInfo(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  const logout = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
  };

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        // 401 means the cookie is missing or invalid. 403 covers two very
        // different things -- a suspended account, which is a dead session,
        // and a customer touching an admin route, which is not. Only the
        // first should sign anyone out.
        const sessionOver =
          status === 401 ||
          (status === 403 && code === 'ACCOUNT_SUSPENDED');

        if (sessionOver && userRef.current && !isCredentialCheck(error.config)) {
          setUserInfo(null);
          localStorage.removeItem('userInfo');

          toast?.error(
            code === 'ACCOUNT_SUSPENDED'
              ? 'Your account is no longer active. Please sign in again.'
              : 'Your session has ended. Please sign in again.'
          );
        }

        // Always hand the error on, so the calling page still shows its own
        // message and its loading state resolves
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(id);
  }, [toast]);

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}