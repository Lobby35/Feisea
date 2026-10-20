import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  function updateAccount(result) {
    setAccount({ ...result, photoVersion: Date.now() });
  }
  useEffect(() => {
    api.session().then(updateAccount).catch(error => {
      if (error.status !== 401) setError(error.message);
    }).finally(() => setLoading(false));
  }, []);
  return <AccountContext.Provider value={{ account, updateAccount, loading, error }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
